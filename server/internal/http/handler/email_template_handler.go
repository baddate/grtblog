package handler

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/baddate/sanblog/server/internal/app/email"
	domainemail "github.com/baddate/sanblog/server/internal/domain/email"
	"github.com/baddate/sanblog/server/internal/http/contract"
	"github.com/baddate/sanblog/server/internal/http/response"
)

type EmailTemplateHandler struct {
	svc *email.Service
}

func NewEmailTemplateHandler(svc *email.Service) *EmailTemplateHandler {
	return &EmailTemplateHandler{svc: svc}
}

// ListEmailEvents godoc
// @Summary 获取邮件事件列表
// @Tags Email
// @Produce json
// @Success 200 {object} contract.EmailEventListResp
// @Security BearerAuth
// @Router /admin/email/events [get]
// @Security JWTAuth
func (h *EmailTemplateHandler) ListEmailEvents(c *fiber.Ctx) error {
	return response.Success(c, contract.EmailEventListResp{Events: h.svc.ListEvents()})
}

// ListPublicEmailEvents godoc
// @Summary 获取可订阅邮件事件列表
// @Tags EmailPublic
// @Produce json
// @Success 200 {object} contract.EmailEventListResp
// @Router /public/email/events [get]
func (h *EmailTemplateHandler) ListPublicEmailEvents(c *fiber.Ctx) error {
	return response.Success(c, contract.EmailEventListResp{Events: h.svc.ListPublicEvents()})
}

// ListEmailEventCatalog godoc
// @Summary 获取邮件事件参数目录
// @Tags Email
// @Produce json
// @Success 200 {object} contract.EmailEventCatalogResp
// @Security BearerAuth
// @Router /admin/email/events/catalog [get]
// @Security JWTAuth
func (h *EmailTemplateHandler) ListEmailEventCatalog(c *fiber.Ctx) error {
	items := h.svc.ListEventCatalog()
	respItems := make([]contract.EmailEventDescriptorResp, len(items))
	for i, item := range items {
		fields := make([]contract.EmailEventFieldResp, len(item.Fields))
		for j, field := range item.Fields {
			fields[j] = contract.EmailEventFieldResp{
				Name:        field.Name,
				Type:        field.Type,
				Required:    field.Required,
				Description: field.Description,
			}
		}
		respItems[i] = contract.EmailEventDescriptorResp{
			Name:        item.Name,
			Title:       item.Title,
			Category:    item.Category,
			Public:      item.PublicEmail,
			Description: item.Description,
			Fields:      fields,
		}
	}
	return response.Success(c, contract.EmailEventCatalogResp{Items: respItems})
}

// ListEmailTemplates godoc
// @Summary 获取邮件模板列表
// @Tags Email
// @Produce json
// @Success 200 {object} []contract.EmailTemplateResp
// @Security BearerAuth
// @Router /admin/email/templates [get]
// @Security JWTAuth
func (h *EmailTemplateHandler) ListEmailTemplates(c *fiber.Ctx) error {
	items, err := h.svc.ListTemplates(c.Context())
	if err != nil {
		return err
	}
	resp := make([]contract.EmailTemplateResp, len(items))
	for i, item := range items {
		resp[i] = mapEmailTemplateResp(item)
	}
	return response.Success(c, resp)
}

// CreateEmailTemplate godoc
// @Summary 创建邮件模板
// @Tags Email
// @Accept json
// @Produce json
// @Param request body contract.CreateEmailTemplateReq true "创建邮件模板参数"
// @Success 200 {object} contract.EmailTemplateResp
// @Security BearerAuth
// @Router /admin/email/templates [post]
// @Security JWTAuth
func (h *EmailTemplateHandler) CreateEmailTemplate(c *fiber.Ctx) error {
	var req contract.CreateEmailTemplateReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	tpl := &domainemail.Template{
		Code:            req.Code,
		Name:            req.Name,
		EventName:       req.EventName,
		SubjectTemplate: req.SubjectTemplate,
		HTMLTemplate:    req.HTMLTemplate,
		TextTemplate:    req.TextTemplate,
		ToEmails:        req.ToEmails,
		IsEnabled:       req.IsEnabled,
	}
	if err := h.svc.CreateTemplate(c.Context(), tpl); err != nil {
		Audit(c, "email.template.create_failed", map[string]any{
			"code":      tpl.Code,
			"eventName": tpl.EventName,
			"error":     err.Error(),
		})
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.SuccessWithMessage(c, mapEmailTemplateResp(tpl), response.Translate(c, "server.success.email_template_created"))
}

// UpdateEmailTemplate godoc
// @Summary 更新邮件模板
// @Tags Email
// @Accept json
// @Produce json
// @Param code path string true "模板编码"
// @Param request body contract.UpdateEmailTemplateReq true "更新邮件模板参数"
// @Success 200 {object} contract.EmailTemplateResp
// @Security BearerAuth
// @Router /admin/email/templates/{code} [put]
// @Security JWTAuth
func (h *EmailTemplateHandler) UpdateEmailTemplate(c *fiber.Ctx) error {
	code := strings.TrimSpace(c.Params("code"))
	if code == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_template_code"))
	}
	var req contract.UpdateEmailTemplateReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	tpl := &domainemail.Template{
		Name:            req.Name,
		EventName:       req.EventName,
		SubjectTemplate: req.SubjectTemplate,
		HTMLTemplate:    req.HTMLTemplate,
		TextTemplate:    req.TextTemplate,
		ToEmails:        req.ToEmails,
		IsEnabled:       req.IsEnabled,
	}
	if err := h.svc.UpdateTemplate(c.Context(), code, tpl); err != nil {
		Audit(c, "email.template.update_failed", map[string]any{
			"code":      code,
			"eventName": tpl.EventName,
			"error":     err.Error(),
		})
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	updated, err := h.svc.GetTemplateByCode(c.Context(), code)
	if err != nil {
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.SuccessWithMessage(c, mapEmailTemplateResp(updated), response.Translate(c, "server.success.email_template_updated"))
}

// DeleteEmailTemplate godoc
// @Summary 删除邮件模板
// @Tags Email
// @Produce json
// @Param code path string true "模板编码"
// @Success 200 {object} any
// @Security BearerAuth
// @Router /admin/email/templates/{code} [delete]
// @Security JWTAuth
func (h *EmailTemplateHandler) DeleteEmailTemplate(c *fiber.Ctx) error {
	code := strings.TrimSpace(c.Params("code"))
	if code == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_template_code"))
	}
	if err := h.svc.DeleteTemplate(c.Context(), code); err != nil {
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.email_template_deleted"))
}

// PreviewEmailTemplate godoc
// @Summary 预览邮件模板渲染结果
// @Tags Email
// @Accept json
// @Produce json
// @Param code path string true "模板编码"
// @Param request body contract.EmailTemplatePreviewReq false "预览参数"
// @Success 200 {object} contract.EmailTemplatePreviewResp
// @Security BearerAuth
// @Router /admin/email/templates/{code}/preview [post]
// @Security JWTAuth
func (h *EmailTemplateHandler) PreviewEmailTemplate(c *fiber.Ctx) error {
	code := strings.TrimSpace(c.Params("code"))
	if code == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_template_code"))
	}
	var req contract.EmailTemplatePreviewReq
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&req); err != nil {
			return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
		}
	}
	variables, err := parseEmailVariables(req.Variables)
	if err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.invalid_extinfo"), err)
	}
	rendered, err := h.svc.PreviewTemplate(c.Context(), code, variables)
	if err != nil {
		Audit(c, "email.template.preview_failed", map[string]any{
			"code":  code,
			"keys":  mapKeys(variables),
			"error": err.Error(),
		})
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.Success(c, contract.EmailTemplatePreviewResp{
		Subject:  rendered.Subject,
		HTMLBody: rendered.HTMLBody,
		TextBody: rendered.TextBody,
	})
}

// TestEmailTemplate godoc
// @Summary 测试发送邮件模板
// @Tags Email
// @Accept json
// @Produce json
// @Param code path string true "模板编码"
// @Param request body contract.EmailTemplateTestReq false "测试发送参数"
// @Success 200 {object} any
// @Security BearerAuth
// @Router /admin/email/templates/{code}/test [post]
// @Security JWTAuth
func (h *EmailTemplateHandler) TestEmailTemplate(c *fiber.Ctx) error {
	code := strings.TrimSpace(c.Params("code"))
	if code == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_template_code"))
	}
	var req contract.EmailTemplateTestReq
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&req); err != nil {
			return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
		}
	}
	variables, err := parseEmailVariables(req.Variables)
	if err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.invalid_extinfo"), err)
	}
	if err := h.svc.TestSend(c.Context(), code, req.ToEmails, variables); err != nil {
		Audit(c, "email.template.test_failed", map[string]any{
			"code":    code,
			"toCount": len(req.ToEmails),
			"keys":    mapKeys(variables),
			"error":   err.Error(),
		})
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.email_test_sent"))
}

// SubscribeEmail godoc
// @Summary 订阅邮件事件
// @Tags EmailPublic
// @Accept json
// @Produce json
// @Param request body contract.EmailSubscribeReq true "订阅参数(使用 eventNames)"
// @Success 200 {object} contract.EmailSubscribeBatchResp
// @Router /public/email/subscriptions [post]
func (h *EmailTemplateHandler) SubscribeEmail(c *fiber.Ctx) error {
	var req contract.EmailSubscribeReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	items, err := h.svc.SubscribeBatch(c.Context(), req.Email, req.EventNames, c.IP())
	if err != nil {
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	respItems := make([]contract.EmailPublicSubscriptionResp, len(items))
	for i, item := range items {
		respItems[i] = mapEmailPublicSubscriptionResp(item)
	}
	return response.SuccessWithMessage(c, contract.EmailSubscribeBatchResp{Items: respItems}, response.Translate(c, "server.success.email_subscribed"))
}

// UnsubscribeEmail godoc
// @Summary 退订邮件事件
// @Tags EmailPublic
// @Accept json
// @Produce json
// @Param request body contract.EmailUnsubscribeReq true "退订参数"
// @Success 200 {object} any
// @Router /public/email/subscriptions/unsubscribe [post]
func (h *EmailTemplateHandler) UnsubscribeEmail(c *fiber.Ctx) error {
	var req contract.EmailUnsubscribeReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if err := h.svc.Unsubscribe(c.Context(), req.Token, req.Email, req.EventName); err != nil {
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.email_unsubscribed"))
}

// ListEmailSubscriptions godoc
// @Summary 获取邮件订阅列表（管理端）
// @Tags Email
// @Produce json
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(20)
// @Param eventName query string false "事件名"
// @Param status query string false "状态"
// @Param search query string false "邮箱关键字"
// @Success 200 {object} contract.EmailSubscriptionListResp
// @Security BearerAuth
// @Router /admin/email/subscriptions [get]
// @Security JWTAuth
func (h *EmailTemplateHandler) ListEmailSubscriptions(c *fiber.Ctx) error {
	page := parseIntQuery(c, "page", 1)
	pageSize := parseIntQuery(c, "pageSize", 20)
	eventName := strings.TrimSpace(c.Query("eventName"))
	status := strings.TrimSpace(c.Query("status"))
	search := strings.TrimSpace(c.Query("search"))

	var eventNamePtr *string
	var statusPtr *string
	var searchPtr *string
	if eventName != "" {
		eventNamePtr = &eventName
	}
	if status != "" {
		statusPtr = &status
	}
	if search != "" {
		searchPtr = &search
	}
	items, total, err := h.svc.ListSubscriptions(c.Context(), domainemail.SubscriptionListOptions{
		Page:      page,
		PageSize:  pageSize,
		EventName: eventNamePtr,
		Status:    statusPtr,
		Search:    searchPtr,
	})
	if err != nil {
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	respItems := make([]contract.EmailSubscriptionResp, len(items))
	for i, item := range items {
		respItems[i] = mapEmailSubscriptionResp(item, false)
	}
	return response.Success(c, contract.EmailSubscriptionListResp{
		Items: respItems,
		Total: total,
		Page:  page,
		Size:  pageSize,
	})
}

// BatchUpdateEmailSubscriptionStatus godoc
// @Summary 批量更新邮件订阅状态（管理端）
// @Tags Email
// @Accept json
// @Produce json
// @Param request body contract.BatchUpdateEmailSubscriptionStatusReq true "批量更新状态参数"
// @Success 200 {object} any
// @Security BearerAuth
// @Router /admin/email/subscriptions/status [put]
// @Security JWTAuth
func (h *EmailTemplateHandler) BatchUpdateEmailSubscriptionStatus(c *fiber.Ctx) error {
	var req contract.BatchUpdateEmailSubscriptionStatusReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if err := h.svc.BatchUpdateSubscriptionStatus(c.Context(), req.IDs, req.Status); err != nil {
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.batch_update_subscription_status"))
}

// ListEmailOutbox godoc
// @Summary 获取邮件出站队列
// @Tags Email
// @Produce json
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(20)
// @Param status query string false "状态"
// @Param eventName query string false "事件名"
// @Param search query string false "主题关键字"
// @Success 200 {object} contract.EmailOutboxListResp
// @Security BearerAuth
// @Router /admin/email/outbox [get]
// @Security JWTAuth
func (h *EmailTemplateHandler) ListEmailOutbox(c *fiber.Ctx) error {
	page := parseIntQuery(c, "page", 1)
	pageSize := parseIntQuery(c, "pageSize", 20)
	status := strings.TrimSpace(c.Query("status"))
	eventName := strings.TrimSpace(c.Query("eventName"))
	search := strings.TrimSpace(c.Query("search"))

	var statusPtr, eventNamePtr, searchPtr *string
	if status != "" {
		statusPtr = &status
	}
	if eventName != "" {
		eventNamePtr = &eventName
	}
	if search != "" {
		searchPtr = &search
	}
	items, total, err := h.svc.ListOutbox(c.Context(), domainemail.OutboxListOptions{
		Page:      page,
		PageSize:  pageSize,
		Status:    statusPtr,
		EventName: eventNamePtr,
		Search:    searchPtr,
	})
	if err != nil {
		return err
	}
	respItems := make([]contract.EmailOutboxResp, len(items))
	for i, item := range items {
		respItems[i] = mapEmailOutboxResp(item, false)
	}
	return response.Success(c, contract.EmailOutboxListResp{
		Items: respItems,
		Total: total,
		Page:  page,
		Size:  pageSize,
	})
}

// GetEmailOutbox godoc
// @Summary 获取邮件出站详情
// @Tags Email
// @Produce json
// @Param id path int true "出站记录 ID"
// @Success 200 {object} contract.EmailOutboxResp
// @Security BearerAuth
// @Router /admin/email/outbox/{id} [get]
// @Security JWTAuth
func (h *EmailTemplateHandler) GetEmailOutbox(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id <= 0 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_outbox_detail_id"))
	}
	item, err := h.svc.GetOutboxByID(c.Context(), int64(id))
	if err != nil {
		if mapped := mapEmailDomainError(c, err); mapped != nil {
			return mapped
		}
		return err
	}
	return response.Success(c, mapEmailOutboxResp(item, true))
}

func mapEmailOutboxResp(item *domainemail.Outbox, withBody bool) contract.EmailOutboxResp {
	toEmails := item.ToEmails
	if toEmails == nil {
		toEmails = []string{}
	}
	resp := contract.EmailOutboxResp{
		ID:           item.ID,
		TemplateCode: item.TemplateCode,
		EventName:    item.EventName,
		ToEmails:     toEmails,
		Subject:      item.Subject,
		Status:       item.Status,
		RetryCount:   item.RetryCount,
		NextRetryAt:  item.NextRetryAt,
		LastError:    item.LastError,
		SentAt:       item.SentAt,
		CreatedAt:    item.CreatedAt,
		UpdatedAt:    item.UpdatedAt,
	}
	if withBody {
		resp.HTMLBody = item.HTMLBody
		resp.TextBody = item.TextBody
	}
	return resp
}

func mapEmailTemplateResp(item *domainemail.Template) contract.EmailTemplateResp {
	toEmails := item.ToEmails
	if toEmails == nil {
		toEmails = []string{}
	}
	return contract.EmailTemplateResp{
		ID:              item.ID,
		Code:            item.Code,
		Name:            item.Name,
		EventName:       item.EventName,
		SubjectTemplate: item.SubjectTemplate,
		HTMLTemplate:    item.HTMLTemplate,
		TextTemplate:    item.TextTemplate,
		ToEmails:        toEmails,
		IsEnabled:       item.IsEnabled,
		IsInternal:      item.IsInternal,
		CreatedAt:       item.CreatedAt,
		UpdatedAt:       item.UpdatedAt,
	}
}

func mapEmailSubscriptionResp(item *domainemail.Subscription, withToken bool) contract.EmailSubscriptionResp {
	resp := contract.EmailSubscriptionResp{
		ID:             item.ID,
		Email:          item.Email,
		EventName:      item.EventName,
		Status:         item.Status,
		SourceIP:       item.SourceIP,
		UnsubscribedAt: item.UnsubscribedAt,
		CreatedAt:      item.CreatedAt,
		UpdatedAt:      item.UpdatedAt,
	}
	if withToken {
		resp.Token = item.Token
	}
	return resp
}

func mapEmailPublicSubscriptionResp(item *domainemail.Subscription) contract.EmailPublicSubscriptionResp {
	return contract.EmailPublicSubscriptionResp{
		ID:        item.ID,
		Email:     item.Email,
		EventName: item.EventName,
		CreatedAt: item.CreatedAt,
		UpdatedAt: item.UpdatedAt,
	}
}

func parseEmailVariables(raw json.RawMessage) (map[string]any, error) {
	if len(raw) == 0 || strings.TrimSpace(string(raw)) == "" || strings.TrimSpace(string(raw)) == "null" {
		return map[string]any{}, nil
	}
	decoder := json.NewDecoder(strings.NewReader(string(raw)))
	decoder.UseNumber()
	result := map[string]any{}
	if err := decoder.Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

func mapKeys(input map[string]any) []string {
	if len(input) == 0 {
		return []string{}
	}
	keys := make([]string, 0, len(input))
	for key := range input {
		keys = append(keys, key)
	}
	return keys
}

func mapEmailDomainError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, domainemail.ErrEmailTemplateNotFound):
		return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.error.email_template_not_found"))
	case errors.Is(err, domainemail.ErrEmailTemplateCodeExists):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_template_code_exists"))
	case errors.Is(err, domainemail.ErrEmailTemplateEventInvalid):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_template_event_invalid"))
	case errors.Is(err, domainemail.ErrEmailTemplateRenderFailed):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_template_render_failed"))
	case errors.Is(err, domainemail.ErrEmailTemplateInternalLocked):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_template_internal_locked"))
	case errors.Is(err, domainemail.ErrEmailNoRecipient):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_no_recipient"))
	case errors.Is(err, domainemail.ErrEmailDisabled):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_disabled"))
	case errors.Is(err, domainemail.ErrEmailConfigInvalid):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_config_invalid"))
	case errors.Is(err, domainemail.ErrEmailSendFailed):
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.error.email_send_failed"))
	case errors.Is(err, domainemail.ErrEmailSubscriptionInvalid):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_subscription_invalid"))
	case errors.Is(err, domainemail.ErrEmailSubscriptionEventInvalid):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_subscription_event_invalid"))
	case errors.Is(err, domainemail.ErrEmailSubscriptionNotFound):
		return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.error.email_subscription_not_found"))
	case errors.Is(err, domainemail.ErrEmailSubscriptionStatusInvalid):
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.error.email_subscription_status_invalid"))
	case errors.Is(err, domainemail.ErrEmailOutboxNotFound):
		return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.error.email_outbox_not_found"))
	default:
		return nil
	}
}
