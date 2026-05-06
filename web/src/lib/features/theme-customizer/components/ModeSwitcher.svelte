<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
	import { Sun, Moon, Monitor } from 'lucide-svelte';
	const modes = [
		{ value: 'light' as const, label: 'Light', icon: Sun },
		{ value: 'dark' as const, label: 'Dark', icon: Moon },
		{ value: 'system' as const, label: 'Auto', icon: Monitor }
	];
</script>

<div class="mode-switcher">
	{#each modes as mode, i (mode.value)}
		<button
			class="mode-btn"
			class:selected={paletteStore.config.mode === mode.value}
			onclick={() => paletteStore.setMode(mode.value)}
			title={mode.label}
		>
			<span class="mode-icon">
				<svelte:component this={mode.icon} size={18} strokeWidth={2.5} />
			</span>
			<span class="mode-label">{mode.label}</span>
		</button>

		{#if i < modes.length - 1}
			<div class="separator"></div>
		{/if}
	{/each}
</div>

<style>
	.mode-switcher {
		display: flex;
		align-items: center;
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		overflow: hidden;
		width: 100%;
	}

	.mode-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		color: var(--fadeText);
		font-size: var(--font-size-sm);
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.mode-btn:hover {
		color: var(--text);
		background: var(--surface);
	}

	.mode-btn.selected {
		background: var(--surface);
		color: var(--text);
	}

	.mode-icon {
		font-size: 1.1em;
		line-height: 1;
	}

	.separator {
		width: 1px;
		height: 1.5rem;
		background: var(--border-color);
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.mode-label {
			display: none;
		}
		.mode-icon {
			font-size: 1.3em;
		}
	}
</style>
