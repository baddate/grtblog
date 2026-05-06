<script lang="ts">
	import { resolve } from '$app/paths';
	import { SlideIn } from '$lib/ui/animation';
	import { Mail, Rss } from 'lucide-svelte';
	import SubscribeModal from './SubscribeModal.svelte';
	import { t } from '$lib/i18n/client';

	let isModalOpen = $state(false);
</script>

<section class="mt-16 border-t border-ink-100 dark:border-ink-800/50 pt-16">
	<SlideIn direction="up">
		<div class="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
			<div class="flex flex-col gap-1 text-center md:text-left">
				<h2
					class="text-base font-serif font-medium text-ink-900 dark:text-ink-100 flex items-center justify-center md:justify-start gap-2"
				>
					{t('web.ui.subscribe_title')}
				</h2>
				<p class="text-[11px] text-ink-400 font-mono">
					{t('web.ui.subscribe_desc')}
				</p>
			</div>

			<div class="flex items-center gap-3">
				<button
					onclick={() => (isModalOpen = true)}
					class="px-5 py-2.5 text-xs font-medium bg-accent-600 dark:bg-accent-500 text-white rounded-default hover:bg-accent-700 dark:hover:bg-accent-400 transition-all shadow-sm shadow-accent-500/10 flex items-center gap-2 group"
				>
					<Mail size={13} class="group-hover:rotate-12 transition-transform" />
					<span>{t('web.ui.subscribe_by_email')}</span>
				</button>

				<a
					href={resolve('/feed', {})}
					data-sveltekit-preload-data="off"
					class="px-5 py-2.5 text-xs font-medium bg-accent-50/50 dark:bg-accent-500/5 border border-accent-200/60 dark:border-accent-800/60 text-accent-700 dark:text-accent-300 rounded-default hover:border-accent-500/50 hover:text-accent-600 transition-all flex items-center gap-2 group"
				>
					<Rss size={13} class="group-hover:text-warning-500 transition-colors" />
					<span>{t('web.ui.subscribe_by_rss')}</span>
				</a>
			</div>
		</div>
	</SlideIn>
</section>

<SubscribeModal bind:isOpen={isModalOpen} />

<style lang="postcss">
	@reference "$routes/layout.css";
</style>
