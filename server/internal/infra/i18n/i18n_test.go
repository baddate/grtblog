package i18n

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

// findServerRoot walks up from the current file's directory until it finds go.mod.
func findServerRoot() string {
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)
	// Walk up looking for go.mod (server root marker).
	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			// Reached filesystem root without finding go.mod; fall back to cwd.
			wd, _ := os.Getwd()
			return wd
		}
		dir = parent
	}
}

var testInitDone bool

func initTest() {
	if testInitDone {
		return
	}
	testInitDone = true
	if err := Init(findServerRoot()); err != nil {
		panic("i18n test init failed: " + err.Error())
	}
}

func TestMustLocalize_zh(t *testing.T) {
	initTest()
	msg := MustLocalize("zh", "server.error.not_found")
	if msg != "资源未找到" {
		t.Errorf("expected '资源未找到', got '%s'", msg)
	}
}

func TestMustLocalize_en(t *testing.T) {
	initTest()
	msg := MustLocalize("en", "server.error.not_found")
	if msg != "Resource not found" {
		t.Errorf("expected 'Resource not found', got '%s'", msg)
	}
}

func TestMustLocalize_fallback(t *testing.T) {
	initTest()
	msg := MustLocalize("zh", "nonexistent.key.xyz")
	if msg != "nonexistent.key.xyz" {
		t.Errorf("expected key itself for unknown key, got '%s'", msg)
	}
}

func TestMustLocalize_fallbackToEn(t *testing.T) {
	initTest()
	msg := MustLocalize("fr", "server.error.not_found")
	if msg != "Resource not found" {
		t.Errorf("expected English fallback for unsupported lang 'fr', got '%s'", msg)
	}
}
