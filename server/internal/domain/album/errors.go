package album

import "errors"

var (
	ErrAlbumNotFound       = errors.New("ALBUM_NOT_FOUND")
	ErrAlbumShortURLExists = errors.New("ALBUM_SHORT_URL_EXISTS")
	ErrPhotoNotFound       = errors.New("PHOTO_NOT_FOUND")
)
