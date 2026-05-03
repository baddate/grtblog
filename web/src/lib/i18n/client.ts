import { page } from '$app/state';
import { createTranslateFn } from './server';
import type { TranslateFn, TranslationMap } from './types';
import type { TranslationKey } from './generated/keys';

// Must NOT read page.data at module top-level during SSR —
// SvelteKit only allows page.data access inside component rendering context.
// So we lazily create the translate function on first call, and
// recreate it when translations change (language switch triggers full navigation).
let cachedTranslations: TranslationMap | undefined;
let cachedFn: TranslateFn | undefined;

export const t: TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => {
	const translations: TranslationMap = page.data.translations ?? {};
	if (translations !== cachedTranslations) {
		cachedTranslations = translations;
		cachedFn = createTranslateFn(translations);
	}
	return params !== undefined ? cachedFn!(key, params) : cachedFn!(key);
};
