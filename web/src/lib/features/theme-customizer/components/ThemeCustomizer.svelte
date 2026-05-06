<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';

	let open = $state(false);
	let hiding = $state(false);
	let editorLoaded = $state(false);

	let PaletteEditor = $state<Component | null>(null);
	let ThemeList = $state<Component | null>(null);
	let ModeSwitcher = $state<Component | null>(null);

	async function loadEditor() {
		if (editorLoaded) return;
		const [paletteMod, listMod, modeMod] = await Promise.all([
			import('./PaletteEditor.svelte'),
			import('./ThemeList.svelte'),
			import('./ModeSwitcher.svelte')
		]);
		PaletteEditor = paletteMod.default;
		ThemeList = listMod.default;
		ModeSwitcher = modeMod.default;
		editorLoaded = true;
	}

	function show() {
		open = true;
		hiding = false;
		if (!editorLoaded) loadEditor();
	}

	function hide() {
		hiding = true;
		setTimeout(() => {
			open = false;
			hiding = false;
		}, 250);
	}

	function toggle() {
		if (open) hide();
		else show();
	}

	onMount(() => {
		paletteStore.init();
	});
</script>

<button
	class="theme-customizer-fab"
	aria-label={open ? 'Close Theme Manager' : 'Customize Theme'}
	onclick={toggle}
>
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
		<path d="M2 12h20" />
	</svg>
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="theme-customizer-backdrop" onclick={hide}></div>

	<div class="theme-customizer-popup" class:hiding>
		<div class="popup-content">
			<header class="popup-header">
				<h2>Customize</h2>
				<button class="popup-close" onclick={hide} aria-label="Close">&#x2715;</button>
			</header>

			{#if editorLoaded && ThemeList}
				<ThemeList />
			{/if}

			{#if editorLoaded && PaletteEditor}
				<PaletteEditor />
			{/if}
		</div>

		<div class="popup-footer">
			{#if editorLoaded && ModeSwitcher}
				<ModeSwitcher />
			{/if}
		</div>
	</div>
{/if}

<style>
	.theme-customizer-fab {
		position: fixed;
		bottom: 5rem;
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
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
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

	.theme-customizer-popup {
		position: fixed;
		bottom: 0.5rem;
		right: 0.5rem;
		z-index: 1001;
		width: 400px;
		max-width: calc(100vw - 1rem);
		height: calc(100vh - 1rem);
		max-height: 700px;
		overflow: hidden;
		background: var(--background);
		border: 2px solid var(--primary-color);
		border-radius: calc(var(--border-radius) * 4);
		box-shadow: var(--shadow-card);
		display: flex;
		flex-direction: column;
		transform-origin: bottom right;
		animation: zoomFadeIn 0.2s ease-in forwards;
	}

	.theme-customizer-popup.hiding {
		animation: zoomFadeOut 0.2s ease-out forwards;
	}

	@keyframes zoomFadeIn {
		from {
			transform: scale(0.9);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes zoomFadeOut {
		from {
			transform: scale(1);
			opacity: 1;
		}
		to {
			transform: scale(0.9);
			opacity: 0;
		}
	}

	.popup-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem 1rem;
		padding-bottom: calc(var(--layout-nav-height, 3rem) + 2rem);
	}

	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.popup-header h2 {
		font-size: var(--font-size-md);
		margin: 0;
	}

	.popup-close {
		background: none;
		border: none;
		color: var(--fadeText);
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0.25rem;
	}

	.popup-close:hover {
		color: var(--text);
	}

	.popup-footer {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--border-color);
		background: var(--background);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
	}
</style>
