package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/copier"

	"github.com/baddate/sanblog/server/internal/app/friendlink"
	"github.com/baddate/sanblog/server/internal/app/sysconfig"
	"github.com/baddate/sanblog/server/internal/domain/social"
	"github.com/baddate/sanblog/server/internal/http/contract"
	"github.com/baddate/sanblog/server/internal/http/middleware"
	"github.com/baddate/sanblog/server/internal/http/response"
)

type FriendLinkHandler struct {
	svc    *friendlink.Service
	sysCfg *sysconfig.Service
}

func NewFriendLinkHandler(svc *friendlink.Service, sysCfg *sysconfig.Service) *FriendLinkHandler {
	return &FriendLinkHandler{svc: svc, sysCfg: sysCfg}
}

// SubmitApplication godoc
// @Summary 提交或更新友链申请
// @Tags FriendLink
// @Accept json
// @Produce json
// @Param request body contract.FriendLinkApplicationReq true "友链申请"
// @Success 200 {object} contract.FriendLinkApplicationRespEnvelope
// @Security BearerAuth
// @Router /friend-links/applications [post]
func (h *FriendLinkHandler) SubmitApplication(c *fiber.Ctx) error {
	if h.sysCfg != nil {
		if v, err := h.sysCfg.GetConfigValue(c.Context(), "friendlink.apply.enabled"); err == nil && v == "false" {
			return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.friend_link_app_closed"))
		}
	}

	var req contract.FriendLinkApplicationReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBiz[any](c, response.NotLogin)
	}
	if req.URL == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.friend_link_url_required"))
	}
	userID := claims.UserID
	var cmd friendlink.SubmitCmd
	if err := copier.Copy(&cmd, req); err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.map_body_failed"))
	}
	cmd.UserID = &userID
	result, err := h.svc.Submit(c.Context(), cmd)
	if err != nil {
		if errors.Is(err, social.ErrFriendLinkApplicationBlocked) {
			return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.site_blocked"))
		}
		return err
	}
	msg := response.Translate(c, "server.handler.friend_link_app_submitted")
	if !result.Created {
		msg = response.Translate(c, "server.handler.friend_link_app_prev_updated")
	}
	Audit(c, "friend-link.submit", map[string]any{"url": req.URL, "name": req.Name, "created": result.Created})
	return response.SuccessWithMessage(c, contract.ToFriendLinkApplicationResp(result.Application), msg)
}
