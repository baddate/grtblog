import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import { resolveHref, resolvePath } from '$lib/shared/utils/resolve-path';

describe('resolvePath', () => {
	it('keeps the zh prefix when rendering zh links', () => {
		expect(resolvePath('/posts', 'zh')).toBe('/zh/posts');
	});

	it('keeps the en prefix when rendering en links', () => {
		expect(resolvePath('/posts', 'en')).toBe('/en/posts');
	});
});

describe('resolveHref', () => {
	it('keeps the zh prefix for relative site links', () => {
		expect(resolveHref('/posts', 'zh')).toBe('/zh/posts');
	});
});
