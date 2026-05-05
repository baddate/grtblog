import { browser } from '$app/environment';
import { defaultThemePalette, presets, type ThemePalette } from './palette';

const STORAGE_KEY_CURRENT = 'palette-current';
const STORAGE_KEY_CUSTOMS = 'palette-customs';
const MAX_CUSTOMS = 5;

function validatePalette(v: unknown): ThemePalette | null {
	if (!v || typeof v !== 'object') return null;
	const p = v as Record<string, unknown>;
	if (typeof p.id !== 'string') return null;
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

function loadFromStorage(key: string): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function saveToStorage(key: string, value: string): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, value);
	} catch {
		// localStorage full or unavailable — silently skip
	}
}

class PaletteStore {
	current = $state<ThemePalette>(defaultThemePalette);
	customs = $state<ThemePalette[]>([]);

	init(): void {
		if (!browser) return;
		const raw = loadFromStorage(STORAGE_KEY_CURRENT);
		if (raw) {
			const parsed = this._safeParse(raw);
			if (parsed) {
				this.current = parsed;
			}
		}
		const rawCustoms = loadFromStorage(STORAGE_KEY_CUSTOMS);
		if (rawCustoms) {
			const arr = this._safeParseArray(rawCustoms);
			if (arr.length > 0) {
				this.customs = arr;
			}
		}
	}

	select(id: string): void {
		const found =
			presets.find((p) => p.id === id) ?? this.customs.find((p) => p.id === id);
		if (found) {
			this.current = { ...found };
			this._persist();
		}
	}

	update(palette: ThemePalette): void {
		this.current = { ...palette };
		this._persist();
	}

	saveCustom(palette: ThemePalette): void {
		if (this.customs.length >= MAX_CUSTOMS) return;
		const withId = { ...palette, id: `custom_${Date.now()}` };
		this.customs = [...this.customs, withId];
		this._persistCustoms();
	}

	deleteCustom(id: string): void {
		this.customs = this.customs.filter((p) => p.id !== id);
		this._persistCustoms();
	}

	resetToDefault(): void {
		this.current = { ...defaultThemePalette };
		this._persist();
	}

	private _persist(): void {
		saveToStorage(STORAGE_KEY_CURRENT, JSON.stringify(this.current));
	}

	private _persistCustoms(): void {
		saveToStorage(STORAGE_KEY_CUSTOMS, JSON.stringify(this.customs));
	}

	private _safeParse(raw: string): ThemePalette | null {
		try {
			return validatePalette(JSON.parse(raw));
		} catch {
			return null;
		}
	}

	private _safeParseArray(raw: string): ThemePalette[] {
		try {
			const arr = JSON.parse(raw);
			if (!Array.isArray(arr)) return [];
			return arr.map(validatePalette).filter((p): p is ThemePalette => p !== null);
		} catch {
			return [];
		}
	}
}

export const paletteStore = new PaletteStore();
