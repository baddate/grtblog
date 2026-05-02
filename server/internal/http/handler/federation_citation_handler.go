package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	appEvent "github.com/baddate/sanblog/server/internal/app/event"
	"github.com/baddate/sanblog/server/internal/app/sysconfig"
	"github.com/baddate/sanblog/server/internal/domain/content"
	"github.com/baddate/sanblog/server/internal/domain/federation"
	"github.com/baddate/sanblog/server/internal/domain/social"
	"github.com/baddate/sanblog/server/internal/http/contract"
	"github.com/baddate/sanblog/server/internal/http/response"
	fedinfra "github.com/baddate/sanblog/server/internal/infra/federation"
)

type FederationCitationHandler struct {
	cfgSvc       *sysconfig.Service
	contentRepo  content.Repository
	instanceRepo federation.FederationInstanceRepository
	citationRepo federation.FederatedCitationRepository
	linkRepo     social.FriendLinkRepository
	resolver     *fedinfra.Resolver
	verifier     *fedinfra.Verifier
	rateLimiter  fedinfra.RateLimiter
	events       appEvent.Bus
}

func NewFederationCitationHandler(
	cfgSvc *sysconfig.Service,
	contentRepo content.Repository,
	instanceRepo federation.FederationInstanceRepository,
	citationRepo federation.FederatedCitationRepository,
	linkRepo social.FriendLinkRepository,
	resolver *fedinfra.Resolver,
	verifier *fedinfra.Verifier,
	rateLimiter fedinfra.RateLimiter,
	events appEvent.Bus,
) *FederationCitationHandler {
	if events == nil {
		events = appEvent.NopBus{}
	}
	return &FederationCitationHandler{
		cfgSvc:       cfgSvc,
		contentRepo:  contentRepo,
		instanceRepo: instanceRepo,
		citationRepo: citationRepo,
		linkRepo:     linkRepo,
		resolver:     resolver,
		verifier:     verifier,
		rateLimiter:  rateLimiter,
		events:       events,
	}
}

// RequestCitation handles signed citation requests from remote instances.
// @Summary 联合引用申请（入站）
// @Tags Federation
// @Accept json
// @Produce json
// @Param request body contract.FederationCitationRequestReq true "引用申请参数"
// @Success 200 {object} contract.FederationCitationResponseResp
// @Router /api/federation/citations/request [post]
func (h *FederationCitationHandler) RequestCitation(c *fiber.Ctx) error {
	body := c.Body()
	req, err := parseFederationRequest(c)
	if err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.request_parse_failed"), err)
	}

	signature, err := h.verifier.VerifyRequest(c.Context(), req, body)
	if err != nil {
		log.Printf("[federation] 入站 引用申请 校验失败 ip=%s err=%v", c.IP(), err)
		_ = h.events.Publish(c.Context(), appEvent.Generic{
			EventName: "federation.signature.verify_failed",
			At:        time.Now(),
			Payload:   map[string]any{"action": "citation", "ip": c.IP()},
		})
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.signature_verification_failed"))
	}

	var payload contract.FederationCitationRequestReq
	if err := json.Unmarshal(body, &payload); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(payload.SourceInstanceURL) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.source_instance_url_required"))
	}
	if strings.TrimSpace(payload.SourcePost.URL) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.source_post_url_required"))
	}
	if strings.TrimSpace(payload.TargetPostID) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.target_post_id_required"))
	}
	if signature != nil && signature.BaseURL != "" && !sameBaseURL(signature.BaseURL, payload.SourceInstanceURL) {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.signature_mismatch"))
	}

	settings, err := h.cfgSvc.FederationSettings(c.Context())
	if err != nil || !settings.Enabled {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.federation_not_enabled"))
	}
	policy := parseFederationPolicy(settings)
	if !policyBool(policy.AllowCitation, true) {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.citation_not_allowed"))
	}
	if !settings.AllowInbound {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.inbound_requests_closed"))
	}
	if err := enforceFederationInboundRateLimit(c, c.Context(), h.rateLimiter, payload.SourceInstanceURL, "citation", settings.RateLimits); err != nil {
		_ = h.events.Publish(c.Context(), appEvent.Generic{
			EventName: "federation.inbound.rate_limited",
			At:        time.Now(),
			Payload:   map[string]any{"action": "citation", "source": payload.SourceInstanceURL},
		})
		return err
	}

	article, err := h.resolveTargetArticle(c.Context(), payload.TargetPostID)
	if err != nil {
		if errors.Is(err, content.ErrArticleNotFound) {
			return response.NewBizError(response.NotFound)
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.target_article_parse_failed"), err)
	}
	if !article.IsPublished {
		return response.NewBizError(response.NotFound)
	}

	instance, err := ensureFederationInstance(c, c.Context(), payload.SourceInstanceURL, h.resolver, h.instanceRepo)
	if err != nil {
		return err
	}

	status := "pending"
	if policyBool(policy.AutoApproveFriendlinkCitation, false) && h.isFriendLink(c.Context(), payload.SourceInstanceURL) {
		status = "approved"
	}

	citationType := strings.TrimSpace(payload.CitationType)
	if citationType == "" {
		citationType = "reference"
	}

	// Idempotency: skip if we already processed this request.
	if reqID := strings.TrimSpace(payload.RequestID); reqID != "" {
		if existing, err := h.citationRepo.FindBySourceRequestID(c.Context(), reqID); err == nil && existing != nil {
			return response.Success(c, contract.FederationCitationResponseResp{
				CitationID: existing.ID,
				Status:     existing.Status,
			})
		}
	}

	citation := &federation.FederatedCitation{
		SourceInstanceID: instance.ID,
		SourceRequestID:  toOptionalString(payload.RequestID),
		SourcePostURL:    payload.SourcePost.URL,
		SourcePostTitle:  toOptionalString(payload.SourcePost.Title),
		TargetArticleID:  article.ID,
		CitationContext:  toOptionalString(payload.CitationContext),
		CitationType:     citationType,
		Status:           status,
		RequestedAt:      time.Now().UTC(),
	}
	if err := h.citationRepo.Create(c.Context(), citation); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.create_citation_failed"), err)
	}

	resp := contract.FederationCitationResponseResp{
		CitationID: citation.ID,
		Status:     status,
	}
	log.Printf("[federation] 入站 引用申请 source=%s target_post=%s citation_id=%d status=%s key_id=%s", payload.SourceInstanceURL, payload.TargetPostID, citation.ID, status, signature.KeyID)
	_ = h.events.Publish(c.Context(), appEvent.Generic{
		EventName: "federation.citation.received",
		At:        time.Now(),
		Payload: map[string]any{
			"CitationID":        citation.ID,
			"SourceInstanceURL": payload.SourceInstanceURL,
			"TargetPostID":      payload.TargetPostID,
			"Status":            status,
			"KeyID":             signature.KeyID,
		},
	})
	return response.Success(c, resp)
}

func (h *FederationCitationHandler) resolveTargetArticle(ctx context.Context, targetID string) (*content.Article, error) {
	if numericID, err := strconv.ParseInt(targetID, 10, 64); err == nil {
		return h.contentRepo.GetArticleByID(ctx, numericID)
	}
	return h.contentRepo.GetArticleByShortURL(ctx, targetID)
}

func (h *FederationCitationHandler) isFriendLink(ctx context.Context, baseURL string) bool {
	if h.linkRepo == nil {
		return false
	}
	_, err := h.linkRepo.FindByURL(ctx, strings.TrimRight(baseURL, "/"))
	return err == nil
}
