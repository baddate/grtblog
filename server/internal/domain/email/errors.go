package email

import "errors"

var ErrEmailTemplateNotFound = errors.New("EMAIL_TEMPLATE_NOT_FOUND")
var ErrEmailTemplateCodeExists = errors.New("EMAIL_TEMPLATE_CODE_EXISTS")
var ErrEmailTemplateEventInvalid = errors.New("EMAIL_TEMPLATE_EVENT_INVALID")
var ErrEmailTemplateRenderFailed = errors.New("EMAIL_TEMPLATE_RENDER_FAILED")
var ErrEmailTemplateInternalLocked = errors.New("EMAIL_TEMPLATE_INTERNAL_LOCKED")
var ErrEmailNoRecipient = errors.New("EMAIL_NO_RECIPIENT")
var ErrEmailDisabled = errors.New("EMAIL_DISABLED")
var ErrEmailConfigInvalid = errors.New("EMAIL_CONFIG_INVALID")
var ErrEmailSendFailed = errors.New("EMAIL_SEND_FAILED")
var ErrEmailSubscriptionInvalid = errors.New("EMAIL_SUBSCRIPTION_INVALID")
var ErrEmailSubscriptionEventInvalid = errors.New("EMAIL_SUBSCRIPTION_EVENT_INVALID")
var ErrEmailSubscriptionNotFound = errors.New("EMAIL_SUBSCRIPTION_NOT_FOUND")
var ErrEmailSubscriptionStatusInvalid = errors.New("EMAIL_SUBSCRIPTION_STATUS_INVALID")
var ErrEmailOutboxNotFound = errors.New("EMAIL_OUTBOX_NOT_FOUND")
