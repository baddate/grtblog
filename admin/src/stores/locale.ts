import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_LANG, isSupportedLang } from '@/shared/languages'
import i18n from '@/plugins/i18n'

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
  const detected = detectLocale()
  const current = ref<string>(detected)
  i18n.global.locale.value = detected

  function setLocale(lang: string) {
    if (!isSupportedLang(lang)) return
    current.value = lang
    i18n.global.locale.value = lang
    localStorage.setItem(LOCALE_KEY, lang)
  }

  return { current, setLocale }
})
