import type { WebsiteInfoMap } from '$lib/features/website-info/types';
import type { TranslateFn } from '$lib/i18n/types';
import { ANY_LANG_RE } from '$lib/i18n/languages';

type UnknownRecord = Record<string, unknown>;

export type ResolvedSeoMeta = {
	title: string;
	description: string;
	keywords: string;
	canonicalUrl: string;
	ogSiteName: string;
	ogTitle: string;
	ogDescription: string;
	ogType: string;
	ogUrl: string;
	ogImage: string;
	ogImageType: string | null;
	ogImageWidth: number | null;
	ogImageHeight: number | null;
	twitterCard: 'summary' | 'summary_large_image';
	robots: string;
};

export type ResolveSeoMetaInput = {
	pathname: string;
	search?: string;
	routeData: unknown;
	websiteInfo?: WebsiteInfoMap | null;
	origin?: string;
	fallbackSiteIcon?: string;
	t?: TranslateFn;
};

type PageMeta = {
	pageTitle: string;
	description?: string;
	image?: string;
	ogType?: string;
};

const DEFAULT_SITE_NAME = 'sanblog';
const DEFAULT_DESCRIPTION =
	'sanblog - A personal blog about programming, technology, and software development.';
const DEFAULT_KEYWORDS =
	'blog, programming, technology, software development, web development, coding';
const GENERATED_OG_IMAGE_WIDTH = 1200;
const GENERATED_OG_IMAGE_HEIGHT = 630;

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const readNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
};

const asRecord = (value: unknown): UnknownRecord | null =>
	value && typeof value === 'object' ? (value as UnknownRecord) : null;

const parseListImage = (value: unknown): string => {
	if (!Array.isArray(value)) return '';
	for (const item of value) {
		const candidate = readString(item);
		if (candidate) return candidate;
	}
	return '';
};

const compactText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const cutText = (value: string, limit: number): string => {
	if (value.length <= limit) return value;
	return `${value.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
};

const normalizeDescription = (value: string): string => cutText(compactText(value), 200);

const normalizePathname = (pathname: string): string => {
	const trimmed = pathname.trim();
	if (!trimmed) return '/';
	if (trimmed === '/') return '/';
	return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const stripLangPrefix = (pathname: string): string => {
	const match = pathname.match(ANY_LANG_RE);
	if (match) {
		const rest = pathname.slice(match[0].length - 1);
		return rest || '/';
	}
	return pathname;
};

const getPageValue = (
	routeData: UnknownRecord,
	key: 'post' | 'moment' | 'page'
): UnknownRecord | null => asRecord(routeData[key]);

const getPaginationPage = (routeData: UnknownRecord): number | null => {
	const pagination = asRecord(routeData.pagination);
	const pageFromPagination = readNumber(pagination?.page);
	if (pageFromPagination && pageFromPagination > 0) return pageFromPagination;

	const thinkings = asRecord(routeData.thinkings);
	const pageFromThinkings = readNumber(thinkings?.page);
	if (pageFromThinkings && pageFromThinkings > 0) return pageFromThinkings;

	const moments = asRecord(routeData.moments);
	const pageFromMoments = readNumber(moments?.page);
	if (pageFromMoments && pageFromMoments > 0) return pageFromMoments;

	return null;
};

const parsePageFromPath = (pathname: string): number | null => {
	const matched = pathname.match(/\/page\/(\d+)$/);
	if (!matched) return null;
	const page = Number(matched[1]);
	return Number.isFinite(page) && page > 0 ? page : null;
};

const parsePageFromSearch = (search: string): number | null => {
	if (!search) return null;
	const params = new URLSearchParams(search);
	const page = Number(params.get('page') ?? '');
	return Number.isFinite(page) && page > 0 ? page : null;
};

const resolveBaseUrl = (
	websiteInfo: WebsiteInfoMap | null | undefined,
	origin?: string
): string => {
	const raw =
		readString(websiteInfo?.public_url) || readString(origin) || readString(websiteInfo?.og_url);
	if (!raw) return '';
	try {
		const base = new URL(raw);
		base.pathname = '/';
		base.search = '';
		base.hash = '';
		return base.toString();
	} catch {
		return '';
	}
};

const toAbsoluteUrl = (value: string, baseUrl: string): string => {
	if (!value) return '';
	try {
		return new URL(value).toString();
	} catch {
		if (!baseUrl) return value;
		try {
			return new URL(value, baseUrl).toString();
		} catch {
			return value;
		}
	}
};

const buildCanonicalUrl = (pathname: string, search: string, baseUrl: string): string => {
	const pathWithSearch = `${pathname}${search}`;
	if (!baseUrl) return pathWithSearch;
	try {
		return new URL(pathWithSearch, baseUrl).toString();
	} catch {
		return pathWithSearch;
	}
};

const resolveListPageTitle = (baseTitle: string, page: number | null, t: TranslateFn): string => {
	if (!page || page <= 1) return baseTitle;
	return t('web.seo.paginated', { title: baseTitle, page });
};

export const resolveOgTag = (pathname: string, ogType: string): string => {
	const p = stripLangPrefix(pathname);
	if (ogType === 'article') return 'ARTICLE';
	if (p === '/') return 'HOME';
	if (p === '/timeline') return 'TIMELINE';
	if (p === '/tags') return 'TAGS';
	return 'PAGE';
};

const resolvePageMeta = (pathname: string, search: string, routeData: UnknownRecord, t: TranslateFn): PageMeta => {
	const p = stripLangPrefix(pathname);
	const post = getPageValue(routeData, 'post');
	if (post) {
		return {
			pageTitle: readString(post.title),
			description: readString(post.summary) || readString(post.leadIn),
			image: readString(post.cover),
			ogType: 'article'
		};
	}

	const moment = getPageValue(routeData, 'moment');
	if (moment) {
		return {
			pageTitle: readString(moment.title),
			description: readString(moment.summary),
			image: parseListImage(moment.image),
			ogType: 'article'
		};
	}

	const pageDetail = getPageValue(routeData, 'page');
	if (pageDetail) {
		return {
			pageTitle: readString(pageDetail.title),
			description: readString(pageDetail.description) || readString(pageDetail.aiSummary),
			ogType: 'article'
		};
	}

	const categoryName = readString(routeData.categoryName);
	if (categoryName) {
		const page = getPaginationPage(routeData);
		return {
			pageTitle: resolveListPageTitle(categoryName, page, t),
			description: t('web.seo.category.desc', { name: categoryName })
		};
	}

	const columnName = readString(routeData.columnName);
	if (columnName) {
		const page = getPaginationPage(routeData);
		return {
			pageTitle: resolveListPageTitle(columnName, page, t),
			description: t('web.seo.column.desc', { name: columnName })
		};
	}

	if (p === '/') {
		return { pageTitle: '' };
	}

	if (p === '/posts' || p.startsWith('/posts/page/')) {
		const page = parsePageFromPath(pathname) ?? getPaginationPage(routeData);
		return {
			pageTitle: resolveListPageTitle(t('web.seo.posts.title'), page, t),
			description: t('web.seo.posts.desc')
		};
	}

	if (p === '/moments') {
		const page = parsePageFromSearch(search) ?? getPaginationPage(routeData);
		return {
			pageTitle: resolveListPageTitle(t('web.seo.moments.title'), page, t),
			description: t('web.seo.moments.desc')
		};
	}

	if (p === '/thinkings' || p.startsWith('/thinkings/page/')) {
		const page = parsePageFromPath(pathname) ?? getPaginationPage(routeData);
		return {
			pageTitle: resolveListPageTitle(t('web.seo.thinkings.title'), page, t),
			description: t('web.seo.thinkings.desc')
		};
	}

	if (p === '/friends') {
		return {
			pageTitle: t('web.seo.friends.title'),
			description: t('web.seo.friends.desc')
		};
	}

	if (p === '/friends-timeline' || p.startsWith('/friends-timeline/page/')) {
		const page = parsePageFromPath(pathname) ?? getPaginationPage(routeData);
		return {
			pageTitle: resolveListPageTitle(t('web.seo.friends_timeline.title'), page, t),
			description: t('web.seo.friends_timeline.desc')
		};
	}

	if (p === '/tags') {
		return {
			pageTitle: t('web.seo.tags.title'),
			description: t('web.seo.tags.desc')
		};
	}

	if (p === '/timeline') {
		return {
			pageTitle: t('web.seo.timeline.title'),
			description: t('web.seo.timeline.desc')
		};
	}

	if (p.startsWith('/auth/providers/')) {
		return { pageTitle: t('web.seo.auth_callback') };
	}

	if (p.startsWith('/internal/preview/')) {
		return { pageTitle: t('web.seo.content_preview') };
	}

	return { pageTitle: '' };
};

export const resolveSeoMeta = (input: ResolveSeoMetaInput): ResolvedSeoMeta => {
	const pathname = normalizePathname(input.pathname);
	const search = input.search ?? '';
	const routeData = asRecord(input.routeData) ?? {};
	const websiteInfo = input.websiteInfo ?? null;
	const isHomePage = stripLangPrefix(pathname) === '/';

	const siteName = readString(websiteInfo?.website_name) || DEFAULT_SITE_NAME;
	const homeTitle = readString(websiteInfo?.home_title);
	const defaultDescription = readString(websiteInfo?.description) || DEFAULT_DESCRIPTION;
	const keywords = readString(websiteInfo?.keywords) || DEFAULT_KEYWORDS;
	const t = (input.t ?? ((key: string) => key)) as TranslateFn;
	const pageMeta = resolvePageMeta(pathname, search, routeData, t);

	const pageTitle = readString(pageMeta.pageTitle);
	const resolvedHomeTitle = homeTitle || siteName;
	const title = isHomePage
		? resolvedHomeTitle
		: pageTitle && pageTitle !== siteName
			? `${pageTitle} | ${siteName}`
			: siteName;
	const description = normalizeDescription(pageMeta.description || defaultDescription);

	const baseUrl = resolveBaseUrl(websiteInfo, input.origin);
	const canonicalPath = pathname === '/' ? '/' : `${pathname}/`;
	const canonicalUrl = buildCanonicalUrl(canonicalPath, search, baseUrl);
	const ogUrl = canonicalUrl;

	const contentImage = toAbsoluteUrl(readString(pageMeta.image), baseUrl);
	const ogType = readString(pageMeta.ogType) || readString(websiteInfo?.og_type) || 'website';
	const ogSiteName = readString(websiteInfo?.og_site_name) || siteName;
	const ogTitle =
		pageTitle ||
		(isHomePage ? resolvedHomeTitle : '') ||
		readString(websiteInfo?.og_title) ||
		siteName;
	const ogDescription = pageMeta.description
		? description
		: normalizeDescription(readString(websiteInfo?.og_description) || description);
	const ogImagePath = pathname === '/' ? '/og-image.png' : `${pathname}/og-image.png`;
	const generatedOgImage = toAbsoluteUrl(ogImagePath, baseUrl);
	const ogImage = contentImage || generatedOgImage;
	const usesGeneratedOgImage = !contentImage;

	const noIndex =
		stripLangPrefix(pathname).startsWith('/auth/providers/') ||
		stripLangPrefix(pathname).startsWith('/internal/preview/') ||
		stripLangPrefix(pathname).startsWith('/internal/');

	return {
		title,
		description,
		keywords,
		canonicalUrl,
		ogSiteName,
		ogTitle,
		ogDescription,
		ogType,
		ogUrl,
		ogImage,
		ogImageType: usesGeneratedOgImage ? 'image/png' : null,
		ogImageWidth: usesGeneratedOgImage ? GENERATED_OG_IMAGE_WIDTH : null,
		ogImageHeight: usesGeneratedOgImage ? GENERATED_OG_IMAGE_HEIGHT : null,
		twitterCard: ogImage ? 'summary_large_image' : 'summary',
		robots: noIndex ? 'noindex,nofollow' : 'index,follow'
	};
};
