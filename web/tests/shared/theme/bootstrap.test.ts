import { describe, expect, it } from 'vitest';

import {
	DEFAULT_THEME_CSS_TEXT,
	buildThemeCssText,
	parseThemeConfig,
	resolveThemeSnapshot
} from '$lib/shared/theme/bootstrap';
import { defaultThemePalette } from '$lib/shared/theme/palette';

describe('parseThemeConfig', () => {
	it('falls back to the default config when the payload is invalid', () => {
		expect(parseThemeConfig(null)).toEqual({
			mode: 'system',
			theme: defaultThemePalette.id,
			version: 1
		});
	});

	it('keeps a valid persisted mode and theme id', () => {
		expect(
			parseThemeConfig({
				mode: 'dark',
				theme: 'custom_theme',
				version: 4
			})
		).toEqual({
			mode: 'dark',
			theme: 'custom_theme',
			version: 4
		});
	});
});

describe('resolveThemeSnapshot', () => {
	it('prefers the cached css text when it exists', () => {
		const snapshot = resolveThemeSnapshot({
			rawConfig: { mode: 'light', theme: defaultThemePalette.id, version: 1 },
			rawThemes: [defaultThemePalette],
			rawCssText: ':root { --background: hotpink; }',
			systemPrefersDark: false
		});

		expect(snapshot.cssText).toBe(':root { --background: hotpink; }');
		expect(snapshot.resolvedTheme).toBe('light');
	});

	it('rebuilds css from the selected palette when there is no cache', () => {
		const palette = {
			...defaultThemePalette,
			id: 'custom_sunrise',
			vars: {
				light: {
					primary: '#f97316',
					secondary: '#fb7185',
					background: '#fff7ed',
					surface: '#ffedd520',
					text: '#7c2d12'
				},
				dark: {
					primary: '#fdba74',
					secondary: '#fda4af',
					background: '#431407',
					surface: '#7c2d1230',
					text: '#fed7aa'
				}
			}
		};

		const snapshot = resolveThemeSnapshot({
			rawConfig: { mode: 'system', theme: palette.id, version: 1 },
			rawThemes: [palette],
			systemPrefersDark: true
		});

		expect(snapshot.resolvedTheme).toBe('dark');
		expect(snapshot.themeId).toBe(palette.id);
		expect(snapshot.cssText).toBe(buildThemeCssText(palette));
	});

	it('falls back to the default theme css when the stored themes are invalid', () => {
		const snapshot = resolveThemeSnapshot({
			rawConfig: { mode: 'light', theme: 'broken', version: 1 },
			rawThemes: [{ nope: true }],
			systemPrefersDark: false
		});

		expect(snapshot.themeId).toBe(defaultThemePalette.id);
		expect(snapshot.cssText).toBe(DEFAULT_THEME_CSS_TEXT);
	});
});
