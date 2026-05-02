package content

import "errors"

var ErrArticleNotFound = errors.New("ARTICLE_NOT_FOUND")
var ErrCategoryNotFound = errors.New("CATEGORY_NOT_FOUND")
var ErrColumnNotFound = errors.New("COLUMN_NOT_FOUND")
var ErrTagNotFound = errors.New("TAG_NOT_FOUND")
var ErrArticleShortURLExists = errors.New("ARTICLE_SHORT_URL_EXISTS")
var ErrMomentNotFound = errors.New("MOMENT_NOT_FOUND")
var ErrMomentShortURLExists = errors.New("MOMENT_SHORT_URL_EXISTS")
var ErrPageNotFound = errors.New("PAGE_NOT_FOUND")
var ErrPageShortURLExists = errors.New("PAGE_SHORT_URL_EXISTS")
