# Language Switcher Dropdown + BCP 47 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace zh/en toggle with a data-driven dropdown supporting BCP 47 language codes (`zh-Hans`, `zh-Hant`, `en`, `ja`). Default language (zh-Hans) gets no URL prefix.

**Architecture:** Single-source-of-truth `languages.ts` config drives all routing, i18n, hreflang, and UI. Route `[lang]/` → `[[lang]]/` (optional param) eliminates prefix for default language. Translation loading dynamically matches JSON files to config entries. Admin mirrors the same pattern with vue-i18n.

**Tech Stack:** SvelteKit 2.57, Svelte 5 (runes), TypeScript, Vue 3.5 + vue-i18n + Naive UI

---

### Task 1: Create language registry (web)

**Files:**
- Create: `web/src/lib/i18n/languages.ts`

- [ ] **Step 1: Create languages.ts**

```ts
export interface LanguageMeta {
  code: string;        // BCP 47 tag: 'zh-Hans', 'zh-Hant', 'en', 'ja'
  nativeName: string;  // Display name in dropdown
  isDefault: boolean;  // Default language has no URL prefix
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'zh-Hans', nativeName: '简体中文', isDefault: true },
  { code: 'zh-Hant', nativeName: '繁體中文', isDefault: false },
  { code: 'en',      nativeName: 'English',  isDefault: false },
  { code: 'ja',      nativeName: '日本語',   isDefault: false },
];

export const DEFAULT_LANG = LANGUAGES.find(l => l.isDefault)!.code;
export const FALLBACK_LANG = 'en';
export const SUPPORTED_LANGS = LANGUAGES.map(l => l.code);
export const NON_DEFAULT_LANGS = LANGUAGES.filter(l => !l.isDefault).map(l => l.code);

export const SUPPORTED_LANGS_SET = new Set(SUPPORTED_LANGS);

// Matches URL paths starting with a non-default lang prefix: /^(en|zh-Hant|ja)(/|$)/i
export const NON_DEFAULT_LANG_RE = new RegExp(
  `^/(${NON_DEFAULT_LANGS.join('|')})(/|$)`, 'i'
);

// Matches URL paths starting with ANY supported lang prefix
export const ANY_LANG_RE = new RegExp(
  `^/(${SUPPORTED_LANGS.join('|')})(/|$)`, 'i'
);

export function getLanguageMeta(code: string): LanguageMeta | undefined {
  return LANGUAGES.find(l => l.code === code);
}

export function isSupportedLang(code: string): boolean {
  return SUPPORTED_LANGS_SET.has(code);
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/i18n/languages.ts
git commit -m "feat(i18n): add centralized language registry with BCP 47 codes"
```

---

### Task 2: Refactor constants.ts

**Files:**
- Modify: `web/src/lib/i18n/constants.ts`

- [ ] **Step 1: Replace constants.ts with re-exports from languages.ts**

```ts
export {
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  FALLBACK_LANG,
  LANGUAGES,
  NON_DEFAULT_LANGS,
  getLanguageMeta,
  isSupportedLang,
} from './languages';
export type { LanguageMeta } from './languages';
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/i18n/constants.ts
git commit -m "refactor(i18n): replace hardcoded constants with registry re-exports"
```

---

### Task 3: Refactor server.ts — dynamic translation loading

**Files:**
- Modify: `web/src/lib/i18n/server.ts`

- [ ] **Step 1: Replace fixed imports with glob-based loading**

Remove:
```ts
import zh from './generated/zh.json';
import en from './generated/en.json';
import { SUPPORTED_LANGS, DEFAULT_LANG, FALLBACK_LANG, type SupportedLang } from './constants';
export { SUPPORTED_LANGS, DEFAULT_LANG, FALLBACK_LANG, type SupportedLang };

const translations: Record<string, TranslationMap> = { zh, en };
```

Replace with glob import and updated exports:
```ts
import type { TranslateFn, TranslationMap } from './types';
import { parseAcceptLanguage } from './locale';
import { DEFAULT_LANG, FALLBACK_LANG, SUPPORTED_LANGS, SUPPORTED_LANGS_SET, isSupportedLang } from './languages';

// Re-export commonly-used symbols for backward compatibility
export { DEFAULT_LANG, FALLBACK_LANG, SUPPORTED_LANGS, isSupportedLang } from './languages';

const modules = import.meta.glob<TranslationMap>('./generated/*.json', { eager: true, import: 'default' });

const translations: Record<string, TranslationMap> = {};
for (const [path, value] of Object.entries(modules)) {
  const code = path.replace('./generated/', '').replace('.json', '');
  if (SUPPORTED_LANGS_SET.has(code)) {
    translations[code] = value;
  }
}
```

- [ ] **Step 2: Update loadTranslations signature**

`SupportedLang` type is removed — accept any string and handle fallback:
```ts
export function loadTranslations(lang: string): TranslationMap {
  return translations[lang] ?? translations[FALLBACK_LANG] ?? {};
}
```

- [ ] **Step 3: Update isSupportedLang export and detectLanguage**

Remove `type SupportedLang` completely. Use `isSupportedLang` from languages.ts:
```ts
export function detectLanguage(
  urlLang: string | undefined | null,
  cookieLang: string | null,
  acceptLanguage: string | null
): string {
  if (urlLang && isSupportedLang(urlLang)) return urlLang;
  if (cookieLang && isSupportedLang(cookieLang)) return cookieLang;
  const preferred = parseAcceptLanguage(acceptLanguage);
  if (preferred && isSupportedLang(preferred)) return preferred;
  return FALLBACK_LANG;
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/i18n/server.ts
git commit -m "refactor(i18n): dynamic translation loading via import.meta.glob"
```

---

### Task 4: Refactor locale.ts

**Files:**
- Modify: `web/src/lib/i18n/locale.ts`

- [ ] **Step 1: Replace imports and buildSwitchUrl logic**

Current:
```ts
import { SUPPORTED_LANGS, type SupportedLang } from './constants';
const LANG_SEGMENTS = new Set(SUPPORTED_LANGS);
```

Replace with:
```ts
import { SUPPORTED_LANGS_SET, DEFAULT_LANG, isSupportedLang } from './languages';
```

- [ ] **Step 2: Update parseAcceptLanguage to accept BCP 47 codes**

The current `parseAcceptLanguage` strips region subtags:
```ts
if (tag.includes('-')) return tag.split('-')[0].toLowerCase();
```

This would turn `zh-Hans` → `zh`. We need to preserve full BCP 47 tags for supported languages. Update:
```ts
export function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  try {
    const first = header.split(',')[0];
    if (!first) return null;
    const tag = first.split(';')[0].trim();
    return tag.toLowerCase();
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Update setLangCookie**

Remove `SupportedLang` type constraint:
```ts
export function setLangCookie(lang: string): string {
  return `lang=${lang}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}
```

- [ ] **Step 4: Update buildSwitchUrl for default-language no-prefix**

```ts
export function buildSwitchUrl(currentPath: string, targetLang: string): string {
  const parts = currentPath.replace(/\/+$/, '').split('/').filter(Boolean);

  // Strip any supported language prefix from the first segment
  if (parts.length > 0 && SUPPORTED_LANGS_SET.has(parts[0])) {
    parts.shift();
  }

  const basePath = '/' + parts.join('/') + (parts.length > 0 ? '/' : '');

  if (targetLang === DEFAULT_LANG) {
    return basePath;
  }
  return `/${targetLang}${basePath}`;
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/i18n/locale.ts
git commit -m "refactor(i18n): update locale utils for BCP 47 and default-lang no-prefix"
```

---

### Task 5: Update i18n index.ts

**Files:**
- Modify: `web/src/lib/i18n/index.ts`

- [ ] **Step 1: Update exports**

```ts
export { createTranslateFn, loadTranslations, detectLanguage } from './server';
export { LANGUAGES, DEFAULT_LANG, FALLBACK_LANG, SUPPORTED_LANGS, NON_DEFAULT_LANGS, isSupportedLang, getLanguageMeta } from './languages';
export type { LanguageMeta } from './languages';
export type { TranslateFn, TranslationMap } from './types';
export type { TranslationKey } from './generated/keys';
export { parseAcceptLanguage, setLangCookie, buildSwitchUrl } from './locale';
```

Changes:
- Remove `export type { SupportedLang }` (no longer exists)
- Add exports from `languages.ts`

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/i18n/index.ts
git commit -m "refactor(i18n): update index exports for registry-driven i18n"
```

---

### Task 6: Rename translation files

**Files:**
- Rename: `web/src/lib/i18n/generated/zh.json` → `web/src/lib/i18n/generated/zh-Hans.json`
- Create: `web/src/lib/i18n/generated/zh-Hant.json` (placeholder)
- Create: `web/src/lib/i18n/generated/ja.json` (placeholder)

- [ ] **Step 1: Rename zh.json → zh-Hans.json**

```bash
git mv web/src/lib/i18n/generated/zh.json web/src/lib/i18n/generated/zh-Hans.json
```

- [ ] **Step 2: Create zh-Hant.json placeholder**

Same structure as zh-Hans.json but empty/placeholder:
```json
{}
```

Write to `web/src/lib/i18n/generated/zh-Hant.json`

- [ ] **Step 3: Create ja.json placeholder**

```json
{}
```

Write to `web/src/lib/i18n/generated/ja.json`

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/i18n/generated/
git commit -m "feat(i18n): rename zh→zh-Hans, add zh-Hant and ja placeholder translations"
```

---

### Task 7: Rename routes/[lang]/ → routes/[[lang]]/

**Files:**
- Rename: `web/src/routes/[lang]/` → `web/src/routes/[[lang]]/`

- [ ] **Step 1: Rename the directory**

```bash
git mv web/src/routes/\[lang\] web/src/routes/\[\[lang\]\]
```

- [ ] **Step 2: Verify directory structure**

```bash
ls web/src/routes/\[\[lang\]\]/
```

Expected: same subdirectories as before (posts, moments, albums, etc.)

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/
git commit -m "refactor(routes): rename [lang]→[[lang]] for optional default-lang prefix"
```

---

### Task 8: Update hooks.server.ts

**Files:**
- Modify: `web/src/hooks.server.ts`

- [ ] **Step 1: Replace language detection logic**

Current (lines 57-71):
```ts
// --- i18n language detection ---
const pathname = event.url.pathname;
const NON_DEFAULT_LANG_RE = /^\/(en|jp)(\/|$)/i;

let lang: SupportedLang;
const langMatch = pathname.match(NON_DEFAULT_LANG_RE);
if (langMatch) {
  lang = langMatch[1].toLowerCase() as SupportedLang;
} else {
  lang = 'zh'; // default language when no explicit lang prefix is present
}
event.locals.lang = lang;
event.locals.t = createTranslateFn(loadTranslations(lang));
```

Replace with:
```ts
// --- i18n language detection ---
import { NON_DEFAULT_LANG_RE, DEFAULT_LANG, isSupportedLang } from '$lib/i18n/languages';

const pathname = event.url.pathname;
const langMatch = pathname.match(NON_DEFAULT_LANG_RE);
const lang = langMatch?.[1]?.toLowerCase() ?? DEFAULT_LANG;
if (!isSupportedLang(lang)) {
  throw new Error(`Unsupported language: ${lang}`);
}
event.locals.lang = lang;
event.locals.t = createTranslateFn(loadTranslations(lang));
```

- [ ] **Step 2: Update imports**

Current import:
```ts
import { loadTranslations, createTranslateFn } from '$lib/i18n/server';
import { setLangCookie } from '$lib/i18n/locale';
import type { SupportedLang } from '$lib/i18n/server';
```

Remove `type { SupportedLang }` import. Add:
```ts
import { DEFAULT_LANG, isSupportedLang, NON_DEFAULT_LANG_RE } from '$lib/i18n/languages';
```

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks.server.ts
git commit -m "refactor(i18n): use registry-driven lang detection in server hook"
```

---

### Task 9: Update hooks.ts (client reroute)

**Files:**
- Modify: `web/src/hooks.ts`

- [ ] **Step 1: Replace reroute logic**

Current:
```ts
import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = ({ url }) => {
  const pathname = url.pathname;
  if (!/^\/(en|jp|zh)(\/|$)/.test(pathname)) {
    return `/zh${pathname}`;
  }
  return pathname;
};
```

Replace with:
```ts
import type { Reroute } from '@sveltejs/kit';
import { SUPPORTED_LANGS } from '$lib/i18n/languages';

const ANY_LANG_RE = new RegExp(`^/(${SUPPORTED_LANGS.join('|')})(/|$)`, 'i');

export const reroute: Reroute = ({ url }) => {
  const pathname = url.pathname;
  // If path already has a supported lang prefix, keep as-is ([[lang]] will match)
  if (ANY_LANG_RE.test(pathname)) {
    return pathname;
  }
  // No lang prefix → default language, [[lang]] gets undefined
  return pathname;
};
```

Note: With `[[lang]]` (optional), SvelteKit will match the route even without a prefix. The `params.lang` will be `undefined` for default language — we handle that in the page server loads.

- [ ] **Step 2: Commit**

```bash
git add web/src/hooks.ts
git commit -m "refactor(i18n): update client reroute for [[lang]] optional param"
```

---

### Task 10: Update +layout.svelte — hreflang & stripLangPrefix

**Files:**
- Modify: `web/src/routes/+layout.svelte`

- [ ] **Step 1: Update stripLangPrefix function (line 73)**

Current:
```ts
const stripLangPrefix = (pathname: string): string =>
  pathname.replace(/^\/(zh|en|jp)(?=\/|$)/, '') || '/';
```

Replace with:
```ts
import { ANY_LANG_RE } from '$lib/i18n/languages';

const stripLangPrefix = (pathname: string): string => {
  const match = pathname.match(ANY_LANG_RE);
  if (match) {
    return pathname.slice(match[0].length - 1) || '/';
  }
  return pathname;
};
```

- [ ] **Step 2: Replace hardcoded hreflang tags (lines 403-412)**

Current:
```html
{#if seoMeta.canonicalUrl}
  {@const canonicalPathname = new URL(seoMeta.canonicalUrl).pathname}
  {@const basePath = stripLangPrefix(canonicalPathname)}
  {@const origin = page.url.origin}
  {@const zhUrl = origin + '/zh' + basePath}
  <link rel="alternate" hreflang="zh" href={zhUrl} />
  <link rel="alternate" hreflang="en" href={origin + '/en' + basePath} />
  <link rel="alternate" hreflang="jp" href={origin + '/jp' + basePath} />
  <link rel="alternate" hreflang="x-default" href={zhUrl} />
{/if}
```

Replace with:
```html
{#if seoMeta.canonicalUrl}
  {@const canonicalPathname = new URL(seoMeta.canonicalUrl).pathname}
  {@const basePath = stripLangPrefix(canonicalPathname)}
  {@const origin = page.url.origin}
  {@const defaultLang = LANGUAGES.find(l => l.isDefault)!}
  <link rel="alternate" hreflang="x-default" href={origin + basePath} />
  {#each LANGUAGES as { code }}
    <link
      rel="alternate"
      hreflang={code}
      href={origin + (code === defaultLang.code ? basePath : '/' + code + basePath)}
    />
  {/each}
{/if}
```

- [ ] **Step 3: Add LANGUAGES import (line 36 area)**

Add near existing i18n imports:
```ts
import { LANGUAGES } from '$lib/i18n';
```

- [ ] **Step 4: Commit**

```bash
git add web/src/routes/+layout.svelte
git commit -m "refactor(i18n): dynamic hreflang tags from language registry"
```

---

### Task 11: Rewrite LanguageSwitcher.svelte — toggle → dropdown

**Files:**
- Modify: `web/src/lib/ui/layout/footer/LanguageSwitcher.svelte`

- [ ] **Step 1: Replace the component**

```svelte
<script lang="ts">
  import { LANGUAGES, getLanguageMeta, DEFAULT_LANG } from '$lib/i18n/languages';
  import { buildSwitchUrl, setLangCookie } from '$lib/i18n/locale';
  import { page } from '$app/state';

  type Props = { currentLang: string };
  let { currentLang }: Props = $props();

  let open = $state(false);
  const currentMeta = $derived(getLanguageMeta(currentLang));

  function handleSwitch(e: Event, code: string) {
    e.preventDefault();
    if (code === currentLang) { open = false; return; }
    document.cookie = setLangCookie(code);
    window.location.href = buildSwitchUrl(page.url.pathname, code);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { open = false; }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative inline-flex">
  <button
    onclick={() => open = !open}
    class="text-[10px] md:text-[11px] font-mono text-ink-400 hover:text-jade-600 dark:hover:text-jade-400 transition-colors flex items-center gap-0.5"
    aria-label="Switch language"
    aria-expanded={open}
  >
    {currentMeta?.nativeName ?? currentLang}
    <svg class="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
    </svg>
  </button>

  {#if open}
    <ul
      class="absolute bottom-full mb-1 right-0 z-50 min-w-[120px] rounded-md border border-ink-200/70 bg-ink-50/95 dark:border-ink-700/70 dark:bg-ink-900/95 backdrop-blur-md shadow-lg py-1"
      role="menu"
    >
      {#each LANGUAGES as lang (lang.code)}
        <li>
          <button
            onclick={(e) => handleSwitch(e, lang.code)}
            class="w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors {lang.code === currentLang
              ? 'text-jade-600 dark:text-jade-400 font-bold'
              : 'text-ink-500 hover:text-jade-600 dark:hover:text-jade-400'}"
            role="menuitem"
          >
            {lang.nativeName}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/ui/layout/footer/LanguageSwitcher.svelte
git commit -m "feat(i18n): replace language toggle with dropdown"
```

---

### Task 12: Update resolve-path.ts & metadata.ts

**Files:**
- Modify: `web/src/lib/shared/utils/resolve-path.ts`
- Modify: `web/src/lib/shared/seo/metadata.ts`

- [ ] **Step 1: Update resolve-path.ts imports**

Current:
```ts
import { SUPPORTED_LANGS, type SupportedLang } from '$lib/i18n/server';
```
Replace:
```ts
import { SUPPORTED_LANGS, isSupportedLang } from '$lib/i18n/languages';
```

Update the usage on line 15: replace `SUPPORTED_LANGS.includes(lang as SupportedLang)` with `isSupportedLang(lang)`.

- [ ] **Step 2: Update metadata.ts stripLangPrefix (lines 88-95)**

Current:
```ts
const stripLangPrefix = (pathname: string): string => {
  const match = pathname.match(/^\/(zh|en|jp)(\/|$)/);
  ...
};
```

Replace the hardcoded regex with import from registry. Add:
```ts
import { ANY_LANG_RE } from '$lib/i18n/languages';
```

And update the function to use `ANY_LANG_RE` instead of the hardcoded regex.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/shared/utils/resolve-path.ts web/src/lib/shared/seo/metadata.ts
git commit -m "refactor(i18n): update resolve-path and metadata for registry-driven i18n"
```

---

### Task 13: Update page.server.ts files for [[lang]] param

**Files:**
- Modify: `web/src/routes/[[lang]]/albums/+page.server.ts`
- Modify: `web/src/routes/[[lang]]/moments/+page.server.ts`
- Modify: `web/src/routes/[[lang]]/statistics/+page.server.ts`

- [ ] **Step 1: Update albums/+page.server.ts**

Current (lines 4, 12-13):
```ts
import { isSupportedLang } from '$lib/i18n/server';
const lang = event.params.lang as string | undefined;
const prefix = lang && isSupportedLang(lang) ? `/${lang}` : '';
```

Replace with:
```ts
import { DEFAULT_LANG, isSupportedLang } from '$lib/i18n/languages';
const lang = event.params.lang ?? DEFAULT_LANG;
const prefix = lang !== DEFAULT_LANG && isSupportedLang(lang) ? `/${lang}` : '';
```

- [ ] **Step 2: Same pattern for moments/+page.server.ts and statistics/+page.server.ts**

Apply identical change.

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/\[\[lang\]\]/albums/+page.server.ts web/src/routes/\[\[lang\]\]/moments/+page.server.ts web/src/routes/\[\[lang\]\]/statistics/+page.server.ts
git commit -m "fix(i18n): handle undefined params.lang from [[lang]] optional param"
```

---

### Task 14: Create admin languages config

**Files:**
- Create: `admin/src/shared/languages.ts`

- [ ] **Step 1: Create identical language registry for admin**

```ts
export interface LanguageMeta {
  code: string;
  nativeName: string;
  isDefault: boolean;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'zh-Hans', nativeName: '简体中文', isDefault: true },
  { code: 'zh-Hant', nativeName: '繁體中文', isDefault: false },
  { code: 'en',      nativeName: 'English',  isDefault: false },
  { code: 'ja',      nativeName: '日本語',   isDefault: false },
];

export const DEFAULT_LANG = LANGUAGES.find(l => l.isDefault)!.code;
export const FALLBACK_LANG = 'en';
export const SUPPORTED_LANGS = LANGUAGES.map(l => l.code);
export const SUPPORTED_LANGS_SET = new Set(SUPPORTED_LANGS);

export function getLanguageMeta(code: string): LanguageMeta | undefined {
  return LANGUAGES.find(l => l.code === code);
}

export function isSupportedLang(code: string): boolean {
  return SUPPORTED_LANGS_SET.has(code);
}
```

- [ ] **Step 2: Verify shared/ directory**

```bash
ls admin/src/shared/ 2>/dev/null || mkdir -p admin/src/shared
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/shared/languages.ts
git commit -m "feat(admin): add language registry config"
```

---

### Task 15: Refactor admin i18n plugin

**Files:**
- Modify: `admin/src/plugins/i18n.ts`

- [ ] **Step 1: Replace hardcoded imports with dynamic loading**

Current:
```ts
import { createI18n } from 'vue-i18n'
import zhAdmin from '@/locales/zh/admin.json'
import enAdmin from '@/locales/en/admin.json'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh: { ...zhAdmin },
    en: { ...enAdmin },
  },
})
export default i18n
```

Replace:
```ts
import { createI18n } from 'vue-i18n'
import { DEFAULT_LANG, FALLBACK_LANG } from '@/shared/languages'

const modules = import.meta.glob('@/locales/*/admin.json', { eager: true, import: 'default' })

const messages: Record<string, unknown> = {}
for (const [path, value] of Object.entries(modules)) {
  const parts = path.split('/')
  const code = parts[parts.length - 2] // extract dir name between locales/ and /admin.json
  messages[code] = value
}

const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LANG,
  fallbackLocale: FALLBACK_LANG,
  messages,
})
export default i18n
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/plugins/i18n.ts
git commit -m "refactor(admin): dynamic vue-i18n locale loading"
```

---

### Task 16: Rename admin translation dirs

**Files:**
- Rename: `admin/src/locales/zh/` → `admin/src/locales/zh-Hans/`
- Create: `admin/src/locales/zh-Hant/` (placeholder)
- Create: `admin/src/locales/ja/` (placeholder)

- [ ] **Step 1: Rename zh → zh-Hans**

```bash
git mv admin/src/locales/zh admin/src/locales/zh-Hans
```

- [ ] **Step 2: Create zh-Hant/admin.json placeholder**

```json
{}
```

- [ ] **Step 3: Create ja/admin.json placeholder**

```json
{}
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/locales/
git commit -m "feat(admin): rename zh→zh-Hans, add placeholder locale dirs"
```

---

### Task 17: Refactor admin locale store

**Files:**
- Modify: `admin/src/stores/locale.ts`

- [ ] **Step 1: Replace the store**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEFAULT_LANG, isSupportedLang, getLanguageMeta, type LanguageMeta } from '@/shared/languages'

const LOCALE_KEY = 'admin-locale'

function detectLocale(): string {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved && isSupportedLang(saved)) return saved

  const nav = navigator.language || ''
  // Try full BCP 47 match first, then prefix
  const lower = nav.toLowerCase()
  if (isSupportedLang(lower)) return lower
  // Check registered languages for prefix match (e.g. browser sends 'zh-TW' → match 'zh-Hant')
  for (const code of ['zh-Hant', 'zh-Hans', 'en', 'ja'] as const) {
    if (lower.startsWith(code.split('-')[0])) return code
  }
  return DEFAULT_LANG
}

export const useLocaleStore = defineStore('locale', () => {
  const current = ref<string>(detectLocale())

  function setLocale(lang: string) {
    if (!isSupportedLang(lang)) return
    current.value = lang
    localStorage.setItem(LOCALE_KEY, lang)

    try {
      const { locale } = useI18n()
      locale.value = lang
    } catch {
      // i18n not initialized yet
    }
  }

  return { current, setLocale }
})
```

Key changes:
- Remove `isZh`, `isEn` computed
- Remove `toggle()` method
- `detectLocale` now matches BCP 47 codes and handles browser locale prefix matching

- [ ] **Step 2: Commit**

```bash
git add admin/src/stores/locale.ts
git commit -m "refactor(admin): replace toggle-based locale store with generic setLocale"
```

---

### Task 18: Rewrite admin LanguageSwitch.vue — toggle → dropdown

**Files:**
- Modify: `admin/src/layout/header/action/LanguageSwitch.vue`

- [ ] **Step 1: Replace component**

```vue
<script setup lang="ts">
import { NButton, NDropdown } from 'naive-ui'
import { useLocaleStore } from '@/stores/locale'
import { LANGUAGES, getLanguageMeta } from '@/shared/languages'
import { computed } from 'vue'

defineOptions({ name: 'LanguageSwitch' })

const localeStore = useLocaleStore()

const currentMeta = computed(() => getLanguageMeta(localeStore.current))

const options = LANGUAGES.map(l => ({
  key: l.code,
  label: l.nativeName,
}))
</script>

<template>
  <n-dropdown trigger="click" :options="options" @select="(key: string) => localeStore.setLocale(key)">
    <n-button text size="tiny" style="font-size: 14px; padding: 0 6px">
      {{ currentMeta?.nativeName ?? localeStore.current }}
    </n-button>
  </n-dropdown>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/layout/header/action/LanguageSwitch.vue
git commit -m "feat(admin): replace language toggle with n-dropdown"
```

---

### Task 19: Build verification

- [ ] **Step 1: Build web**

```bash
cd web && pnpm build
```

Expected: Build succeeds. No TypeScript errors. No missing imports.

- [ ] **Step 2: Build admin**

```bash
cd admin && pnpm build
```

Expected: Build succeeds. No TypeScript errors.

- [ ] **Step 3: Type-check both**

```bash
cd web && pnpm check
cd ../admin && pnpm type-check
```

Expected: Both pass.

- [ ] **Step 4: Commit any fixes**

If build/check surfaces issues, fix them and commit:
```bash
git add -A
git commit -m "fix: resolve build and type-check issues from i18n refactor"
```
