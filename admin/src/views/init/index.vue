<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  NAlert,
  NButton,
  NCard,
  NConfigProvider,
  NForm,
  NFormItem,
  NH1,
  NH2,
  NInput,
  NSpin,
  NStep,
  NSteps,
  NTag,
  useMessage,
  type GlobalThemeOverrides,
} from 'naive-ui'
import { computed, onMounted, reactive, ref } from 'vue'

import noiseBg from '@/assets/noise.png'
import { getConfigProviderProps } from '@/composables'
import ThemeModePopover from '@/layout/header/action/ThemeModePopover.vue'
import router from '@/router'
import { getSetupState, login, register } from '@/services/auth'
import { ApiError } from '@/services/http'
import { bootstrapObservabilityPages } from '@/services/observability'
import { completeAllUpgradeGuides } from '@/services/system'
import { updateWebsiteInfo } from '@/services/website-info'
import { useUserStore, usePreferencesStore } from '@/stores'
import ThemeColorPopover from '@/views/sign-in/components/ThemeColorPopover.vue'
import { applyEnabledFeatures } from '@/views/upgrade-guide/apply-features'
import FeatureToggleList from '@/views/upgrade-guide/FeatureToggleList.vue'
import { getAllGuides } from '@/views/upgrade-guide/registry'

import type { FormItemRule } from 'naive-ui'

defineOptions({
  name: 'InitPage',
})

const message = useMessage()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()

// 使用全局主题配置
const configProviderProps = getConfigProviderProps()

// 将主题色转换为 RGB 格式供 CSS 使用
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) return '0, 0, 0'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

const primaryColorRgb = computed(() => hexToRgb(preferencesStore.themeColor))

const themeOverrides: GlobalThemeOverrides = {
  common: {
    fontWeightStrong: '600',
  },
  Input: {
    heightMedium: '34px',
    fontSizeMedium: '13px',
    boxShadowFocus: '0 0 0 2px rgba(var(--primary-color-rgb), 0.1)',
  },
  Button: {
    heightMedium: '34px',
    fontSizeMedium: '13px',
    fontWeight: '500',
  },
  Form: {
    labelFontSizeTop: '12px',
    labelFontWeight: '500',
    labelTextColor: 'rgb(115, 115, 115)',
    feedbackPadding: '4px 0 0 2px',
    feedbackFontSize: '11px',
  },
  Steps: {
    indicatorSizeSmall: '20px',
    headerFontSizeSmall: '13px',
  },
}

const loadingState = ref(true)
const submitting = ref(false)
const setupState = ref<Awaited<ReturnType<typeof getSetupState>> | null>(null)
const formRef = ref<InstanceType<typeof NForm> | null>(null)
const currentStep = ref(1)

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  websiteName: '',
  publicUrl: '',
  description: '',
  keywords: '',
})

// Feature toggles from the upgrade guide registry
const allGuides = getAllGuides()
const featureStates = reactive<Record<string, boolean>>({})

const requiredTrimmedRule = (message: string): FormItemRule => ({
  validator: (_rule, value: string) => !!(value || '').trim(),
  message,
  trigger: ['input', 'blur'],
})

const rules: Record<string, FormItemRule[]> = {
  username: [requiredTrimmedRule(t('admin.validation.username_required'))],
  nickname: [requiredTrimmedRule(t('admin.validation.nickname_required'))],
  email: [
    {
      validator: (_rule, value: string) => {
        const email = (value || '').trim()
        if (!email) return new Error(t('admin.validation.email_required'))
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return new Error(t('admin.validation.invalid_email'))
        }
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
  password: [{ required: true, message: t('admin.validation.password_required'), trigger: ['input', 'blur'] }],
  confirmPassword: [
    { required: true, message: t('admin.validation.confirm_password_required'), trigger: ['input', 'blur'] },
    {
      validator: () => form.password === form.confirmPassword,
      message: t('admin.validation.password_mismatch'),
      trigger: ['input', 'blur'],
    },
  ],
  websiteName: [requiredTrimmedRule(t('admin.validation.site_name_required'))],
  publicUrl: [requiredTrimmedRule(t('admin.validation.public_url_required'))],
  description: [requiredTrimmedRule(t('admin.validation.description_required'))],
  keywords: [requiredTrimmedRule(t('admin.validation.keywords_required'))],
}

const needsAccountSetup = computed(() => !setupState.value?.hasUser)
const needsWebsiteSetup = computed(() => !setupState.value?.websiteInfoReady)

function normalizePublicURL(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return trimmed.replace(/\/+$/, '')
}

async function loadSetupState() {
  loadingState.value = true
  try {
    const state = await getSetupState()
    setupState.value = state
    if (!state.needsSetup) {
      await router.replace({ name: 'signIn' })
      return
    }
    if (!state.hasUser) {
      form.publicUrl = window.location.origin
    }
  } catch (error) {
    if (!(error instanceof ApiError)) {
      message.error(t('admin.init.load_failed'))
    }
  } finally {
    loadingState.value = false
  }
}

function goToSignIn() {
  router.replace({
    name: 'signIn',
    query: {
      r: '/settings?tab=site-info',
    },
  })
}

const totalSteps = 3

async function handleNextStep() {
  try {
    // Step 3 (federation) has no required fields, skip validation
    if (currentStep.value < 3) {
      await formRef.value?.validate()
    }
    if (currentStep.value < totalSteps) {
      currentStep.value++
    } else {
      await submitSetup()
    }
  } catch (e) {
    // Validation failed
  }
}

async function submitSetup() {
  submitting.value = true
  try {
    if (needsAccountSetup.value) {
      await register({
        username: form.username.trim(),
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      const loginResp = await login({
        credential: form.username.trim(),
        password: form.password,
      })
      userStore.setAuth({
        token: loginResp.token,
        user: {
          id: loginResp.user.id,
          username: loginResp.user.username,
          nickname: loginResp.user.nickname,
          email: loginResp.user.email,
          avatar: loginResp.user.avatar,
          isAdmin: loginResp.user.isAdmin,
          roles: loginResp.roles,
          permissions: loginResp.permissions,
          createdAt: loginResp.user.createdAt,
          updatedAt: loginResp.user.updatedAt,
        },
      })
    }

    if (needsWebsiteSetup.value) {
      const websiteName = form.websiteName.trim()
      const publicURL = normalizePublicURL(form.publicUrl)
      const description = form.description.trim()
      const keywords = form.keywords.trim()
      const tasks: Promise<unknown>[] = [
        updateWebsiteInfo('website_name', { value: websiteName }),
        updateWebsiteInfo('public_url', { value: publicURL }),
        updateWebsiteInfo('api_url', { value: `${publicURL}/api/v2` }),
        updateWebsiteInfo('description', { value: description }),
        updateWebsiteInfo('keywords', { value: keywords }),
      ]
      await Promise.all(tasks)
    }

    // Apply feature configs from registry
    try {
      await applyEnabledFeatures(allGuides, featureStates, normalizePublicURL(form.publicUrl))
    } catch {
      message.warning(t('admin.init.feature_config_failed'))
    }

    // Mark all upgrade guides as completed for fresh install
    try {
      await completeAllUpgradeGuides()
    } catch {
      // Non-critical
    }

    let bootstrapFailed = false
    try {
      await bootstrapObservabilityPages()
    } catch {
      bootstrapFailed = true
    }

    if (bootstrapFailed) {
      message.warning(t('admin.init.bootstrap_failed'))
    } else {
      message.success(t('admin.init.bootstrap_success'))
    }
    await router.replace({ path: '/' })
  } catch (error) {
    if (error instanceof ApiError) return
    message.error(t('admin.init.init_failed'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSetupState()
})
</script>

<template>
  <NConfigProvider
    v-bind="configProviderProps"
    :theme-overrides="themeOverrides"
  >
    <div
      class="relative flex min-h-screen w-screen bg-neutral-50 font-sans text-neutral-900 transition-colors dark:bg-neutral-950 dark:text-neutral-100"
      :style="{ '--primary-color-rgb': primaryColorRgb }"
    >
      <!-- 主题控制栏 -->
      <div class="absolute top-0 right-0 z-100 flex items-center gap-4 p-8">
        <ThemeColorPopover />
        <ThemeModePopover />
      </div>

      <!-- Loading State -->
      <NSpin
        :show="loadingState"
        class="m-auto"
        size="large"
        v-if="loadingState"
      >
        <template #description>{{ $t('admin.init.loading_environment') }}</template>
      </NSpin>

      <template v-else-if="setupState">
        <!-- New Setup Split Layout -->
        <div
          v-if="!setupState.hasUser"
          class="flex h-screen w-full overflow-hidden"
        >
          <!-- Left: Brand -->
          <div
            class="brand-panel relative hidden flex-[0_0_45%] flex-col justify-center overflow-hidden px-20 lg:flex"
            :style="{
              background: `linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.05) 0%, rgba(var(--primary-color-rgb), 0.02) 100%)`,
            }"
          >
            <!-- Noise Texture -->
            <div
              class="absolute inset-0 z-0 opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay"
              :style="{ backgroundImage: `url(${noiseBg})` }"
            ></div>

            <!-- Decorative Elements -->
            <div
              class="absolute -top-[10%] -left-[10%] z-0 h-[600px] w-[600px] rounded-full bg-white opacity-40 blur-3xl dark:opacity-5"
            ></div>

            <div class="relative z-10 max-w-lg">
              <div class="mb-10 flex items-center gap-3 opacity-60">
                <div
                  class="h-1 w-10 rounded-full"
                  :style="{ background: `rgb(var(--primary-color-rgb))` }"
                ></div>
                <span
                  class="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400"
                  >Welcome aboard</span
                >
              </div>

              <NH1
                class="mb-6 text-4xl leading-tight font-bold tracking-tight text-neutral-900 dark:text-white"
              >
                {{ $t('admin.init.brand_start') }}
                <br />
                <span :style="{ color: `rgb(var(--primary-color-rgb))` }">{{ $t('admin.init.brand_journey') }}</span>
              </NH1>

              <div
                class="text-base leading-relaxed font-light text-neutral-500 dark:text-neutral-400"
              >
                <p class="mb-3">{{ $t('admin.init.brand_desc1') }}</p>
                <p>{{ $t('admin.init.brand_desc2') }}</p>
              </div>

              <div
                class="mt-20 flex items-center gap-4 text-[10px] font-medium tracking-widest text-neutral-400 uppercase"
              >
                <span>sanblog V2.1.0</span>
                <span class="h-0.5 w-0.5 rounded-full bg-neutral-300"></span>
                <span>DESIGNED FOR CREATORS</span>
              </div>
            </div>
          </div>

          <!-- Right: Form -->
          <div
            class="flex flex-1 overflow-y-auto bg-white p-8 transition-colors sm:p-12 dark:bg-neutral-900"
          >
            <div class="mx-auto flex min-h-full w-full max-w-[360px] flex-col justify-center py-4">
              <div class="mb-10">
                <div class="mb-6 flex items-center justify-between">
                  <div
                    class="text-[10px] font-bold tracking-widest whitespace-nowrap text-neutral-400 uppercase"
                  >
                    Step {{ currentStep }} / {{ totalSteps }}
                  </div>
                  <NSteps
                    :current="currentStep"
                    size="small"
                    class="ml-4 w-36"
                  >
                    <NStep />
                    <NStep />
                    <NStep />
                  </NSteps>
                </div>

                <NH2 class="m-0 text-2xl font-bold tracking-tight">
                  {{
                    currentStep === 1
                      ? $t('admin.init.step_account')
                      : currentStep === 2
                        ? $t('admin.init.step_site')
                        : $t('admin.init.step_features')
                  }}
                </NH2>
                <p class="mt-2 text-[13px] leading-relaxed text-neutral-500">
                  {{
                    currentStep === 1
                      ? $t('admin.init.step_account_desc')
                      : currentStep === 2
                        ? $t('admin.init.step_site_desc')
                        : $t('admin.init.step_features_desc')
                  }}
                </p>
              </div>

              <NForm
                ref="formRef"
                :model="form"
                :rules="rules"
                label-placement="top"
                :show-require-mark="false"
                class="mb-6"
                size="medium"
              >
                <!-- Step 1: Admin Account -->
                <Transition
                  name="fade-slide"
                  mode="out-in"
                >
                  <div
                    v-if="currentStep === 1"
                    key="step1"
                    class="space-y-0.5"
                  >
                    <NFormItem
                      :label="$t('admin.init.label_username')"
                      path="username"
                    >
                      <NInput
                        v-model:value="form.username"
                        :placeholder="t('admin.init.placeholder_username')"
                      >
                      </NInput>
                    </NFormItem>
                    <NFormItem
                      :label="$t('admin.init.label_nickname')"
                      path="nickname"
                    >
                      <NInput
                        v-model:value="form.nickname"
                        :placeholder="t('admin.init.placeholder_nickname')"
                      >
                      </NInput>
                    </NFormItem>
                    <NFormItem
                      :label="$t('admin.init.label_password')"
                      path="password"
                    >
                      <NInput
                        v-model:value="form.password"
                        type="password"
                        show-password-on="click"
                        :placeholder="t('admin.init.placeholder_password')"
                      >
                      </NInput>
                    </NFormItem>
                    <NFormItem
                      :label="$t('admin.init.label_confirm_password')"
                      path="confirmPassword"
                    >
                      <NInput
                        v-model:value="form.confirmPassword"
                        type="password"
                        show-password-on="click"
                        :placeholder="t('admin.init.placeholder_confirm_password')"
                      >
                      </NInput>
                    </NFormItem>
                    <NFormItem
                      :label="$t('admin.init.label_email')"
                      path="email"
                    >
                      <NInput
                        v-model:value="form.email"
                        :placeholder="t('admin.init.placeholder_email')"
                      >
                      </NInput>
                    </NFormItem>
                  </div>
                  <!-- Step 2: Site Info -->
                  <div
                    v-else-if="currentStep === 2"
                    key="step2"
                    class="space-y-0.5"
                  >
                    <NFormItem
                      :label="$t('admin.init.label_site_name')"
                      path="websiteName"
                    >
                      <NInput
                        v-model:value="form.websiteName"
                        :placeholder="t('admin.init.placeholder_site_name')"
                      >
                      </NInput>
                    </NFormItem>
                    <NFormItem
                      :label="$t('admin.init.label_public_url')"
                      path="publicUrl"
                    >
                      <NInput
                        v-model:value="form.publicUrl"
                        :placeholder="t('admin.init.placeholder_public_url')"
                      >
                      </NInput>
                    </NFormItem>
                    <NFormItem
                      :label="$t('admin.init.label_description')"
                      path="description"
                    >
                      <NInput
                        v-model:value="form.description"
                        type="textarea"
                        :placeholder="t('admin.init.placeholder_description')"
                        :rows="2"
                        class="resize-none"
                      />
                    </NFormItem>
                    <NFormItem
                      :label="$t('admin.init.label_keywords')"
                      path="keywords"
                    >
                      <NInput
                        v-model:value="form.keywords"
                        :placeholder="t('admin.init.placeholder_keywords')"
                      >
                      </NInput>
                    </NFormItem>
                  </div>
                  <!-- Step 3: Features from registry -->
                  <div
                    v-else
                    key="step3"
                  >
                    <FeatureToggleList
                      :guides="allGuides"
                      :primary-color-rgb="primaryColorRgb"
                      v-model:states="featureStates"
                    />
                  </div>
                </Transition>
              </NForm>

              <div
                class="flex items-center justify-between border-t border-neutral-100 pt-6 dark:border-neutral-800"
              >
                <NButton
                  v-if="currentStep > 1"
                  quaternary
                  size="medium"
                  @click="currentStep--"
                >
                  {{ $t('admin.init.prev_step') }}
                </NButton>
                <div v-else></div>

                <NButton
                  type="primary"
                  size="medium"
                  :loading="submitting"
                  @click="handleNextStep"
                  class="min-w-25 shadow-sm"
                >
                  {{ currentStep === totalSteps ? $t('admin.init.start') : $t('admin.init.next_step') }}
                </NButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Existing User State -->
        <div
          v-else
          class="flex h-screen w-full overflow-hidden"
        >
          <!-- Left: Brand -->
          <div
            class="brand-panel relative hidden flex-[0_0_45%] flex-col justify-center overflow-hidden px-20 lg:flex"
            :style="{
              background: `linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.05) 0%, rgba(var(--primary-color-rgb), 0.02) 100%)`,
            }"
          >
            <div
              class="absolute inset-0 z-0 opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay"
              :style="{ backgroundImage: `url(${noiseBg})` }"
            ></div>
            <div
              class="absolute -top-[10%] -left-[10%] z-0 h-[600px] w-[600px] rounded-full bg-white opacity-40 blur-3xl dark:opacity-5"
            ></div>

            <div class="relative z-10 max-w-lg">
              <div class="mb-10 flex items-center gap-3 opacity-60">
                <div
                  class="h-1 w-10 rounded-full"
                  :style="{ background: `rgb(var(--primary-color-rgb))` }"
                ></div>
                <span
                  class="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400"
                  >Welcome aboard</span
                >
              </div>

              <NH1
                class="mb-6 text-4xl leading-tight font-bold tracking-tight text-neutral-900 dark:text-white"
              >
                {{ $t('admin.init.brand_start') }}
                <br />
                <span :style="{ color: `rgb(var(--primary-color-rgb))` }">{{ $t('admin.init.brand_journey') }}</span>
              </NH1>

              <div
                class="text-base leading-relaxed font-light text-neutral-500 dark:text-neutral-400"
              >
                <p class="mb-3">{{ $t('admin.init.brand_desc1') }}</p>
                <p>{{ $t('admin.init.brand_desc2') }}</p>
              </div>

              <div
                class="mt-20 flex items-center gap-4 text-[10px] font-medium tracking-widest text-neutral-400 uppercase"
              >
                <span>sanblog V2.1.0</span>
                <span class="h-0.5 w-0.5 rounded-full bg-neutral-300"></span>
                <span>DESIGNED FOR CREATORS</span>
              </div>
            </div>
          </div>

          <!-- Right: Result -->
          <div
            class="flex flex-1 overflow-y-auto bg-white p-8 transition-colors sm:p-12 dark:bg-neutral-900"
          >
            <div class="mx-auto flex min-h-full w-full max-w-[420px] flex-col justify-center py-4">
              <NCard
                size="large"
                bordered
              >
                <div class="mb-4 flex items-center justify-between"></div>
                <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                  {{ $t('admin.init.almost_done') }}
                </h3>
                <p class="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {{ $t('admin.init.site_info_incomplete') }}
                </p>
                <NAlert
                  type="warning"
                  :show-icon="false"
                  class="mt-4 mb-6"
                >
                  {{ $t('admin.init.site_info_alert') }}
                </NAlert>
                <NButton
                  type="primary"
                  size="large"
                  block
                  @click="goToSignIn"
                >
                  {{ $t('admin.init.go_to_signin') }}
                </NButton>
              </NCard>
            </div>
          </div>
        </div>
      </template>
    </div>
  </NConfigProvider>
</template>
