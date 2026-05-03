import type { TranslationMap } from './types';
import zh from './generated/zh.json';
import en from './generated/en.json';

// ---- Language metadata type ----
export interface LanguageMeta {
  code: SupportedLang;
  name: string;
  englishName: string;
}

// ---- Core constants ----
export const SUPPORTED_LANGS = ['zh', 'en', 'jp'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'zh';
export const FALLBACK_LANG: SupportedLang = 'en';
export const SUPPORTED_LANGS_SET: Set<string> = new Set(SUPPORTED_LANGS);

// ---- Language registry ----
export const LANGUAGES: Record<SupportedLang, LanguageMeta> = {
  zh: { code: 'zh', name: '中文', englishName: 'Chinese' },
  en: { code: 'en', name: 'English', englishName: 'English' },
  jp: { code: 'jp', name: '日本語', englishName: 'Japanese' },
};

// ---- Translations map (used by loader) ----
export const TRANSLATIONS: Record<string, TranslationMap> = { zh, en };

// ---- Derived values ----
export const NON_DEFAULT_LANGS: readonly SupportedLang[] = SUPPORTED_LANGS.filter(
  (lang) => lang !== DEFAULT_LANG,
);

// ---- Helpers ----
export function isSupportedLang(lang: string): lang is SupportedLang {
  return SUPPORTED_LANGS.includes(lang as SupportedLang);
}

export function getLanguageMeta(lang: string): LanguageMeta | undefined {
  if (isSupportedLang(lang)) return LANGUAGES[lang];
  return undefined;
}
