<script setup lang="ts">
import {
  NColorPicker,
  NDivider,
  NDrawer,
  NDrawerContent,
  NInput,
  NSwitch,
  useModal,
  NSelect,
  NConfigProvider,
  NSlider,
  NInputNumber,
} from 'naive-ui'
import { h, onMounted, ref } from 'vue'

import { ButtonAnimation, ButtonAnimationProvider, CollapseTransitionTrigger } from '@/components'
import { useI18n } from 'vue-i18n'

import { useComponentThemeOverrides, useInjection } from '@/composables'
import { mediaQueryInjectionKey } from '@/injection'
import { getSystemStatus } from '@/services/system'
import { usePreferencesStore, toRefsPreferencesStore } from '@/stores'
import { ccAPCA } from '@/utils/chromaHelper'
import twc from '@/utils/tailwindColor'

import LayoutThumbnail from './component/LayoutThumbnail.vue'
import WatermarkModal from './component/WatermarkModal.vue'

const { isMaxSm } = useInjection(mediaQueryInjectionKey)

const { overlayThemeOverrides } = useComponentThemeOverrides()

const { reset } = usePreferencesStore()

const { preferences, themeColor, sidebarMenu, isDark } = toRefsPreferencesStore()

const { t } = useI18n()
const modal = useModal()

const showPreferencesDrawer = ref(false)
const serverVersion = ref('')

onMounted(() => {
  getSystemStatus()
    .then((res) => {
      const v = res.app.version
      const c = res.app.commit
      serverVersion.value = c ? `${v} (${c})` : v
    })
    .catch(() => {
      serverVersion.value = 'unknown'
    })
})

const colorSwatches = [
  twc.red[500],
  twc.orange[500],
  twc.amber[500],
  twc.yellow[500],
  twc.lime[500],
  twc.green[500],
  twc.emerald[500],
  twc.teal[500],
  twc.cyan[500],
  twc.sky[500],
  twc.blue[500],
  twc.indigo[500],
  twc.violet[500],
  twc.purple[500],
  twc.fuchsia[500],
  twc.pink[500],
]

const showWatermarkModal = () => {
  modal.create({
    autoFocus: false,
    title: t('admin.preferences.modify_watermark'),
    preset: 'dialog',
    content: () => h(WatermarkModal),
    closable: true,
    draggable: true,
    showIcon: false,
    zIndex: 99999,
  })
}
</script>
<template>
  <div>
    <ButtonAnimation
      @click="showPreferencesDrawer = true"
      :title="$t('admin.preferences.system_settings')"
    >
      <span class="iconify ph--gear" />
    </ButtonAnimation>
    <ButtonAnimationProvider>
      <NConfigProvider :theme-overrides="overlayThemeOverrides">
        <NDrawer
          v-model:show="showPreferencesDrawer"
          :auto-focus="false"
          :width="320"
          :theme-overrides="{
            footerPadding: '14px 16px',
          }"
          :style="{
            '--primary-color': themeColor,
          }"
        >
          <NDrawerContent :native-scrollbar="false">
            <template #header>
              <div class="flex items-center gap-x-1">
                <span>{{ $t('admin.preferences.system_settings') }}</span>
                <ButtonAnimation
                  animation="rotate"
                  @click="reset"
                >
                  <span class="iconify ph--arrow-clockwise" />
                </ButtonAnimation>
              </div>
            </template>
            <div>
              <NDivider>{{ $t('admin.preferences.theme_color') }}</NDivider>
              <NColorPicker
                v-bind="$attrs"
                v-model:value="themeColor"
                :swatches="colorSwatches"
              >
                <template #label="currentColor">
                  <span
                    :style="
                      currentColor && {
                        color: ccAPCA(
                          currentColor,
                          twc.neutral[150],
                          twc.neutral[950],
                          '#fff',
                          isDark,
                        ),
                      }
                    "
                    >{{ currentColor }}</span
                  >
                </template>
              </NColorPicker>
            </div>
            <div>
              <NDivider>{{ $t('admin.preferences.nav_mode') }}</NDivider>
              <LayoutThumbnail />
            </div>
            <div>
              <NDivider>{{ $t('admin.preferences.layout') }}</NDivider>
              <div class="flex flex-col gap-y-1.5">
                <CollapseTransitionTrigger>
                  <template #trigger="{ collapsed }">
                    <div class="flex items-center">
                      <div
                        class="flex flex-1 items-center gap-x-1 transition-[color] hover:text-primary"
                      >
                        <span>{{ $t('admin.preferences.expand_sidebar') }}</span>
                        <span
                          class="iconify transition-[rotate] ph--caret-right"
                          :class="{ 'rotate-90': collapsed }"
                        />
                      </div>
                      <NSwitch
                        v-model:value="sidebarMenu.collapsed"
                        :checked-value="false"
                        :unchecked-value="true"
                        :disabled="isMaxSm || preferences.navigationMode !== 'sidebar'"
                        @click.stop
                      />
                    </div>
                  </template>
                  <div class="flex flex-col gap-y-1 pt-1.5 pl-4">
                    <div class="flex items-center justify-between">
                      <span>{{ $t('admin.preferences.sidebar_width') }}</span>
                      <NInputNumber
                        v-model:value="sidebarMenu.width"
                        size="small"
                        :min="sidebarMenu.minWidth"
                        :max="sidebarMenu.maxWidth"
                        :step="1"
                        :disabled="isMaxSm || preferences.navigationMode !== 'sidebar'"
                        :format="(value) => value!.toFixed(0)"
                        style="width: 100px"
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <span>{{ $t('admin.preferences.sidebar_max_width') }}</span>
                      <NInputNumber
                        v-model:value="sidebarMenu.maxWidth"
                        size="small"
                        :min="sidebarMenu.minWidth"
                        :step="1"
                        :disabled="isMaxSm || preferences.navigationMode !== 'sidebar'"
                        style="width: 100px"
                      />
                    </div>
                  </div>
                </CollapseTransitionTrigger>
                <CollapseTransitionTrigger>
                  <template #trigger="{ collapsed }">
                    <div class="flex items-center">
                      <div
                        class="flex flex-1 items-center gap-x-1 transition-[color] hover:text-primary"
                      >
                        <span>{{ $t('admin.preferences.show_tabs') }}</span>
                        <span
                          class="iconify transition-[rotate] ph--caret-right"
                          :class="{ 'rotate-90': collapsed }"
                        />
                      </div>
                      <NSwitch
                        v-model:value="preferences.tabs.show"
                        :disabled="isMaxSm"
                        @click.stop
                      />
                    </div>
                  </template>
                  <div class="flex flex-col gap-y-1 pt-1.5 pl-4">
                    <div class="flex items-center justify-between">
                      <span>{{ $t('admin.preferences.always_show_close') }}</span>
                      <NSwitch
                        v-model:value="preferences.tabs.showTabClose"
                        :disabled="!preferences.tabs.show || isMaxSm"
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <span>{{ $t('admin.preferences.tab_border_position') }}</span>
                      <NSelect
                        v-model:value="preferences.tabs.tabBorderPosition"
                        :options="[
                          {
                            label: t('admin.common.top'),
                            value: 'top',
                          },
                          {
                            label: t('admin.common.bottom'),
                            value: 'bottom',
                          },
                        ]"
                        :disabled="!preferences.tabs.show || isMaxSm"
                        size="small"
                        style="width: 80px"
                      />
                    </div>
                  </div>
                </CollapseTransitionTrigger>
                <CollapseTransitionTrigger>
                  <template #trigger="{ collapsed }">
                    <div class="flex items-center">
                      <div
                        class="flex flex-1 items-center gap-x-1 transition-[color] hover:text-primary"
                      >
                        <span>{{ $t('admin.preferences.show_breadcrumb') }}</span>
                        <span
                          class="iconify transition-[rotate] ph--caret-right"
                          :class="{ 'rotate-90': collapsed }"
                        />
                      </div>
                      <NSwitch
                        v-model:value="preferences.breadcrumb.show"
                        :disabled="isMaxSm || preferences.navigationMode !== 'sidebar'"
                        @click.stop
                      />
                    </div>
                  </template>

                  <div class="flex flex-col gap-y-1 pt-1.5 pl-4">
                    <div class="flex items-center justify-between">
                      <span>{{ $t('admin.preferences.enable_transition') }}</span>
                      <NSwitch
                        v-model:value="preferences.breadcrumb.enableTransition"
                        :disabled="
                          !preferences.breadcrumb.show ||
                          isMaxSm ||
                          preferences.navigationMode !== 'sidebar'
                        "
                      />
                    </div>
                  </div>
                </CollapseTransitionTrigger>

                <div class="flex items-center justify-between">
                  <span>{{ $t('admin.preferences.show_loading_bar') }}</span>
                  <NSwitch v-model:value="preferences.showTopLoadingBar" />
                </div>
                <div class="flex items-center justify-between">
                  <span>{{ $t('admin.preferences.show_logo') }}</span>
                  <NSwitch v-model:value="preferences.showLogo" />
                </div>
                <div class="flex items-center justify-between">
                  <span>{{ $t('admin.preferences.show_nav_buttons') }}</span>
                  <NSwitch
                    v-model:value="preferences.showNavigationButton"
                    :disabled="isMaxSm || preferences.navigationMode !== 'sidebar'"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <span>{{ $t('admin.preferences.show_footer') }}</span>
                  <NSwitch
                    v-model:value="preferences.showFooter"
                    :disabled="isMaxSm"
                  />
                </div>
                <CollapseTransitionTrigger>
                  <template #trigger="{ collapsed }">
                    <div class="flex items-center">
                      <div
                        class="flex flex-1 items-center gap-x-1 transition-[color] hover:text-primary"
                      >
                        <span>{{ $t('admin.preferences.enable_nav_transition') }}</span>
                        <span
                          class="iconify transition-[rotate] ph--caret-right"
                          :class="{ 'rotate-90': collapsed }"
                        />
                      </div>
                      <NSwitch
                        v-model:value="preferences.navigationTransition.enable"
                        :disabled="isMaxSm"
                        @click.stop
                      />
                    </div>
                  </template>
                  <div class="flex flex-col gap-y-1 pt-1.5 pl-4">
                    <div class="flex items-center justify-between">
                      <span>{{ $t('admin.preferences.transition_effect') }}</span>
                      <NSelect
                        v-model:value="preferences.navigationTransition.effect"
                        :options="[
                          {
                            label: t('admin.preferences.slide'),
                            value: 'slider',
                          },
                          {
                            label: t('admin.preferences.zoom'),
                            value: 'scale',
                          },
                          {
                            label: t('admin.preferences.fade'),
                            value: 'fade',
                          },
                          {
                            label: t('admin.preferences.fade_left'),
                            value: 'fade-left',
                          },
                          {
                            label: t('admin.preferences.fade_right'),
                            value: 'fade-right',
                          },
                        ]"
                        :disabled="!preferences.navigationTransition.enable || isMaxSm"
                        size="small"
                        style="width: 110px"
                      />
                    </div>
                  </div>
                </CollapseTransitionTrigger>
              </div>
            </div>
            <div>
              <NDivider>{{ $t('admin.preferences.page_settings') }}</NDivider>
              <div class="flex flex-col gap-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-x-1">
                    <span>{{ $t('admin.preferences.show_watermark') }}</span>
                    <ButtonAnimation
                      size="small"
                      @click="showWatermarkModal"
                      :label="$t('admin.common.edit')"
                      :theme-overrides="{
                        heightSmall: '24px',
                      }"
                    >
                      <span class="iconify size-4 ph--pencil-simple-line" />
                    </ButtonAnimation>
                  </div>
                  <NSwitch v-model:value="preferences.watermark.show" />
                </div>

                <CollapseTransitionTrigger>
                  <template #trigger="{ collapsed }">
                    <div class="flex items-center">
                      <div
                        class="flex flex-1 items-center gap-x-1 transition-[color] hover:text-primary"
                      >
                        <span>{{ $t('admin.preferences.show_frosted_glass') }}</span>
                        <span
                          class="iconify transition-[rotate] ph--caret-right"
                          :class="{ 'rotate-90': collapsed }"
                        />
                      </div>
                      <NSwitch
                        v-model:value="preferences.noise.show"
                        @click.stop
                      />
                    </div>
                  </template>
                  <div class="flex flex-col gap-y-1 pt-1.5 pl-4">
                    <div class="flex items-center justify-between">
                      <span class="mr-4 shrink-0">{{ $t('admin.preferences.opacity') }}</span>
                      <NSlider
                        v-model:value="preferences.noise.opacity"
                        :min="0"
                        :max="100"
                        :step="1"
                      />
                    </div>
                  </div>
                </CollapseTransitionTrigger>
                <CollapseTransitionTrigger>
                  <template #trigger="{ collapsed }">
                    <div class="flex items-center">
                      <div
                        class="flex flex-1 items-center gap-x-1 transition-[color] hover:text-primary"
                      >
                        <span>{{ $t('admin.preferences.enable_background') }}</span>
                        <span
                          class="iconify transition-[rotate] ph--caret-right"
                          :class="{ 'rotate-90': collapsed }"
                        />
                      </div>
                      <NSwitch
                        v-model:value="preferences.backgroundImage.show"
                        @click.stop
                      />
                    </div>
                  </template>
                  <div class="flex flex-col gap-y-1 pt-1.5 pl-4">
                    <div class="flex flex-col gap-y-1">
                      <span class="shrink-0">{{ $t('admin.preferences.background_url') }}</span>
                      <NInput
                        v-model:value="preferences.backgroundImage.url"
                        :placeholder="$t('admin.validation.invalid_url')"
                        size="small"
                        :disabled="!preferences.backgroundImage.show"
                        clearable
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="mr-4 shrink-0">{{ $t('admin.preferences.opacity') }}</span>
                      <NSlider
                        v-model:value="preferences.backgroundImage.opacity"
                        :min="0"
                        :max="100"
                        :step="1"
                        :disabled="!preferences.backgroundImage.show"
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="mr-4 shrink-0">{{ $t('admin.preferences.blur_level') }}</span>
                      <NSlider
                        v-model:value="preferences.backgroundImage.blur"
                        :min="0"
                        :max="50"
                        :step="1"
                        :disabled="!preferences.backgroundImage.show"
                      />
                    </div>
                    <CollapseTransitionTrigger>
                      <template #trigger="{ collapsed }">
                        <div class="flex items-center">
                          <div
                            class="flex flex-1 items-center gap-x-1 transition-[color] hover:text-primary"
                          >
                            <span>{{ $t('admin.preferences.enable_glass_effect') }}</span>
                            <span
                              class="iconify transition-[rotate] ph--caret-right"
                              :class="{ 'rotate-90': collapsed }"
                            />
                          </div>
                          <NSwitch
                            v-model:value="preferences.backgroundImage.glassEffect.enable"
                            :disabled="!preferences.backgroundImage.show"
                            @click.stop
                          />
                        </div>
                      </template>
                      <div class="flex flex-col gap-y-1 pt-1.5 pl-4">
                        <div class="flex items-center justify-between">
                          <span class="mr-4 shrink-0">{{ $t('admin.preferences.component_opacity') }}</span>
                          <NSlider
                            v-model:value="preferences.backgroundImage.glassEffect.opacity"
                            :min="0"
                            :max="100"
                            :step="1"
                            :disabled="
                              !preferences.backgroundImage.show ||
                              !preferences.backgroundImage.glassEffect.enable
                            "
                          />
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="mr-4 shrink-0">{{ $t('admin.preferences.background_blur') }}</span>
                          <NSlider
                            v-model:value="preferences.backgroundImage.glassEffect.blur"
                            :min="0"
                            :max="50"
                            :step="1"
                            :disabled="
                              !preferences.backgroundImage.show ||
                              !preferences.backgroundImage.glassEffect.enable
                            "
                          />
                        </div>
                      </div>
                    </CollapseTransitionTrigger>
                  </div>
                </CollapseTransitionTrigger>
                <div class="flex items-center justify-between">
                  <span>{{ $t('admin.preferences.text_selectable') }}</span>
                  <NSwitch v-model:value="preferences.enableTextSelect" />
                </div>
              </div>
            </div>
            <template #footer>
              <div class="flex w-full items-center justify-between">
                <div class="flex items-center gap-x-1">
                  <span class="iconify size-5 ph--gear-fine" />
                  <span class="leading-4">{{ $t('admin.preferences.current_version') }}</span>
                </div>
                <span class="leading-4">{{ serverVersion || '...' }}</span>
              </div>
            </template>
          </NDrawerContent>
        </NDrawer>
      </NConfigProvider>
    </ButtonAnimationProvider>
  </div>
</template>
