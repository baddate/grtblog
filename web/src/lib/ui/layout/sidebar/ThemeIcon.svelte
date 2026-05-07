<script lang="ts">
	import { resolveTheme, themeManager, type Theme } from '$lib/shared/theme/theme.svelte';
	import { Monitor, Moon, Sun } from 'lucide-svelte';
	import { t } from '$lib/i18n/client';

	const theme = themeManager;
	const resolved = $derived.by(() => resolveTheme(theme.current));

	type ViewTransitionLike = { ready: Promise<void> };
	type DocumentWithViewTransition = Document & {
		startViewTransition?: (callback: () => void) => ViewTransitionLike;
	};

	const isMobile = () => window.innerWidth < 768;

	const cycleOrder: Theme[] = ['light', 'dark', 'system'];
	const nextTheme = (): Theme => {
		const idx = cycleOrder.indexOf(theme.current);
		return cycleOrder[(idx + 1) % cycleOrder.length];
	};

	const getLabel = (theme: Theme): string => {
		switch (theme) {
			case 'light': return t('web.theme.light');
			case 'dark': return t('web.theme.dark');
			case 'system': return t('web.theme.system');
			default: return theme;
		}
	};

	const toggleTheme = async (event: MouseEvent) => {
		const next = nextTheme();
		const willChange = resolveTheme(next) !== resolved;
		const doc = document as DocumentWithViewTransition;
		const root = document.documentElement;

		// 实际深浅色没变化或不支持 View Transitions：直接切换
		if (!willChange || !doc.startViewTransition || isMobile()) {
			theme.set(next);
			return;
		}

		root.dataset.themeTransitioning = 'true';
		try {
			const x = event.clientX;
			const y = event.clientY;
			const endRadius = Math.hypot(
				Math.max(x, window.innerWidth - x),
				Math.max(y, window.innerHeight - y)
			);

			const transition = doc.startViewTransition.call(doc, () => {
				theme.set(next);
			});

			await transition.ready;

			const reveal = document.documentElement.animate(
				{
					clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
				},
				{
					duration: 350,
					easing: 'ease-out',
					pseudoElement: '::view-transition-new(root)'
				}
			);
			await reveal.finished;
		} finally {
			delete root.dataset.themeTransitioning;
		}
	};
</script>

<button
	type="button"
	data-theme={theme.current}
	aria-label={getLabel(theme.current)}
	title={getLabel(theme.current)}
	onclick={toggleTheme}
	class="h-10 w-10 rounded-default text-ink-400 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-100 flex items-center justify-center"
>
	{#if theme.current === 'dark'}
		<Moon class="w-5 h-5 relative z-10" />
	{:else if theme.current === 'system'}
		<Monitor class="w-5 h-5 relative z-10" />
	{:else}
		<Sun class="w-5 h-5 relative z-10" />
	{/if}
</button>
