import { browser } from '$app/environment';
import { defaultThemePalette, presets, THEME_MANAGER_VERSION, type ThemePalette } from './palette';
import { STORAGE_KEY_CONFIG, STORAGE_KEY_THEMES, type ThemeConfig } from './bootstrap';

function validatePalette(v: unknown): ThemePalette | null {
	if (!v || typeof v !== 'object') return null;
	const p = v as Record<string, unknown>;
	if (typeof p.id !== 'string' || typeof p.name !== 'string') return null;
	if (!p.vars || typeof p.vars !== 'object') return null;
	const vars = p.vars as Record<string, unknown>;
	for (const mode of ['light', 'dark']) {
		const m = vars[mode] as Record<string, unknown> | undefined;
		if (!m) return null;
		for (const key of ['primary', 'secondary', 'background', 'surface', 'text']) {
			if (typeof m[key] !== 'string') return null;
		}
	}
	return p as unknown as ThemePalette;
}

function loadFromStorage<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function saveToStorage(key: string, value: unknown): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// localStorage full or unavailable
	}
}

const defaultConfig: ThemeConfig = {
	mode: 'system',
	theme: defaultThemePalette.id,
	version: THEME_MANAGER_VERSION
};

class PaletteStore {
	/** All locally stored themes (user-added copies of presets + custom themes) */
	themes = $state<ThemePalette[]>([defaultThemePalette]);

	/** Current theme/mode config */
	config = $state<ThemeConfig>({ ...defaultConfig });

	/** Current active palette (derived) */
	get current(): ThemePalette {
		const found = this.themes.find((t) => t.id === this.config.theme);
		if (found) return found;
		// Fallback to first local theme or default
		return this.themes[0] ?? defaultThemePalette;
	}

	/** Presets not yet in local themes */
	get availablePresets(): ThemePalette[] {
		return presets.filter((p) => !this.themes.some((t) => t.id === p.id));
	}

	init(): void {
		if (!browser) return;

		// Load themes
		const rawThemes = loadFromStorage<unknown[]>(STORAGE_KEY_THEMES, []);
		if (Array.isArray(rawThemes) && rawThemes.length > 0) {
			const valid = rawThemes.map(validatePalette).filter((p): p is ThemePalette => p !== null);
			if (valid.length > 0) {
				this.themes = valid;
			}
		}

		// Load config
		const rawConfig = loadFromStorage<ThemeConfig>(STORAGE_KEY_CONFIG, defaultConfig);
		this.config = { ...defaultConfig, ...rawConfig };

		// Version migration check
		if (this.config.version !== THEME_MANAGER_VERSION) {
			console.log('Theme Manager version mismatch, updating.', {
				local: this.config.version,
				current: THEME_MANAGER_VERSION
			});
			this.config = { ...this.config, version: THEME_MANAGER_VERSION };
			this._persistConfig();
		}
	}

	/** Select an existing local theme by id */
	select(id: string): void {
		const found = this.themes.find((t) => t.id === id);
		if (!found) {
			console.error(`Theme ${id} not found`);
			return;
		}
		this.config = { ...this.config, theme: id };
		this._persistConfig();
	}

	/** Add a preset to local themes and activate it */
	addPreset(preset: ThemePalette): void {
		if (this.themes.some((t) => t.id === preset.id)) return;
		this.themes = [preset, ...this.themes];
		this._persistThemes();
		this.select(preset.id);
	}

	/** Update/modify a theme in the local list */
	modifyTheme(id: string, palette: ThemePalette): void {
		const idx = this.themes.findIndex((t) => t.id === id);
		if (idx === -1) return;
		const updated = [...this.themes];
		updated[idx] = palette;
		this.themes = updated;
		this._persistThemes();
	}

	/** Update current palette fields */
	update(palette: ThemePalette): void {
		this.modifyTheme(palette.id, palette);
	}

	/** Create a new custom theme (clone of current) with generated id */
	newTheme(name: string): void {
		const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
		const cloned: ThemePalette = JSON.parse(JSON.stringify(this.current));
		const newPalette: ThemePalette = { ...cloned, id, name };
		this.themes = [newPalette, ...this.themes];
		this._persistThemes();
		this.select(id);
	}

	/** Delete a local theme (cannot delete if it's the last one) */
	deleteTheme(id: string): void {
		if (this.themes.length <= 1) return;
		this.themes = this.themes.filter((t) => t.id !== id);
		this._persistThemes();
		// If deleted theme was active, switch to first
		if (this.config.theme === id) {
			this.config = { ...this.config, theme: this.themes[0].id };
			this._persistConfig();
		}
	}

	/** Import a theme from JSON string (paste) */
	importTheme(json: string): { success: true } | { success: false; error: string } {
		try {
			const parsed = JSON.parse(json);
			const palette = validatePalette(parsed);
			if (!palette) return { success: false, error: 'Invalid palette format' };
			if (this.themes.some((t) => t.id === palette.id)) {
				return { success: false, error: 'Theme already exists' };
			}
			this.themes = [palette, ...this.themes];
			this._persistThemes();
			this.select(palette.id);
			return { success: true };
		} catch {
			return { success: false, error: 'Invalid JSON' };
		}
	}

	/** Export current theme as JSON string */
	exportCurrentJson(): string {
		return JSON.stringify(this.current, null, 2);
	}

	setMode(mode: 'light' | 'dark' | 'system'): void {
		this.config = { ...this.config, mode };
		this._persistConfig();
	}

	resetToDefault(): void {
		// If default_aster is not in local themes, add it back
		if (!this.themes.some((t) => t.id === defaultThemePalette.id)) {
			this.themes = [defaultThemePalette, ...this.themes];
			this._persistThemes();
		}
		this.config = { ...this.config, theme: defaultThemePalette.id };
		this._persistConfig();
	}

	private _persistThemes(): void {
		saveToStorage(STORAGE_KEY_THEMES, this.themes);
	}

	private _persistConfig(): void {
		saveToStorage(STORAGE_KEY_CONFIG, this.config);
	}
}

export const paletteStore = new PaletteStore();
