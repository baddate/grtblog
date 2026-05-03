package router

import (
	"github.com/gofiber/fiber/v2"

	"github.com/baddate/sanblog/server/internal/app/taxonomy"
	"github.com/baddate/sanblog/server/internal/http/handler"
	"github.com/baddate/sanblog/server/internal/http/middleware"
	"github.com/baddate/sanblog/server/internal/infra/persistence"
)

func registerTaxonomyPublicRoutes(v2 fiber.Router, deps Dependencies) {
	taxHandler := newTaxonomyHandler(deps)
	tagContentHandler := newTagContentHandler(deps)

	v2.Get("/categories", taxHandler.ListCategories)
	v2.Get("/columns", taxHandler.ListColumns)
	v2.Get("/tags", taxHandler.ListTags)
	v2.Get("/tags/:id/contents", tagContentHandler.ListByTagID)
}

func registerTaxonomyAdminRoutes(v2 fiber.Router, deps Dependencies) {
	taxHandler := newTaxonomyHandler(deps)
	identityRepo := persistence.NewIdentityRepository(deps.DB)
	adminTokenRepo := persistence.NewAdminTokenRepository(deps.DB)
	admin := v2.Group("/admin", middleware.RequireAuth(deps.JWTManager, identityRepo, adminTokenRepo), middleware.RequireAdmin(identityRepo))

	admin.Post("/categories", taxHandler.CreateCategory)
	admin.Put("/categories/:id", taxHandler.UpdateCategory)
	admin.Delete("/categories/:id", taxHandler.DeleteCategory)

	admin.Post("/columns", taxHandler.CreateColumn)
	admin.Put("/columns/:id", taxHandler.UpdateColumn)
	admin.Delete("/columns/:id", taxHandler.DeleteColumn)

	admin.Post("/tags", taxHandler.CreateTag)
	admin.Put("/tags/:id", taxHandler.UpdateTag)
	admin.Delete("/tags/:id", taxHandler.DeleteTag)
}

func newTaxonomyHandler(deps Dependencies) *handler.TaxonomyHandler {
	categoryRepo := persistence.NewArticleCategoryRepository(deps.DB)
	columnRepo := persistence.NewMomentColumnRepository(deps.DB)
	tagRepo := persistence.NewTagRepository(deps.DB)

	categorySvc := taxonomy.NewCategoryService(categoryRepo)
	columnSvc := taxonomy.NewColumnService(columnRepo)
	tagSvc := taxonomy.NewTagService(tagRepo)

	return handler.NewTaxonomyHandler(categorySvc, columnSvc, tagSvc)
}

func newTagContentHandler(deps Dependencies) *handler.TagContentHandler {
	return handler.NewTagContentHandler(
		newArticleHandler(deps),
		newMomentHandler(deps),
		persistence.NewContentRepository(deps.DB),
		deps.Redis,
		deps.Config.Redis.Prefix,
	)
}
