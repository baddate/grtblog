<script lang="ts">
  import { LANGUAGES, getLanguageMeta, DEFAULT_LANG } from '$lib/i18n/languages';
  import { buildSwitchUrl, setLangCookie } from '$lib/i18n/locale';
  import { page } from '$app/state';

  type Props = { currentLang: string };
  let { currentLang }: Props = $props();

  let open = $state(false);
  const currentMeta = $derived(getLanguageMeta(currentLang));

  function handleSwitch(e: Event, code: string) {
    e.preventDefault();
    if (code === currentLang) { open = false; return; }
    document.cookie = setLangCookie(code);
    window.location.href = buildSwitchUrl(page.url.pathname, code);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { open = false; }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative inline-flex">
  <button
    onclick={() => open = !open}
    class="text-[10px] md:text-[11px] font-mono text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors flex items-center gap-0.5"
    aria-label="Switch language"
    aria-expanded={open}
  >
    {currentMeta?.nativeName ?? currentLang}
    <svg class="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
    </svg>
  </button>

  {#if open}
    <ul
      class="absolute bottom-full mb-1 right-0 z-50 min-w-[120px] rounded-md border border-ink-200/70 bg-ink-50/95 dark:border-ink-700/70 dark:bg-ink-900/95 backdrop-blur-md shadow-lg py-1"
      role="menu"
    >
      {#each LANGUAGES as lang (lang.code)}
        <li>
          <button
            onclick={(e) => handleSwitch(e, lang.code)}
            class="w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors {lang.code === currentLang
              ? 'text-accent-600 dark:text-accent-400 font-bold'
              : 'text-ink-500 hover:text-accent-600 dark:hover:text-accent-400'}"
            role="menuitem"
          >
            {lang.nativeName}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
