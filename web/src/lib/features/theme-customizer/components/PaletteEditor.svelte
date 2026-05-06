<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import tinycolor from 'tinycolor2';

	const colorKeys = ['primary', 'secondary', 'background', 'surface', 'text'] as const;

	let mode = $state<'light' | 'dark'>('light');

	function handleColorChange(key: (typeof colorKeys)[number], raw: string) {
		const value = raw.trim();
		if (!tinycolor(value).isValid()) return;
		paletteStore.update({
			...paletteStore.current,
			vars: {
				...paletteStore.current.vars,
				[mode]: {
					...paletteStore.current.vars[mode],
					[key]: value
				}
			}
		});
	}

	const currentColors = $derived(paletteStore.current.vars[mode]);
</script>

<div class="palette-editor">
	<h3 class="editor-label">Colors</h3>

	<div class="mode-tabs">
		<button
			class="mode-tab"
			class:mode-active={mode === 'light'}
			onclick={() => (mode = 'light')}
		>
			Light
		</button>
		<button
			class="mode-tab"
			class:mode-active={mode === 'dark'}
			onclick={() => (mode = 'dark')}
		>
			Dark
		</button>
	</div>

	<div class="color-fields">
		{#each colorKeys as key}
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

<style>
	.palette-editor {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.editor-label {
		font-size: var(--font-size-sm);
		margin: 0;
		color: var(--fadeText);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.mode-tabs {
		display: flex;
		gap: 0.25rem;
		background: var(--surface);
		border-radius: 0.5rem;
		padding: 0.2rem;
	}

	.mode-tab {
		flex: 1;
		padding: 0.35rem 0.5rem;
		border: none;
		border-radius: 0.35rem;
		background: transparent;
		color: var(--fadeText);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}

	.mode-tab:hover {
		background: var(--surface2);
	}

	.mode-active {
		background: var(--primary-color);
		color: var(--primary-contrast);
	}

	.mode-active:hover {
		background: var(--primary-color);
	}

	.color-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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
		border-radius: 0.35rem;
		cursor: pointer;
		background: none;
	}

	.color-hex {
		flex: 1;
		padding: 0.35rem 0.5rem;
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
</style>
