<script lang="ts">
	import FriendLinkGrid from '$lib/features/friend-link/components/FriendLinkGrid.svelte';
	import { windowStore } from '$lib/shared/stores/windowStore.svelte';
	import { FadeIn } from '$lib/ui/animation';
	import { Plus } from 'lucide-svelte';

	import { userStore } from '$lib/shared/stores/userStore';
	import { authModalStore } from '$lib/shared/stores/authModalStore';
	import PageHeader from '$lib/ui/common/PageHeader.svelte';
	import SafeMarkdownView from '$lib/shared/markdown/SafeMarkdownView.svelte';
	import { t } from '$lib/i18n/client';

	let { data } = $props();

	function handleApplyClick() {
		if ($userStore.isLogin) {
			windowStore.open(t('web.friend.apply_title'));
		} else {
			authModalStore.open('apply-friend-link');
		}
	}
</script>

<div class="friends-page max-w-5xl mx-auto py-10 space-y-16">
	<PageHeader
		title={t('web.seo.friends.title')}
		tag="Friends"
		subtitle={t('web.friends.subtitle')}
		description={t('web.seo.friends.desc')}
	/>

	<!-- Friends Grid -->
	<div class="friends-content">
		<FriendLinkGrid links={data.links} />
	</div>

	<!-- Bottom Section -->
	<FadeIn y={10} duration={1000} delay={600}>
		<div class="border-t border-ink-100 dark:border-ink-800 pt-10 flex flex-col items-center">
			<div
				class="p-8 rounded-default bg-ink-50/50 dark:bg-ink-950/30 border border-dashed border-ink-200 dark:border-ink-800 max-w-2xl w-full"
			>
				<h2
					class="text-sm font-bold text-ink-900 dark:text-ink-100 uppercase tracking-widest mb-6 font-mono text-center"
				>
					{t('web.friends.guidelines_title')}
				</h2>

				{#if data.applyConfig.requirements}
					<div class="text-xs text-ink-500 dark:text-ink-400 space-y-3 font-serif">
						<SafeMarkdownView content={data.applyConfig.requirements} />
					</div>
				{:else}
					<ul class="text-xs text-ink-500 dark:text-ink-400 space-y-3 font-serif">
						<li class="flex gap-2">
							<span>•</span> {t('web.friends.guideline_1')}
						</li>
						<li class="flex gap-2">
							<span>•</span> {t('web.friends.guideline_2')}
						</li>
						<li class="flex gap-2">
							<span>•</span> {t('web.friends.guideline_3')}
						</li>
					</ul>
				{/if}

				{#if data.applyConfig.enabled}
					<div class="mt-10 flex justify-center">
						<button
							onclick={handleApplyClick}
							class="flex items-center gap-2 px-4 py-2 bg-ink-900 dark:bg-ink-100 text-ink-0 dark:text-ink-950 rounded-default hover:bg-accent-600 dark:hover:bg-accent-400 transition-all duration-300 font-bold text-[11px] shadow-sm group"
						>
							<Plus size={14} class="group-hover:rotate-90 transition-transform duration-300" />
							{t('web.friends.apply_button')}
						</button>
					</div>
				{:else}
					<div class="mt-10 text-center text-xs text-ink-400 dark:text-ink-500 font-mono">
						{t('web.friends.closed_notice')}
					</div>
				{/if}
			</div>
		</div>
	</FadeIn>
</div>

<style lang="postcss">
	@reference "$routes/layout.css";
</style>
