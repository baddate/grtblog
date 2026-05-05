<script lang="ts">
	import { type Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		variant?: 'jade' | 'ink' | 'amber' | 'cinnabar' | 'outline';
		class?: string;
	}

	let { children, variant = 'ink', class: className = '' }: Props = $props();

	const baseClasses =
		'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.1em] uppercase transition-colors';
	const variantClasses = {
		jade: 'border border-accent-500/10 bg-accent-500/10 text-accent-700 dark:text-accent-400',
		ink: 'border border-ink-100 bg-ink-500/5 text-ink-500 dark:border-ink-800/50 dark:text-ink-400',
		amber: 'border border-warning-500/20 bg-warning-500/10 text-warning-700 dark:text-warning-400',
		cinnabar:
			'text-error-700 dark:text-error-400 border border-error-500/20 bg-error-500/10',
		outline: 'border border-ink-100 bg-transparent text-ink-400 dark:border-ink-800/50'
	} as const;

	const cx = (...parts: Array<string | false | null | undefined>) =>
		parts.filter(Boolean).join(' ');

	let classes = $derived(cx(baseClasses, variantClasses[variant], className));
</script>

<span class={classes}>
	{@render children()}
</span>
