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
