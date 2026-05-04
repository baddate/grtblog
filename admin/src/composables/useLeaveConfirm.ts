import { useDialog } from 'naive-ui'
import { onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useComponentModifier } from '@/composables'
import i18n from '@/plugins/i18n'

import type { Ref } from 'vue'

const __ = i18n.global.t

interface LeaveConfirmOptions {
  when: Ref<boolean> | (() => boolean)
  title?: string
  content?: string
  positiveText?: string
  negativeText?: string
}

function resolveWhen(when: LeaveConfirmOptions['when']) {
  return typeof when === 'function' ? when() : when.value
}

export function useLeaveConfirm(options: LeaveConfirmOptions) {
  const dialog = useDialog()
  const { getModalModifier } = useComponentModifier()

  const title = options.title ?? __('admin.leave_confirm.unsaved_title')
  const content = options.content ?? __('admin.leave_confirm.content')
  const positiveText = options.positiveText ?? __('admin.leave_confirm.positive')
  const negativeText = options.negativeText ?? __('admin.leave_confirm.negative')

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!resolveWhen(options.when)) return
    event.preventDefault()
    event.returnValue = ''
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  onBeforeRouteLeave(() => {
    if (!resolveWhen(options.when)) return true
    return new Promise<boolean>((resolve) => {
      dialog.warning({
        ...getModalModifier(),
        title,
        content,
        positiveText,
        negativeText,
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}
