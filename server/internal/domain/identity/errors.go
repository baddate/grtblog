package identity

import "errors"

var (
	ErrUserExists           = errors.New("USER_EXISTS")
	ErrUserNotFound         = errors.New("USER_NOT_FOUND")
	ErrInvalidCredentials   = errors.New("INVALID_CREDENTIALS")
	ErrAdminTokenNotFound   = errors.New("ADMIN_TOKEN_NOT_FOUND")
	ErrAdminTokenExpired    = errors.New("ADMIN_TOKEN_EXPIRED")
	ErrOAuthAlreadyBound    = errors.New("OAUTH_ALREADY_BOUND")
	ErrOAuthBindingNotFound = errors.New("OAUTH_BINDING_NOT_FOUND")
)
