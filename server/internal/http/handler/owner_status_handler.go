package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/baddate/sanblog/server/internal/app/ownerstatus"
	"github.com/baddate/sanblog/server/internal/http/response"
)

type OwnerStatusHandler struct {
	svc *ownerstatus.Service
}

func NewOwnerStatusHandler(svc *ownerstatus.Service) *OwnerStatusHandler {
	return &OwnerStatusHandler{svc: svc}
}

func (h *OwnerStatusHandler) GetStatus(c *fiber.Ctx) error {
	if h == nil || h.svc == nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.owner_status_service_not_init"))
	}
	return response.Success(c, h.svc.Get())
}

func (h *OwnerStatusHandler) UpdateStatus(c *fiber.Ctx) error {
	if h == nil || h.svc == nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.owner_status_service_not_init"))
	}

	var req ownerstatus.UpdateInput
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&req); err != nil {
			return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
		}
	}

	if req.OK != nil && *req.OK != 0 && *req.OK != 1 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.ok_only_0_or_1"))
	}
	if req.Timestamp != nil && *req.Timestamp <= 0 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.timestamp_positive"))
	}

	next := h.svc.Update(req)
	Audit(c, "owner.status.update", map[string]any{
		"ok":               next.OK,
		"process":          next.Process,
		"adminPanelOnline": next.AdminPanelOnline,
	})
	return response.Success(c, next)
}

func (h *OwnerStatusHandler) PanelHeartbeat(c *fiber.Ctx) error {
	if h == nil || h.svc == nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.owner_status_service_not_init"))
	}

	status := h.svc.TouchAdminPanel()
	Audit(c, "owner.status.panel_heartbeat", map[string]any{
		"adminPanelOnline": status.AdminPanelOnline,
	})
	return response.Success(c, status)
}
