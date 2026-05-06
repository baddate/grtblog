<script lang="ts">
	import { ArrowLeft, Share2, ArrowUp, Home, MessageSquare } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Button from '$lib/ui/primitives/button/Button.svelte';
	import { browser } from '$app/environment';
	import { toast } from 'svelte-sonner';
	import { resolvePath } from '$lib/shared/utils/resolve-path';
	import { page } from '$app/state';

	interface Props {
		title: string;
		showThreshold?: number;
		showCommentShortcut?: boolean;
	}

	let { title, showThreshold = 300, showCommentShortcut = true }: Props = $props();

	let scrollY = $state(0);
	let clientHeight = $state(0);

	let showHeader = $derived(scrollY > showThreshold);
	let progress = $derived.by(() => {
		if (!browser || !showHeader) return 0;
		const scrollHeight = document.documentElement.scrollHeight;
		const totalHeight = scrollHeight - clientHeight;
		if (totalHeight <= 0) return 0;
		return Math.min(100, Math.max(0, (scrollY / totalHeight) * 100));
	});

	const scrollToTop = () => {
		if (!browser) return;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const scrollToComments = () => {
		if (!browser) return;
		const commentSection = document.querySelector('#comments');
		if (commentSection) {
			commentSection.scrollIntoView({ behavior: 'smooth' });
		} else {
			toast.info('该页面没有评论区');
		}
	};

	function goBack() {
		if (!browser) return;
		if (window.history.length > 1) {
			history.back();
		} else {
			window.location.href = resolvePath('/', page.data.lang);
		}
	}

	async function handleShare() {
		if (!browser) return;
		const shareData = {
			title: title,
			url: window.location.href
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
			} else {
				await navigator.clipboard.writeText(window.location.href);
				toast.success('链接已复制到剪贴板');
			}
		} catch (err) {
			if ((err as Error).name !== 'AbortError') {
				console.error('Share failed:', err);
				toast.error('分享失败，请重试');
			}
		}
	}
</script>

<svelte:window bind:scrollY bind:innerHeight={clientHeight} />

{#if showHeader}
	<header
		class="sticky-header-shell fixed top-0 left-0 right-0 z-40 hidden h-14 transition-all duration-500 md:block"
		in:fly={{ y: -100, duration: 600, easing: cubicOut }}
		out:fade={{ duration: 300 }}
	>
		<!-- Progress Bar -->
		<div
			class="sticky-header-progress absolute bottom-0 left-0 h-[2px] transition-all duration-150 ease-out"
			style="width: {progress}%"
		></div>

		<div
			class="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 md:pl-28 lg:px-8 lg:pl-32"
		>
			<!-- Left Actions -->
			<div class="flex flex-1 items-center gap-1 md:gap-2">
				<Button
					variant="ghost"
					size="sm"
					class="group !h-9 !w-9 !p-0 text-[color:var(--fadeText)] hover:bg-[var(--surface)] hover:text-[color:var(--heading)]"
					onclick={goBack}
					title="返回"
				>
					<ArrowLeft size={18} class="transition-transform group-hover:-translate-x-0.5" />
				</Button>
				<div class="hidden h-4 w-px sm:block bg-[color:var(--border-color)]/70"></div>
				<Button
					variant="ghost"
					size="sm"
					class="group !h-9 !w-9 !p-0 text-[color:var(--fadeText)] hover:bg-[var(--surface)] hover:text-[color:var(--heading)]"
					href={resolvePath('/', page.data.lang)}
					title="首页"
				>
					<Home size={18} />
				</Button>
			</div>

			<!-- Center Title -->
			<div class="flex flex-[2] items-center justify-center overflow-hidden px-4 md:flex-[3]">
				<button
					class="group flex max-w-full items-center gap-2 transition-all hover:opacity-80"
					onclick={scrollToTop}
				>
					<span
						class="truncate font-serif text-[13px] font-medium tracking-wide text-[color:var(--heading)] md:text-sm"
					>
						{title}
					</span>
					<ArrowUp
						size={12}
						class="shrink-0 text-accent-500 opacity-0 transition-all group-hover:translate-y-[-2px] group-hover:opacity-100"
					/>
				</button>
			</div>

			<!-- Right Actions -->
			<div class="flex flex-1 items-center justify-end gap-1 md:gap-2">
				<div class="hidden items-center gap-1 pr-2 lg:flex">
					<span class="font-mono text-[10px] font-bold text-[color:var(--fadeText)]">
						{Math.round(progress)}%
					</span>
				</div>

				{#if showCommentShortcut}
					<Button
						variant="ghost"
						size="sm"
						class="!h-9 !w-9 !p-0 text-[color:var(--fadeText)] hover:bg-[var(--surface)] hover:text-[color:var(--heading)]"
						onclick={scrollToComments}
						title="跳转评论"
					>
						<MessageSquare size={18} />
					</Button>
				{/if}

				<Button
					variant="ghost"
					size="sm"
					class="!h-9 !w-9 !p-0 text-[color:var(--fadeText)] hover:bg-[var(--surface)] hover:text-accent-600 dark:hover:text-accent-400"
					onclick={handleShare}
					title="分享文章"
				>
					<Share2 size={18} />
				</Button>

				<div class="h-4 w-px bg-[color:var(--border-color)]/70"></div>

				<Button
					variant="ghost"
					size="sm"
					class="!h-9 !w-9 !p-0 bg-accent-500/10 text-accent-600 hover:bg-accent-500/20 dark:bg-accent-500/20 dark:text-accent-400 dark:hover:bg-accent-500/30"
					onclick={scrollToTop}
					title="回到顶部"
				>
					<ArrowUp size={18} />
				</Button>
			</div>
		</div>
	</header>
{/if}

<style>
	.sticky-header-shell {
		border-bottom: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
		background: color-mix(in srgb, var(--background) 82%, transparent);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	.sticky-header-progress {
		background: linear-gradient(90deg, var(--secondary-color), var(--primary-color));
		box-shadow: 0 0 16px color-mix(in srgb, var(--primary-color) 35%, transparent);
	}

	/* Subtle gradient for progress bar glow */
	.sticky-header-shell::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, var(--primary-color) 20%, transparent),
			transparent
		);
		pointer-events: none;
	}

	:global(.dark) .sticky-header-shell {
		background: color-mix(in srgb, var(--surface) 62%, var(--background) 38%);
		border-bottom-color: color-mix(in srgb, var(--border-color) 82%, transparent);
	}
</style>
