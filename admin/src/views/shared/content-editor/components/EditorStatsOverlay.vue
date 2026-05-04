<script setup lang="ts">
import { NCard, NPopover } from 'naive-ui'

defineProps<{
  idle: boolean
  cursorLine: number
  cursorColumn: number
  readingMinutes: number
  charCount: number
  chineseCharCount: number
  wordCount: number
  totalCharCount: number
  paragraphCount: number
  selectionTotal: number
  selectionChars: number
}>()
</script>

<template>
  <div
    class="pointer-events-none absolute right-3 bottom-3 z-10 transition-opacity duration-200"
    :class="idle ? 'opacity-75 hover:opacity-100' : 'opacity-0'"
  >
    <NCard
      size="small"
      class="pointer-events-auto shadow-sm"
      content-style="padding: 6px 8px;"
    >
      <div class="flex items-center gap-3 text-[13px]">
        <NPopover
          trigger="hover"
          :disabled="!idle"
          content-style="padding: 4px 6px;"
        >
          <template #trigger>
            <span class="cursor-help">{{ $t('admin.editor.chars', { n: charCount }) }}</span>
          </template>
          <div class="flex flex-col gap-0.5 text-[11px] leading-tight">
            <span v-if="selectionTotal">{{ $t('admin.editor.selected', { n: selectionChars }) }}</span>
            <span>{{ $t('admin.editor.chinese', { n: chineseCharCount }) }}</span>
            <span>{{ $t('admin.editor.english_words', { n: wordCount }) }}</span>
            <span>{{ $t('admin.editor.characters', { n: totalCharCount }) }}</span>
            <span>{{ $t('admin.editor.paragraphs', { n: paragraphCount }) }}</span>
          </div>
        </NPopover>
        <span v-if="selectionTotal">{{ $t('admin.editor.selected_chars', { n: selectionChars }) }}</span>
        <span>{{ cursorLine }}:{{ cursorColumn }}</span>
        <span>{{ $t('admin.editor.minutes_read', { n: readingMinutes }) }}</span>
      </div>
    </NCard>
  </div>
</template>
