package handler

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/copier"

	"github.com/baddate/sanblog-v2/server/internal/app/auth"
	"github.com/baddate/sanblog-v2/server/internal/app/setupstate"
	"github.com/baddate/sanblog-v2/server/internal/app/sysconfig"
	"github.com/baddate/sanblog-v2/server/internal/domain/identity"
	"github.com/baddate/sanblog-v2/server/internal/http/contract"
	"github.com/baddate/sanblog-v2/server/internal/http/middleware"
	"github.com/baddate/sanblog-v2/server/internal/http/response"
	"github.com/baddate/sanblog-v2/server/internal/security/turnstile"
)

type AuthHandler struct {
	svc       *auth.Service
	setupSvc  *setupstate.Service
	sysCfg    *sysconfig.Service
	turnstile TurnstileVerifier
}

// TurnstileVerifier 便于替换实现/注入 mock。
type TurnstileVerifier interface {
	Verify(ctx context.Context, token, remoteIP string, settings turnstile.Settings) error
}

func NewAuthHandler(svc *auth.Service, setupSvc *setupstate.Service, sysCfg *sysconfig.Service, verifier TurnstileVerifier) *AuthHandler {
	return &AuthHandler{svc: svc, setupSvc: setupSvc, sysCfg: sysCfg, turnstile: verifier}
}

// Register godoc
// @Summary 用户注册
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body contract.RegisterReq true "注册参数"
// @Success 200 {object} contract.RegisterRespEnvelope
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req contract.RegisterReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if err := h.verifyTurnstile(c, req.TurnstileToken); err != nil {
		return err
	}
	var cmd auth.RegisterCmd
	if err := copier.Copy(&cmd, req); err != nil {
		msg := response.Translate(c, "server.handler.map_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	user, err := h.svc.Register(c.Context(), cmd)
	if err != nil {
		if errors.Is(err, auth.ErrRegisterClosed) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.admin_only_registration"))
		}
		if errors.Is(err, auth.ErrPasswordTooWeak) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.password_too_short"))
		}
		if errors.Is(err, identity.ErrInvalidCredentials) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_registration_fields"))
		}
		if errors.Is(err, identity.ErrUserExists) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.user_or_email_exists"))
		}
		return err
	}
	Audit(c, "auth.register", map[string]any{
		"userId":   user.ID,
		"username": user.Username,
		"email":    user.Email,
		"isAdmin":  user.IsAdmin,
	})
	return response.SuccessWithMessage(c, contract.ToUserResp(*user), response.Translate(c, "server.success.registration_success"))
}

// Login godoc
// @Summary 用户登录
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body contract.LoginReq true "登录参数"
// @Success 200 {object} contract.LoginRespEnvelope
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req contract.LoginReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if err := h.verifyTurnstile(c, req.TurnstileToken); err != nil {
		return err
	}
	var cmd auth.LoginCmd
	if err := copier.Copy(&cmd, req); err != nil {
		msg := response.Translate(c, "server.handler.map_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	result, err := h.svc.Login(c.Context(), cmd)
	if err != nil {
		if errors.Is(err, auth.ErrUserDisabled) {
			return response.NewBizErrorWithMsg(response.Unauthorized, response.Translate(c, "server.handler.account_disabled"))
		}
		if errors.Is(err, identity.ErrInvalidCredentials) {
			return response.NewBizError(response.InvalidCredential)
		}
		return err
	}
	Audit(c, "auth.login", map[string]any{
		"userId":   result.User.ID,
		"username": result.User.Username,
		"isAdmin":  result.User.IsAdmin,
	})
	return response.Success(c, contract.LoginResp{
		Token: result.Token,
		User:  contract.ToUserResp(result.User),
	})
}

func (h *AuthHandler) verifyTurnstile(c *fiber.Ctx, token string) error {
	if h.turnstile == nil || h.sysCfg == nil {
		return nil
	}
	settings, err := h.sysCfg.Turnstile(c.Context())
	if err != nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.get_sys_config_failed"))
	}
	if !settings.Enabled {
		return nil
	}
	if err := h.turnstile.Verify(c.Context(), token, c.IP(), settings); err != nil {
		if errors.Is(err, turnstile.ErrVerificationFailed) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.turnstile_not_passed"))
		}
		if errors.Is(err, turnstile.ErrMissingSecret) {
			return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.turnstile_not_configured"))
		}
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.turnstile_failed"))
	}
	return nil
}

// UpdateProfile 更新当前登录用户的昵称/头像/邮箱。
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}
	var req contract.UpdateProfileReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	var cmd auth.UpdateProfileCmd
	if err := copier.Copy(&cmd, req); err != nil {
		msg := response.Translate(c, "server.handler.map_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	cmd.UserID = claims.UserID
	user, err := h.svc.UpdateProfile(c.Context(), cmd)
	if err != nil {
		if errors.Is(err, identity.ErrUserExists) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.email_already_used"))
		}
		return err
	}
	Audit(c, "auth.update_profile", map[string]any{"userId": claims.UserID})
	return response.SuccessWithMessage(c, contract.ToUserResp(*user), response.Translate(c, "server.success.updated"))
}

// ChangePassword 修改当前登录用户密码。
func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}
	var req contract.ChangePasswordReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if req.NewPassword == "" || req.OldPassword == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.password_required"))
	}
	var cmd auth.ChangePasswordCmd
	if err := copier.Copy(&cmd, req); err != nil {
		msg := response.Translate(c, "server.handler.map_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	cmd.UserID = claims.UserID
	if err := h.svc.ChangePassword(c.Context(), cmd); err != nil {
		if errors.Is(err, auth.ErrPasswordTooWeak) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.password_too_short"))
		}
		if errors.Is(err, identity.ErrInvalidCredentials) {
			return response.NewBizError(response.InvalidCredential)
		}
		return err
	}
	Audit(c, "auth.change_password", map[string]any{"userId": claims.UserID})
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.password_updated"))
}

// ListOAuthBindings 返回当前用户绑定的 OAuth 账号。
func (h *AuthHandler) ListOAuthBindings(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}
	items, err := h.svc.ListOAuthBindings(c.Context(), claims.UserID)
	if err != nil {
		return err
	}
	return response.Success(c, items)
}

// BindOAuth 绑定当前用户的 OAuth 账号。
func (h *AuthHandler) BindOAuth(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}
	provider := c.Params("provider")
	var req contract.OAuthCallbackReq
	if err := c.BodyParser(&req); err != nil {
		msg := response.Translate(c, "server.handler.parse_body_failed")
	return response.ErrorWithMsg[any](c, response.ParamsError, msg)
	}
	if req.Code == "" || req.State == "" || provider == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.oauth_fields_required"))
	}
	contextNonce := readOAuthStateNonceCookie(c)
	clearOAuthStateNonceCookie(c)
	if err := h.svc.BindOAuth(c.Context(), claims.UserID, auth.OAuthLoginCmd{
		Provider:     provider,
		Code:         req.Code,
		State:        req.State,
		Redirect:     req.RedirectURI,
		ContextNonce: contextNonce,
	}); err != nil {
		if errors.Is(err, identity.ErrOAuthAlreadyBound) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.oauth_already_bound"))
		}
		if errors.Is(err, auth.ErrInvalidOAuthIdentity) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.oauth_identity_invalid"))
		}
		return err
	}
	Audit(c, "auth.bind_oauth", map[string]any{
		"userId":   claims.UserID,
		"provider": provider,
	})
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.bind_success"))
}

// UnbindOAuth 解绑当前用户的 OAuth 账号。
func (h *AuthHandler) UnbindOAuth(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}
	provider := c.Params("provider")
	if provider == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.oauth_provider_required"))
	}
	if err := h.svc.UnbindOAuth(c.Context(), claims.UserID, provider); err != nil {
		if errors.Is(err, auth.ErrLastOAuthBinding) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.cannot_unbind_last_auth"))
		}
		if errors.Is(err, identity.ErrOAuthBindingNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.account_not_bound_to_provider"))
		}
		return err
	}
	Audit(c, "auth.unbind_oauth", map[string]any{
		"userId":   claims.UserID,
		"provider": provider,
	})
	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.success.unbind_success"))
}

// AccessInfo 返回当前登录用户的角色/权限。
func (h *AuthHandler) AccessInfo(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}
	info, err := h.svc.AccessInfo(c.Context(), claims)
	if err != nil {
		return err
	}
	return response.Success(c, contract.AccessInfoResp{
		User: contract.ToUserResp(info.User),
	})
}

// Profile godoc
// @Summary 获取当前用户信息
// @Tags Auth
// @Produce json
// @Success 200 {object} contract.UserRespEnvelope
// @Security BearerAuth
// @Router /auth/profile [get]
func (h *AuthHandler) Profile(c *fiber.Ctx) error {
	claims, ok := middleware.GetClaims(c)
	if !ok {
		return response.ErrorFromBizLocalized[any](c, response.NotLogin)
	}
	user, err := h.svc.CurrentUser(c.Context(), claims.UserID)
	if err != nil {
		if errors.Is(err, identity.ErrUserNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.user_not_found"))
		}
		return err
	}
	return response.Success(c, contract.ToUserResp(*user))
}

// InitState 返回是否需要初始化（无用户时为 false）。
func (h *AuthHandler) InitState(c *fiber.Ctx) error {
	initialized, err := h.svc.IsInitialized(c.Context())
	if err != nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.get_init_state_failed"))
	}
	return response.Success(c, contract.InitStateResp{
		Initialized: initialized,
	})
}

// SetupState 返回初始化准备状态（用户、管理员、站点信息）。
func (h *AuthHandler) SetupState(c *fiber.Ctx) error {
	if h.setupSvc == nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.init_service_not_configured"))
	}
	state, err := h.setupSvc.Evaluate(c.Context())
	if err != nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.get_init_state_failed"))
	}
	pending := state.PendingUpgradeGuides
	if pending == nil {
		pending = []string{}
	}
	return response.Success(c, contract.SetupStateResp{
		HasUser:                state.HasUser,
		HasAdmin:               state.HasAdmin,
		WebsiteInfoReady:       state.WebsiteInfoReady,
		MissingWebsiteInfoKeys: state.MissingWebsiteInfoKeys,
		NeedsSetup:             state.NeedsSetup,
		PendingUpgradeGuides:   pending,
	})
}

// TurnstileState godoc
// @Summary 获取 Turnstile 配置状态
// @Tags Auth
// @Produce json
// @Success 200 {object} contract.TurnstileStateRespEnvelope
// @Router /auth/turnstile [get]
// TurnstileState 返回 Turnstile 是否启用及站点信息。
func (h *AuthHandler) TurnstileState(c *fiber.Ctx) error {
	if h.sysCfg == nil {
		return response.Success(c, contract.TurnstileStateResp{
			Enabled: false,
		})
	}
	settings, err := h.sysCfg.Turnstile(c.Context())
	if err != nil {
		return response.NewBizErrorWithMsg(response.ServerError, response.Translate(c, "server.handler.get_sys_config_failed"))
	}
	resp := contract.TurnstileStateResp{
		Enabled: settings.Enabled,
	}
	if settings.Enabled {
		resp.SiteKey = settings.SiteKey
	}
	return response.Success(c, resp)
}
