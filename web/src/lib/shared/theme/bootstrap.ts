import { defaultThemePalette, type ThemePalette } from './palette';
import { cssConverter, generateThemeFromPalette } from './theme';

export const STORAGE_KEY_THEMES = 'palette-themes';
export const STORAGE_KEY_CONFIG = 'palette-config';
export const STORAGE_KEY_CSS = 'theme-css';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeConfig {
	mode: ThemeMode;
	theme: string;
	version: number;
}

export interface ResolvedThemeSnapshot {
	cssText: string;
	mode: ThemeMode;
	resolvedTheme: ResolvedTheme;
	themeId: string;
}

export const DEFAULT_THEME_CSS_TEXT = cssConverter(generateThemeFromPalette(defaultThemePalette));

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isThemeMode(value: unknown): value is ThemeMode {
	return value === 'light' || value === 'dark' || value === 'system';
}

function isThemePalette(value: unknown): value is ThemePalette {
	if (!isRecord(value)) return false;
	if (typeof value.id !== 'string' || typeof value.name !== 'string') return false;
	if (!isRecord(value.base) || !isRecord(value.vars)) return false;

	const base = value.base;
	if (!isRecord(base.border) || typeof base.border.radius !== 'string') return false;
	if (!isRecord(base.font) || typeof base.font.family !== 'string') return false;
	if (
		value.card !== 'gradient' &&
		value.card !== 'solid' &&
		value.card !== 'solid-border' &&
		value.card !== 'border' &&
		value.card !== 'transparent'
	) {
		return false;
	}

	for (const mode of ['light', 'dark'] as const) {
		const modeVars = value.vars[mode];
		if (!isRecord(modeVars)) return false;
		for (const key of ['primary', 'secondary', 'background', 'surface', 'text']) {
			if (typeof modeVars[key] !== 'string') return false;
		}
	}

	return true;
}

export function parseThemeConfig(rawConfig: unknown): ThemeConfig {
	if (!isRecord(rawConfig)) {
		return { mode: 'system', theme: defaultThemePalette.id, version: 1 };
	}

	return {
		mode: isThemeMode(rawConfig.mode) ? rawConfig.mode : 'system',
		theme: typeof rawConfig.theme === 'string' ? rawConfig.theme : defaultThemePalette.id,
		version: typeof rawConfig.version === 'number' ? rawConfig.version : 1
	};
}

function resolvePalette(rawThemes: unknown, themeId: string): ThemePalette {
	if (!Array.isArray(rawThemes)) return defaultThemePalette;
	const palettes = rawThemes.filter(isThemePalette);
	return palettes.find((palette) => palette.id === themeId) ?? defaultThemePalette;
}

export function buildThemeCssText(palette: ThemePalette): string {
	return cssConverter(generateThemeFromPalette(palette));
}

export function resolveThemeSnapshot(options: {
	rawConfig: unknown;
	rawThemes: unknown;
	rawCssText?: unknown;
	systemPrefersDark: boolean;
}): ResolvedThemeSnapshot {
	const config = parseThemeConfig(options.rawConfig);
	const palette = resolvePalette(options.rawThemes, config.theme);
	const resolvedTheme =
		config.mode === 'dark' || (config.mode === 'system' && options.systemPrefersDark)
			? 'dark'
			: 'light';
	const cachedCssText =
		typeof options.rawCssText === 'string' && options.rawCssText.trim().length > 0
			? options.rawCssText
			: null;

	return {
		cssText: cachedCssText ?? buildThemeCssText(palette),
		mode: config.mode,
		resolvedTheme,
		themeId: palette.id
	};
}

export function createThemeBootScript(defaultCssText = DEFAULT_THEME_CSS_TEXT): string {
	return `
		(function () {
			try {
				const CONFIG_KEY = ${JSON.stringify(STORAGE_KEY_CONFIG)};
				const CSS_KEY = ${JSON.stringify(STORAGE_KEY_CSS)};
				const defaultCssText = ${JSON.stringify(defaultCssText)};
				const rawConfig = localStorage.getItem(CONFIG_KEY);
				const parsed = rawConfig ? JSON.parse(rawConfig) : null;
				const mode =
					parsed && (parsed.mode === 'light' || parsed.mode === 'dark' || parsed.mode === 'system')
						? parsed.mode
						: 'system';
				const isDark =
					mode === 'dark' ||
					(mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
				document.documentElement.classList.toggle('dark', isDark);
				document.documentElement.classList.toggle('dark-mode', isDark);
				document.documentElement.classList.toggle('light-mode', !isDark);

				const cssText = localStorage.getItem(CSS_KEY) || defaultCssText;
				let styleEl = document.getElementById('theme-css-vars');
				if (!(styleEl instanceof HTMLStyleElement)) {
					styleEl = document.createElement('style');
					styleEl.id = 'theme-css-vars';
					document.head.appendChild(styleEl);
				}
				styleEl.textContent = cssText;
			} catch (e) {}
		})();
	`;
}
