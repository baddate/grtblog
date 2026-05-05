<script lang="ts">
	import type { Tag } from '../types';
	import { windowStore } from '$lib/shared/stores/windowStore.svelte';
	import { Tag as TagIcon } from 'lucide-svelte';
	import { t } from '$lib/i18n/client';

	let { tags = [] }: { tags: Tag[] } = $props();

	function handleTagClick(tag: Tag) {
		windowStore.open(
			t('web.tag.contents_title', { name: tag.name }),
			{ id: tag.id, name: tag.name },
			'tag-contents'
		);
	}
</script>

{#if tags && tags.length > 0}
	<div class="flex flex-wrap items-center gap-2">
		<TagIcon size={12} class="text-ink-400 mr-1" />
		{#each tags as tag (tag.id)}
			<button
				onclick={() => handleTagClick(tag)}
				class="group flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-ink-50 dark:bg-ink-800/40 border border-ink-200/50 dark:border-ink-700/50 hover:border-accent-500/50 hover:bg-accent-500/5 dark:hover:bg-accent-500/10 transition-all duration-300"
			>
				<span
					class="font-serif text-[11px] text-ink-600 dark:text-ink-300 group-hover:text-accent-600 dark:group-hover:text-accent-400"
				>
					{tag.name}
				</span>
			</button>
		{/each}
	</div>
{/if}

<style lang="postcss">
	@reference "$routes/layout.css";
</style>
