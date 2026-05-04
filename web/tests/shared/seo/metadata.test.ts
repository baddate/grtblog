import { describe, expect, it } from 'vitest';
import { resolveSeoMeta } from '$lib/shared/seo/metadata';

describe('resolveSeoMeta', () => {
	it('recognizes zh-prefixed archive routes', () => {
		const seo = resolveSeoMeta({
			pathname: '/zh-Hans/posts',
			origin: 'https://example.com',
			routeData: {},
			t: (key) => key
		});

		expect(seo.title).toBe('web.seo.posts.title | sanblog');
		expect(seo.canonicalUrl).toBe('https://example.com/zh-Hans/posts/');
	});
});
