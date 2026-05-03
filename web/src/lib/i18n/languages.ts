import type { TranslationMap } from './types';
import zh from './generated/zh.json';
import en from './generated/en.json';

// ---- Language metadata type ----
export interface LanguageMeta {
  code: SupportedLang;
  name: string;
  englishName: string;
  nativeName: string;
  isDefault: boolean;
}

// ---- Core constants ----
export const SUPPORTED_LANGS = ['zh', 'en', 'jp'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'zh';
export const FALLBACK_LANG: SupportedLang = 'en';
export const SUPPORTED_LANGS_SET: Set<string> = new Set(SUPPORTED_LANGS);

// ---- Language registry ----
export const LANGUAGES: LanguageMeta[] = [
  { code: 'zh', name: '中文', englishName: 'Chinese', nativeName: '中文', isDefault: true },
  { code: 'en', name: 'English', englishName: 'English', nativeName: 'English', isDefault: false },
  { code: 'jp', name: '日本語', englishName: 'Japanese', nativeName: '日本語', isDefault: false },
];

// ---- Translations map (used by loader) ----
export const TRANSLATIONS: Record<string, TranslationMap> = { zh, en };

// ---- Derived values ----
export const NON_DEFAULT_LANGS: readonly SupportedLang[] = SUPPORTED_LANGS.filter(
  (lang) => lang !== DEFAULT_LANG,
);

// ---- Regex helpers (used by URL parsing) ----
export const ANY_LANG_RE = new RegExp(`^/(${SUPPORTED_LANGS.join('|')})(/|$)`, 'i');
export const NON_DEFAULT_LANG_RE = new RegExp(`^/(${NON_DEFAULT_LANGS.join('|')})(/|$)`, 'i');

// ---- Helpers ----
export function isSupportedLang(lang: string): lang is SupportedLang {
  return SUPPORTED_LANGS.includes(lang as SupportedLang);
}

export function getLanguageMeta(lang: string): LanguageMeta | undefined {
  return LANGUAGES.find((l) => l.code === lang);
}
