package handler

import (
	"context"
	"errors"
	"strconv"

	"github.com/baddate/sanblog-v2/server/internal/http/middleware"
	"github.com/gofiber/fiber/v2"

	"github.com/baddate/sanblog-v2/server/internal/app/thinking"
	domaincomment "github.com/baddate/sanblog-v2/server/internal/domain/comment"
	"github.com/baddate/sanblog-v2/server/internal/domain/identity"
	domainthinking "github.com/baddate/sanblog-v2/server/internal/domain/thinking"
	"github.com/baddate/sanblog-v2/server/internal/http/contract"
	"github.com/baddate/sanblog-v2/server/internal/http/response"
)

type ThinkingHandler struct {
	svc         *thinking.Service
	commentRepo domaincomment.CommentRepository
	userRepo    identity.Repository
}

func NewThinkingHandler(svc *thinking.Service, commentRepo domaincomment.CommentRepository, userRepo identity.Repository) *ThinkingHandler {
	return &ThinkingHandler{
		svc:         svc,
		commentRepo: commentRepo,
		userRepo:    userRepo,
	}
}

// CreateThinking godoc
// @Summary 发布思考
// @Tags Thinking
// @Accept json
// @Produce json
// @Param request body contract.CreateThinkingReq true "创建参数"
// @Success 200 {object} contract.ThinkingResp
// @Security JWTAuth
// @Router /thinkings [post]
func (h *ThinkingHandler) CreateThinking(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	var req contract.CreateThinkingReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}

	created, err := h.svc.Create(c.Context(), thinking.CreateThinkingCmd{
		Content:      req.Content,
		AuthorID:     claims.UserID,
		AllowComment: req.AllowComment,
		CreatedAt:    req.CreatedAt,
	})
	if err != nil {
		return h.mapError(c, err)
	}

	Audit(c, "thinking.create", map[string]any{
		"thinkingId":     created.ID,
		"thinkingAuthor": created.AuthorID,
		"userId":         claims.UserID,
	})

	resp, err := h.toThinkingResp(c.Context(), created)
	if err != nil {
		return err
	}
	return response.Success(c, resp)
}

// UpdateThinking godoc
// @Summary 更新思考
// @Tags Thinking
// @Accept json
// @Produce json
// @Param id path int true "思考ID"
// @Param request body contract.UpdateThinkingReq true "更新参数"
// @Success 200
// @Security JWTAuth
// @Router /thinkings/{id} [put]
func (h *ThinkingHandler) UpdateThinking(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	var req contract.UpdateThinkingReq
	if err := c.BodyParser(&req); err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	_, err = h.svc.Update(c.Context(), thinking.UpdateThinkingCmd{
		ID:           id,
		Content:      req.Content,
		AllowComment: req.AllowComment,
	})
	if err != nil {
		return h.mapError(c, err)
	}

	Audit(c, "thinking.update", map[string]any{
		"thinkingId": id,
		"userId":     claims.UserID,
	})

	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.updated"))
}

// ListThinkings godoc
// @Summary 获取思考列表
// @Tags Thinking
// @Param page query int false "页码"
// @Param pageSize query int false "页大小"
// @Success 200 {object} contract.ListThinkingResp
// @Router /thinkings [get]
func (h *ThinkingHandler) ListThinkings(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("pageSize", 10)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize
	items, total, err := h.svc.List(c.Context(), pageSize, offset)
	if err != nil {
		return h.mapError(c, err)
	}

	resItems := make([]contract.ThinkingListItemResp, len(items))
	for i, item := range items {
		resp, err := h.toThinkingListItemResp(c.Context(), item)
		if err != nil {
			return err
		}
		resItems[i] = *resp
	}

	return response.Success(c, contract.ListThinkingResp{
		Items: resItems,
		Total: total,
	})
}

// GetThinking godoc
// @Summary 获取单个思考
// @Tags Thinking
// @Param id path int true "思考ID"
// @Success 200 {object} contract.ThinkingResp
// @Router /thinkings/{id} [get]
func (h *ThinkingHandler) GetThinking(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	item, err := h.svc.FindByID(c.Context(), id)
	if err != nil {
		return h.mapError(c, err)
	}

	resp, err := h.toThinkingResp(c.Context(), item)
	if err != nil {
		return err
	}
	return response.Success(c, resp)
}

// DeleteThinking godoc
// @Summary 删除思考
// @Tags Thinking
// @Param id path int true "思考ID"
// @Success 200
// @Security JWTAuth
// @Router /thinkings/{id} [delete]
func (h *ThinkingHandler) DeleteThinking(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	if err := h.svc.Delete(c.Context(), id); err != nil {
		return h.mapError(c, err)
	}

	Audit(c, "thinking.delete", map[string]any{
		"thinkingId": id,
		"userId":     claims.UserID,
	})

	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.deleted"))
}

// BatchDeleteThinkings godoc
// @Summary 批量删除思考（管理端）
// @Tags Thinking
// @Accept json
// @Produce json
// @Param request body contract.BatchDeleteThinkingReq true "批量删除参数"
// @Success 200 {object} contract.EmptyRespEnvelope
// @Security JWTAuth
// @Router /admin/thinkings/batch-delete [post]
func (h *ThinkingHandler) BatchDeleteThinkings(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	var req contract.BatchDeleteThinkingReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if len(req.IDs) == 0 {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}
	for _, id := range req.IDs {
		if id <= 0 {
			return response.ErrorFromBizLocalized[any](c, response.ParamsError)
		}
	}

	if err := h.svc.BatchDelete(c.Context(), thinking.BatchDeleteCmd{IDs: req.IDs}); err != nil {
		return h.mapError(c, err)
	}

	Audit(c, "thinking.batch_delete", map[string]any{
		"thinkingIds": req.IDs,
		"userId":      claims.UserID,
	})

	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.deleted"))
}

// GetThinkingMetrics godoc
// @Summary 获取思考指标
// @Tags Thinking
// @Produce json
// @Param id path int true "思考ID"
// @Success 200 {object} contract.MetricsResp
// @Router /thinkings/{id}/metrics [get]
func (h *ThinkingHandler) GetThinkingMetrics(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	t, err := h.svc.FindByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, domainthinking.ErrThinkingNotFound) {
			return response.ErrorFromBizLocalized[any](c, response.NotFound)
		}
		return err
	}

	return response.Success(c, contract.MetricsResp{
		Views:    t.Metrics.Views,
		Likes:    t.Metrics.Likes,
		Comments: t.Metrics.Comments,
	})
}

// BatchGetThinkingMetrics godoc
// @Summary 批量获取思考指标
// @Tags Thinking
// @Accept json
// @Produce json
// @Param request body contract.BatchThinkingMetricsReq true "思考ID列表"
// @Success 200 {object} contract.BatchThinkingMetricsResp
// @Router /thinkings/metrics [post]
func (h *ThinkingHandler) BatchGetThinkingMetrics(c *fiber.Ctx) error {
	var req contract.BatchThinkingMetricsReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
		return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if len(req.IDs) == 0 {
		return response.Success(c, contract.BatchThinkingMetricsResp{Items: []contract.ThinkingMetricsItem{}})
	}
	if len(req.IDs) > 50 {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	items := make([]contract.ThinkingMetricsItem, 0, len(req.IDs))
	for _, id := range req.IDs {
		t, err := h.svc.FindByID(c.Context(), id)
		if err != nil {
			continue
		}
		items = append(items, contract.ThinkingMetricsItem{
			ID:       t.ID,
			Views:    t.Metrics.Views,
			Likes:    t.Metrics.Likes,
			Comments: t.Metrics.Comments,
		})
	}

	return response.Success(c, contract.BatchThinkingMetricsResp{Items: items})
}

func (h *ThinkingHandler) mapError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, domainthinking.ErrThinkingNotFound):
		return response.ErrorFromBizLocalized[any](c, response.NotFound)
	case errors.Is(err, domainthinking.ErrThinkingContentEmpty):
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	default:
		return err
	}
}

func (h *ThinkingHandler) toThinkingResp(ctx context.Context, t *domainthinking.Thinking) (*contract.ThinkingResp, error) {
	resp := &contract.ThinkingResp{
		ID:                         t.ID,
		CommentID:                  t.CommentID,
		Content:                    t.Content,
		AuthorID:                   t.AuthorID,
		ActivityPubObjectID:        t.ActivityPubObjectID,
		ActivityPubLastPublishedAt: t.ActivityPubLastPublishedAt,
		IsHot:                      false,
		AllowComment:               h.allowCommentByAreaID(ctx, t.CommentID),
		Metrics: contract.ThinkingMetrics{
			Views:    t.Metrics.Views,
			Likes:    t.Metrics.Likes,
			Comments: t.Metrics.Comments,
		},
		CreatedAt: t.CreatedAt,
		UpdatedAt: t.UpdatedAt,
	}
	if h.userRepo != nil {
		user, err := h.userRepo.FindByID(ctx, t.AuthorID)
		if err != nil {
			if !errors.Is(err, identity.ErrUserNotFound) {
				return nil, err
			}
		} else if user != nil {
			resp.AuthorName = user.Nickname
			resp.Avatar = user.Avatar
		}
	}
	return resp, nil
}

func (h *ThinkingHandler) toThinkingListItemResp(ctx context.Context, t *domainthinking.Thinking) (*contract.ThinkingListItemResp, error) {
	resp := &contract.ThinkingListItemResp{
		ID:                  t.ID,
		CommentID:           t.CommentID,
		Content:             t.Content,
		AuthorID:            t.AuthorID,
		ActivityPubObjectID: t.ActivityPubObjectID,
		IsHot:               false,
		AllowComment:        h.allowCommentByAreaID(ctx, t.CommentID),
		Views:               t.Metrics.Views,
		Likes:               t.Metrics.Likes,
		Comments:            t.Metrics.Comments,
		CreatedAt:           t.CreatedAt,
		UpdatedAt:           t.UpdatedAt,
	}
	if h.userRepo != nil {
		user, err := h.userRepo.FindByID(ctx, t.AuthorID)
		if err != nil {
			if !errors.Is(err, identity.ErrUserNotFound) {
				return nil, err
			}
		} else if user != nil {
			resp.AuthorName = user.Nickname
			resp.Avatar = user.Avatar
		}
	}
	return resp, nil
}

func (h *ThinkingHandler) allowCommentByAreaID(ctx context.Context, areaID int64) bool {
	if h.commentRepo == nil || areaID <= 0 {
		return true
	}
	area, err := h.commentRepo.GetAreaByID(ctx, areaID)
	if err != nil || area == nil {
		return false
	}
	return !area.IsClosed
}
