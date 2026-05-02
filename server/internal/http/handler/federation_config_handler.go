package handler

import (
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/baddate/sanblog/server/internal/app/sysconfig"
	domainconfig "github.com/baddate/sanblog/server/internal/domain/config"
	"github.com/baddate/sanblog/server/internal/http/contract"
	"github.com/baddate/sanblog/server/internal/http/response"
)

// FederationConfigHandler provides settings-center style APIs for federation_config.
type FederationConfigHandler struct {
	svc *sysconfig.Service
}

func NewFederationConfigHandler(svc *sysconfig.Service) *FederationConfigHandler {
	return &FederationConfigHandler{svc: svc}
}

// ListFederationConfig lists federation config items.
// @Summary 联合配置列表
// @Tags FederationAdmin
// @Accept json
// @Produce json
// @Param keys query string false "指定配置 key（逗号分隔）"
// @Success 200 {object} contract.SysConfigTreeResp
// @Security BearerAuth
// @Router /admin/federation/config [get]
// @Security JWTAuth
func (h *FederationConfigHandler) ListFederationConfig(c *fiber.Ctx) error {
	keys, err := parseAndValidateFederationConfigKeys(c.Query("keys"), "federation.")
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, err.Error())
	}

	items, err := h.svc.ListConfigs(c.Context(), keys)
	if err != nil {
		return err
	}
	items = filterFederationConfigsByPrefix(items, "federation.")
	tree, err := buildSysConfigTree(items)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.config_parse_failed"), err)
	}
	return response.Success(c, tree)
}

// UpdateFederationConfig updates federation config items.
// @Summary 更新联合配置
// @Tags FederationAdmin
// @Accept json
// @Produce json
// @Param request body contract.SysConfigBatchUpdateReq true "配置更新参数"
// @Success 200 {object} contract.SysConfigTreeResp
// @Security BearerAuth
// @Router /admin/federation/config [put]
// @Security JWTAuth
func (h *FederationConfigHandler) UpdateFederationConfig(c *fiber.Ctx) error {
	var req contract.SysConfigBatchUpdateReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if len(req.Items) == 0 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.items_required"))
	}

	updates := make([]sysconfig.UpdateItem, 0, len(req.Items))
	for _, item := range req.Items {
		key := strings.TrimSpace(item.Key)
		if key == "" {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.key_required"))
		}
		if !strings.HasPrefix(key, "federation.") {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.only_federation_config"))
		}
		if key == "federation.instanceURL" && item.Value != nil {
			var instanceURL string
			if err := json.Unmarshal(json.RawMessage(*item.Value), &instanceURL); err != nil {
				return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.instance_url_string"))
			}
			trimmed := strings.TrimSpace(instanceURL)
			if trimmed != "" && !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
				return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.instance_url_prefix"))
			}
		}
		updates = append(updates, sysconfig.UpdateItem{
			Key:          key,
			Value:        contract.RawMessagePtr(item.Value),
			IsSensitive:  item.IsSensitive,
			GroupPath:    item.GroupPath,
			Label:        item.Label,
			Description:  item.Description,
			ValueType:    item.ValueType,
			EnumOptions:  contract.RawMessagePtr(item.EnumOptions),
			DefaultValue: contract.RawMessagePtr(item.DefaultValue),
			VisibleWhen:  contract.RawMessagePtr(item.VisibleWhen),
			Sort:         item.Sort,
			Meta:         contract.RawMessagePtr(item.Meta),
		})
	}

	updated, err := h.svc.UpdateConfigs(c.Context(), updates)
	if err != nil {
		var validationErr *sysconfig.UpdateValidationError
		if errors.As(err, &validationErr) {
			return response.NewBizErrorWithMsg(response.ParamsError, validationErr.Error())
		}
		return err
	}
	updated = filterFederationConfigsByPrefix(updated, "federation.")
	tree, err := buildSysConfigTree(updated)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.config_parse_failed"), err)
	}
	return response.SuccessWithMessage(c, tree, response.Translate(c, "server.success.updated"))
}

// ExportFederationConfigs exports all federation.* and activitypub.* configs including sensitive values.
// @Summary 导出联合配置
// @Tags FederationAdmin
// @Produce json
// @Success 200 {object} contract.SysConfigExportResp
// @Security BearerAuth
// @Router /admin/federation/export [get]
// @Security JWTAuth
func (h *FederationConfigHandler) ExportFederationConfigs(c *fiber.Ctx) error {
	items, err := h.svc.ListConfigs(c.Context(), nil)
	if err != nil {
		return err
	}

	var fedItems []domainconfig.SysConfig
	for _, item := range items {
		key := strings.TrimSpace(item.Key)
		if strings.HasPrefix(key, "federation.") || strings.HasPrefix(key, "activitypub.") {
			fedItems = append(fedItems, item)
		}
	}

	configs := make([]contract.SysConfigExportItem, 0, len(fedItems))
	for _, item := range fedItems {
		valueType, err := normalizeValueType(item.ValueType)
		if err != nil {
			return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.config_parse_failed"), err)
		}
		raw, err := valueToJSON(valueType, item.Value)
		if err != nil {
			return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.config_serialize_failed"), err)
		}
		var value any
		if raw != nil {
			_ = json.Unmarshal(*raw, &value)
		}
		configs = append(configs, contract.SysConfigExportItem{
			Key:   item.Key,
			Value: value,
		})
	}

	return response.Success(c, contract.SysConfigExportResp{
		Version:    1,
		ExportedAt: time.Now().UTC(),
		Configs:    configs,
	})
}

// ImportFederationConfigs imports federation.* and activitypub.* configs from an export payload.
// @Summary 导入联合配置
// @Tags FederationAdmin
// @Accept json
// @Produce json
// @Param request body contract.SysConfigImportReq true "导入数据"
// @Success 200
// @Security BearerAuth
// @Router /admin/federation/import [post]
// @Security JWTAuth
func (h *FederationConfigHandler) ImportFederationConfigs(c *fiber.Ctx) error {
	var req contract.SysConfigImportReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if len(req.Configs) == 0 {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.configs_required"))
	}

	updates := make([]sysconfig.UpdateItem, 0, len(req.Configs))
	for _, item := range req.Configs {
		key := strings.TrimSpace(item.Key)
		if key == "" {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.key_required"))
		}
		if !strings.HasPrefix(key, "federation.") && !strings.HasPrefix(key, "activitypub.") {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.only_fed_act_import"))
		}

		// Validate instanceURL format
		if key == "federation.instanceURL" || key == "activitypub.instanceURL" {
			if s, ok := item.Value.(string); ok {
				trimmed := strings.TrimSpace(s)
				if trimmed != "" && !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
					return response.NewBizErrorWithMsg(response.ParamsError, key+response.Translate(c, "server.handler.config_url_prefix_must_http"))
				}
			}
		}

		encoded, err := json.Marshal(item.Value)
		if err != nil {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.config_serialize_failed")+": "+key)
		}
		raw := json.RawMessage(encoded)
		updates = append(updates, sysconfig.UpdateItem{
			Key:   key,
			Value: &raw,
		})
	}

	if _, err := h.svc.UpdateConfigs(c.Context(), updates); err != nil {
		var validationErr *sysconfig.UpdateValidationError
		if errors.As(err, &validationErr) {
			return response.NewBizErrorWithMsg(response.ParamsError, validationErr.Error())
		}
		return err
	}

	return response.SuccessWithMessage(c, response.Translate(c, "server.success.import_success"), response.Translate(c, "server.success.import_success"))
}

func parseAndValidateFederationConfigKeys(raw string, prefix string) ([]string, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}
	parts := strings.Split(raw, ",")
	keys := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, item := range parts {
		key := strings.TrimSpace(item)
		if key == "" {
			continue
		}
		if !strings.HasPrefix(key, prefix) {
			return nil, errors.New("仅允许查询 " + prefix + " 配置")
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		keys = append(keys, key)
	}
	return keys, nil
}

func filterFederationConfigsByPrefix(items []domainconfig.SysConfig, prefix string) []domainconfig.SysConfig {
	out := make([]domainconfig.SysConfig, 0, len(items))
	for _, item := range items {
		if strings.HasPrefix(strings.TrimSpace(item.Key), prefix) {
			out = append(out, item)
		}
	}
	return out
}
