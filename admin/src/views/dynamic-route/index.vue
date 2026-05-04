<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { NCard, NAlert, NButton } from 'naive-ui'
import { RouterLink, useRouter } from 'vue-router'

import { ScrollContainer } from '@/components'
import { useInjection } from '@/composables'
import { mediaQueryInjectionKey } from '@/injection'

const { isMaxMd } = useInjection(mediaQueryInjectionKey)

defineOptions({
  name: 'DynamicRoute',
})

const router = useRouter()
</script>
<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-2">
    <NAlert
      type="info"
      closable
    >
      {{ t('admin.dynamic_route.alert') }}
    </NAlert>
    <NCard :size="isMaxMd ? 'small' : undefined">
      <div class="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
        <RouterLink
          v-for="value in 50"
          :key="value"
          :to="value <= 25 ? `/dynamic-route/${value}` : `/dynamic-route/${value}/${value}`"
        >
          <NButton
            block
            secondary
            :type="
              [`/dynamic-route/${value}`, `/dynamic-route/${value}/${value}`].includes(
                router.currentRoute.value.fullPath,
              )
                ? 'primary'
                : 'default'
            "
          >
            {{
              value <= 25 ? `/dynamic-route/${value}` : `/dynamic-route/${value}/${value}`
            }}</NButton
          >
        </RouterLink>
      </div>
    </NCard>
  </ScrollContainer>
</template>
