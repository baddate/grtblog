# Language Switcher: Toggle → Dropdown with BCP 47 Support

## Summary

Replace zh/en toggle with a data-driven dropdown supporting BCP 47 language codes (`zh-Hans`, `zh-Hant`, `en`, `ja`). Default language (zh-Hans) gets no URL prefix. Adding a new language = one config entry + one translation JSON.

## Language Registry (Single Source of Truth)

New file: `web/src/lib/i18n/languages.ts`

```ts
interface LanguageMeta {
  code: string;        // BCP 47 tag
  nativeName: string;  // Display name in dropdown
  isDefault: boolean;  // Default language has no URL prefix
}

const LANGUAGES: LanguageMeta[] = [
  { code: 'zh-Hans', nativeName: '中文（简体）', isDefault: true },
  { code: 'zh-Hant', nativeName: '中文（繁體）', isDefault: false },
  { code: 'en',      nativeName: 'English',      isDefault: false },
  { code: 'ja',      nativeName: 'にほんご',       isDefault: false },
];
```

All derived values (SUPPORTED_LANGS, DEFAULT_LANG, regex patterns) are computed from this array. No language codes hardcoded elsewhere.

## URL Structure

- Route directory renamed: `routes/[lang]/` → `routes/[[lang]]/` (optional param)
- Default language (zh-Hans): no prefix — `/posts/`, `/moments/`
- Non-default: `/{code}/posts/` — `/en/posts/`, `/zh-Hant/posts/`, `/ja/posts/`
- `hooks.server.ts`: extract lang from URL using `NON_DEFAULT_LANG_RE` (derived), fallback to `DEFAULT_LANG`
- `hooks.ts`: reroute delegates to `[[lang]]` param, defaulting missing prefix to default language
- `+layout.svelte`: hreflang tags generated from `LANGUAGES` array dynamically

## UI Components

### Web — LanguageSwitcher.svelte
- Toggle button → dropdown (native `<button>` + `<ul>`)
- Renders all languages from `LANGUAGES` config
- Current language shown as button label (native name)
- Switch triggers full page navigation: set cookie + `window.location.href`

### Admin — LanguageSwitch.vue
- Toggle button → Naive UI `n-dropdown`
- Options generated from language config
- Switch calls `localeStore.setLocale(code)` — instant reactive switch

## Admin Store

- `toggle()` → `setLocale(code: string)` — accepts any valid language code
- Remove `isZh`/`isEn` computed booleans
- Validation: accept any code that has a matching translation file

## Translation Loading

- **Web**: `loadTranslations(lang)` loads `generated/{lang}.json`, falls back to default
- **Admin**: `vue-i18n` messages object built dynamically from available locale files
- Old `constants.ts` replaced by re-exports from `languages.ts`

## Files Changed

| File | Change |
|------|--------|
| `web/src/lib/i18n/languages.ts` | **New** — language registry |
| `web/src/lib/i18n/constants.ts` | Replace with re-exports from languages.ts |
| `web/src/lib/i18n/server.ts` | Dynamic JSON loading, use DEFAULT_LANG from registry |
| `web/src/lib/i18n/locale.ts` | `buildSwitchUrl` uses registry-derived regex |
| `web/src/lib/i18n/index.ts` | Add languages.ts exports |
| `web/src/hooks.server.ts` | Use `NON_DEFAULT_LANG_RE` from registry |
| `web/src/hooks.ts` | Use registry-derived regex for reroute |
| `web/src/routes/+layout.svelte` | Dynamic hreflang from `LANGUAGES` |
| `web/src/lib/ui/layout/footer/LanguageSwitcher.svelte` | Toggle → dropdown |
| `web/src/lib/shared/utils/resolve-path.ts` | Use `SUPPORTED_LANGS` from registry |
| `web/src/lib/shared/seo/metadata.ts` | Use registry-derived regex |
| `web/src/routes/[lang]/` | Rename to `[[lang]]/` |
| `admin/src/stores/locale.ts` | `toggle()` → `setLocale()`, remove isZh/isEn |
| `admin/src/plugins/i18n.ts` | Dynamic locale loading |
| `admin/src/layout/header/action/LanguageSwitch.vue` | Toggle → dropdown |

## Adding a New Language

1. Add entry to `LANGUAGES` array in `languages.ts`
2. Add `{code}.json` translation file in `web/src/lib/i18n/generated/`
3. Add `{code}/admin.json` in `admin/src/locales/`
4. Everything else (routing, hreflang, dropdown, regex) is automatic
