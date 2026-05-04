import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_LANG, isSupportedLang } from '@/shared/languages'
import i18n from '@/plugins/i18n'

const LOCALE_KEY = 'admin-locale'
const LOCALE_EXPLICIT_KEY = 'admin-locale:explicit'

/**
 * Detect initial locale:
 * 1. If user has explicitly set a language via the UI, respect that preference
 * 2. Otherwise, auto-detect from browser language
 * 3. Fall back to a previously saved value (legacy sessions without explicit flag)
 * 4. Use default
 */
function detectLocale(): string {
  const saved = localStorage.getItem(LOCALE_KEY)
  const isExplicit = localStorage.getItem(LOCALE_EXPLICIT_KEY)
  if (saved && isSupportedLang(saved) && isExplicit) return saved

  const nav = navigator.language || ''
  const lower = nav.toLowerCase()
  if (isSupportedLang(lower)) return lower
  // Prefix match for browser locales (e.g. 'en-US' → 'en', 'zh-CN' → 'zh-Hans')
  for (const code of ['zh-Hans', 'zh-Hant', 'en', 'ja'] as const) {
    if (lower.startsWith(code.split('-')[0])) return code
  }

  if (saved && isSupportedLang(saved)) return saved

  return DEFAULT_LANG
}

export const useLocaleStore = defineStore('locale', () => {
  const detected = detectLocale()
  const current = ref<string>(detected)
  i18n.global.locale.value = detected

  function setLocale(lang: string) {
    if (!isSupportedLang(lang)) return
    current.value = lang
    i18n.global.locale.value = lang
    localStorage.setItem(LOCALE_KEY, lang)
    localStorage.setItem(LOCALE_EXPLICIT_KEY, 'true')
  }

  return { current, setLocale }
})
