import { browser } from '$app/environment';
import { paletteStore } from './paletteStore.svelte';
import { generateThemeFromPalette, cssConverter } from './theme';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

class ThemeManager {
	current = $state<Theme>('system');
	currentPaletteId = $state<string>('default_aster');

	set(theme: Theme) {
		this.current = theme;
	}

	setPalette(id: string) {
		this.currentPaletteId = id;
	}
}

export const themeManager = new ThemeManager();

export const resolveTheme = (theme: Theme): ResolvedTheme => {
	if (!browser || theme !== 'system') {
		return theme === 'dark' ? 'dark' : 'light';
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const initTheme = (manager: ThemeManager): void => {
	if (!browser) return;
	const saved = localStorage.getItem('theme') as Theme | null;
	if (saved === 'light' || saved === 'dark' || saved === 'system') {
		manager.set(saved);
	}
};

let styleEl: HTMLStyleElement | null = null;

function ensureStyleElement(): HTMLStyleElement {
	if (!styleEl) {
		const ssrStyle = document.querySelector('style[data-theme-ssr]');
		if (ssrStyle) ssrStyle.remove();
		styleEl = document.createElement('style');
		styleEl.id = 'theme-css-vars';
		document.head.appendChild(styleEl);
	}
	return styleEl;
}

function injectThemeCss() {
	const uiTheme = generateThemeFromPalette(paletteStore.current);
	const fullCss = cssConverter(uiTheme);
	const el = ensureStyleElement();
	el.textContent = fullCss;
}

export const startThemeSync = (manager: ThemeManager): void => {
	$effect(() => {
		if (!browser) return;

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = () => {
			const resolved = resolveTheme(manager.current);
			document.documentElement.classList.toggle('dark', resolved === 'dark');
			document.documentElement.classList.toggle('dark-mode', resolved === 'dark');
			document.documentElement.classList.toggle('light-mode', resolved === 'light');
			localStorage.setItem('theme', manager.current);
			injectThemeCss();
		};

		apply();

		if (manager.current !== 'system') return;

		const onChange = () => apply();
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});
};
