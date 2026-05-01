import type { SupportedLang } from './server';

const LANG_COOKIE = 'lang';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  try {
    const first = header.split(',')[0];
    if (!first) return null;
    const tag = first.split(';')[0].trim();
    if (tag.includes('-')) return tag.split('-')[0].toLowerCase();
    return tag.toLowerCase();
  } catch {
    return null;
  }
}

export function setLangCookie(lang: SupportedLang): string {
  return `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function buildSwitchUrl(currentPath: string, targetLang: SupportedLang): string {
  const parts = currentPath.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts.length > 0 && ['zh', 'en'].includes(parts[0])) {
    parts[0] = targetLang;
    return '/' + parts.join('/') + '/';
  }
  return `/${targetLang}/`;
}
