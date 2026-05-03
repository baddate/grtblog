import type { Handle, HandleServerError } from '@sveltejs/kit';
import { ISR_DEPS_HEADER } from '$lib/server/isr-deps';
import { loadTranslations, createTranslateFn } from '$lib/i18n/server';
import { setLangCookie } from '$lib/i18n/locale';
import type { SupportedLang } from '$lib/i18n/server';

const STATIC_FALLBACK_HEADER = 'x-grt-static-fallback';
const STATIC_MISS_WARN_TTL_MS = 5 * 60 * 1000;
const recentStaticMissWarnAt = new Map<string, number>();

const shouldWarnStaticMiss = (key: string, now: number): boolean => {
	const last = recentStaticMissWarnAt.get(key) ?? 0;
	if (now - last < STATIC_MISS_WARN_TTL_MS) {
		return false;
	}
	recentStaticMissWarnAt.set(key, now);

	// Keep the in-memory throttle map bounded for long-lived renderer processes.
	if (recentStaticMissWarnAt.size > 1000) {
		for (const [candidate, timestamp] of recentStaticMissWarnAt) {
			if (now - timestamp >= STATIC_MISS_WARN_TTL_MS) {
				recentStaticMissWarnAt.delete(candidate);
			}
		}
	}
	return true;
};

const logServerResponse = (
	method: string,
	pathname: string,
	status: number,
	staticFallback: boolean,
	deps: string[]
) => {
	if (status < 400) return;
	const level = status >= 500 ? 'error' : 'warn';
	const extra = staticFallback ? ' staticFallback=1' : '';
	const depInfo = deps.length > 0 ? ` deps=${deps.join(',')}` : '';
	console[level](
		`[renderer][server-response] side=server code=${status} method=${method} path=${pathname}${extra}${depInfo}`
	);
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const detail =
		error instanceof Error
			? `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`
			: String(error);
	console.error(
		`[renderer][server-exception] side=server code=${status ?? 500} method=${event.request.method} path=${event.url.pathname} message=${message}\n${detail}`
	);
};



export const handle: Handle = async ({ event, resolve }) => {
	// --- i18n language detection ---
	const pathname = event.url.pathname;
	const NON_DEFAULT_LANG_RE = /^\/(en|jp)(\/|$)/i;

	let lang: SupportedLang;
	const langMatch = pathname.match(NON_DEFAULT_LANG_RE);
	if (langMatch) {
		lang = langMatch[1].toLowerCase() as SupportedLang;
	} else {
		lang = 'zh'; // default language when no explicit lang prefix is present
	}
	event.locals.lang = lang;
	event.locals.t = createTranslateFn(loadTranslations(lang));
	// --- end i18n ---

	event.locals.isrDeps = new Set<string>();

	const response = await resolve(event);
	const staticFallback = event.request.headers.get(STATIC_FALLBACK_HEADER) === '1';
	const depList = Array.from(event.locals.isrDeps).sort();
	logServerResponse(
		event.request.method,
		event.url.pathname,
		response.status,
		staticFallback,
		depList
	);
	if (staticFallback && event.locals.isrDeps.size > 0) {
		const now = Date.now();
		const warnKey = `${event.request.method}:${event.url.pathname}:${response.status}:${depList.join(',')}`;
		if (shouldWarnStaticMiss(warnKey, now)) {
			console.warn(
				`[renderer][isr-static-miss] ${event.request.method} ${event.url.pathname} status=${response.status} deps=${depList.join(',')}`
			);
		}
	}
	// Prepare final response with ISR headers if needed
	let finalResponse: Response;
	if (event.locals.isrDeps.size === 0) {
		finalResponse = response;
	} else {
		const headers = new Headers(response.headers);
		headers.set(ISR_DEPS_HEADER, JSON.stringify(depList));
		finalResponse = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers
		});
	}

	// Set lang cookie on every response (after all other response modifications)
	finalResponse.headers.append('Set-Cookie', setLangCookie(lang));
	return finalResponse;
};
