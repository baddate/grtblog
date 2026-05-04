import { useMessage } from 'naive-ui'
import { reactive, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import i18n from '@/plugins/i18n'
const { t } = i18n.global
import { getPage, createPage, updatePage } from '@/services/page'

export function usePageForm() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()

  const id = computed(() => route.params.id as string | undefined)
  const isCreating = computed(() => !id.value)
  const loading = ref(false)
  const saving = ref(false)

  const form = reactive({
    title: '',
    description: '',
    aiSummary: '',
    content: '',
    shortUrl: '',
    isEnabled: true,
    allowComment: true,
  })

  async function fetch() {
    if (isCreating.value) {
      return null
    }
    loading.value = true
    try {
      const data = await getPage(Number(id.value))
      form.title = data.title
      form.description = data.description || ''
      form.aiSummary = data.aiSummary || ''
      form.content = data.content
      form.shortUrl = data.shortUrl
      form.isEnabled = data.isEnabled
      form.allowComment = data.allowComment
      return data
    } finally {
      loading.value = false
    }
  }

  async function save() {
    saving.value = true
    try {
      const payload = {
        title: form.title,
        description: form.description,
        aiSummary: form.aiSummary || undefined,
        content: form.content,
        shortUrl: form.shortUrl,
        isEnabled: form.isEnabled,
        allowComment: form.allowComment,
      }
      if (isCreating.value) {
        await createPage(payload)
        message.success(t('admin.page.create_success'))
      } else {
        await updatePage(Number(id.value), payload)
        message.success(t('admin.page.update_success'))
      }
      router.push({ name: 'pageList' })
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error(t('admin.common.save_failed'))
      }
    } finally {
      saving.value = false
    }
  }

  return { form, loading, saving, isCreating, fetch, save }
}
