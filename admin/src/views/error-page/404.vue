<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { NButton, NAlert } from 'naive-ui'
import { reactive } from 'vue'

import { ScrollContainer } from '@/components'
import router from '@/router'

import ErrorPage from './index.vue'

const errorState = reactive({
  code: 404,
  content: 'Not Found',
})

const changeStateCode500 = () => {
  errorState.code = 500
  errorState.content = 'Internal Server Error'
}

const changeStateCode200 = () => {
  errorState.code = 200
  errorState.content = 'OK'
}
</script>
<template>
  <ScrollContainer>
    <NAlert
      type="info"
      closable
      style="z-index: 10"
    >
      <div class="flex items-center gap-x-2">
        <span>{{ $t('admin.error.404_desc') }}</span>
        <NButton
          size="small"
          type="warning"
          @click="changeStateCode500"
          >{{ $t('admin.error.to_500') }}</NButton
        >

        <NButton
          size="small"
          type="success"
          @click="changeStateCode200"
          >{{ $t('admin.error.to_200') }}</NButton
        >
      </div>
    </NAlert>
    <div
      class="absolute left-0 flex h-screen w-full items-center justify-center"
      style="padding-bottom: 240px"
    >
      <ErrorPage
        v-bind="errorState"
        :container-style="{
          maxWidth: '500px',
        }"
      >
        <NButton
          size="large"
          type="info"
          @click="router.push('/404')"
          >{{ $t('admin.error.route_show') }}</NButton
        >
      </ErrorPage>
    </div>
  </ScrollContainer>
</template>
