import { redirect } from '@sveltejs/kit';
import { isSupportedLang } from '$lib/i18n/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const lang = event.params.lang as string | undefined;
	const prefix = lang && isSupportedLang(lang) ? `/${lang}` : '';
	throw redirect(302, `${prefix}/timeline?redirect_from=statistics`);
};
