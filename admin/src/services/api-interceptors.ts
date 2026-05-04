import i18n from '@/plugins/i18n'

import { useDiscreteApi } from '@/composables'

const __ = i18n.global.t
import router from '@/router'
import { toRefsUserStore, useUserStore, pinia } from '@/stores'

import { addErrorInterceptor, addResponseInterceptor, setAuthTokenProvider } from './http'

export function setupApiInterceptors() {
  const { message } = useDiscreteApi()
  const userStore = useUserStore(pinia)
  const { token } = toRefsUserStore()

  setAuthTokenProvider(() => token.value)

  addResponseInterceptor(({ envelope }) => {
    if (envelope.msg && envelope.msg !== 'success' && envelope.msg !== 'ok') {
      // message.success(envelope.msg)
    }
  })

  addErrorInterceptor((error) => {
    if (error.status === 401 || error.status === 403) {
      const currentRoute = router.currentRoute.value
      const redirectPath = currentRoute?.fullPath
      const isAuthPage = currentRoute?.name === 'signIn' || currentRoute?.name === 'init'
      if (!isAuthPage) {
        userStore.cleanup(redirectPath)
        return
      }
    }
    message.error(error.message || __('admin.service.network_error'))
  })
}
