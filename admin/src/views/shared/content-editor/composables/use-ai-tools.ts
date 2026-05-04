import { ref } from 'vue'

import i18n from '@/plugins/i18n'
const { t } = i18n.global
import { generateSummaryStream, generateTitle } from '@/services/ai'

import type { MessageApi } from 'naive-ui'

interface UseAiTitleGenerationOptions {
  getContent: () => string
  applyResult: (result: { title: string; shortUrl: string }) => void
  message: MessageApi
}

export function useAiTitleGeneration(options: UseAiTitleGenerationOptions) {
  const loading = ref(false)

  async function generate() {
    const content = options.getContent().trim()
    if (!content) {
      options.message.warning(t('admin.ai.content_required'))
      return
    }

    loading.value = true
    try {
      const result = await generateTitle(content)
      options.applyResult(result)
      options.message.success(t('admin.ai.generate_success'))
    } catch (error) {
      options.message.error(error instanceof Error ? error.message : t('admin.ai.generate_failed'))
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    generate,
  }
}

interface UseAiSummaryGenerationOptions {
  getContent: () => string
  adoptSummary: (summary: string) => void
  message: MessageApi
}

export function useAiSummaryGeneration(options: UseAiSummaryGenerationOptions) {
  const loading = ref(false)
  const result = ref('')
  const done = ref(false)

  async function generate() {
    const content = options.getContent().trim()
    if (!content) {
      options.message.warning(t('admin.ai.content_required'))
      return
    }

    loading.value = true
    result.value = ''
    done.value = false

    try {
      await generateSummaryStream(content, (chunk) => {
        result.value += chunk
      })
      done.value = true
    } catch (error) {
      options.message.error(error instanceof Error ? error.message : t('admin.ai.summary_generate_failed'))
      result.value = ''
    } finally {
      loading.value = false
    }
  }

  function adopt() {
    options.adoptSummary(result.value)
    result.value = ''
    done.value = false
    options.message.success(t('admin.ai.summary_adopted'))
  }

  function dismiss() {
    result.value = ''
    done.value = false
  }

  return {
    loading,
    result,
    done,
    generate,
    adopt,
    dismiss,
  }
}
