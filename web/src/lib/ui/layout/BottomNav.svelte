<script lang="ts">
	import { page } from '$app/state';
	import { themeManager } from '$lib/shared/theme/theme.svelte';
	import { Home, NotebookPen, Image, MessageCircle, Tags, Palette, Menu, X } from 'lucide-svelte';
	import { resolveHref } from '$lib/shared/utils/resolve-path';
	import { DEFAULT_LANG } from '$lib/i18n/server';

	const currentLang = $derived(page.data.lang ?? DEFAULT_LANG);

	const isActive = (href: string) => {
		const resolved = resolveHref(href, currentLang);
		return page.url.pathname === resolved || page.url.pathname.startsWith(resolved + '/');
	};

	let mobileMenuOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/posts/', label: 'Posts', icon: NotebookPen },
		{ href: '/albums/', label: 'Albums', icon: Image },
		{ href: '/moments/', label: 'Moments', icon: MessageCircle },
		{ href: '/tags/', label: 'Tags', icon: Tags }
	];

	function cycleTheme() {
		const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
		const idx = order.indexOf(themeManager.current);
		themeManager.set(order[(idx + 1) % order.length]);
	}
</script>

<nav class="bottom-nav" aria-label="Main navigation">
	<div class="nav-inner">
		<a href="/" class="nav-logo" aria-label="Home">
			<div class="logo-icon"></div>
		</a>

		<div class="nav-links">
			{#each navItems as item}
				<a
					href={resolveHref(item.href, currentLang)}
					class="nav-link {isActive(item.href) ? 'active' : ''}"
				>
					<svelte:component this={item.icon} size={18} />
					<span>{item.label}</span>
				</a>
			{/each}
		</div>

		<div class="nav-actions">
			<button onclick={cycleTheme} class="theme-btn" aria-label="Toggle theme">
				<Palette size={20} />
			</button>
			<button
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="mobile-menu-toggle"
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<X size={24} />
				{:else}
					<Menu size={24} />
				{/if}
			</button>
		</div>
	</div>

	{#if mobileMenuOpen}
		<div class="mobile-menu">
			{#each navItems as item}
				<a
					href={resolveHref(item.href, currentLang)}
					class="mobile-link {isActive(item.href) ? 'active' : ''}"
					onclick={() => (mobileMenuOpen = false)}
				>
					<svelte:component this={item.icon} size={20} />
					<span>{item.label}</span>
				</a>
			{/each}
		</div>
	{/if}
</nav>

<style lang="postcss">
	.bottom-nav {
		position: fixed;
		left: 0;
		bottom: 1rem;
		width: 100%;
		display: flex;
		justify-content: center;
		z-index: 1000;
		pointer-events: none;
		padding: 0 1rem;
	}

	.nav-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		width: 100%;
		max-width: var(--layout-content-main, 60rem);
		background: var(--background);
		border: 1px solid var(--border-color);
		border-radius: calc(var(--border-radius) * 2);
		box-shadow: var(--shadow-card);
		pointer-events: auto;
		transition: all 0.2s ease-in-out;
		min-height: var(--layout-nav-height, 3rem);
	}

	.nav-inner:hover {
		transform: scale(1.02);
	}

	.nav-logo {
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	.logo-icon {
		width: 2.5rem;
		height: 2.5rem;
		--gradient-color-1: var(--primary-color);
		--gradient-color-2: var(--colors-purple);
		background: linear-gradient(
			-60deg,
			var(--gradient-color-1),
			var(--gradient-color-2),
			var(--gradient-color-1),
			var(--gradient-color-2),
			var(--gradient-color-1),
			var(--secondary-color),
			var(--gradient-color-1),
			var(--gradient-color-2)
		);
		background-size: 200% 200%;
		animation: backgroundMove 5s linear infinite;
		mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="m35.4 11.5.6.2a25.7 25.7 0 0 1 8.3 5.8l.4-.2.3-.3-.2-.2-2-1.8a20.1 20.1 0 0 0-7.4-3.5ZM20 16.9h-.4c-2.6.2-4.7 2.3-6.6 6.6a22.4 22.4 0 0 0-1.8 10.7A20.5 20.5 0 0 0 16 45.3l.4.5.4-.5.4-.5-.4-.8a18.9 18.9 0 0 1-1.5-13.8c1-3 2.8-4 5-3l2 1.4a45010.8 45010.8 0 0 0 16.7 14c2.4 2 3.4 2.7 4.7 3.4l2 .7a5 5 0 0 0 1.7 0c.5-.1 1.2-.5 1.6-.9.4-.4 1-1.3 1.6-2.5a19 19 0 0 0 2-8.7c0-1.6-.2-2.6-.4-4.1A26.1 26.1 0 0 0 46.9 19s-.2 0-.6.6l-.1.2.4.6A21.2 21.2 0 0 1 50 33.8c-.2 2-.8 4.3-1.4 5.6-.5 1-1.2 1.6-1.9 1.7-.8.2-1.8-.2-2.7-1.1A985.3 985.3 0 0 1 27 20.8C24.5 18.3 22 17 20 16.9Zm-1.2 30.2-.3.2-.3.3.3.3a24.2 24.2 0 0 0 5 3 17.8 17.8 0 0 1-4.7-3.8Z" /><path d="M48.8 15.2a694 694 0 0 0-14.4 12.2 23.6 23.6 0 0 0 2 2.4l12.4-14.6Zm-21.4 19A1128.2 1128.2 0 0 0 15.1 49l14.8-12.6-2.5-2Z" /></svg>')
			center/contain;
		-webkit-mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="m35.4 11.5.6.2a25.7 25.7 0 0 1 8.3 5.8l.4-.2.3-.3-.2-.2-2-1.8a20.1 20.1 0 0 0-7.4-3.5ZM20 16.9h-.4c-2.6.2-4.7 2.3-6.6 6.6a22.4 22.4 0 0 0-1.8 10.7A20.5 20.5 0 0 0 16 45.3l.4.5.4-.5.4-.5-.4-.8a18.9 18.9 0 0 1-1.5-13.8c1-3 2.8-4 5-3l2 1.4a45010.8 45010.8 0 0 0 16.7 14c2.4 2 3.4 2.7 4.7 3.4l2 .7a5 5 0 0 0 1.7 0c.5-.1 1.2-.5 1.6-.9.4-.4 1-1.3 1.6-2.5a19 19 0 0 0 2-8.7c0-1.6-.2-2.6-.4-4.1A26.1 26.1 0 0 0 46.9 19s-.2 0-.6.6l-.1.2.4.6A21.2 21.2 0 0 1 50 33.8c-.2 2-.8 4.3-1.4 5.6-.5 1-1.2 1.6-1.9 1.7-.8.2-1.8-.2-2.7-1.1A985.3 985.3 0 0 1 27 20.8C24.5 18.3 22 17 20 16.9Zm-1.2 30.2-.3.2-.3.3.3.3a24.2 24.2 0 0 0 5 3 17.8 17.8 0 0 1-4.7-3.8Z" /><path d="M48.8 15.2a694 694 0 0 0-14.4 12.2 23.6 23.6 0 0 0 2 2.4l12.4-14.6Zm-21.4 19A1128.2 1128.2 0 0 0 15.1 49l14.8-12.6-2.5-2Z" /></svg>')
			center/contain;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.8rem;
		border-radius: var(--border-radius);
		color: var(--text);
		text-decoration: none;
		font-family: var(--font-family);
		font-size: var(--font-size-sm);
		transition: all 0.2s ease;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--primary-color);
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.theme-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 50%;
		background: var(--surface);
		color: var(--fadeText);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.theme-btn:hover {
		color: var(--primary-color);
		background: var(--surface2);
	}

	.mobile-menu-toggle {
		display: none;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 50%;
		background: var(--primary-color);
		color: var(--primary-contrast);
		cursor: pointer;
	}

	.mobile-menu {
		display: none;
	}

	@media (max-width: 767px) {
		.nav-links {
			display: none;
		}

		.mobile-menu-toggle {
			display: flex;
		}

		.nav-inner {
			padding: 0.5rem 0.75rem;
		}

		.mobile-menu {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			position: absolute;
			bottom: calc(var(--layout-nav-height) + 1rem);
			left: 1rem;
			width: calc(100% - 2rem);
			padding: 1rem;
			background: var(--background);
			border: 1px solid var(--border-color);
			border-radius: calc(var(--border-radius) * 2);
			box-shadow: var(--shadow-card);
			pointer-events: auto;
		}

		.mobile-link {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.75rem 1rem;
			border-radius: var(--border-radius);
			color: var(--text);
			text-decoration: none;
			font-size: var(--font-size-base);
			transition: all 0.2s ease;
		}

		.mobile-link:hover,
		.mobile-link.active {
			color: var(--primary-color);
			background: var(--surface);
		}

		.logo-icon {
			width: 2rem;
			height: 2rem;
		}
	}
</style>
