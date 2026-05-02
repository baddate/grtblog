package thinking

import "errors"

var (
	ErrThinkingNotFound     = errors.New("THINKING_NOT_FOUND")
	ErrThinkingContentEmpty = errors.New("THINKING_CONTENT_EMPTY")
)
