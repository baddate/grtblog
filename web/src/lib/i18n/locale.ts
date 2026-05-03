import { SUPPORTED_LANGS, type SupportedLang } from './constants';

const LANG_COOKIE = 'lang';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

const LANG_SEGMENTS = new Set(SUPPORTED_LANGS);

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

	// Strip any known lang prefix from the first segment
	if (parts.length > 0 && LANG_SEGMENTS.has(parts[0] as SupportedLang)) {
		parts.shift();
	}

	// Ensure trailing slash for SvelteKit trailingSlash: 'always'
	const basePath = '/' + parts.join('/') + (parts.length > 0 ? '/' : '');

	return `/${targetLang}${basePath}`;
}
