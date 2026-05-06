import { browser } from '$app/environment';
import { paletteStore } from './paletteStore.svelte';
import { generateThemeFromPalette, cssConverter } from './theme';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

class ThemeManager {
	get current(): Theme {
		return paletteStore.config.mode as Theme;
	}

	set(theme: Theme) {
		paletteStore.setMode(theme as 'light' | 'dark' | 'system');
	}

	setPalette(id: string) {
		paletteStore.select(id);
	}
}

export const themeManager = new ThemeManager();

export const resolveTheme = (theme: Theme): ResolvedTheme => {
	if (!browser || theme !== 'system') {
		return theme === 'dark' ? 'dark' : 'light';
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const initTheme = (): void => {
	if (!browser) return;
	paletteStore.init();
};

let styleEl: HTMLStyleElement | null = null;

function ensureStyleElement(): HTMLStyleElement {
	if (!styleEl) {
		styleEl = document.createElement('style');
		styleEl.id = 'theme-css-vars';
		document.head.appendChild(styleEl);
		// Remove SSR style *after* the new element is attached,
		// so there is no gap where neither style exists.
		const ssrStyle = document.querySelector('style[data-theme-ssr]');
		if (ssrStyle) ssrStyle.remove();
	}
	return styleEl;
}

function injectThemeCss() {
	const uiTheme = generateThemeFromPalette(paletteStore.current);
	const fullCss = cssConverter(uiTheme);
	const el = ensureStyleElement();
	el.textContent = fullCss;
}

function attachFontLink(family: string) {
	if (!browser || !family) return;
	const firstFont = family.split(',')[0].replace(/"/g, '').trim();
	// Skip system fonts
	if (firstFont.includes('Helvetica') || firstFont.includes('Arial')) return;
	const existing = document.querySelectorAll('link._fontFamily');
	const alreadyLoaded = Array.from(existing).some((link) => {
		const href = (link as HTMLLinkElement).href;
		const enc = href.split('=')[1]?.split(':')[0] ?? '';
		return decodeURIComponent(enc) === firstFont;
	});
	if (alreadyLoaded) return;
	const link = document.createElement('link');
	link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(firstFont)}:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600`;
	link.rel = 'stylesheet';
	link.classList.add('_fontFamily');
	document.head.appendChild(link);
}

export const startThemeSync = (): void => {
	$effect(() => {
		if (!browser) return;

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const apply = () => {
			const mode = paletteStore.config.mode as Theme;
			const resolved = resolveTheme(mode);
			document.documentElement.classList.toggle('dark', resolved === 'dark');
			document.documentElement.classList.toggle('dark-mode', resolved === 'dark');
			document.documentElement.classList.toggle('light-mode', resolved === 'light');
			injectThemeCss();
			attachFontLink(paletteStore.current.base.font.family);
		};

		apply();

		if (paletteStore.config.mode !== 'system') return;

		const onChange = () => apply();
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});
};
