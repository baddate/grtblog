// ---- Language metadata type ----
export interface LanguageMeta {
  code: string;
  nativeName: string;
  isDefault: boolean;
}

// ---- Language registry (single source of truth) ----
export const LANGUAGES: LanguageMeta[] = [
  { code: 'zh-Hans', nativeName: '简体中文', isDefault: true },
  { code: 'zh-Hant', nativeName: '繁體中文', isDefault: false },
  { code: 'en',      nativeName: 'English',  isDefault: false },
  { code: 'ja',      nativeName: '日本語',   isDefault: false },
];

// ---- Core constants ----
export const DEFAULT_LANG = LANGUAGES.find(l => l.isDefault)!.code;
export const FALLBACK_LANG = 'en';
export const SUPPORTED_LANGS = LANGUAGES.map(l => l.code);
export const NON_DEFAULT_LANGS = LANGUAGES.filter(l => !l.isDefault).map(l => l.code);
export const SUPPORTED_LANGS_SET: ReadonlySet<string> = new Set(SUPPORTED_LANGS);

// ---- Regex helpers (used by URL parsing) ----
export const ANY_LANG_RE = new RegExp(`^/(${SUPPORTED_LANGS.join('|')})(/|$)`, 'i');
export const NON_DEFAULT_LANG_RE = new RegExp(`^/(${NON_DEFAULT_LANGS.join('|')})(/|$)`, 'i');

// ---- Helpers ----
export function isSupportedLang(lang: string): boolean {
  return SUPPORTED_LANGS_SET.has(lang);
}

export function getLanguageMeta(code: string): LanguageMeta | undefined {
  return LANGUAGES.find(l => l.code === code);
}
