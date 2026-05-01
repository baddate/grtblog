import type { TranslateFn, TranslationMap } from './types';
import zh from './generated/zh.json';
import en from './generated/en.json';
import { parseAcceptLanguage } from './locale';

const translations: Record<string, TranslationMap> = { zh, en };
const SUPPORTED_LANGS = ['zh', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const FALLBACK_LANG: SupportedLang = 'en';

export function isSupportedLang(lang: string): lang is SupportedLang {
  return SUPPORTED_LANGS.includes(lang as SupportedLang);
}

export function loadTranslations(lang: SupportedLang): TranslationMap {
  return translations[lang] ?? translations[FALLBACK_LANG];
}

export function createTranslateFn(map: TranslationMap): TranslateFn {
  return (key: string, params?: Record<string, string | number>) => {
    let template = map[key];
    if (!template) {
      template = translations[FALLBACK_LANG][key];
    }
    if (!template) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing translation: "${key}"`);
        return `⚠ ${key}`;
      }
      return key;
    }
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params[name] ?? `{${name}}`)
    );
  };
}

export function detectLanguage(
  urlLang: string | undefined,
  cookieLang: string | null,
  acceptLanguage: string | null
): SupportedLang {
  if (urlLang && isSupportedLang(urlLang)) return urlLang;
  if (cookieLang && isSupportedLang(cookieLang)) return cookieLang;
  const preferred = parseAcceptLanguage(acceptLanguage);
  if (preferred && isSupportedLang(preferred)) return preferred;
  return FALLBACK_LANG;
}
