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
