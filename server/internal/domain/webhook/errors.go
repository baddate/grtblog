package webhook

import "errors"

var ErrWebhookNotFound = errors.New("WEBHOOK_NOT_FOUND")
var ErrDeliveryHistoryNotFound = errors.New("DELIVERY_HISTORY_NOT_FOUND")
var ErrWebhookInvalidEvents = errors.New("WEBHOOK_INVALID_EVENTS")
var ErrWebhookDeliveryFailed = errors.New("WEBHOOK_DELIVERY_FAILED")
