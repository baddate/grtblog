import { SUPPORTED_LANGS_SET, DEFAULT_LANG } from './languages';

const LANG_COOKIE = 'lang';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function parseAcceptLanguage(header: string | null): string | null {
	if (!header) return null;
	try {
		const first = header.split(',')[0];
		if (!first) return null;
		const tag = first.split(';')[0].trim();
		return tag.toLowerCase();
	} catch {
		return null;
	}
}

export function setLangCookie(lang: string): string {
	return `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function buildSwitchUrl(currentPath: string, targetLang: string): string {
	const parts = currentPath.replace(/\/+$/, '').split('/').filter(Boolean);

	// Strip any supported language prefix from the first segment
	if (parts.length > 0 && SUPPORTED_LANGS_SET.has(parts[0])) {
		parts.shift();
	}

	// Ensure trailing slash for SvelteKit trailingSlash: 'always'
	const basePath = '/' + parts.join('/') + (parts.length > 0 ? '/' : '');

	if (targetLang === DEFAULT_LANG) {
		return basePath;
	}
	return `/${targetLang}${basePath}`;
}
