<script lang="ts">
	import { buildSwitchUrl, setLangCookie } from '$lib/i18n/locale';
	import type { SupportedLang } from '$lib/i18n/server';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	type Props = {
		currentLang: SupportedLang;
	};

	let { currentLang }: Props = $props();

	const targetLang = $derived(currentLang === 'zh' ? 'en' : 'zh');
	const targetLabel = $derived(currentLang === 'zh' ? 'EN' : '中文');
	const switchUrl = $derived(buildSwitchUrl(page.url.pathname, targetLang));

	function handleSwitch(e: Event) {
		e.preventDefault();
		document.cookie = setLangCookie(targetLang);
		goto(switchUrl);
	}
</script>

<button
	onclick={handleSwitch}
	class="text-[10px] md:text-[11px] font-mono text-ink-400 hover:text-jade-600 dark:hover:text-jade-400 transition-colors"
	aria-label="Switch language to {targetLang === 'zh' ? 'Chinese' : 'English'}"
>
	{targetLabel}
</button>
