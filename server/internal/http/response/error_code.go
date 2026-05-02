package response

import "github.com/gofiber/fiber/v2"

type BizError struct {
	HTTPStatus int
	Code       int
	BizErr     string
	Msg        string // legacy, keep for backward compat
	MsgKey     string // i18n key e.g. "server.error.not_found"
}

var (
	OK = BizError{
		HTTPStatus: fiber.StatusOK,
		Code:       0,
		BizErr:     "OK",
		Msg:        "success",
		MsgKey:     "",
	}

	NotFound = BizError{
		HTTPStatus: fiber.StatusNotFound,
		Code:       404,
		BizErr:     "NOT_FOUND",
		Msg:        "资源未找到",
		MsgKey:     "server.error.not_found",
	}

	MethodNotAllowed = BizError{
		HTTPStatus: fiber.StatusMethodNotAllowed,
		Code:       405,
		BizErr:     "METHOD_NOT_ALLOWED",
		Msg:        "请求方法不被允许",
		MsgKey:     "server.error.method_not_allowed",
	}

	ParamsError = BizError{
		HTTPStatus: fiber.StatusBadRequest,
		Code:       400,
		BizErr:     "PARAMS_ERROR",
		Msg:        "参数错误",
		MsgKey:     "server.error.params_error",
	}

	NotLogin = BizError{
		HTTPStatus: fiber.StatusUnauthorized,
		Code:       401,
		BizErr:     "NOT_LOGIN",
		Msg:        "未登录或登录已过期",
		MsgKey:     "server.error.not_login",
	}

	Unauthorized = BizError{
		HTTPStatus: fiber.StatusForbidden,
		Code:       403,
		BizErr:     "UNAUTHORIZED",
		Msg:        "你没有访问该资源的权限",
		MsgKey:     "server.error.unauthorized",
	}

	InvalidCredential = BizError{
		HTTPStatus: fiber.StatusUnauthorized,
		Code:       40101,
		BizErr:     "INVALID_CREDENTIAL",
		Msg:        "用户名或密码不正确",
		MsgKey:     "server.error.invalid_credential",
	}

	ServerError = BizError{
		HTTPStatus: fiber.StatusInternalServerError,
		Code:       500,
		BizErr:     "SERVER_ERROR",
		Msg:        "服务器内部错误",
		MsgKey:     "server.error.server_error",
	}

	TooManyRequests = BizError{
		HTTPStatus: fiber.StatusTooManyRequests,
		Code:       429,
		BizErr:     "TOO_MANY_REQUESTS",
		Msg:        "请求过于频繁，请稍后再试",
		MsgKey:     "server.error.too_many_requests",
	}
)
