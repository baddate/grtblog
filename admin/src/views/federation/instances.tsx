import { NButton, NCard } from 'naive-ui'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { ScrollContainer } from '@/components'

export default defineComponent({
  name: 'FederationInstances',
  setup() {
    const router = useRouter()
    const { t } = useI18n()

    return () => (
      <ScrollContainer wrapper-class='p-4'>
        <NCard>
          <div class='space-y-6'>
            <div>
              <div class='text-base font-semibold'>{t('admin.federation.instances_title')}</div>
              <div class='text-xs text-neutral-500'>{t('admin.federation.instances_desc')}</div>
            </div>

            <div class='flex justify-end'>
              <NButton
                type='primary'
                onClick={() => router.push({ name: 'friendLinkList' })}
              >
                {t('admin.federation.go_to_friend_links')}
              </NButton>
            </div>
          </div>
        </NCard>
      </ScrollContainer>
    )
  },
})
