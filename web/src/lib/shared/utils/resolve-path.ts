import { resolve } from '$app/paths';
import type { PathnameWithSearchOrHash, ResolvedPathname } from '$app/types';
import { SUPPORTED_LANGS, type SupportedLang } from '$lib/i18n/server';

export const isPathnameWithSearchOrHash = (value: string): value is PathnameWithSearchOrHash =>
	value.startsWith('/');

const resolvePathname: (path: PathnameWithSearchOrHash) => ResolvedPathname = resolve;

export const resolvePath = <T extends PathnameWithSearchOrHash>(
	path: T,
	lang?: string
): ResolvedPathname => {
	const resolved = resolvePathname(path);
	if (lang && SUPPORTED_LANGS.includes(lang as SupportedLang)) {
		return `/${lang}${resolved}` as ResolvedPathname;
	}
	return resolved;
};

export const resolveHref = (href: string, lang?: string): string => {
	if (!isPathnameWithSearchOrHash(href)) return href;
	return resolvePath(href, lang);
};
