<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/client';
	import { siteHealthStore } from '../store.svelte';

	let dismissed = $state(false);

	const bannerConfig = $derived.by(() => {
		switch (siteHealthStore.mode) {
			case 'maintenance':
				return {
					text: t('web.health.maintenance'),
					bg: 'bg-warning-50 dark:bg-warning-950/40 border-warning-200 dark:border-warning-800/60',
					textColor: 'text-warning-800 dark:text-warning-200',
					icon: 'i-ph-wrench-bold',
					iconColor: 'text-warning-500'
				};
			case 'degraded':
				return {
					text: t('web.health.degraded'),
					bg: 'bg-warning-50 dark:bg-warning-950/40 border-warning-200 dark:border-warning-800/60',
					textColor: 'text-warning-800 dark:text-warning-200',
					icon: 'i-ph-warning-bold',
					iconColor: 'text-warning-500'
				};
			case 'critical':
			case 'outage':
				return {
					text: t('web.health.error'),
					bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60',
					textColor: 'text-red-800 dark:text-red-200',
					icon: 'i-ph-warning-bold',
					iconColor: 'text-red-500'
				};
			default:
				return null;
		}
	});

	function dismiss() {
		dismissed = true;
		if (browser) {
			try {
				sessionStorage.setItem('health-banner-dismissed', '1');
			} catch {
				// ignore
			}
		}
	}

	// Restore dismissed state from sessionStorage.
	if (browser) {
		try {
			dismissed = sessionStorage.getItem('health-banner-dismissed') === '1';
		} catch {
			// ignore
		}
	}
</script>

{#if siteHealthStore.showBanner && bannerConfig && !dismissed}
	<div
		class="relative border-b px-4 py-2.5 text-center text-sm transition-colors {bannerConfig.bg}"
	>
		<span class="inline-flex items-center gap-2 {bannerConfig.textColor}">
			<span class="iconify {bannerConfig.icon} {bannerConfig.iconColor} text-base"></span>
			{bannerConfig.text}
		</span>
		<button
			class="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 opacity-50 transition-opacity hover:opacity-100 {bannerConfig.textColor}"
			onclick={dismiss}
			aria-label={t('web.health.dismiss')}
		>
			<span class="iconify i-ph-x-bold text-sm"></span>
		</button>
	</div>
{/if}
