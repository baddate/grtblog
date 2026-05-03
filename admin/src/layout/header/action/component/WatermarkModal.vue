<script setup lang="ts">
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker,
  NSlider,
  NSwitch,
  NSelect,
  NScrollbar,
  NConfigProvider,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

import { HintHelp } from '@/components'
import { useComponentThemeOverrides } from '@/composables'
import { toRefsPreferencesStore } from '@/stores'

const { watermark } = toRefsPreferencesStore()
const { t } = useI18n()

const { overlayThemeOverrides } = useComponentThemeOverrides()
</script>
<template>
  <NConfigProvider :theme-overrides="overlayThemeOverrides">
    <NScrollbar
      style="max-height: 400px"
      contentClass="pr-3 py-6"
    >
      <NForm
        :label-width="80"
        :model="watermark"
        :show-feedback="false"
        class="space-y-4"
      >
        <NFormItem
          :label="$t('admin.preferences.watermark_content')"
          path="content"
        >
          <NInput
            type="textarea"
            v-model:value="watermark.content"
            clearable
          />
        </NFormItem>

        <div class="flex gap-x-4">
          <NFormItem
            :label="$t('admin.preferences.font_size')"
            path="fontSize"
            class="w-full"
          >
            <NInputNumber
              v-model:value="watermark.fontSize"
              :min="8"
              :max="32"
            />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.font_color')"
            path="fontColor"
            class="w-full"
          >
            <NColorPicker v-model:value="watermark.fontColor" />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.font_style')"
            path="fontStyle"
            class="w-full"
          >
            <NSelect
              v-model:value="watermark.fontStyle"
              :options="[
                { label: t('admin.preferences.font_normal'), value: 'normal' },
                { label: t('admin.preferences.font_italic'), value: 'italic' },
                { label: t('admin.watermark.oblique'), value: 'oblique' },
                { label: t('admin.preferences.font_bold'), value: 'bold' },
                { label: t('admin.watermark.thin'), value: 'thin' },
                { label: t('admin.watermark.thin'), value: 'extralight1' },
                { label: t('admin.watermark.thin'), value: 'extralight2' },
                { label: t('admin.watermark.thin'), value: 'extralight3' },
                { label: t('admin.watermark.thin'), value: 'extralight4' },
                { label: t('admin.watermark.thin'), value: 'extralight5' },
                { label: t('admin.watermark.thin'), value: 'extralight6' },
                { label: t('admin.watermark.thin'), value: 'extralight7' },
                { label: t('admin.watermark.thin'), value: 'extralight8' },
                { label: t('admin.watermark.thin'), value: 'extralight9' },
                { label: t('admin.watermark.thin'), value: 'extralight10' },
              ]"
            />
          </NFormItem>
        </div>

        <div class="flex gap-x-4">
          <NFormItem
            :label="$t('admin.preferences.line_height')"
            path="lineHeight"
            class="w-full"
          >
            <NInputNumber
              v-model:value="watermark.lineHeight"
              :min="1"
            />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.font_weight')"
            path="fontWeight"
            class="w-full"
          >
            <NInputNumber
              v-model:value="watermark.fontWeight"
              :min="100"
              :max="900"
              :step="100"
            />
          </NFormItem>
        </div>
        <div class="flex gap-x-4">
          <NFormItem
            :label="$t('admin.preferences.width')"
            path="width"
          >
            <NInputNumber
              v-model:value="watermark.width"
              class="w-full"
              :min="1"
            />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.height')"
            path="height"
          >
            <NInputNumber
              v-model:value="watermark.height"
              class="w-full"
              :min="1"
            />
          </NFormItem>
        </div>

        <div class="flex gap-x-4">
          <NFormItem
            :label="$t('admin.preferences.x_gap')"
            path="xGap"
          >
            <NInputNumber
              v-model:value="watermark.xGap"
              class="w-full"
            />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.y_gap')"
            path="yGap"
          >
            <NInputNumber
              v-model:value="watermark.yGap"
              class="w-full"
            />
          </NFormItem>
        </div>
        <div class="flex gap-x-4">
          <NFormItem
            :label="$t('admin.preferences.x_offset')"
            path="xoffset"
          >
            <NInputNumber
              v-model:value="watermark.xOffset"
              class="w-full"
            />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.y_offset')"
            path="yGap"
          >
            <NInputNumber
              v-model:value="watermark.yOffset"
              class="w-full"
            />
          </NFormItem>
        </div>
        <div class="flex gap-x-4">
          <NFormItem
            :label="$t('admin.preferences.rotation')"
            path="rotate"
            class="w-full"
          >
            <NSlider
              v-model:value="watermark.rotate"
              :min="-90"
              :max="90"
            />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.global_rotation')"
            path="globalRotate"
            class="w-full"
          >
            <NSlider
              v-model:value="watermark.globalRotate"
              :min="-180"
              :max="180"
            />
          </NFormItem>
          <NFormItem
            :label="$t('admin.preferences.cross_boundary')"
            path="cross"
            class="w-full"
          >
            <NSwitch v-model:value="watermark.cross" />
          </NFormItem>
        </div>
        <NFormItem
          :label="$t('admin.preferences.image_url')"
          path="image"
        >
          <NInput
            type="textarea"
            v-model:value="watermark.image"
            clearable
          />
        </NFormItem>

        <div class="flex gap-x-4">
          <NFormItem
            path="imageWidth"
            class="w-full"
            :show-label="false"
          >
            <div>
              <HintHelp
                :label="$t('admin.preferences.image_width')"
                :content="$t('admin.watermark.restart_hint')"
                class="pb-1.5"
              />
              <NInputNumber v-model:value="watermark.imageWidth" />
            </div>
          </NFormItem>
          <NFormItem
            path="imageHeight"
            class="w-full"
            :show-label="false"
          >
            <div>
              <HintHelp
                :label="$t('admin.preferences.image_height')"
                :content="$t('admin.watermark.restart_hint')"
                class="pb-1.5"
              />
              <NInputNumber v-model:value="watermark.imageHeight" />
            </div>
          </NFormItem>

          <NFormItem
            path="imageOpacity"
            class="w-full"
            :show-label="false"
          >
            <div class="flex h-full flex-col">
              <HintHelp
                :label="$t('admin.preferences.image_opacity')"
                :content="$t('admin.watermark.restart_hint')"
                class="pb-1.5"
              />
              <NSlider
                v-model:value="watermark.imageOpacity"
                :min="0"
                :max="1"
                :step="0.01"
                class="mt-2"
              />
            </div>
          </NFormItem>
        </div>
      </NForm>
    </NScrollbar>
  </NConfigProvider>
</template>
