package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"

	applike "github.com/baddate/sanblog-v2/server/internal/app/like"
	domainlike "github.com/baddate/sanblog-v2/server/internal/domain/like"
	"github.com/baddate/sanblog-v2/server/internal/http/contract"
	"github.com/baddate/sanblog-v2/server/internal/http/response"
)

type LikeHandler struct {
	svc *applike.Service
}

func NewLikeHandler(svc *applike.Service) *LikeHandler {
	return &LikeHandler{svc: svc}
}

type TrackLikeEnvelope struct {
	Code   int                    `json:"code"`
	BizErr string                 `json:"bizErr"`
	Msg    string                 `json:"msg"`
	Data   contract.TrackLikeResp `json:"data"`
	Meta   response.Meta          `json:"meta"`
}

// TrackLike godoc
// @Summary 点赞埋点（去重）
// @Tags Analytics
// @Accept json
// @Produce json
// @Param request body contract.TrackLikeReq true "点赞参数"
// @Success 200 {object} TrackLikeEnvelope
// @Router /public/analytics/like [post]
func (h *LikeHandler) TrackLike(c *fiber.Ctx) error {
	var req contract.TrackLikeReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}

	result, err := h.svc.TrackLike(c.UserContext(), applike.TrackLikeCmd{
		ContentType: req.ContentType,
		ContentID:   req.ContentID,
		VisitorID:   req.VisitorID,
	}, applike.RequestMeta{
		IP:        c.IP(),
		UserAgent: c.Get("User-Agent", ""),
	})
	if err != nil {
		return h.mapLikeError(c, err)
	}

	return response.Success(c, contract.TrackLikeResp{
		VisitorID: result.VisitorID,
		Affected:  result.Affected,
	})
}

// ImportLikeBatch godoc
// @Summary 批量导入点赞（管理端）
// @Tags Analytics
// @Accept json
// @Produce json
// @Param request body contract.ImportLikeBatchReq true "批量导入点赞参数"
// @Success 200 {object} contract.ImportLikeBatchResp
// @Security JWTAuth
// @Router /admin/likes/import [post]
func (h *LikeHandler) ImportLikeBatch(c *fiber.Ctx) error {
	var req contract.ImportLikeBatchReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if req.ContentID <= 0 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.content_id_positive"))
	}
	if len(req.VisitorIDs) == 0 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.visitor_ids_required"))
	}

	result, err := h.svc.ImportLikeBatch(c.UserContext(), applike.ImportLikeBatchCmd{
		ContentType: req.ContentType,
		ContentID:   req.ContentID,
		VisitorIDs:  req.VisitorIDs,
	})
	if err != nil {
		return h.mapLikeError(c, err)
	}

	return response.Success(c, contract.ImportLikeBatchResp{
		Inserted: result.Inserted,
	})
}

func (h *LikeHandler) mapLikeError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, domainlike.ErrInvalidTargetType), errors.Is(err, domainlike.ErrInvalidTargetID):
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.like_params_invalid"), err)
	case errors.Is(err, domainlike.ErrTargetNotFound):
		return response.NewBizErrorWithCause(response.NotFound, response.Translate(c, "server.handler.like_target_not_found"), err)
	default:
		return err
	}
}
