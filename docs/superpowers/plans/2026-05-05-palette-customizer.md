# Palette Customizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a user-facing theme customizer with preset palettes, 5-color picker (light + dark), font/card-style selection, real-time CSS variable injection, and localStorage persistence.

**Architecture:** Three-layer modular design: `paletteStore.svelte.ts` (state + persistence), extended `theme.svelte.ts` (CSS injection driven by store), and lazily-loaded `ThemeCustomizer.svelte` (floating button + editor panel).

**Tech Stack:** SvelteKit 2.57, Svelte 5 runes ($state/$effect), tinycolor2, localStorage, dynamic import() for lazy loading.

---

### Task 1: Extend `palette.ts` with presets

**Files:**
- Modify: `web/src/lib/shared/theme/palette.ts`

- [ ] **Step 1: Add preset palettes**

Add a `presets` export array below `defaultPalettes` (after line 53 in the current file):

```typescript
export const presets: ThemePalette[] = [
	defaultThemePalette,
	{
		name: 'Coral',
		id: 'preset_coral',
		base: { border: { radius: '0.2rem' }, font: { family: 'Jost' } },
		card: 'gradient',
		vars: {
			light: {
				primary: '#e76f51',
				secondary: '#f4a261',
				background: '#fef9f2',
				surface: '#f4a26120',
				text: '#2d2a26'
			},
			dark: {
				primary: '#f4a261',
				secondary: '#e76f51',
				background: '#1a1512',
				surface: '#2d221a',
				text: '#e8d5c4'
			}
		}
	},
	{
		name: 'Moss',
		id: 'preset_moss',
		base: { border: { radius: '0.2rem' }, font: { family: 'Jost' } },
		card: 'solid',
		vars: {
			light: {
				primary: '#2d6a4f',
				secondary: '#40916c',
				background: '#f0f7f4',
				surface: '#d8f3dc50',
				text: '#1b3a2d'
			},
			dark: {
				primary: '#52b788',
				secondary: '#40916c',
				background: '#0d1f17',
				surface: '#1a3a2a',
				text: '#b7e4c7'
			}
		}
	},
	{
		name: 'Slate',
		id: 'preset_slate',
		base: { border: { radius: '0.2rem' }, font: { family: 'Jost' } },
		card: 'border',
		vars: {
			light: {
				primary: '#3a4151',
				secondary: '#5c6378',
				background: '#f8f9fa',
				surface: '#e9ecef50',
				text: '#212529'
			},
			dark: {
				primary: '#8d99ae',
				secondary: '#6c7576',
				background: '#111318',
				surface: '#1e2128',
				text: '#ced4da'
			}
		}
	}
];
```

- [ ] **Step 2: Build to verify no type errors**

```bash
cd web && pnpm check
```

Expected: No type errors related to `palette.ts`.

---

### Task 2: Create `paletteStore.svelte.ts`

**Files:**
- Create: `web/src/lib/shared/theme/paletteStore.svelte.ts`

- [ ] **Step 1: Create the store**

```typescript
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
	return p as ThemePalette;
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
```

- [ ] **Step 2: Build to verify**

```bash
cd web && pnpm check
```

Expected: No type errors.

---

### Task 3: Modify `theme.svelte.ts` to read from `paletteStore`

**Files:**
- Modify: `web/src/lib/shared/theme/theme.svelte.ts`

- [ ] **Step 1: Replace import and update `injectThemeCss`**

Remove the `defaultThemePalette` import:
```typescript
// Before (line 2):
import { defaultThemePalette } from './palette';
// After: remove this line
```

Add the `paletteStore` import:
```typescript
import { paletteStore } from './paletteStore.svelte';
```

- [ ] **Step 2: Update `injectThemeCss` function**

Replace lines 51-56:
```typescript
function injectThemeCss() {
	const uiTheme = generateThemeFromPalette(paletteStore.current);
	const fullCss = cssConverter(uiTheme);
	const el = ensureStyleElement();
	el.textContent = fullCss;
}
```

- [ ] **Step 3: Build to verify**

```bash
cd web && pnpm check
```

Expected: No type errors.

---

### Task 4: Create `ThemeCustomizer.svelte`

**Files:**
- Create: `web/src/lib/features/theme-customizer/components/ThemeCustomizer.svelte`

- [ ] **Step 1: Create the floating button + panel container**

```svelte
<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import { onMount } from 'svelte';

	let open = $state(false);
	let editorLoaded = $state(false);

	let PaletteEditor: any = $state(null);
	let PresetSelector: any = $state(null);
	let CardStyleSelector: any = $state(null);

	async function loadEditor() {
		if (editorLoaded) return;
		const [paletteMod, presetMod, cardMod] = await Promise.all([
			import('./PaletteEditor.svelte'),
			import('./PresetSelector.svelte'),
			import('./CardStyleSelector.svelte')
		]);
		PaletteEditor = paletteMod.default;
		PresetSelector = presetMod.default;
		CardStyleSelector = cardMod.default;
		editorLoaded = true;
	}

	function toggle() {
		open = !open;
		if (open && !editorLoaded) {
			loadEditor();
		}
	}

	function handleReset() {
		paletteStore.resetToDefault();
	}

	function handleSaveCustom() {
		paletteStore.saveCustom(paletteStore.current);
	}

	onMount(() => {
		paletteStore.init();
	});
</script>

<button
	class="theme-customizer-fab"
	aria-label="Customize theme"
	onclick={toggle}
>
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="12" cy="12" r="10"/>
		<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/>
		<path d="M2 12h20"/>
	</svg>
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="theme-customizer-backdrop" onclick={toggle}></div>
	<div class="theme-customizer-panel">
		<header class="theme-customizer-header">
			<h2>Theme Customizer</h2>
			<button class="theme-customizer-close" onclick={toggle} aria-label="Close">&#x2715;</button>
		</header>

		{#if editorLoaded && PresetSelector}
			<PresetSelector />
		{/if}

		<div class="theme-customizer-body">
			{#if editorLoaded && PaletteEditor}
				<PaletteEditor />
			{/if}

			{#if editorLoaded && CardStyleSelector}
				<CardStyleSelector />
			{/if}
		</div>

		<footer class="theme-customizer-footer">
			<button onclick={handleSaveCustom} disabled={paletteStore.customs.length >= 5}>
				Save as Custom
			</button>
			<button onclick={handleReset}>Reset to Default</button>
		</footer>
	</div>
{/if}

<style>
	.theme-customizer-fab {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 50;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		border: 1px solid var(--border-color);
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-small);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.theme-customizer-fab:hover {
		transform: scale(1.1);
		box-shadow: var(--shadow-medium);
	}

	.theme-customizer-backdrop {
		position: fixed;
		inset: 0;
		z-index: 51;
		background: rgba(0, 0, 0, 0.3);
	}

	.theme-customizer-panel {
		position: fixed;
		bottom: 0;
		right: 0;
		z-index: 52;
		width: 100%;
		max-width: 400px;
		max-height: 85dvh;
		overflow-y: auto;
		background: var(--background);
		border: 1px solid var(--border-color);
		border-radius: 1rem 1rem 0 0;
		padding: 1.5rem;
		box-shadow: var(--shadow-card);
		animation: slideUp 0.25s ease-out;
	}

	@keyframes slideUp {
		from { transform: translateY(20%); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	.theme-customizer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.theme-customizer-header h2 {
		font-size: var(--font-size-md);
		margin: 0;
	}

	.theme-customizer-close {
		background: none;
		border: none;
		color: var(--fadeText);
		cursor: pointer;
		font-size: 1.25rem;
	}

	.theme-customizer-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.theme-customizer-footer {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.theme-customizer-footer button {
		flex: 1;
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}

	.theme-customizer-footer button:hover {
		background: var(--surface2);
	}

	.theme-customizer-footer button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (min-width: 768px) {
		.theme-customizer-panel {
			border-radius: 1rem;
			bottom: 5rem;
			right: 1.5rem;
			max-height: 70dvh;
		}
	}
</style>
```

- [ ] **Step 2: Build to verify**

```bash
cd web && pnpm check
```

Expected: No type errors. Svelte a11y warnings for the backdrop div are suppressed.

---

### Task 5: Create `PresetSelector.svelte`

**Files:**
- Create: `web/src/lib/features/theme-customizer/components/PresetSelector.svelte`

- [ ] **Step 1: Create the component**

```svelte
<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import { presets } from '$lib/shared/theme/palette';
	import type { ThemePalette } from '$lib/shared/theme/palette';

	const allPalettes = $derived([...presets, ...paletteStore.customs]);

	function isSelected(p: ThemePalette): boolean {
		return p.id === paletteStore.current.id;
	}
</script>

<div class="preset-selector">
	<h3 class="preset-label">Presets</h3>
	<div class="preset-grid">
		{#each allPalettes as palette (palette.id)}
			<button
				class="preset-swatch"
				class:preset-active={isSelected(palette)}
				onclick={() => paletteStore.select(palette.id)}
				aria-label={palette.name}
				title={palette.name}
			>
				<span class="swatch" style="background: {palette.vars.light.primary}"></span>
				<span class="preset-name">{palette.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.preset-label {
		font-size: var(--font-size-sm);
		margin: 0 0 0.5rem 0;
		color: var(--fadeText);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preset-grid {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.preset-swatch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.5rem;
	}

	.preset-swatch:hover {
		background: var(--surface);
	}

	.preset-active {
		background: var(--surface);
		outline: 2px solid var(--primary-color);
		outline-offset: 2px;
	}

	.swatch {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: 1px solid var(--border-color);
	}

	.preset-name {
		font-size: var(--font-size-sm);
		color: var(--text);
	}
</style>
```

- [ ] **Step 2: Build to verify**

```bash
cd web && pnpm check
```

Expected: No type errors.

---

### Task 6: Create `CardStyleSelector.svelte`

**Files:**
- Create: `web/src/lib/features/theme-customizer/components/CardStyleSelector.svelte`

- [ ] **Step 1: Create the component**

```svelte
<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import type { ThemePalette } from '$lib/shared/theme/palette';

	const cardStyles: Array<{ value: ThemePalette['card']; label: string }> = [
		{ value: 'gradient', label: 'Gradient' },
		{ value: 'solid', label: 'Solid' },
		{ value: 'solid-border', label: 'Solid Border' },
		{ value: 'border', label: 'Border' },
		{ value: 'transparent', label: 'Transparent' }
	];

	function handleCardChange(value: ThemePalette['card']) {
		paletteStore.update({ ...paletteStore.current, card: value });
	}
</script>

<div class="card-selector">
	<h3 class="selector-label">Card Style</h3>
	<div class="selector-options">
		{#each cardStyles as style}
			<button
				class="selector-btn"
				class:selector-active={paletteStore.current.card === style.value}
				onclick={() => handleCardChange(style.value)}
			>
				{style.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.selector-label {
		font-size: var(--font-size-sm);
		margin: 0 0 0.5rem 0;
		color: var(--fadeText);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.selector-options {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.selector-btn {
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}

	.selector-btn:hover {
		background: var(--surface2);
	}

	.selector-active {
		background: var(--primary-color);
		color: var(--primary-contrast);
		border-color: var(--primary-color);
	}

	.selector-active:hover {
		background: var(--primary-color);
	}
</style>
```

- [ ] **Step 2: Build to verify**

```bash
cd web && pnpm check
```

Expected: No type errors.

---

### Task 6.5: Add font selector to `ThemeCustomizer.svelte`

**Files:**
- Modify: `web/src/lib/features/theme-customizer/components/ThemeCustomizer.svelte`

- [ ] **Step 1: Add font selection to the panel body**

Insert a font dropdown section inside the `.theme-customizer-body` div, before the CardStyleSelector:

```svelte
<div class="font-selector">
	<h3 class="selector-label">Font</h3>
	<select
		class="font-select"
		value={paletteStore.current.base.font.family}
		onchange={(e) => {
			const updated = {
				...paletteStore.current,
				base: {
					...paletteStore.current.base,
					font: { family: e.currentTarget.value }
				}
			};
			paletteStore.update(updated);
		}}
	>
		<option value="Jost">Jost</option>
		<option value="Inter">Inter</option>
		<option value="System UI">System UI</option>
	</select>
</div>
```

Add the corresponding styles:

```css
.font-selector {
	/* uses .selector-label from CardStyleSelector styles */
}

.font-select {
	padding: 0.35rem 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--border-radius);
	background: var(--surface);
	color: var(--text);
	font-size: var(--font-size-sm);
	cursor: pointer;
	width: 100%;
}
```

- [ ] **Note:** Changing the font family via CSS `--font-family` variable will immediately update typography since Tailwind already references `var(--font-family)`. Only fonts already loaded via `@fontsource` (Jost) will work without additional font loading. Inter and System UI are listed as future options — for v1, only Jost is functional.

- [ ] **Step 2: Build to verify**

```bash
cd web && pnpm check
```

---

### Task 7: Create `PaletteEditor.svelte`

**Files:**
- Create: `web/src/lib/features/theme-customizer/components/PaletteEditor.svelte`

- [ ] **Step 1: Create the component**

```svelte
<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import type { ThemePalette } from '$lib/shared/theme/palette';
	import tinycolor from 'tinycolor2';

	const modes: Array<'light' | 'dark'> = ['light', 'dark'];
	const colorKeys: Array<{ key: keyof ThemePalette['vars']['light']; label: string }> = [
		{ key: 'primary', label: 'Primary' },
		{ key: 'secondary', label: 'Secondary' },
		{ key: 'background', label: 'Background' },
		{ key: 'surface', label: 'Surface' },
		{ key: 'text', label: 'Text' }
	];

	function handleColorChange(
		mode: 'light' | 'dark',
		key: keyof ThemePalette['vars']['light'],
		value: string
	) {
		const color = tinycolor(value);
		if (!color.isValid()) return;
		const hex = color.toHexString();
		const updated = {
			...paletteStore.current,
			vars: {
				...paletteStore.current.vars,
				[mode]: {
					...paletteStore.current.vars[mode],
					[key]: hex
				}
			}
		};
		paletteStore.update(updated);
	}
</script>

<div class="palette-editor">
	{#each modes as mode}
		<div class="mode-section">
			<h3 class="mode-label">{mode === 'light' ? 'Light Mode' : 'Dark Mode'}</h3>
			<div class="color-rows">
				{#each colorKeys as { key, label }}
					{@const color = paletteStore.current.vars[mode][key]}
					<div class="color-row">
						<label class="color-label" for="color-{mode}-{key}">{label}</label>
						<div class="color-input-group">
							<input
								type="color"
								id="color-{mode}-{key}"
								value={color}
								oninput={(e) => handleColorChange(mode, key, e.currentTarget.value)}
								class="color-picker"
							/>
							<input
								type="text"
								value={color}
								oninput={(e) => handleColorChange(mode, key, e.currentTarget.value)}
								class="color-text"
								maxlength={9}
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.mode-section {
		margin-bottom: 1rem;
	}

	.mode-label {
		font-size: var(--font-size-sm);
		margin: 0 0 0.5rem 0;
		color: var(--fadeText);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.color-rows {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.color-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.color-label {
		font-size: var(--font-size-sm);
		color: var(--text);
		min-width: 5rem;
	}

	.color-input-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-picker {
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--border-color);
		border-radius: 0.25rem;
		padding: 0;
		cursor: pointer;
		background: none;
	}

	.color-picker::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.color-picker::-webkit-color-swatch {
		border: none;
		border-radius: 0.2rem;
	}

	.color-text {
		width: 6rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		font-size: var(--font-size-sm);
		font-family: monospace;
	}
</style>
```

- [ ] **Step 2: Build to verify**

```bash
cd web && pnpm check
```

Expected: No type errors.

---

### Task 8: Integrate into `+layout.svelte`

**Files:**
- Modify: `web/src/routes/+layout.svelte`

- [ ] **Step 1: Add import**

After the `import BottomNav` line (line 4), add:
```typescript
import ThemeCustomizer from '$lib/features/theme-customizer/components/ThemeCustomizer.svelte';
```

- [ ] **Step 2: Render `ThemeCustomizer`**

After `<BottomNav />` (line 445), add:
```svelte
<ThemeCustomizer />
```

- [ ] **Step 3: Ensure SSR theme CSS is emitted**

The `{@html themeCssVars}` in `<style data-theme-ssr>` at line 376 must be defined. If not already defined by a server load, add a `<script module>` block at the top of the file:

```svelte
<script module lang="ts">
	import { defaultThemePalette } from '$lib/shared/theme/palette';
	import { generateThemeFromPalette, cssConverter } from '$lib/shared/theme/theme';
	
	const themeCssVars = cssConverter(generateThemeFromPalette(defaultThemePalette));
</script>
```

- [ ] **Step 4: Build and verify**

```bash
cd web && pnpm build
```

Expected: Build succeeds.

---

### Task 9: Smoke test checklist

- [ ] **Step 1: Start dev server**

```bash
cd web && pnpm dev
```

- [ ] **Step 2: Verify manually**

| Check | Expected |
|-------|----------|
| Page loads with default Aster theme | Purple-pink palette applied |
| Floating button visible bottom-right | Round globe icon |
| Click button | Panel slides up |
| Click "Coral" preset | Site switches to warm palette |
| Click "Moss" preset | Site switches to green palette |
| Edit dark mode primary color | Dark mode recolor in real time |
| Change card style to "Solid" | Cards lose gradient |
| "Save as Custom" | Custom appears in presets row |
| "Reset to Default" | Returns to Aster |
| Refresh page | Custom palette persists |
| Corrupted localStorage | Falls back to default gracefully |

- [ ] **Step 3: Test localStorage corruption**

In browser console:
```javascript
localStorage.setItem('palette-current', 'not-json');
```
Refresh. Expected: Site loads with default Aster (no crash).

---

### Task 10: Commit

- [ ] **Step 1: Stage and commit**

```bash
git add \
  web/src/lib/shared/theme/palette.ts \
  web/src/lib/shared/theme/paletteStore.svelte.ts \
  web/src/lib/shared/theme/theme.svelte.ts \
  web/src/lib/features/theme-customizer/ \
  web/src/routes/+layout.svelte

git commit -m "feat(web): add user-facing theme palette customizer

Visitors can pick from preset palettes, edit 5 base colors (light+dark),
switch card style, with real-time CSS variable injection and
localStorage persistence."
```
