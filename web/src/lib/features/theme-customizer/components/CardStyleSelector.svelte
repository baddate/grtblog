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
