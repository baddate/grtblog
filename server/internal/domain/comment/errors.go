package comment

import "errors"

var ErrCommentNotFound = errors.New("COMMENT_NOT_FOUND")
var ErrCommentParentNotFound = errors.New("COMMENT_PARENT_NOT_FOUND")
var ErrCommentAreaNotFound = errors.New("COMMENT_AREA_NOT_FOUND")
var ErrCommentAreaClosed = errors.New("COMMENT_AREA_CLOSED")
var ErrCommentTooDeep = errors.New("COMMENT_TOO_DEEP")
var ErrCommentContentEmpty = errors.New("COMMENT_CONTENT_EMPTY")
var ErrCommentContentTooLong = errors.New("COMMENT_CONTENT_TOO_LONG")
var ErrCommentDisabled = errors.New("COMMENT_DISABLED")
var ErrCommentBlocked = errors.New("COMMENT_BLOCKED")
var ErrCommentStatusInvalid = errors.New("COMMENT_STATUS_INVALID")
var ErrVisitorNotFound = errors.New("VISITOR_NOT_FOUND")
var ErrCommentReplyDisabled = errors.New("COMMENT_REPLY_DISABLED")
var ErrCommentNotOwner = errors.New("COMMENT_NOT_OWNER")
var ErrCommentAlreadyDeleted = errors.New("COMMENT_ALREADY_DELETED")
