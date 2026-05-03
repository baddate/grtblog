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

export function loadTranslations(lang: string): TranslationMap {
  return translations[lang] ?? translations[FALLBACK_LANG] ?? {};
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
): string {
  if (urlLang && isSupportedLang(urlLang)) return urlLang;
  if (cookieLang && isSupportedLang(cookieLang)) return cookieLang;
  const preferred = parseAcceptLanguage(acceptLanguage);
  if (preferred && isSupportedLang(preferred)) return preferred;
  return FALLBACK_LANG;
}
