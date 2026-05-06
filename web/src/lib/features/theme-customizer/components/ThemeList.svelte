<script lang="ts">
	import { paletteStore } from '$lib/shared/theme/paletteStore.svelte';
</script>

<div class="theme-list">
	<!-- Local Themes -->
	<div class="theme-group">
		<h3 class="group-label">Theme</h3>
		<div class="theme-buttons">
			{#each paletteStore.themes as palette (palette.id)}
				<button
					class="theme-btn"
					class:active={paletteStore.current.id === palette.id}
					onclick={() => paletteStore.select(palette.id)}
					title={palette.name}
				>
					<svg
						width="32"
						height="32"
						viewBox="0 0 32 32"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle
							cx="16"
							cy="16"
							r="16"
							fill={palette.vars[paletteStore.config.mode === 'dark' ? 'dark' : 'light'].background}
						/>
						<circle
							cx="16"
							cy="16"
							r="8"
							fill={palette.vars[paletteStore.config.mode === 'dark' ? 'dark' : 'light'].primary}
						/>
					</svg>
					{palette.name}
				</button>
			{/each}
		</div>
	</div>

	<!-- Available Presets (not yet added) -->
	{#if paletteStore.availablePresets.length > 0}
		<div class="theme-group">
			<h3 class="group-label">Available Themes</h3>
			<div class="theme-buttons">
				{#each paletteStore.availablePresets as palette (palette.id)}
					<button
						class="theme-btn available"
						onclick={() => paletteStore.addPreset(palette)}
						title="Add {palette.name}"
					>
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								cx="16"
								cy="16"
								r="16"
								fill={palette.vars[paletteStore.config.mode === 'dark' ? 'dark' : 'light']
									.background}
							/>
							<circle
								cx="16"
								cy="16"
								r="8"
								fill={palette.vars[paletteStore.config.mode === 'dark' ? 'dark' : 'light'].primary}
							/>
						</svg>
						{palette.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.theme-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.theme-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.group-label {
		font-size: var(--font-size-sm);
		color: var(--fadeText);
		margin: 0;
		font-weight: 500;
	}

	.theme-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.theme-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.75rem 0.4rem 0.4rem;
		border: 1px solid transparent;
		border-radius: var(--border-radius);
		background: var(--surface);
		color: var(--text);
		font-size: var(--font-size-sm);
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.theme-btn:hover {
		background: var(--surface2);
	}

	.theme-btn.active {
		border-color: var(--primary-color);
		color: var(--primary-color);
	}

	.theme-btn.available {
		opacity: 0.65;
		border-style: dashed;
		border-color: var(--border-color);
	}

	.theme-btn.available:hover {
		opacity: 1;
		border-style: solid;
	}
</style>
