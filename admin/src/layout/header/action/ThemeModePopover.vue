<script setup lang="ts">
import { NPopselect } from 'naive-ui'
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

import { ButtonAnimation } from '@/components'
import { toRefsPreferencesStore } from '@/stores'

import type { PopoverProps } from 'naive-ui'

interface ThemeModePopover extends /* @vue-ignore */ PopoverProps {}

defineProps<ThemeModePopover>()

defineOptions({
  inheritAttrs: false,
})

const { themeMode } = toRefsPreferencesStore()
const { t } = useI18n()

const themeModeDropdownOptions = [
  {
    icon: () => h('span', { class: 'iconify ph--sun size-5' }),
    iconName: 'iconify ph--sun',
    key: 'light',
    value: 'light',
    label: t('admin.header.light_mode'),
  },
  {
    icon: () => h('span', { class: 'iconify ph--moon size-5' }),
    iconName: 'iconify ph--moon',
    key: 'dark',
    value: 'dark',
    label: t('admin.header.dark_mode'),
  },
  {
    icon: () => h('span', { class: 'iconify ph--desktop size-5' }),
    iconName: 'iconify ph--desktop',
    key: 'auto',
    value: 'auto',
    label: t('admin.header.system_mode'),
  },
]

const themeIconClasses = computed(
  () =>
    themeModeDropdownOptions.find((item) => item.key === themeMode.value)?.iconName ||
    'iconify ph--desktop size-5',
)

function renderSelectLabel(option: (typeof themeModeDropdownOptions)[number]) {
  return h(
    'div',
    {
      class: 'flex items-center gap-x-2',
    },
    [option.icon(), option.label],
  )
}
</script>
<template>
  <NPopselect
    class="p-0.5"
    trigger="click"
    v-bind="$attrs"
    v-model:value="themeMode"
    :options="themeModeDropdownOptions"
    :render-label="renderSelectLabel"
    :to="false"
  >
    <ButtonAnimation :title="$t('admin.header.theme')">
      <span :class="themeIconClasses" />
    </ButtonAnimation>
  </NPopselect>
</template>
