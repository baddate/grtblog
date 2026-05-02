import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const LOCALE_KEY = 'admin-locale'

function detectLocale(): string {
  // Check localStorage first
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved === 'zh' || saved === 'en') return saved

  // Fall back to browser language
  const nav = navigator.language || ''
  if (nav.startsWith('zh')) return 'zh'
  return 'en'
}

export const useLocaleStore = defineStore('locale', () => {
  const current = ref<string>(detectLocale())

  const isZh = computed(() => current.value === 'zh')
  const isEn = computed(() => current.value === 'en')

  function setLocale(lang: string) {
    if (lang !== 'zh' && lang !== 'en') return
    current.value = lang
    localStorage.setItem(LOCALE_KEY, lang)

    // Sync vue-i18n locale
    try {
      const { locale } = useI18n()
      locale.value = lang
    } catch {
      // i18n may not be initialized yet
    }
  }

  function toggle() {
    setLocale(isZh.value ? 'en' : 'zh')
  }

  return {
    current,
    isZh,
    isEn,
    setLocale,
    toggle,
  }
})
