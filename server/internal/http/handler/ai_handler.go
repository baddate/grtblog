package handler

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	appai "github.com/baddate/sanblog/server/internal/app/ai"
	domainai "github.com/baddate/sanblog/server/internal/domain/ai"
	"github.com/baddate/sanblog/server/internal/http/contract"
	"github.com/baddate/sanblog/server/internal/http/response"
)

type AIHandler struct {
	svc *appai.Service
}

func NewAIHandler(svc *appai.Service) *AIHandler {
	return &AIHandler{svc: svc}
}

// ── Provider CRUD ──

func (h *AIHandler) ListProviders(c *fiber.Ctx) error {
	providers, err := h.svc.ListProviders(c.Context())
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.providers_list_failed"), err)
	}
	resp := make([]contract.AIProviderResp, len(providers))
	for i, p := range providers {
		resp[i] = toProviderResp(p)
	}
	return response.Success(c, resp)
}

func (h *AIHandler) CreateProvider(c *fiber.Ctx) error {
	var req contract.CreateAIProviderReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Name) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.name_not_empty"))
	}
	if !isValidProviderType(req.Type) {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.provider_type_invalid"))
	}

	p := &domainai.Provider{
		Name:     strings.TrimSpace(req.Name),
		Type:     req.Type,
		APIURL:   strings.TrimSpace(req.APIURL),
		APIKey:   strings.TrimSpace(req.APIKey),
		IsActive: true,
	}
	if req.IsActive != nil {
		p.IsActive = *req.IsActive
	}

	if err := h.svc.CreateProvider(c.Context(), p); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.create_provider_failed"), err)
	}
	return response.SuccessWithMessage(c, toProviderResp(p), response.Translate(c, "server.success.provider_created"))
}

func (h *AIHandler) UpdateProvider(c *fiber.Ctx) error {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_provider_id"))
	}

	existing, err := h.svc.GetProviderByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, domainai.ErrProviderNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.provider_not_found"))
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.get_provider_failed"), err)
	}

	var req contract.UpdateAIProviderReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}

	if req.Name != nil {
		existing.Name = strings.TrimSpace(*req.Name)
	}
	if req.Type != nil {
		if !isValidProviderType(*req.Type) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.provider_type_invalid"))
		}
		existing.Type = *req.Type
	}
	if req.APIURL != nil {
		existing.APIURL = strings.TrimSpace(*req.APIURL)
	}
	if req.APIKey != nil {
		existing.APIKey = strings.TrimSpace(*req.APIKey)
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	if err := h.svc.UpdateProvider(c.Context(), existing); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.update_provider_failed"), err)
	}
	return response.SuccessWithMessage(c, toProviderResp(existing), response.Translate(c, "server.success.provider_updated"))
}

func (h *AIHandler) DeleteProvider(c *fiber.Ctx) error {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_provider_id"))
	}
	if err := h.svc.DeleteProvider(c.Context(), id); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.delete_provider_failed"), err)
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.provider_deleted"))
}

// ── Model CRUD ──

func (h *AIHandler) ListModels(c *fiber.Ctx) error {
	models, err := h.svc.ListModels(c.Context())
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.get_models_failed"), err)
	}

	// 批量获取 provider 信息
	providers, _ := h.svc.ListProviders(c.Context())
	providerMap := make(map[int64]*domainai.Provider, len(providers))
	for _, p := range providers {
		providerMap[p.ID] = p
	}

	resp := make([]contract.AIModelResp, len(models))
	for i, m := range models {
		r := toModelResp(m)
		if p, ok := providerMap[m.ProviderID]; ok {
			r.ProviderName = p.Name
			r.ProviderType = p.Type
		}
		resp[i] = r
	}
	return response.Success(c, resp)
}

func (h *AIHandler) CreateModel(c *fiber.Ctx) error {
	var req contract.CreateAIModelReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Name) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.model_name_required"))
	}
	if strings.TrimSpace(req.ModelID) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.model_id_required"))
	}
	if req.ProviderID <= 0 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.select_provider_required"))
	}

	m := &domainai.Model{
		ProviderID: req.ProviderID,
		Name:       strings.TrimSpace(req.Name),
		ModelID:    strings.TrimSpace(req.ModelID),
		IsActive:   true,
	}
	if req.IsActive != nil {
		m.IsActive = *req.IsActive
	}

	if err := h.svc.CreateModel(c.Context(), m); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.create_model_failed"), err)
	}
	return response.SuccessWithMessage(c, toModelResp(m), response.Translate(c, "server.success.model_created"))
}

func (h *AIHandler) UpdateModel(c *fiber.Ctx) error {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_model_id"))
	}

	existing, err := h.svc.GetModelByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, domainai.ErrModelNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.model_not_found"))
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.get_model_failed"), err)
	}

	var req contract.UpdateAIModelReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}

	if req.ProviderID != nil {
		existing.ProviderID = *req.ProviderID
	}
	if req.Name != nil {
		existing.Name = strings.TrimSpace(*req.Name)
	}
	if req.ModelID != nil {
		existing.ModelID = strings.TrimSpace(*req.ModelID)
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	if err := h.svc.UpdateModel(c.Context(), existing); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.update_model_failed"), err)
	}
	return response.SuccessWithMessage(c, toModelResp(existing), response.Translate(c, "server.success.model_updated"))
}

func (h *AIHandler) DeleteModel(c *fiber.Ctx) error {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_model_id"))
	}
	if err := h.svc.DeleteModel(c.Context(), id); err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.delete_model_failed"), err)
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.model_deleted"))
}

// ── AI 功能 ──

func (h *AIHandler) ModerateComment(c *fiber.Ctx) error {
	var req contract.AIModerateCommentReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Content) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.comment_content_required"))
	}

	result, err := h.svc.ModerateComment(c.Context(), req.Content, "manual")
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, err.Error(), err)
	}
	return response.Success(c, contract.AIModerateCommentResp{
		Approved: result.Approved,
		Reason:   result.Reason,
		Score:    result.Score,
	})
}

func (h *AIHandler) GenerateTitle(c *fiber.Ctx) error {
	var req contract.AIGenerateTitleReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Content) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.article_content_required"))
	}

	result, err := h.svc.GenerateTitle(c.Context(), req.Content)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, err.Error(), err)
	}
	return response.Success(c, contract.AIGenerateTitleResp{
		Title:    result.Title,
		ShortURL: result.ShortURL,
	})
}

func (h *AIHandler) RewriteContent(c *fiber.Ctx) error {
	var req contract.AIRewriteContentReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Content) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.content_required"))
	}

	result, err := h.svc.RewriteContent(c.Context(), req.Content, req.Instruction)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, err.Error(), err)
	}
	return response.Success(c, contract.AIRewriteContentResp{
		Content: result.Content,
	})
}

func (h *AIHandler) RewriteContentStream(c *fiber.Ctx) error {
	var req contract.AIRewriteContentReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Content) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.content_required"))
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	// 创建独立 context：SetBodyStreamWriter 的回调在单独 goroutine 中运行，
	// fasthttp.RequestCtx 作为 context.Context 在该 goroutine 中不可用（Done() 会 panic）。
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		defer cancel()
		err := h.svc.RewriteContentStream(ctx, req.Content, req.Instruction, func(chunk string) error {
			data, _ := json.Marshal(map[string]string{"content": chunk})
			if _, err := fmt.Fprintf(w, "data: %s\n\n", data); err != nil {
				return err
			}
			return w.Flush()
		})
		if err != nil {
			data, _ := json.Marshal(map[string]string{"error": err.Error()})
			fmt.Fprintf(w, "data: %s\n\n", data)
			w.Flush()
		}
		fmt.Fprintf(w, "data: [DONE]\n\n")
		w.Flush()
	})
	return nil
}

func (h *AIHandler) GenerateSummaryStream(c *fiber.Ctx) error {
	var req contract.AIGenerateSummaryReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Content) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.content_required"))
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		defer cancel()
		err := h.svc.GenerateSummaryStream(ctx, req.Content, func(chunk string) error {
			data, _ := json.Marshal(map[string]string{"content": chunk})
			if _, err := fmt.Fprintf(w, "data: %s\n\n", data); err != nil {
				return err
			}
			return w.Flush()
		})
		if err != nil {
			data, _ := json.Marshal(map[string]string{"error": err.Error()})
			fmt.Fprintf(w, "data: %s\n\n", data)
			w.Flush()
		}
		fmt.Fprintf(w, "data: [DONE]\n\n")
		w.Flush()
	})
	return nil
}

// ── TaskLog ──

func (h *AIHandler) ListTaskLogs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	opts := domainai.TaskLogListOptions{
		Page:     page,
		PageSize: pageSize,
	}
	if v := c.Query("taskType"); v != "" {
		opts.TaskType = &v
	}
	if v := c.Query("status"); v != "" {
		opts.Status = &v
	}
	if v := c.Query("search"); v != "" {
		opts.Search = &v
	}

	items, total, err := h.svc.ListTaskLogs(c.Context(), opts)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.get_task_logs_failed"), err)
	}

	respItems := make([]contract.AITaskLogResp, len(items))
	for i, l := range items {
		respItems[i] = toTaskLogResp(l)
	}
	return response.Success(c, contract.AITaskLogListResp{
		Items: respItems,
		Total: total,
		Page:  page,
		Size:  pageSize,
	})
}

func (h *AIHandler) GetTaskLog(c *fiber.Ctx) error {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_task_log_id"))
	}

	l, err := h.svc.GetTaskLogByID(c.Context(), id)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.get_task_log_failed"), err)
	}
	return response.Success(c, toTaskLogResp(l))
}

// ── Helpers ──

func isValidProviderType(t string) bool {
	return t == "openai" || t == "openrouter" || t == "gemini"
}

func toProviderResp(p *domainai.Provider) contract.AIProviderResp {
	return contract.AIProviderResp{
		ID:        p.ID,
		Name:      p.Name,
		Type:      p.Type,
		APIURL:    p.APIURL,
		IsActive:  p.IsActive,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}

func toModelResp(m *domainai.Model) contract.AIModelResp {
	return contract.AIModelResp{
		ID:         m.ID,
		ProviderID: m.ProviderID,
		Name:       m.Name,
		ModelID:    m.ModelID,
		IsActive:   m.IsActive,
		CreatedAt:  m.CreatedAt,
		UpdatedAt:  m.UpdatedAt,
	}
}

func toTaskLogResp(l *domainai.TaskLog) contract.AITaskLogResp {
	return contract.AITaskLogResp{
		ID:            l.ID,
		TaskType:      l.TaskType,
		ModelName:     l.ModelName,
		ProviderName:  l.ProviderName,
		Status:        l.Status,
		InputText:     l.InputText,
		OutputText:    l.OutputText,
		ErrorMessage:  l.ErrorMessage,
		DurationMs:    l.DurationMs,
		TriggerSource: l.TriggerSource,
		CreatedAt:     l.CreatedAt,
		UpdatedAt:     l.UpdatedAt,
	}
}
