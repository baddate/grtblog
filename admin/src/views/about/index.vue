<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { NScrollbar, NTag } from 'naive-ui'
import { onMounted, ref } from 'vue'

import packageJson from '@/../package.json'
import { ScrollContainer } from '@/components'
import { getSystemStatus } from '@/services/system'

defineOptions({
  name: 'About',
})

const APP_NAME = import.meta.env.VITE_APP_NAME
const version = ref('')
const commit = ref('')
const { dependencies, devDependencies } = packageJson

getSystemStatus()
  .then((res) => {
    version.value = res.app.version
    commit.value = res.app.commit ?? ''
  })
  .catch(() => {
    version.value = 'unknown'
  })

let codeToHtml: any
const dependenciesCodeHighlight = ref('')
const devDependenciesCodeHighlight = ref('')

const frontendTech = [
  { name: 'Vue 3', icon: 'ph--vue-logo', color: '#42b883', desc: t('admin.about.tech_vue_desc') },
  { name: 'Naive UI', icon: null, color: '#75B93F', desc: t('admin.about.tech_naive_ui_desc') },
  { name: 'Vite', icon: 'ph--lightning', color: '#9499ff', desc: t('admin.about.tech_vite_desc') },
  {
    name: 'TailwindCSS 4',
    icon: 'ph--wind',
    color: '#00bcff',
    desc: t('admin.about.tech_tailwind_desc'),
  },
  {
    name: 'TypeScript',
    icon: 'ph--file-ts',
    color: '#3178C6',
    desc: t('admin.about.tech_typescript_desc'),
  },
  {
    name: 'Pinia',
    icon: 'ph--tree-structure',
    color: '#FFD859',
    desc: t('admin.about.tech_pinia_desc'),
  },
]

const backendTech = [
  { name: 'Go', icon: 'ph--code', color: '#00ADD8', desc: t('admin.about.tech_go_desc') },
  {
    name: 'Fiber',
    icon: 'ph--rocket-launch',
    color: '#00ACD7',
    desc: t('admin.about.tech_fiber_desc'),
  },
  {
    name: 'PostgreSQL',
    icon: 'ph--database',
    color: '#4169E1',
    desc: t('admin.about.tech_postgresql_desc'),
  },
  {
    name: 'Redis',
    icon: 'ph--hard-drives',
    color: '#DC382D',
    desc: t('admin.about.tech_redis_desc'),
  },
  {
    name: 'SvelteKit',
    icon: 'ph--monitor',
    color: '#FF3E00',
    desc: t('admin.about.tech_sveltekit_desc'),
  },
]

const features = [
  {
    icon: 'ph--article',
    title: t('admin.about.feature_markdown_title'),
    desc: t('admin.about.feature_markdown_desc'),
  },
  {
    icon: 'ph--newspaper',
    title: t('admin.about.feature_content_title'),
    desc: t('admin.about.feature_content_desc'),
  },
  {
    icon: 'ph--cloud-arrow-up',
    title: t('admin.about.feature_media_title'),
    desc: t('admin.about.feature_media_desc'),
  },
  {
    icon: 'ph--shield-check',
    title: t('admin.about.feature_security_title'),
    desc: t('admin.about.feature_security_desc'),
  },
  {
    icon: 'ph--arrows-clockwise',
    title: t('admin.about.feature_event_title'),
    desc: t('admin.about.feature_event_desc'),
  },
  {
    icon: 'ph--chart-line-up',
    title: t('admin.about.feature_analytics_title'),
    desc: t('admin.about.feature_analytics_desc'),
  },
]

onMounted(async () => {
  if (!codeToHtml) {
    // @ts-ignore
    const shiki = await import('https://cdn.jsdelivr.net/npm/shiki@3.7.0/+esm')
    codeToHtml = shiki.codeToHtml
  }

  codeToHtml(JSON.stringify(dependencies, null, 2), {
    lang: 'json',
    themes: {
      light: 'min-light',
      dark: 'dark-plus',
    },
  })
    .then((result: string) => (dependenciesCodeHighlight.value = result))
    .catch(() => (dependenciesCodeHighlight.value = JSON.stringify(dependencies, null, 2)))

  codeToHtml(JSON.stringify(devDependencies, null, 2), {
    lang: 'json',
    themes: {
      light: 'min-light',
      dark: 'dark-plus',
    },
  })
    .then((result: string) => (devDependenciesCodeHighlight.value = result))
    .catch(() => (devDependenciesCodeHighlight.value = JSON.stringify(devDependencies, null, 2)))
})
</script>

<template>
  <ScrollContainer wrapper-class="flex flex-col gap-y-4 pb-6">
    <!-- Section 1: Hero -->
    <div class="mt-4 mb-2">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Sanblog Admin</h1>
        <NTag
          size="small"
          round
          type="info"
          >{{ version }}{{ commit ? ` (${commit})` : '' }}</NTag
        >
      </div>
      <p class="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {{ $t('admin.about.tagline') }}
      </p>
      <p class="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {{ $t('admin.about.description') }}
      </p>
    </div>

    <!-- Section 2: Tech Stack -->
    <div>
      <h2 class="mb-3 text-base font-medium text-neutral-700 dark:text-neutral-200">
        {{ $t('admin.about.section_frontend') }}
      </h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="tech in frontendTech"
          :key="tech.name"
          class="flex items-center gap-3 rounded border border-naive-border bg-naive-card p-4 transition-[background-color,border-color]"
        >
          <div
            class="grid size-10 shrink-0 place-items-center rounded-full"
            :style="{ backgroundColor: tech.color + '18' }"
          >
            <span
              v-if="tech.icon"
              class="iconify size-5"
              :class="tech.icon"
              :style="{ color: tech.color }"
            />
            <span
              v-else
              class="text-sm font-bold"
              :style="{ color: tech.color }"
              >N</span
            >
          </div>
          <div class="min-w-0">
            <div class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {{ tech.name }}
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ tech.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h2 class="mb-3 text-base font-medium text-neutral-700 dark:text-neutral-200">
        {{ $t('admin.about.section_backend') }}
      </h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="tech in backendTech"
          :key="tech.name"
          class="flex items-center gap-3 rounded border border-naive-border bg-naive-card p-4 transition-[background-color,border-color]"
        >
          <div
            class="grid size-10 shrink-0 place-items-center rounded-full"
            :style="{ backgroundColor: tech.color + '18' }"
          >
            <span
              class="iconify size-5"
              :class="tech.icon"
              :style="{ color: tech.color }"
            />
          </div>
          <div class="min-w-0">
            <div class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {{ tech.name }}
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ tech.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Features -->
    <div>
      <h2 class="mb-3 text-base font-medium text-neutral-700 dark:text-neutral-200">
        {{ $t('admin.about.section_features') }}
      </h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feat in features"
          :key="feat.title"
          class="flex gap-3 rounded border border-naive-border bg-naive-card p-4 transition-[background-color,border-color]"
        >
          <div class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/8">
            <span
              class="iconify size-5 text-primary"
              :class="feat.icon"
            />
          </div>
          <div class="min-w-0">
            <div class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {{ feat.title }}
            </div>
            <div class="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {{ feat.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Architecture Overview -->
    <div>
      <h2 class="mb-3 text-base font-medium text-neutral-700 dark:text-neutral-200">
        {{ $t('admin.about.section_architecture') }}
      </h2>
      <div
        class="rounded border border-naive-border bg-naive-card p-5 transition-[background-color,border-color]"
      >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <!-- API Layer -->
          <div
            class="flex flex-col items-center gap-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50"
          >
            <span class="iconify size-6 text-sky-500 ph--cloud" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">{{
              $t('admin.about.architecture_api')
            }}</span>
            <div class="flex flex-wrap justify-center gap-1.5">
              <NTag
                size="tiny"
                round
                >Fiber</NTag
              >
              <NTag
                size="tiny"
                round
                >GORM</NTag
              >
              <NTag
                size="tiny"
                round
                >JWT</NTag
              >
              <NTag
                size="tiny"
                round
                >WebSocket</NTag
              >
            </div>
            <div class="flex items-center gap-1 text-xs text-neutral-400">
              <span class="iconify size-3.5 ph--arrows-left-right" />
              <span>PostgreSQL / Redis</span>
            </div>
          </div>

          <!-- SSR Layer -->
          <div
            class="flex flex-col items-center gap-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50"
          >
            <span class="iconify size-6 text-orange-500 ph--browser" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">{{
              $t('admin.about.architecture_ssr')
            }}</span>
            <div class="flex flex-wrap justify-center gap-1.5">
              <NTag
                size="tiny"
                round
                >{{ $t('admin.about.tag_ssr') }}</NTag
              >
              <NTag
                size="tiny"
                round
                >{{ $t('admin.about.tag_static_snapshot') }}</NTag
              >
              <NTag
                size="tiny"
                round
                >{{ $t('admin.about.tag_content_hash') }}</NTag
              >
            </div>
            <div class="flex items-center gap-1 text-xs text-neutral-400">
              <span class="iconify size-3.5 ph--arrow-right" />
              <span>{{ $t('admin.about.architecture_html_snapshot') }}</span>
            </div>
          </div>

          <!-- Admin Layer -->
          <div
            class="flex flex-col items-center gap-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50"
          >
            <span class="iconify size-6 text-emerald-500 ph--layout" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">{{
              $t('admin.about.architecture_admin')
            }}</span>
            <div class="flex flex-wrap justify-center gap-1.5">
              <NTag
                size="tiny"
                round
                >Naive UI</NTag
              >
              <NTag
                size="tiny"
                round
                >Pinia</NTag
              >
              <NTag
                size="tiny"
                round
                >TailwindCSS</NTag
              >
            </div>
            <div class="flex items-center gap-1 text-xs text-neutral-400">
              <span class="iconify size-3.5 ph--arrows-left-right" />
              <span>{{ $t('admin.about.architecture_ws_comm') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 5: Dependencies -->
    <div>
      <h2 class="mb-3 text-base font-medium text-neutral-700 dark:text-neutral-200">
        {{ $t('admin.about.section_dependencies') }}
      </h2>
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div
          class="rounded border border-naive-border bg-naive-card p-4 transition-[background-color,border-color]"
        >
          <NTag
            class="mb-3"
            :bordered="false"
            type="info"
            size="small"
            >dependencies</NTag
          >
          <NScrollbar style="max-height: 420px">
            <div v-html="dependenciesCodeHighlight"></div>
          </NScrollbar>
        </div>
        <div
          class="rounded border border-naive-border bg-naive-card p-4 transition-[background-color,border-color]"
        >
          <NTag
            class="mb-3"
            :bordered="false"
            type="info"
            size="small"
            >devDependencies</NTag
          >
          <NScrollbar style="max-height: 420px">
            <div v-html="devDependenciesCodeHighlight"></div>
          </NScrollbar>
        </div>
      </div>
    </div>
  </ScrollContainer>
</template>
