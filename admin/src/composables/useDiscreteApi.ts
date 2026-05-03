import { zhCN, dateZhCN, enUS, dateEnUS, createDiscreteApi } from 'naive-ui'
import { computed, h } from 'vue'

import { useLocaleStore } from '@/stores/locale'
import { useTheme } from './useTheme'

import type { ConfigProviderProps } from 'naive-ui'

export function getConfigProviderProps() {
  const { theme, themeOverrides } = useTheme()
  const localeStore = useLocaleStore()

  const configProviderProps = computed<ConfigProviderProps>(() => ({
    locale: localeStore.current.startsWith('zh') ? zhCN : enUS,
    dateLocale: localeStore.current.startsWith('zh') ? dateZhCN : dateEnUS,
    theme: theme.value,
    themeOverrides: themeOverrides.value,
    icons: {
      info: () => h('span', { class: 'iconify ph--info size-full' }),
      success: () => h('span', { class: 'iconify ph--seal-check size-full' }),
      warning: () => h('span', { class: 'iconify ph--warning size-full' }),
      error: () => h('span', { class: 'iconify ph--x-square size-full' }),
    },
  }))

  return configProviderProps
}

export function useDiscreteApi() {
  const configProviderProps = getConfigProviderProps()

  return createDiscreteApi(['message', 'dialog', 'notification', 'loadingBar', 'modal'], {
    configProviderProps,
    notificationProviderProps: {
      placement: 'bottom-left',
    },
  })
}
