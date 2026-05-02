package handler

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	appfed "github.com/baddate/sanblog/server/internal/app/federation"
	"github.com/baddate/sanblog/server/internal/http/contract"
	"github.com/baddate/sanblog/server/internal/http/response"
	fedinfra "github.com/baddate/sanblog/server/internal/infra/federation"
)

type FederationOutboundResultHandler struct {
	deliverySvc *appfed.DeliveryService
	verifier    *fedinfra.Verifier
}

func NewFederationOutboundResultHandler(deliverySvc *appfed.DeliveryService, verifier *fedinfra.Verifier) *FederationOutboundResultHandler {
	return &FederationOutboundResultHandler{
		deliverySvc: deliverySvc,
		verifier:    verifier,
	}
}

// ResultCallback 远端回调本地出站结果。
// @Summary 联合出站结果回调
// @Tags Federation
// @Accept json
// @Produce json
// @Param request body contract.FederationOutboundResultReq true "回调结果"
// @Success 200 {object} contract.FederationOutboundResultResp
// @Router /api/federation/outbound/result [post]
func (h *FederationOutboundResultHandler) ResultCallback(c *fiber.Ctx) error {
	if h.deliverySvc == nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.federation_service_not_init"))
	}
	body := c.Body()
	req, err := parseFederationRequest(c)
	if err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.request_parse_failed"), err)
	}
	if h.verifier != nil {
		if _, err := h.verifier.VerifyRequest(c.Context(), req, body); err != nil {
			return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.signature_verification_failed"))
		}
	}

	var payload contract.FederationOutboundResultReq
	if err := c.BodyParser(&payload); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	requestID := strings.TrimSpace(payload.RequestID)
	if requestID == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.request_id_required"))
	}
	var processedAt *time.Time
	if raw := strings.TrimSpace(payload.ProcessedAt); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.processed_at_rfc3339"))
		}
		processedAt = &parsed
	}
	item, err := h.deliverySvc.HandleCallback(c.Context(), appfed.CallbackResultCmd{
		RequestID:      requestID,
		Type:           strings.TrimSpace(payload.Type),
		Status:         strings.TrimSpace(payload.Status),
		RemoteTicketID: strings.TrimSpace(payload.RemoteTicketID),
		Reason:         strings.TrimSpace(payload.Reason),
		ProcessedAt:    processedAt,
	})
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.callback_failed"), err)
	}
	return response.Success(c, contract.FederationOutboundResultResp{
		RequestID: item.RequestID,
		Status:    item.Status,
	})
}
