export const SUPPORTED_LANGS = ['zh', 'en', 'jp'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'zh';
export const FALLBACK_LANG: SupportedLang = 'en';
