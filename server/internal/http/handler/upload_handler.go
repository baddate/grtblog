package handler

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"

	mediaapp "github.com/baddate/sanblog/server/internal/app/media"
	"github.com/baddate/sanblog/server/internal/domain/media"
	"github.com/baddate/sanblog/server/internal/http/contract"
	"github.com/baddate/sanblog/server/internal/http/response"
)

type UploadHandler struct {
	svc *mediaapp.Service
}

func NewUploadHandler(svc *mediaapp.Service) *UploadHandler {
	return &UploadHandler{svc: svc}
}

// UploadFile godoc
// @Summary 上传文件
// @Tags Upload
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "文件"
// @Param type formData string true "上传类型: picture|file"
// @Success 200 {object} contract.UploadFileRespEnvelope
// @Security BearerAuth
// @Router /upload [post]
func (h *UploadHandler) UploadFile(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil || file == nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.file_required"))
	}
	fileType := c.FormValue("type")
	if strings.TrimSpace(fileType) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.file_type_required"))
	}

	result, err := h.svc.Upload(c.Context(), file, fileType)
	if err != nil {
		if errors.Is(err, media.ErrInvalidUploadType) {
			return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.file_type_invalid"))
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.file_upload_failed"), err)
	}

	var imgMeta *contract.UploadImageMeta
	if result.ImageMeta != nil {
		imgMeta = &contract.UploadImageMeta{
			Width:         result.ImageMeta.Width,
			Height:        result.ImageMeta.Height,
			DominantColor: result.ImageMeta.DominantColor,
		}
	}
	resp := contract.ToUploadFileResp(result.File, !result.Created, result.ThumbnailURL, imgMeta)
	msg := response.Translate(c, "server.handler.file_upload_success")
	if !result.Created {
		msg = response.Translate(c, "server.handler.file_exists_returned")
	}
	return response.SuccessWithMessage(c, resp, msg)
}

// ListUploads godoc
// @Summary 获取上传文件列表
// @Tags Upload
// @Produce json
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(10)
// @Success 200 {object} contract.UploadFileListRespEnvelope
// @Security BearerAuth
// @Router /uploads [get]
func (h *UploadHandler) ListUploads(c *fiber.Ctx) error {
	page := 1
	pageSize := 10
	if val, err := strconv.Atoi(c.Query("page", "1")); err == nil && val > 0 {
		page = val
	}
	if val, err := strconv.Atoi(c.Query("pageSize", "10")); err == nil && val > 0 && val <= 100 {
		pageSize = val
	}

	result, err := h.svc.List(c.Context(), page, pageSize)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.file_list_failed"), err)
	}

	items := make([]contract.UploadFileResp, len(result.Items))
	for i, file := range result.Items {
		thumbURL := h.svc.ThumbnailURLFor("/uploads" + file.Path)
		items[i] = contract.ToUploadFileResp(file, false, thumbURL, nil)
	}

	resp := contract.UploadFileListResp{
		Items: items,
		Total: result.Total,
		Page:  result.Page,
		Size:  result.Size,
	}
	return response.Success(c, resp)
}

// SyncUploads godoc
// @Summary 同步磁盘文件到上传索引
// @Tags Upload
// @Produce json
// @Success 200 {object} contract.UploadSyncRespEnvelope
// @Security BearerAuth
// @Router /uploads/sync [post]
func (h *UploadHandler) SyncUploads(c *fiber.Ctx) error {
	result, err := h.svc.SyncIndex(c.Context())
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.file_sync_failed"), err)
	}

	resp := contract.UploadSyncResp{
		Scanned:           result.Scanned,
		Indexed:           result.Indexed,
		Created:           result.Created,
		Updated:           result.Updated,
		Deleted:           result.Deleted,
		SkippedDuplicates: result.SkippedDuplicates,
	}
	return response.SuccessWithMessage(c, resp, response.Translate(c, "server.handler.file_sync_completed"))
}

// RenameUpload godoc
// @Summary 修改上传文件名
// @Tags Upload
// @Accept json
// @Produce json
// @Param id path int true "文件ID"
// @Param request body contract.UploadRenameReq true "新文件名"
// @Success 200 {object} contract.UploadFileRespEnvelope
// @Security BearerAuth
// @Router /upload/{id} [put]
func (h *UploadHandler) RenameUpload(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_file_id"))
	}

	var req contract.UploadRenameReq
	if err := c.BodyParser(&req); err != nil {
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.parse_body_failed"), err)
	}
	if strings.TrimSpace(req.Name) == "" {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.file_name_required"))
	}

	updated, err := h.svc.Rename(c.Context(), id, req.Name)
	if err != nil {
		if errors.Is(err, media.ErrUploadFileNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.file_not_found"))
		}
		return response.NewBizErrorWithCause(response.ParamsError, response.Translate(c, "server.handler.file_rename_failed"), err)
	}

	thumbURL := h.svc.ThumbnailURLFor("/uploads" + updated.Path)
	return response.SuccessWithMessage(c, contract.ToUploadFileResp(*updated, false, thumbURL, nil), response.Translate(c, "server.handler.file_name_updated"))
}

// DeleteUpload godoc
// @Summary 删除上传文件
// @Tags Upload
// @Produce json
// @Param id path int true "文件ID"
// @Success 200 {object} any
// @Security BearerAuth
// @Router /upload/{id} [delete]
func (h *UploadHandler) DeleteUpload(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_file_id"))
	}

	_, err = h.svc.Delete(c.Context(), id)
	if err != nil {
		if errors.Is(err, media.ErrUploadFileNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.file_not_found"))
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.file_delete_failed"), err)
	}

	return response.SuccessWithMessage[any](c, nil, response.Translate(c, "server.handler.file_deleted"))
}

// DownloadUpload godoc
// @Summary 下载上传文件
// @Tags Upload
// @Produce application/octet-stream
// @Param id path int true "文件ID"
// @Success 200 {file} any
// @Security BearerAuth
// @Router /upload/{id}/download [get]
func (h *UploadHandler) DownloadUpload(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return response.NewBizErrorWithMsg(response.ParamsError, response.Translate(c, "server.handler.invalid_file_id"))
	}

	file, err := h.svc.GetByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, media.ErrUploadFileNotFound) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.file_not_found"))
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.file_get_failed"), err)
	}

	diskPath, err := h.svc.ResolveDiskPath(file.Path)
	if err != nil {
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.file_path_parse_failed"), err)
	}
	if _, err := os.Stat(diskPath); err != nil {
		if os.IsNotExist(err) {
			return response.NewBizErrorWithMsg(response.NotFound, response.Translate(c, "server.handler.file_not_found"))
		}
		return response.NewBizErrorWithCause(response.ServerError, response.Translate(c, "server.handler.file_read_failed"), err)
	}

	return c.Download(diskPath, file.Name)
}
