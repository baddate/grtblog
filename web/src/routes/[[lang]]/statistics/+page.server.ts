import { redirect } from '@sveltejs/kit';
import { DEFAULT_LANG, isSupportedLang } from '$lib/i18n/languages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const lang = event.params.lang ?? DEFAULT_LANG;
	const prefix = lang !== DEFAULT_LANG && isSupportedLang(lang) ? `/${lang}` : '';
	throw redirect(302, `${prefix}/timeline?redirect_from=statistics`);
};
