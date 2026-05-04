import i18n from '@/plugins/i18n'
import type { RouteLocationNormalized } from 'vue-router'

const __ = i18n.global.t

type FederationBetaConfirmHandler = () => Promise<boolean>

const FEDERATION_BETA_TITLE = __('admin.federation.beta_title')
const FEDERATION_BETA_CONTENT = __('admin.federation.beta_content')

let federationBetaConfirmHandler: FederationBetaConfirmHandler | null = null

const FEDERATION_BETA_ACK_KEY = 'sanblog:federation-beta-ack'

export function isFederationBetaRoute(to: RouteLocationNormalized) {
  if (to.name === 'settings' && to.query.tab === 'federation') {
    return true
  }

  return (
    typeof to.name === 'string' &&
    [
      'unionManagement',
      'federationInstances',
      'federationOutbound',
      'activityPubOutbox',
      'federationReviews',
      'federationDebug',
      'unionSettingsLegacy',
      'activityPubSettingsLegacy',
    ].includes(to.name)
  )
}

export function registerFederationBetaConfirmHandler(handler: FederationBetaConfirmHandler | null) {
  federationBetaConfirmHandler = handler
}

export function hasAcknowledgedFederationBeta() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(FEDERATION_BETA_ACK_KEY) === '1'
}

export function markFederationBetaAcknowledged() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(FEDERATION_BETA_ACK_KEY, '1')
}

export async function showFederationBetaDialog() {
  if (hasAcknowledgedFederationBeta()) {
    return true
  }

  if (!federationBetaConfirmHandler) {
    return true
  }

  return federationBetaConfirmHandler()
}

export const federationBetaTitle = FEDERATION_BETA_TITLE
export const federationBetaMessage = FEDERATION_BETA_CONTENT
