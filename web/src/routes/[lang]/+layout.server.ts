import type { LayoutServerLoad } from './$types';
import { loadTranslations } from '$lib/i18n/server';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    lang: locals.lang,
    translations: loadTranslations(locals.lang),
  };
};
