package i18n

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

var bundle *i18n.Bundle

// Init loads all locale files (server + common) into the i18n bundle.
// Must be called once at startup before any requests are processed.
// baseDir is the server root directory (where go.mod lives).
// NOTE: go-i18n v2 extracts the language tag from the filename, not the
// directory. We pass synthetic paths (e.g. "zh.json") so the tag is
// correctly recognized as "zh" instead of "server".
func Init(baseDir string) error {
	bundle = i18n.NewBundle(language.English)
	bundle.RegisterUnmarshalFunc("json", json.Unmarshal)

	// Load server-specific locale files
	for _, lang := range []string{"zh", "en"} {
		diskPath := filepath.Join(baseDir, "locales", lang, "server.json")
		data, err := os.ReadFile(diskPath)
		if err != nil {
			return fmt.Errorf("i18n: read server locales %s: %w", lang, err)
		}
		// Use a synthetic path so go-i18n extracts the correct language tag.
		syntheticPath := lang + ".json"
		if _, err := bundle.ParseMessageFileBytes(data, syntheticPath); err != nil {
			return fmt.Errorf("i18n: parse server locales %s: %w", lang, err)
		}
	}

	// Load shared common locale files from repo root
	commonDir := filepath.Join(baseDir, "..", "locales")
	for _, lang := range []string{"zh", "en"} {
		diskPath := filepath.Join(commonDir, lang, "common.json")
		data, err := os.ReadFile(diskPath)
		if err != nil {
			// Common files may not exist in production (only in dev)
			// Log a warning but don't fail — server.json has the critical messages
			fmt.Fprintf(os.Stderr, "i18n: warning: could not read common locales %s: %v\n", lang, err)
			continue
		}
		syntheticPath := lang + ".json"
		if _, err := bundle.ParseMessageFileBytes(data, syntheticPath); err != nil {
			fmt.Fprintf(os.Stderr, "i18n: warning: could not parse common locales %s: %v\n", lang, err)
		}
	}

	return nil
}

// MustLocalize translates a key for the given language.
// Falls back to English if the key is missing, and finally to the key itself.
func MustLocalize(lang string, key string, templateData ...map[string]interface{}) string {
	localizer := i18n.NewLocalizer(bundle, lang)
	var data interface{}
	if len(templateData) > 0 {
		data = templateData[0]
	}
	msg, err := localizer.Localize(&i18n.LocalizeConfig{
		MessageID:    key,
		TemplateData: data,
	})
	if err != nil {
		// Fallback to English
		localizer = i18n.NewLocalizer(bundle, "en")
		msg, err = localizer.Localize(&i18n.LocalizeConfig{
			MessageID:    key,
			TemplateData: data,
		})
		if err != nil {
			return key
		}
	}
	return msg
}
