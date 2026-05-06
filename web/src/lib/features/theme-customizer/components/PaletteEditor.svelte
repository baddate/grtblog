<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import { SELECTED_FONTS, presets, type ThemePalette } from '$lib/shared/theme/palette';
	import tinycolor from 'tinycolor2';
	import { CardTypes } from '$lib/shared/theme/theme';

	const colorKeys = ['primary', 'secondary', 'background', 'surface', 'text'] as const;

	let editingName = $state(false);
	let nameInput = $state('');

	// Section collapse state
	let sections = $state({
		colors: true,
		typography: true,
		layout: true,
		export: false
	});

	let mode = $state<'light' | 'dark'>('light');
	let importOpen = $state(false);
	let importText = $state('');
	let importError = $state('');
	let copyFeedback = $state('');

	const currentColors = $derived(paletteStore.current.vars[mode]);
	const isPreset = $derived(presets.some((p) => p.id === paletteStore.current.id));

	function toggleSection(s: keyof typeof sections) {
		sections = { ...sections, [s]: !sections[s] };
	}

	function handleColorChange(key: (typeof colorKeys)[number], raw: string) {
		const value = raw.trim();
		if (!tinycolor(value).isValid()) return;
		paletteStore.update({
			...paletteStore.current,
			vars: {
				...paletteStore.current.vars,
				[mode]: { ...paletteStore.current.vars[mode], [key]: value }
			}
		});
	}

	function handleNameSubmit() {
		if (!nameInput.trim()) {
			editingName = false;
			return;
		}
		paletteStore.update({ ...paletteStore.current, name: nameInput.trim() });
		editingName = false;
	}

	function handleFontChange(e: Event) {
		const family = (e.target as HTMLSelectElement).value;
		paletteStore.update({
			...paletteStore.current,
			base: { ...paletteStore.current.base, font: { family } }
		});
	}

	function handleRadiusInput(e: Event) {
		const radius = (e.target as HTMLInputElement).value;
		paletteStore.update({
			...paletteStore.current,
			base: { ...paletteStore.current.base, border: { radius } }
		});
	}

	function handleCardChange(e: Event) {
		const card = (e.target as HTMLSelectElement).value as ThemePalette['card'];
		paletteStore.update({ ...paletteStore.current, card });
	}

	function handleNewTheme() {
		const adjectives = [
			'Vibrant',
			'Calm',
			'Bold',
			'Soft',
			'Crisp',
			'Warm',
			'Cool',
			'Deep',
			'Bright',
			'Muted'
		];
		const nouns = [
			'Wave',
			'Haze',
			'Glow',
			'Mist',
			'Drift',
			'Flow',
			'Bloom',
			'Dusk',
			'Dawn',
			'Pulse'
		];
		const name =
			adjectives[Math.floor(Math.random() * adjectives.length)] +
			' ' +
			nouns[Math.floor(Math.random() * nouns.length)];
		paletteStore.newTheme(name);
	}

	function handleDelete() {
		if (paletteStore.themes.length <= 1) return;
		paletteStore.deleteTheme(paletteStore.current.id);
	}

	function handleImport() {
		importError = '';
		const result = paletteStore.importTheme(importText.trim());
		if (result.success) {
			importOpen = false;
			importText = '';
		} else {
			importError = result.error;
		}
	}

	async function handleCopyJson() {
		try {
			await navigator.clipboard.writeText(paletteStore.exportCurrentJson());
			copyFeedback = 'Copied!';
			setTimeout(() => (copyFeedback = ''), 1500);
		} catch {
			copyFeedback = 'Failed';
			setTimeout(() => (copyFeedback = ''), 1500);
		}
	}

	function startEditName() {
		nameInput = paletteStore.current.name;
		editingName = true;
	}
</script>

<div class="palette-editor">
	<!-- Theme name row -->
	<div class="theme-name-row">
		{#if editingName}
			<input
				class="name-input"
				bind:value={nameInput}
				onblur={handleNameSubmit}
				onkeydown={(e) => e.key === 'Enter' && handleNameSubmit()}
			/>
		{:else}
			<button
				class="theme-name-btn"
				onclick={startEditName}
				disabled={isPreset}
				title={isPreset ? 'Presets cannot be renamed' : 'Click to rename'}
			>
				{paletteStore.current.name}
				{#if !isPreset}<span class="edit-icon">✎</span>{/if}
			</button>
		{/if}
		<div class="theme-actions">
			<button class="action-btn" onclick={handleNewTheme} title="Clone as new theme">+ New</button>
			{#if !isPreset}
				<button
					class="action-btn danger"
					onclick={handleDelete}
					title="Delete theme"
					disabled={paletteStore.themes.length <= 1}
				>
					Delete
				</button>
			{/if}
		</div>
	</div>

	<!-- Colors section -->
	<div class="section">
		<button class="section-header" onclick={() => toggleSection('colors')}>
			<span>Colors</span>
			<span class="chevron" class:open={sections.colors}>▸</span>
		</button>
		{#if sections.colors}
			<div class="section-content">
				<div class="mode-tabs">
					<button
						class="mode-tab"
						class:mode-active={mode === 'light'}
						onclick={() => (mode = 'light')}>Light</button
					>
					<button
						class="mode-tab"
						class:mode-active={mode === 'dark'}
						onclick={() => (mode = 'dark')}>Dark</button
					>
				</div>
				<div class="color-fields">
					{#each colorKeys as key (key)}
						<div class="color-row">
							<label class="color-label" for="color-{mode}-{key}">{key}</label>
							<input
								type="color"
								id="color-{mode}-{key}"
								value={currentColors[key]}
								oninput={(e) => handleColorChange(key, (e.target as HTMLInputElement).value)}
							/>
							<input
								type="text"
								class="color-hex"
								value={currentColors[key]}
								oninput={(e) => handleColorChange(key, (e.target as HTMLInputElement).value)}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Typography section -->
	<div class="section">
		<button class="section-header" onclick={() => toggleSection('typography')}>
			<span>Typography</span>
			<span class="chevron" class:open={sections.typography}>▸</span>
		</button>
		{#if sections.typography}
			<div class="section-content">
				<label class="field-label">
					Font Family
					<select
						class="field-select"
						value={paletteStore.current.base.font.family}
						onchange={handleFontChange}
					>
						{#each SELECTED_FONTS as font (font)}
							<option value={font} style="font-family: {font}">{font.replace(/'/g, '')}</option>
						{/each}
					</select>
				</label>
			</div>
		{/if}
	</div>

	<!-- Layout section -->
	<div class="section">
		<button class="section-header" onclick={() => toggleSection('layout')}>
			<span>Layout</span>
			<span class="chevron" class:open={sections.layout}>▸</span>
		</button>
		{#if sections.layout}
			<div class="section-content">
				<label class="field-label">
					Border Radius
					<input
						type="text"
						class="field-input"
						value={paletteStore.current.base.border.radius}
						oninput={handleRadiusInput}
					/>
				</label>
				<label class="field-label">
					Card Style
					<select
						class="field-select"
						value={paletteStore.current.card}
						onchange={handleCardChange}
					>
						{#each CardTypes as type (type)}
							<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
						{/each}
					</select>
				</label>
			</div>
		{/if}
	</div>

	<!-- Export section -->
	<div class="section">
		<button class="section-header" onclick={() => toggleSection('export')}>
			<span>Export / Import</span>
			<span class="chevron" class:open={sections.export}>▸</span>
		</button>
		{#if sections.export}
			<div class="section-content">
				<div class="export-row">
					<button class="export-btn" onclick={handleCopyJson}>
						{copyFeedback || 'Copy Palette JSON'}
					</button>
					<button class="export-btn" onclick={() => (importOpen = !importOpen)}>
						{importOpen ? 'Cancel Import' : 'Import Palette'}
					</button>
				</div>
				{#if importOpen}
					<div class="import-area">
						<textarea
							class="import-textarea"
							placeholder="Paste palette JSON here..."
							bind:value={importText}
							rows="5"
						></textarea>
						{#if importError}
							<div class="import-error">{importError}</div>
						{/if}
						<button class="export-btn primary" onclick={handleImport}>Import</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.palette-editor {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.theme-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.theme-name-btn {
		flex: 1;
		background: var(--surface);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		color: var(--text);
		padding: 0.4rem 0.6rem;
		font-size: var(--font-size-base);
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.theme-name-btn:disabled {
		cursor: default;
		opacity: 0.8;
	}

	.edit-icon {
		color: var(--fadeText);
		font-size: 0.9em;
	}

	.name-input {
		flex: 1;
		background: var(--surface);
		border: 1px solid var(--primary-color);
		border-radius: var(--border-radius);
		color: var(--text);
		padding: 0.4rem 0.6rem;
		font-size: var(--font-size-base);
		font-weight: 500;
		outline: none;
	}

	.theme-actions {
		display: flex;
		gap: 0.25rem;
	}

	.action-btn {
		padding: 0.35rem 0.6rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		font-size: var(--font-size-sm);
		cursor: pointer;
		white-space: nowrap;
	}

	.action-btn:hover {
		background: var(--surface2);
	}

	.action-btn.danger {
		color: #e05252;
		border-color: #e0525240;
	}

	.action-btn.danger:hover {
		background: #e0525220;
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Collapsible sections */
	.section {
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		overflow: hidden;
	}

	.section-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--surface);
		border: none;
		color: var(--heading);
		font-size: var(--font-size-base);
		font-weight: 500;
		cursor: pointer;
		text-align: left;
	}

	.section-header:hover {
		background: var(--surface2);
	}

	.chevron {
		font-size: 0.75em;
		transition: transform 0.2s ease;
		color: var(--fadeText);
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.section-content {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-top: 1px solid var(--border-color);
	}

	/* Color editor */
	.mode-tabs {
		display: flex;
		gap: 0.25rem;
		background: var(--background);
		border-radius: 0.4rem;
		padding: 0.2rem;
	}

	.mode-tab {
		flex: 1;
		padding: 0.3rem 0.5rem;
		border: none;
		border-radius: 0.3rem;
		background: transparent;
		color: var(--fadeText);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}

	.mode-tab:hover {
		background: var(--surface2);
	}

	.mode-active {
		background: var(--primary-color) !important;
		color: var(--primary-contrast);
	}

	.color-fields {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.color-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-label {
		width: 5.5rem;
		font-size: var(--font-size-sm);
		color: var(--text);
		text-transform: capitalize;
		flex-shrink: 0;
	}

	.color-row input[type='color'] {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid var(--border-color);
		border-radius: 0.3rem;
		cursor: pointer;
		background: none;
		flex-shrink: 0;
	}

	.color-hex {
		flex: 1;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		font-size: var(--font-size-sm);
		font-family: monospace;
	}

	.color-hex:focus {
		outline: 2px solid var(--primary-color);
		outline-offset: -1px;
	}

	/* Fields */
	.field-label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: var(--font-size-sm);
		color: var(--fadeText);
	}

	.field-select,
	.field-input {
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		font-size: var(--font-size-sm);
		font-family: inherit;
		cursor: pointer;
	}

	.field-input {
		font-family: monospace;
		cursor: text;
	}

	.field-select:focus,
	.field-input:focus {
		outline: 2px solid var(--primary-color);
		outline-offset: -1px;
	}

	/* Export */
	.export-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.export-btn {
		flex: 1;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		font-size: var(--font-size-sm);
		cursor: pointer;
		white-space: nowrap;
	}

	.export-btn:hover {
		background: var(--surface2);
	}

	.export-btn.primary {
		background: var(--primary-color);
		color: var(--primary-contrast);
		border-color: var(--primary-color);
	}

	.import-area {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.import-textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		font-size: var(--font-size-sm);
		font-family: monospace;
		resize: vertical;
		box-sizing: border-box;
	}

	.import-error {
		padding: 0.4rem 0.6rem;
		background: #e0525220;
		border: 1px solid #e0525240;
		border-radius: var(--border-radius);
		color: #e05252;
		font-size: var(--font-size-sm);
	}
</style>
