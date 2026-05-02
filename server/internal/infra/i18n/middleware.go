package i18n

import (
	"github.com/gofiber/fiber/v2"
	"golang.org/x/text/language"
)

// Middleware returns a Fiber middleware that detects the user's language
// from the Accept-Language header or ?lang= query parameter.
// It stores "lang" (string) and "t" (translate function) in c.Locals().
func Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		lang := detectLang(c)
		c.Locals("lang", lang)
		c.Locals("t", func(key string, data ...map[string]interface{}) string {
			return MustLocalize(lang, key, data...)
		})
		return c.Next()
	}
}

func detectLang(c *fiber.Ctx) string {
	// ?lang= query param takes priority
	if ql := c.Query("lang"); ql == "zh" || ql == "en" {
		return ql
	}

	// Parse Accept-Language header
	header := c.Get("Accept-Language")
	tags, _, _ := language.ParseAcceptLanguage(header)
	for _, tag := range tags {
		base, _ := tag.Base()
		if base.String() == "zh" {
			return "zh"
		}
		if base.String() == "en" {
			return "en"
		}
	}

	// Default fallback
	return "en"
}
