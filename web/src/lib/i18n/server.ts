import type { TranslateFn, TranslationMap } from './types';
import zh from './generated/zh.json';
import en from './generated/en.json';
import { parseAcceptLanguage } from './locale';
import { SUPPORTED_LANGS, DEFAULT_LANG, FALLBACK_LANG, type SupportedLang } from './constants';
export { SUPPORTED_LANGS, DEFAULT_LANG, FALLBACK_LANG, type SupportedLang };

const translations: Record<string, TranslationMap> = { zh, en };

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
  urlLang: string | undefined | null,
  cookieLang: string | null,
  acceptLanguage: string | null
): SupportedLang {
  if (urlLang && isSupportedLang(urlLang)) return urlLang;
  if (cookieLang && isSupportedLang(cookieLang)) return cookieLang;
  const preferred = parseAcceptLanguage(acceptLanguage);
  if (preferred && isSupportedLang(preferred)) return preferred;
  return FALLBACK_LANG;
}
