package handler

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/jinzhu/copier"

	"github.com/baddate/sanblog-v2/server/internal/app/sysconfig"
	domaincomment "github.com/baddate/sanblog-v2/server/internal/domain/comment"
	"github.com/baddate/sanblog-v2/server/internal/domain/content"
	domainfed "github.com/baddate/sanblog-v2/server/internal/domain/federation"
	"github.com/baddate/sanblog-v2/server/internal/domain/identity"
	"github.com/gofiber/fiber/v2"

	"github.com/baddate/sanblog-v2/server/internal/app/article"
	"github.com/baddate/sanblog-v2/server/internal/http/contract"
	"github.com/baddate/sanblog-v2/server/internal/http/middleware"
	"github.com/baddate/sanblog-v2/server/internal/http/response"
)

type ArticleHandler struct {
	svc           *article.Service
	contentRepo   content.Repository
	commentRepo   domaincomment.CommentRepository
	userRepo      identity.Repository
	apCfgSvc      *sysconfig.Service
	deliveryRepo  domainfed.OutboundDeliveryRepository
	postCacheRepo domainfed.FederatedPostCacheRepository
	instanceRepo  domainfed.FederationInstanceRepository
}

func NewArticleHandler(svc *article.Service, contentRepo content.Repository, commentRepo domaincomment.CommentRepository, userRepo identity.Repository, apCfgSvc *sysconfig.Service, opts ...ArticleHandlerOption) *ArticleHandler {
	h := &ArticleHandler{
		svc:         svc,
		contentRepo: contentRepo,
		commentRepo: commentRepo,
		userRepo:    userRepo,
		apCfgSvc:    apCfgSvc,
	}
	for _, o := range opts {
		o(h)
	}
	return h
}

// ArticleHandlerOption configures optional dependencies on ArticleHandler.
type ArticleHandlerOption func(*ArticleHandler)

// WithFederationRepos injects federation repositories for content expansion.
func WithFederationRepos(deliveryRepo domainfed.OutboundDeliveryRepository, postCacheRepo domainfed.FederatedPostCacheRepository, instanceRepo domainfed.FederationInstanceRepository) ArticleHandlerOption {
	return func(h *ArticleHandler) {
		h.deliveryRepo = deliveryRepo
		h.postCacheRepo = postCacheRepo
		h.instanceRepo = instanceRepo
	}
}

// CreateArticle godoc
// @Summary 创建文章
// @Tags Article
// @Accept json
// @Produce json
// @Param request body contract.CreateArticleReq true "创建文章参数"
// @Success 200 {object} contract.ArticleResp
// @Security BearerAuth
// @Router /articles [post]
// @Security JWTAuth
func (h *ArticleHandler) CreateArticle(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	var req contract.CreateArticleReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if req.Views != nil && *req.Views < 0 {
		msg := response.Translate(c, "server.handler.views_negative")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	extInfo, err := parseExtInfo(req.ExtInfo)
	if err != nil {
		msg := response.Translate(c, "server.handler.invalid_extinfo")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}

	var cmd article.CreateArticleCmd
	if err := copier.Copy(&cmd, req); err != nil {
		msg := response.Translate(c, "server.handler.map_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if cmd.AllowComment == nil {
		defaultAllow := true
		cmd.AllowComment = &defaultAllow
	}
	cmd.ExtInfo = extInfo

	createdArticle, err := h.svc.CreateArticle(c.Context(), claims.UserID, cmd)
	if err != nil {
		if errors.Is(err, content.ErrArticleShortURLExists) {
			msg := response.Translate(c, "server.error.article_short_url_exists")
		return response.ErrorWithMsg[any](c, response.ParamsError, msg)
		}
		if errors.Is(err, content.ErrCategoryNotFound) {
			msg := response.Translate(c, "server.error.category_not_found")
		return response.ErrorWithMsg[any](c, response.ParamsError, msg)
		}
		if errors.Is(err, content.ErrTagNotFound) {
			msg := response.Translate(c, "server.error.tag_not_found")
		return response.ErrorWithMsg[any](c, response.ParamsError, msg)
		}
		return err
	}

	articleResponse, err := h.toArticleResp(c.Context(), createdArticle)
	if err != nil {
		return err
	}

	Audit(c, "article.create", map[string]any{
		"articleId": createdArticle.ID,
		"title":     createdArticle.Title,
		"userId":    claims.UserID,
	})

	return response.SuccessWithMessage(c, articleResponse, response.Translate(c, "server.success.article_created"))
}

// UpdateArticle godoc
// @Summary 更新文章
// @Tags Article
// @Accept json
// @Produce json
// @Param id path int true "文章ID"
// @Param request body contract.UpdateArticleReq true "更新文章参数"
// @Success 200 {object} contract.ArticleResp
// @Security BearerAuth
// @Router /articles/{id} [put]
// @Security JWTAuth
func (h *ArticleHandler) UpdateArticle(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	var req contract.UpdateArticleReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	extInfo, err := parseExtInfo(req.ExtInfo)
	if err != nil {
		msg := response.Translate(c, "server.handler.invalid_extinfo")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}

	var cmd article.UpdateArticleCmd
	if err := copier.Copy(&cmd, req); err != nil {
		msg := response.Translate(c, "server.handler.map_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	cmd.ID = id
	cmd.ExtInfo = extInfo

	updatedArticle, err := h.svc.UpdateArticle(c.Context(), cmd)
	if err != nil {
		if errors.Is(err, content.ErrArticleShortURLExists) {
			msg := response.Translate(c, "server.error.article_short_url_exists")
		return response.ErrorWithMsg[any](c, response.ParamsError, msg)
		}
		if errors.Is(err, content.ErrCategoryNotFound) {
			msg := response.Translate(c, "server.error.category_not_found")
		return response.ErrorWithMsg[any](c, response.ParamsError, msg)
		}
		if errors.Is(err, content.ErrTagNotFound) {
			msg := response.Translate(c, "server.error.tag_not_found")
		return response.ErrorWithMsg[any](c, response.ParamsError, msg)
		}
		return err
	}

	articleResponse, err := h.toArticleResp(c.Context(), updatedArticle)
	if err != nil {
		return err
	}

	Audit(c, "article.update", map[string]any{
		"articleId": updatedArticle.ID,
		"title":     updatedArticle.Title,
		"userId":    claims.UserID,
	})

	return response.SuccessWithMessage(c, articleResponse, response.Translate(c, "server.success.article_updated"))
}

// ResetArticleFederationSignals godoc
// @Summary 重置文章联合条目状态（管理端）
// @Tags Article
// @Accept json
// @Produce json
// @Param id path int true "文章ID"
// @Param request body contract.ResetArticleFederationSignalsReq false "重置参数"
// @Success 200 {object} contract.ResetArticleFederationSignalsResp
// @Security BearerAuth
// @Router /admin/articles/{id}/federation/signals/reset [post]
// @Security JWTAuth
func (h *ArticleHandler) ResetArticleFederationSignals(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil || id <= 0 {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	var req contract.ResetArticleFederationSignalsReq
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&req); err != nil {
			msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
		}
	}

	retrigger := true
	if req.Retrigger != nil {
		retrigger = *req.Retrigger
	}
	if retrigger && h.apCfgSvc != nil {
		settings, err := h.apCfgSvc.FederationSettings(c.Context())
		if err != nil {
			return response.ErrorFromBizLocalized[any](c, response.ServerError)
		}
		if !settings.Enabled || !settings.AllowOutbound {
			retrigger = false
		}
	}

	updatedArticle, retriggered, err := h.svc.ResetFederationSignals(c.Context(), article.ResetFederationSignalsCmd{
		ID:        id,
		Mentions:  req.Mentions,
		Citations: req.Citations,
		Retrigger: retrigger,
	})
	if err != nil {
		if errors.Is(err, content.ErrArticleNotFound) {
			return response.ErrorFromBizLocalized[any](c, response.NotFound)
		}
		return err
	}

	Audit(c, "article.federation.signal.reset", map[string]any{
		"articleId":   id,
		"mentions":    req.Mentions,
		"citations":   req.Citations,
		"retrigger":   retrigger,
		"retriggered": retriggered,
		"userId":      claims.UserID,
	})

	resp := contract.ResetArticleFederationSignalsResp{
		ArticleID:   updatedArticle.ID,
		Retriggered: retriggered,
		ExtInfo:     jsonRawFromBytes(updatedArticle.ExtInfo),
	}
	if retriggered {
		return response.SuccessWithMessage(c, resp, response.Translate(c, "server.success.updated"))
	}
	return response.SuccessWithMessage(c, resp, response.Translate(c, "server.success.updated"))
}

// BatchSetArticlePublished godoc
// @Summary 批量设置文章发布状态（管理端）
// @Tags Article
// @Accept json
// @Produce json
// @Param request body contract.BatchSetArticlePublishedReq true "批量发布状态参数"
// @Success 200 {object} contract.EmptyRespEnvelope
// @Security BearerAuth
// @Router /admin/articles/published [put]
// @Security JWTAuth
func (h *ArticleHandler) BatchSetArticlePublished(c *fiber.Ctx) error {
	var req contract.BatchSetArticlePublishedReq
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

	if err := h.svc.BatchSetPublished(c.Context(), article.BatchSetPublishedCmd{
		IDs:         req.IDs,
		IsPublished: req.IsPublished,
	}); err != nil {
		return err
	}

	if req.IsPublished {
		return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.handler.article_batch_published"))
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.updated"))
}

// BatchSetArticleTop godoc
// @Summary 批量设置文章置顶状态（管理端）
// @Tags Article
// @Accept json
// @Produce json
// @Param request body contract.BatchSetArticleTopReq true "批量置顶状态参数"
// @Success 200 {object} contract.EmptyRespEnvelope
// @Security BearerAuth
// @Router /admin/articles/top [put]
// @Security JWTAuth
func (h *ArticleHandler) BatchSetArticleTop(c *fiber.Ctx) error {
	var req contract.BatchSetArticleTopReq
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

	if err := h.svc.BatchSetTop(c.Context(), article.BatchSetTopCmd{
		IDs:   req.IDs,
		IsTop: req.IsTop,
	}); err != nil {
		return err
	}

	if req.IsTop {
		return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.updated"))
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.updated"))
}

// GetArticle godoc
// @Summary 获取文章详情
// @Tags Article
// @Produce json
// @Param id path int true "文章ID"
// @Security BearerAuth
// @Success 200 {object} contract.ArticleResp
// @Router /articles/{id} [get]
func (h *ArticleHandler) GetArticle(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	article, err := h.svc.GetArticleByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, content.ErrArticleNotFound) {
			return response.ErrorFromBizLocalized[any](c, response.NotFound)
		}
		return err
	}
	if !article.IsPublished {
		return response.ErrorFromBizLocalized[any](c, response.NotFound)
	}

	articleResponse, err := h.toArticleResp(c.Context(), article)
	if err != nil {
		return err
	}

	return response.Success(c, articleResponse)
}

// GetArticleAdmin godoc
// @Summary 获取文章详情（管理员）
// @Tags Article
// @Produce json
// @Param id path int true "文章ID"
// @Security BearerAuth
// @Success 200 {object} contract.ArticleResp
// @Router /admin/articles/{id} [get]
// @Security JWTAuth
func (h *ArticleHandler) GetArticleAdmin(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}
	article, err := h.svc.GetArticleByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, content.ErrArticleNotFound) {
			return response.ErrorFromBizLocalized[any](c, response.NotFound)
		}
		return err
	}
	articleResponse, err := h.toArticleResp(c.Context(), article)
	if err != nil {
		return err
	}
	return response.Success(c, articleResponse)
}

// ListSamePeriodMoments godoc
// @Summary 获取文章同一时间的手记（两周内）
// @Tags Article
// @Produce json
// @Param id path int true "文章ID"
// @Success 200 {object} contract.SamePeriodMomentListResp
// @Router /articles/{id}/same-period-moments [get]
func (h *ArticleHandler) ListSamePeriodMoments(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	articleItem, err := h.svc.GetArticleByID(c.Context(), id)
	if err != nil {
		return err
	}
	if !articleItem.IsPublished {
		return response.ErrorFromBizLocalized[any](c, response.NotFound)
	}

	const windowDays = 14
	const limit = 2
	start := articleItem.CreatedAt.AddDate(0, 0, -windowDays)
	end := articleItem.CreatedAt.AddDate(0, 0, windowDays)
	siteTZ := h.apCfgSvc.Timezone(c.Context())

	moments, err := h.contentRepo.ListPublishedMomentsByCreatedAtRange(c.Context(), start, end, limit)
	if err != nil {
		return err
	}

	items := make([]contract.SamePeriodMomentItemResp, 0, len(moments))
	for _, item := range moments {
		resp := contract.SamePeriodMomentItemResp{
			ID:        item.ID,
			Title:     item.Title,
			ShortURL:  item.ShortURL,
			Summary:   item.Summary,
			CreatedAt: item.CreatedAt.In(siteTZ),
		}
		if item.Image != nil {
			resp.Image = splitImages(item.Image)
		}
		items = append(items, resp)
	}

	return response.Success(c, contract.SamePeriodMomentListResp{
		Items: items,
	})
}

// GetArticleByShortURL godoc
// @Summary 根据短链接获取文章
// @Tags Article
// @Produce json
// @Param shortUrl path string true "短链接"
// @Success 200 {object} contract.ArticleResp
// @Router /articles/short/{shortUrl} [get]
func (h *ArticleHandler) GetArticleByShortURL(c *fiber.Ctx) error {
	shortURL := c.Params("shortUrl")
	if shortURL == "" {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	art, err := h.svc.GetArticleByShortURL(c.Context(), shortURL)
	if err != nil {
		if errors.Is(err, content.ErrArticleNotFound) {
			return response.ErrorFromBizLocalized[any](c, response.NotFound)
		}
		return err
	}
	if !art.IsPublished {
		return response.ErrorFromBizLocalized[any](c, response.NotFound)
	}

	articleResponse, err := h.toArticleResp(c.Context(), art)
	if err != nil {
		return err
	}

	// Expand federation signals in public content.
	if articleResponse != nil && h.deliveryRepo != nil && h.postCacheRepo != nil && h.instanceRepo != nil {
		articleResponse.Content = h.expandFederationContent(c.Context(), art, articleResponse.Content)
	}

	return response.Success(c, articleResponse)
}

// ListArticles godoc
// @Summary 获取文章列表
// @Tags Article
// @Produce json
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(10)
// @Param categoryId query int false "分类ID"
// @Param tagId query int false "标签ID"
// @Param search query string false "搜索关键词"
// @Success 200 {object} contract.ArticleListResp
// @Router /articles [get]
func (h *ArticleHandler) ListArticles(c *fiber.Ctx) error {
	query := buildArticleListQuery(c)
	return h.listPublicArticlesWithQuery(c, query)
}

// ListArticlesByCategoryShortURL godoc
// @Summary 根据分类短链接获取文章列表
// @Tags Article
// @Produce json
// @Param shortUrl path string true "分类短链接"
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(10)
// @Success 200 {object} contract.ArticleListResp
// @Router /categories/short/{shortUrl}/articles [get]
func (h *ArticleHandler) ListArticlesByCategoryShortURL(c *fiber.Ctx) error {
	shortURL := strings.TrimSpace(c.Params("shortUrl"))
	if shortURL == "" {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	category, err := h.contentRepo.GetCategoryByShortURL(c.Context(), shortURL)
	if err != nil {
		if errors.Is(err, content.ErrCategoryNotFound) {
			return response.ErrorFromBizLocalized[any](c, response.NotFound)
		}
		return err
	}

	query := buildArticleListQuery(c)
	query.CategoryID = &category.ID

	return h.listPublicArticlesWithQuery(c, query)
}

// ListArticlesAdmin godoc
// @Summary 获取文章列表（管理员）
// @Tags Article
// @Produce json
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(10)
// @Param categoryId query int false "分类ID"
// @Param tagId query int false "标签ID"
// @Param authorId query int false "作者ID"
// @Param published query bool false "是否发布"
// @Param search query string false "搜索关键词"
// @Success 200 {object} contract.ArticleListResp
// @Security BearerAuth
// @Router /admin/articles [get]
func (h *ArticleHandler) ListArticlesAdmin(c *fiber.Ctx) error {
	query := buildArticleListQuery(c)
	return h.listArticlesWithQuery(c, query)
}

func (h *ArticleHandler) listArticlesWithQuery(c *fiber.Ctx, query contract.ListArticlesReq) error {
	articles, total, err := h.svc.ListArticles(c.Context(), content.ArticleListOptionsInternal(query))
	if err != nil {
		return err
	}

	articleResponses := make([]contract.ArticleListItemResp, len(articles))
	for i, art := range articles {
		resp, err := h.toArticleListItemResp(c.Context(), art)
		if err != nil {
			return err
		}
		articleResponses[i] = *resp
	}

	listResponse := contract.ArticleListResp{
		Items: articleResponses,
		Total: total,
		Page:  query.Page,
		Size:  query.PageSize,
	}

	return response.Success(c, listResponse)
}

func (h *ArticleHandler) listPublicArticlesWithQuery(c *fiber.Ctx, query contract.ListArticlesReq) error {
	articles, total, err := h.svc.ListPublicArticles(c.Context(), content.ArticleListOptions{
		Page:       query.Page,
		PageSize:   query.PageSize,
		CategoryID: query.CategoryID,
		TagID:      query.TagID,
		AuthorID:   query.AuthorID,
		Search:     query.Search,
	})
	if err != nil {
		return err
	}

	articleResponses := make([]contract.ArticleListItemResp, len(articles))
	for i, art := range articles {
		resp, err := h.toArticleListItemResp(c.Context(), art)
		if err != nil {
			return err
		}
		articleResponses[i] = *resp
	}

	listResponse := contract.ArticleListResp{
		Items: articleResponses,
		Total: total,
		Page:  query.Page,
		Size:  query.PageSize,
	}

	return response.Success(c, listResponse)
}

func buildArticleListQuery(c *fiber.Ctx) contract.ListArticlesReq {
	query := contract.ListArticlesReq{
		Page:     1,
		PageSize: 10,
	}

	if page, err := strconv.Atoi(c.Query("page", "1")); err == nil && page > 0 {
		query.Page = page
	}
	if pageSize, err := strconv.Atoi(c.Query("pageSize", "10")); err == nil && pageSize > 0 && pageSize <= 100 {
		query.PageSize = pageSize
	}
	if categoryID, err := strconv.ParseInt(c.Query("categoryId"), 10, 64); err == nil {
		query.CategoryID = &categoryID
	}
	if tagID, err := strconv.ParseInt(c.Query("tagId"), 10, 64); err == nil {
		query.TagID = &tagID
	}
	if authorID, err := strconv.ParseInt(c.Query("authorId"), 10, 64); err == nil {
		query.AuthorID = &authorID
	}
	if publishedStr := c.Query("published"); publishedStr != "" {
		if published, err := strconv.ParseBool(publishedStr); err == nil {
			query.Published = &published
		}
	}
	if search := c.Query("search"); search != "" {
		query.Search = &search
	}

	return query
}

// ListRecentPublicArticles godoc
// @Summary 获取最近公开文章
// @Tags Public
// @Produce json
// @Success 200 {object} contract.ArticleListResp
// @Router /public/articles/recent [get]
func (h *ArticleHandler) ListRecentPublicArticles(c *fiber.Ctx) error {
	const page = 1
	const size = 5

	articles, total, err := h.svc.ListPublicArticles(c.Context(), content.ArticleListOptions{
		Page:     page,
		PageSize: size,
	})
	if err != nil {
		return err
	}

	articleResponses := make([]contract.ArticleListItemResp, len(articles))
	for i, art := range articles {
		resp, err := h.toArticleListItemResp(c.Context(), art)
		if err != nil {
			return err
		}
		articleResponses[i] = *resp
	}

	return response.Success(c, contract.ArticleListResp{
		Items: articleResponses,
		Total: total,
		Page:  page,
		Size:  size,
	})
}

// CheckArticleLatest godoc
// @Summary 校验文章是否最新
// @Tags Article
// @Accept json
// @Produce json
// @Param id path int true "文章ID"
// @Param request body contract.CheckArticleLatestReq true "文章版本校验参数"
// @Success 200 {object} contract.CheckArticleLatestResp
// @Router /articles/{id}/latest [post]
func (h *ArticleHandler) CheckArticleLatest(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	var req contract.CheckArticleLatestReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}

	article, err := h.svc.GetArticleByID(c.Context(), id)
	if errors.Is(err, content.ErrArticleNotFound) {
		return response.ErrorFromBizLocalized[any](c, response.NotFound)
	} else if err != nil {
		return err
	}
	if !article.IsPublished {
		return response.ErrorFromBizLocalized[any](c, response.NotFound)
	}

	if req.Hash == article.ContentHash {
		return response.Success(c, contract.CheckArticleLatestResp{
			Latest: true,
			ArticleContentPayload: contract.ArticleContentPayload{
				ContentHash: article.ContentHash,
			},
		})
	}

	return response.Success(c, contract.CheckArticleLatestResp{
		Latest: false,
		ArticleContentPayload: contract.ArticleContentPayload{
			ContentHash: article.ContentHash,
			Title:       article.Title,
			LeadIn:      article.LeadIn,
			TOC:         mapTOCNodes(article.TOC),
			Content:     article.Content,
		},
	})
}

// DeleteArticle godoc
// @Summary 删除文章
// @Tags Article
// @Produce json
// @Param id path int true "文章ID"
// @Success 200 {object} any
// @Security BearerAuth
// @Router /articles/{id} [delete]
// @Security JWTAuth
func (h *ArticleHandler) DeleteArticle(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	if err := h.svc.DeleteArticle(c.Context(), id); err != nil {
		return err
	}

	Audit(c, "article.delete", map[string]any{
		"articleId": id,
		"userId":    claims.UserID,
	})

	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.deleted"))
}

// BatchDeleteArticles godoc
// @Summary 批量删除文章（管理端）
// @Tags Article
// @Accept json
// @Produce json
// @Param request body contract.BatchDeleteArticleReq true "批量删除参数"
// @Success 200 {object} contract.EmptyRespEnvelope
// @Security BearerAuth
// @Router /admin/articles/batch-delete [post]
// @Security JWTAuth
func (h *ArticleHandler) BatchDeleteArticles(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}

	var req contract.BatchDeleteArticleReq
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

	if err := h.svc.BatchDelete(c.Context(), article.BatchDeleteCmd{IDs: req.IDs}); err != nil {
		return err
	}

	Audit(c, "article.batch_delete", map[string]any{
		"articleIds": req.IDs,
		"userId":     claims.UserID,
	})

	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.deleted"))
}

func (h *ArticleHandler) toArticleResp(ctx context.Context, article *content.Article) (*contract.ArticleResp, error) {
	tags, err := h.svc.GetArticleTags(ctx, article.ID)
	if err != nil {
		return nil, err
	}

	metrics, err := h.svc.GetArticleMetrics(ctx, article.ID)
	if err != nil {
		return nil, err
	}

	var resp contract.ArticleResp
	if err := copier.Copy(&resp, article); err != nil {
		return nil, err
	}
	resp.TOC = mapTOCNodes(article.TOC)
	resp.ExtInfo = jsonRawFromBytes(article.ExtInfo)
	resp.AllowComment = h.allowCommentByAreaID(ctx, article.CommentID)
	resp.FediverseObjectURL = h.buildFediverseObjectURL(ctx, article)

	if article.CategoryID != nil {
		category, catErr := h.contentRepo.GetCategoryByID(ctx, *article.CategoryID)
		if catErr == nil && category != nil {
			resp.CategoryName = category.Name
			if category.ShortURL != nil {
				resp.CategoryShortURL = *category.ShortURL
			}
		}
	}

	if len(tags) > 0 {
		resp.Tags = make([]contract.TagResp, len(tags))
		for i, tag := range tags {
			if err := copier.Copy(&resp.Tags[i], tag); err != nil {
				return nil, err
			}
		}
	}

	if metrics != nil {
		var metricsResp contract.MetricsResp
		if err := copier.Copy(&metricsResp, metrics); err != nil {
			return nil, err
		}
		resp.Metrics = &metricsResp
	}

	return &resp, nil
}

func (h *ArticleHandler) toArticleListItemResp(ctx context.Context, article *content.Article) (*contract.ArticleListItemResp, error) {
	tags, err := h.svc.GetArticleTags(ctx, article.ID)
	if err != nil {
		return nil, err
	}

	metrics, err := h.svc.GetArticleMetrics(ctx, article.ID)
	if err != nil {
		return nil, err
	}

	resp := contract.ArticleListItemResp{
		ID:               article.ID,
		Title:            article.Title,
		ShortURL:         article.ShortURL,
		Summary:          article.Summary,
		IsTop:            article.IsTop,
		IsHot:            article.IsHot,
		AllowComment:     h.allowCommentByAreaID(ctx, article.CommentID),
		IsOriginal:       article.IsOriginal,
		IsPublished:      article.IsPublished,
		ContentUpdatedAt: article.ContentUpdatedAt,
		CreatedAt:        article.CreatedAt,
		UpdatedAt:        article.UpdatedAt,
		Tags:             []string{},
	}
	resp.CommentID = article.CommentID

	if article.Cover != nil {
		resp.Cover = *article.Cover
	}

	if metrics != nil {
		resp.Views = metrics.Views
		resp.Likes = metrics.Likes
		resp.Comments = metrics.Comments
	}

	if len(tags) > 0 {
		tagNames := make([]string, len(tags))
		for i, tag := range tags {
			tagNames[i] = tag.Name
		}
		resp.Tags = tagNames
	}

	if article.CategoryID != nil {
		category, err := h.contentRepo.GetCategoryByID(ctx, *article.CategoryID)
		if err != nil {
			if !errors.Is(err, content.ErrCategoryNotFound) {
				return nil, err
			}
		} else if category != nil {
			resp.CategoryName = category.Name
			if category.ShortURL != nil {
				resp.CategoryShortURL = *category.ShortURL
			}
		}
	}

	if h.userRepo != nil {
		user, err := h.userRepo.FindByID(ctx, article.AuthorID)
		if err != nil {
			if !errors.Is(err, identity.ErrUserNotFound) {
				return nil, err
			}
		} else if user != nil {
			resp.AuthorName = user.Nickname
			resp.Avatar = user.Avatar
		}
	}

	return &resp, nil
}

func (h *ArticleHandler) allowCommentByAreaID(ctx context.Context, areaID *int64) bool {
	if h.commentRepo == nil || areaID == nil || *areaID <= 0 {
		return true
	}
	area, err := h.commentRepo.GetAreaByID(ctx, *areaID)
	if err != nil || area == nil {
		return false
	}
	return !area.IsClosed
}

func (h *ArticleHandler) buildFediverseObjectURL(ctx context.Context, article *content.Article) *string {
	if h.apCfgSvc == nil || article == nil {
		return nil
	}
	settings, err := h.apCfgSvc.ActivityPubSettings(ctx)
	if err != nil || !settings.Enabled {
		return nil
	}
	if article.ActivityPubObjectID == nil {
		return nil
	}
	objectURL := strings.TrimSpace(*article.ActivityPubObjectID)
	if objectURL == "" {
		return nil
	}
	return &objectURL
}

// GetArticleMetrics godoc
// @Summary 获取文章指标
// @Tags Article
// @Produce json
// @Param id path int true "文章ID"
// @Success 200 {object} contract.MetricsResp
// @Router /articles/{id}/metrics [get]
func (h *ArticleHandler) GetArticleMetrics(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.ErrorFromBizLocalized[any](c, response.ParamsError)
	}

	metrics, err := h.svc.GetArticleMetrics(c.Context(), id)
	if err != nil {
		if errors.Is(err, content.ErrArticleNotFound) {
			return response.ErrorFromBizLocalized[any](c, response.NotFound)
		}
		return err
	}

	resp := contract.MetricsResp{}
	if metrics != nil {
		resp.Views = metrics.Views
		resp.Likes = metrics.Likes
		resp.Comments = metrics.Comments
	}

	return response.Success(c, resp)
}

func (h *ArticleHandler) expandFederationContent(ctx context.Context, art *content.Article, contentStr string) string {
	if contentStr == "" || art == nil {
		return contentStr
	}
	deliveries, err := h.deliveryRepo.ListBySourceArticle(ctx, art.ID, 100)
	if err != nil {
		return contentStr
	}
	// Collect unique instance IDs from deliveries to fetch instances and cached posts.
	instanceURLs := make(map[string]struct{})
	for _, d := range deliveries {
		instanceURLs[d.TargetInstanceURL] = struct{}{}
	}
	var allInstances []domainfed.FederationInstance
	var allPosts []domainfed.FederatedPostCache
	for u := range instanceURLs {
		inst, err := h.instanceRepo.GetByBaseURL(ctx, u)
		if err != nil || inst == nil {
			continue
		}
		allInstances = append(allInstances, *inst)
		posts, err := h.postCacheRepo.ListByInstance(ctx, inst.ID, nil, 100)
		if err == nil {
			allPosts = append(allPosts, posts...)
		}
	}
	return article.ExpandFederationSignals(contentStr, deliveries, allPosts, allInstances)
}

func mapTOCNodes(nodes []content.TOCNode) []contract.TOCNode {
	result := make([]contract.TOCNode, len(nodes))
	for i, node := range nodes {
		result[i] = contract.TOCNode{
			Name:     node.Name,
			Anchor:   node.Anchor,
			Children: mapTOCNodes(node.Children),
		}
	}
	return result
}
