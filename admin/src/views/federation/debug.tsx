import { NCard, NButton, NInput, NForm, NFormItem, NAlert, NCode } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ScrollContainer } from '@/components'
import { checkFederationRemote } from '@/services/federation-admin'

export default defineComponent({
  name: 'FederationDebug',
  setup() {
    const message = useMessage()
    const { t } = useI18n()
    const targetUrl = ref('')
    const loading = ref(false)
    const error = ref('')
    const result = ref<any>(null)

    const handleCheck = async () => {
      const url = targetUrl.value.trim()
      if (!url) {
        message.warning(t('admin.federation.enter_url'))
        return
      }
      loading.value = true
      error.value = ''
      result.value = null
      try {
        result.value = await checkFederationRemote(url)
        message.success(t('admin.federation.fetched_remote_info'))
      } catch (err: any) {
        error.value = err?.message || t('admin.federation.request_failed')
      } finally {
        loading.value = false
      }
    }

    const renderBlock = (title: string, data: any) => (
      <div class='space-y-2'>
        <div class='text-sm font-medium text-neutral-600'>{title}</div>
        {data ? (
          <NCode
            code={JSON.stringify(data, null, 2)}
            language='json'
            wordWrap
          />
        ) : (
          <div class='text-xs text-neutral-400'>{t('admin.federation.no_data')}</div>
        )}
      </div>
    )

    return () => (
      <ScrollContainer wrapperClass='p-4'>
        <NCard>
          <div class='space-y-6'>
            <div>
              <div class='text-base font-semibold'>{t('admin.federation.debug_title')}</div>
              <div class='text-xs text-neutral-500'>{t('admin.federation.debug_desc')}</div>
            </div>

            <NForm
              labelPlacement='left'
              labelWidth={120}
            >
              <NFormItem label={t('admin.federation.remote_url')}>
                <div class='flex w-full gap-2'>
                  <NInput
                    v-model:value={targetUrl.value}
                    placeholder='https://example.com'
                  />
                  <NButton
                    type='primary'
                    loading={loading.value}
                    onClick={handleCheck}
                  >
                    {t('admin.federation.check')}
                  </NButton>
                </div>
              </NFormItem>
            </NForm>

            {error.value && (
              <NAlert
                type='error'
                title={t('admin.federation.request_failed')}
              >
                {error.value}
              </NAlert>
            )}

            {result.value && (
              <div class='space-y-6'>
                {renderBlock('Manifest', result.value.manifest)}
                {renderBlock('Public Key', result.value.public_key)}
                {renderBlock('Endpoints', result.value.endpoints)}
              </div>
            )}
          </div>
        </NCard>
      </ScrollContainer>
    )
  },
})
