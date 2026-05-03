import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEFAULT_LANG, isSupportedLang } from '@/shared/languages'

const LOCALE_KEY = 'admin-locale'

function detectLocale(): string {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved && isSupportedLang(saved)) return saved

  const nav = navigator.language || ''
  const lower = nav.toLowerCase()
  if (isSupportedLang(lower)) return lower
  // Prefix match for browser locales (e.g. 'zh-TW' → 'zh-Hant')
  for (const code of ['zh-Hant', 'zh-Hans', 'en', 'ja'] as const) {
    if (lower.startsWith(code.split('-')[0])) return code
  }
  return DEFAULT_LANG
}

export const useLocaleStore = defineStore('locale', () => {
  const current = ref<string>(detectLocale())

  function setLocale(lang: string) {
    if (!isSupportedLang(lang)) return
    current.value = lang
    localStorage.setItem(LOCALE_KEY, lang)

    try {
      const { locale } = useI18n()
      locale.value = lang
    } catch {
      // i18n not initialized yet
    }
  }

  return { current, setLocale }
})
