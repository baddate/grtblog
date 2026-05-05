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
