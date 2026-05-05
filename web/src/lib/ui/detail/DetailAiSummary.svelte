<script lang="ts">
	import MarkdownView from '$lib/shared/markdown/MarkdownView.svelte';
	import { ChevronDown, Sparkles } from 'lucide-svelte';
	import { spring } from 'svelte/motion';

	interface Props {
		summary: string;
	}

	let { summary }: Props = $props();

	let isExpanded = $state(false);
	let contentHeight = $state(0);
	const summaryHeight = spring(60, { stiffness: 0.15, damping: 0.6 });

	$effect(() => {
		summaryHeight.set(isExpanded ? contentHeight : 60);
	});
</script>

<div
	class="mb-8 overflow-hidden rounded-default border border-accent-500/20 bg-gradient-to-br from-accent-500/5 to-transparent p-4 shadow-sm transition-all dark:border-accent-500/10 dark:from-accent-500/10"
>
	<div class="mb-3 flex items-center justify-between gap-2.5">
		<div class="flex items-center gap-2">
			<div
				class="flex h-5 w-5 items-center justify-center rounded-md bg-accent-500/10 text-accent-700 dark:bg-accent-500/20 dark:text-accent-400"
			>
				<Sparkles size={12} strokeWidth={2.5} />
			</div>
			<span
				class="font-mono text-[10px] font-bold tracking-widest text-accent-700 uppercase dark:text-accent-400"
				>AI 摘要</span
			>
		</div>
		<button
			class="flex cursor-pointer items-center gap-1 select-none text-[10px] font-medium text-accent-600/80 transition-colors hover:text-accent-600"
			onclick={() => (isExpanded = !isExpanded)}
		>
			{isExpanded ? '收起' : '展开'}
			<ChevronDown
				size={12}
				class={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
			/>
		</button>
	</div>
	<div
		class={`relative overflow-hidden will-change-[height] ${!isExpanded ? 'mask-gradient' : ''}`}
		style:height="{$summaryHeight}px"
	>
		<div
			bind:clientHeight={contentHeight}
			class="markdown-preview max-w-none font-sans text-xs leading-relaxed text-ink-700 dark:text-ink-300 [&>p]:mb-1.5 [&>p]:last:mb-0"
		>
			<MarkdownView content={summary} />
		</div>
	</div>
</div>
