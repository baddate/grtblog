package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	appEvent "github.com/baddate/sanblog-v2/server/internal/app/event"
	"github.com/baddate/sanblog-v2/server/internal/app/sysconfig"
	"github.com/baddate/sanblog-v2/server/internal/domain/federation"
	"github.com/baddate/sanblog-v2/server/internal/domain/identity"
	"github.com/baddate/sanblog-v2/server/internal/domain/social"
	"github.com/baddate/sanblog-v2/server/internal/http/contract"
	"github.com/baddate/sanblog-v2/server/internal/http/response"
	fedinfra "github.com/baddate/sanblog-v2/server/internal/infra/federation"
)

type FederationMentionHandler struct {
	cfgSvc       *sysconfig.Service
	instanceRepo federation.FederationInstanceRepository
	mentionRepo  federation.FederatedMentionRepository
	linkRepo     social.FriendLinkRepository
	userRepo     identity.Repository
	resolver     *fedinfra.Resolver
	verifier     *fedinfra.Verifier
	rateLimiter  fedinfra.RateLimiter
	events       appEvent.Bus
}

func NewFederationMentionHandler(
	cfgSvc *sysconfig.Service,
	instanceRepo federation.FederationInstanceRepository,
	mentionRepo federation.FederatedMentionRepository,
	linkRepo social.FriendLinkRepository,
	userRepo identity.Repository,
	resolver *fedinfra.Resolver,
	verifier *fedinfra.Verifier,
	rateLimiter fedinfra.RateLimiter,
	events appEvent.Bus,
) *FederationMentionHandler {
	if events == nil {
		events = appEvent.NopBus{}
	}
	return &FederationMentionHandler{
		cfgSvc:       cfgSvc,
		instanceRepo: instanceRepo,
		mentionRepo:  mentionRepo,
		linkRepo:     linkRepo,
		userRepo:     userRepo,
		resolver:     resolver,
		verifier:     verifier,
		rateLimiter:  rateLimiter,
		events:       events,
	}
}

// NotifyMention handles cross-site mention notifications.
// @Summary 联合提及通知（入站）
// @Tags Federation
// @Accept json
// @Produce json
// @Param request body contract.FederationMentionNotifyReq true "提及通知参数"
// @Success 200 {object} contract.FederationMentionNotifyResp
// @Router /api/federation/mentions/notify [post]
func (h *FederationMentionHandler) NotifyMention(c *fiber.Ctx) error {
	body := c.Body()
	req, err := parseFederationRequest(c)
	if err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.request_parse_failed"), err)
	}

	signature, err := h.verifier.VerifyRequest(c.Context(), req, body)
	if err != nil {
		log.Printf("[federation] 入站 提及通知 校验失败 ip=%s err=%v", c.IP(), err)
		_ = h.events.Publish(c.Context(), appEvent.Generic{
			EventName: "federation.signature.verify_failed",
			At:        time.Now(),
			Payload:   map[string]any{"action": "mention", "ip": c.IP()},
		})
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.signature_verification_failed"))
	}

	var payload contract.FederationMentionNotifyReq
	if err := json.Unmarshal(body, &payload); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(payload.SourceInstanceURL) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.source_instance_url_required"))
	}
	if strings.TrimSpace(payload.SourcePost.URL) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.source_post_url_required"))
	}
	if strings.TrimSpace(payload.MentionedUser) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.mentioned_user_required"))
	}
	if strings.TrimSpace(payload.MentionContext) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.mention_context_required"))
	}
	if signature != nil && signature.BaseURL != "" && !sameBaseURL(signature.BaseURL, payload.SourceInstanceURL) {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.signature_mismatch"))
	}

	settings, err := h.cfgSvc.FederationSettings(c.Context())
	if err != nil || !settings.Enabled {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.federation_not_enabled"))
	}
	policy := parseFederationPolicy(settings)
	if !policyBool(policy.AllowMention, true) {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.mention_not_allowed"))
	}
	if !settings.AllowInbound {
		return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.inbound_requests_closed"))
	}
	if err := enforceFederationInboundRateLimit(c, c.Context(), h.rateLimiter, payload.SourceInstanceURL, "mention", settings.RateLimits); err != nil {
		_ = h.events.Publish(c.Context(), appEvent.Generic{
			EventName: "federation.inbound.rate_limited",
			At:        time.Now(),
			Payload:   map[string]any{"action": "mention", "source": payload.SourceInstanceURL},
		})
		return err
	}

	user, err := h.userRepo.FindByUsername(c.Context(), payload.MentionedUser)
	if err != nil {
		if errors.Is(err, identity.ErrUserNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.user_not_found"))
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.user_query_failed"), err)
	}

	instance, err := ensureFederationInstance(c, c.Context(), payload.SourceInstanceURL, h.resolver, h.instanceRepo)
	if err != nil {
		return err
	}

	mentionType := strings.TrimSpace(payload.MentionType)
	if mentionType == "" {
		mentionType = "discussion"
	}
	status := "pending"
	if policyBool(policy.AutoApproveFriendlinkCitation, false) && h.isFriendLink(c.Context(), payload.SourceInstanceURL) {
		status = "approved"
	}

	// Idempotency: skip if we already processed this request.
	if reqID := strings.TrimSpace(payload.RequestID); reqID != "" {
		if existing, err := h.mentionRepo.FindBySourceRequestID(c.Context(), reqID); err == nil && existing != nil {
			return response.Success(c, contract.FederationMentionNotifyResp{
				MentionID: existing.ID,
				Delivered: existing.Status == "approved",
			})
		}
	}

	mention := &federation.FederatedMention{
		SourceInstanceID: instance.ID,
		SourceRequestID:  toOptionalString(payload.RequestID),
		SourcePostURL:    payload.SourcePost.URL,
		SourcePostTitle:  toOptionalString(payload.SourcePost.Title),
		MentionedUserID:  user.ID,
		MentionContext:   payload.MentionContext,
		MentionType:      mentionType,
		Status:           status,
		IsRead:           false,
		CreatedAt:        time.Now().UTC(),
	}
	if err := h.mentionRepo.Create(c.Context(), mention); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.write_mention_failed"), err)
	}

	resp := contract.FederationMentionNotifyResp{
		MentionID: mention.ID,
		Delivered: status == "approved",
	}
	log.Printf("[federation] 入站 提及通知 source=%s mentioned=%s mention_id=%d key_id=%s", payload.SourceInstanceURL, payload.MentionedUser, mention.ID, signature.KeyID)
	_ = h.events.Publish(c.Context(), appEvent.Generic{
		EventName: "federation.mention.received",
		At:        time.Now(),
		Payload: map[string]any{
			"MentionID":         mention.ID,
			"SourceInstanceURL": payload.SourceInstanceURL,
			"MentionedUser":     payload.MentionedUser,
			"Status":            status,
			"KeyID":             signature.KeyID,
		},
	})
	return response.Success(c, resp)
}

func (h *FederationMentionHandler) isFriendLink(ctx context.Context, baseURL string) bool {
	if h.linkRepo == nil {
		return false
	}
	_, err := h.linkRepo.FindByURL(ctx, strings.TrimRight(strings.TrimSpace(baseURL), "/"))
	return err == nil
}
