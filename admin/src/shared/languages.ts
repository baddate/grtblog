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
