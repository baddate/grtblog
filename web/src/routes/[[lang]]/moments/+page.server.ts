import { redirect } from '@sveltejs/kit';
import { getMomentList } from '$lib/features/moment/api';
import { trackISRDeps } from '$lib/server/isr-deps';
import { DEFAULT_LANG, isSupportedLang } from '$lib/i18n/languages';
import type { PageServerLoad } from './$types';

const TRACKED_MOMENT_LIST_PAGES = 3;
const DEFAULT_PAGE_SIZE = 20;

export const load: PageServerLoad = async (event) => {
	const { fetch, url } = event;
	const lang = event.params.lang ?? DEFAULT_LANG;
	const prefix = lang !== DEFAULT_LANG && isSupportedLang(lang) ? `/${lang}` : '';
	const rawPage = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
	if (page > 1) {
		throw redirect(308, `${prefix}/moments/page/${page}`);
	}
	if (page <= TRACKED_MOMENT_LIST_PAGES) {
		trackISRDeps(event, `moment:list:page:${page}`);
	}

	const data = await getMomentList(fetch, { page, pageSize: DEFAULT_PAGE_SIZE });
	return {
		moments: data
	};
};
