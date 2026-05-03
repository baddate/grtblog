package social

import "errors"

var ErrFriendLinkApplicationNotFound = errors.New("FRIEND_LINK_APPLICATION_NOT_FOUND")
var ErrFriendLinkNotFound = errors.New("FRIEND_LINK_NOT_FOUND")
var ErrFriendLinkApplicationBlocked = errors.New("FRIEND_LINK_APPLICATION_BLOCKED")
var ErrGlobalNotificationNotFound = errors.New("GLOBAL_NOTIFICATION_NOT_FOUND")
var ErrAdminNotificationNotFound = errors.New("ADMIN_NOTIFICATION_NOT_FOUND")
