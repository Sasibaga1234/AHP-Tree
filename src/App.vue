<template>
  <div class="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
    <!-- Top Navigation Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20">
            A
          </div>
          <div>
            <h1 class="font-bold text-slate-900 text-base leading-tight">{{ t('app.title') }}</h1>
            <p class="text-[11px] text-slate-500 font-medium">{{ t('app.subtitle') }}</p>
          </div>
        </div>

        <!-- 3-Step Wizard Navigation -->
        <nav class="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs max-w-full overflow-x-auto flex-nowrap touch-pan-x shrink-0">
          <button
            @click="currentStep = 'structure'"
            :class="[
              'px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5',
              currentStep === 'structure'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            ]"
          >
            <span class="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>{{ t('steps.structure') }}</span>
          </button>

          <ChevronRight class="w-3.5 h-3.5 text-slate-400" />

          <button
            @click="currentStep = 'comparison'"
            :class="[
              'px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5',
              currentStep === 'comparison'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            ]"
          >
            <span class="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>{{ t('steps.comparison') }}</span>
          </button>

          <ChevronRight class="w-3.5 h-3.5 text-slate-400" />

          <button
            @click="currentStep = 'results'"
            :class="[
              'px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5',
              currentStep === 'results'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            ]"
          >
            <span class="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>{{ t('steps.results') }}</span>
          </button>
        </nav>

        <!-- Right Side: Multi-Language Switcher & Import/Export -->
        <div class="flex items-center gap-3">
          <!-- i18n Language Dropdown -->
          <div class="relative">
            <button
              @click="showLangDropdown = !showLangDropdown"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <Globe class="w-4 h-4" />
              <span>{{ t('app.language') }}: {{ getLocaleLabel(locale) }}</span>
              <ChevronDown class="w-3.5 h-3.5" :class="{ 'rotate-180': showLangDropdown }" />
            </button>

            <div
              v-if="showLangDropdown"
              class="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50"
            >
              <button
                v-for="lang in availableLocales"
                :key="lang.code"
                @click="setLocale(lang.code); showLangDropdown = false"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
              >
                <span>{{ lang.flag }}</span>
                <span>{{ lang.name }}</span>
                <CheckCircle2 v-if="locale === lang.code" class="w-4 h-4 text-sky-600 ml-auto" />
              </button>
            </div>
          </div>

          <!-- Import / Export Actions -->
          <div class="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <button
              @click="showExportDialog = true"
              :title="t('actions.exportJson')"
              class="p-2 text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              <Download class="w-4 h-4" />
            </button>
            <button
              @click="showExcelDialog = true"
              :title="t('actions.exportExcel')"
              class="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              <FileSpreadsheet class="w-4 h-4" />
            </button>
            <label
              :title="t('actions.importJson')"
              class="p-2 text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition"
            >
              <Upload class="w-4 h-4" />
              <input type="file" accept=".json" @change="importJSON" class="hidden" />
            </label>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
      <!-- STAGE 1: Structure - Design Tree -->
      <div v-if="currentStep === 'structure'">
        <TreeEditor
          v-model="model"
          @reset-default="resetDefaultModel"
        />

        <!-- Next Button -->
        <div class="mt-6 flex justify-end">
          <button
            @click="currentStep = 'comparison'"
            class="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 shadow-md shadow-sky-600/20 transition flex items-center gap-2 text-sm"
          >
            <span>{{ t('actions.nextComparison') }}</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- STAGE 2: Comparison - Pairwise Input (Single-Column Flow) -->
      <div v-else-if="currentStep === 'comparison'" class="space-y-6">
        <!-- Sub Header & Mode Toggle -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
              <SlidersHorizontal class="w-5 h-5 text-sky-600" />
              {{ t('comparison.title') }}
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ t('comparison.desc') }}
            </p>
          </div>

          <!-- Mode Toggle (Mode A: 1-9 Scale vs Mode B: Matrix Table) -->
          <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              @click="comparisonMode = 'scale'"
              :class="[
                'px-3 py-1.5 rounded-md font-semibold transition',
                comparisonMode === 'scale' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              {{ t('comparison.modeA') }}
            </button>
            <button
              @click="comparisonMode = 'matrix'"
              :class="[
                'px-3 py-1.5 rounded-md font-semibold transition',
                comparisonMode === 'matrix' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              {{ t('comparison.modeB') }}
            </button>
          </div>
        </div>

        <!-- Single-Column Sequential Comparison Flow -->
        <div class="space-y-4">
          <div v-if="comparisonTargets.length === 0" class="p-6 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            ⚠ Tree structure needs at least 2 child items to perform pairwise comparison. Please return to Step 1.
          </div>

          <template v-else>
            <!-- Mode A: Scale (Single Column) -->
            <ComparisonScale
              v-if="comparisonMode === 'scale'"
              :targets="comparisonTargets"
              :comparisons="model.comparisons"
              @update:comparisons="model.comparisons = $event"
            />

            <!-- Mode B: Matrix Table (Single Column) -->
            <ComparisonMatrix
              v-else
              :targets="comparisonTargets"
              :comparisons="model.comparisons"
              @update:comparisons="model.comparisons = $event"
            />
          </template>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between pt-4">
          <button
            @click="currentStep = 'structure'"
            class="px-5 py-2 text-slate-600 font-semibold rounded-xl border border-slate-300 hover:bg-white transition text-xs"
          >
            {{ t('actions.backStructure') }}
          </button>

          <button
            @click="currentStep = 'results'"
            class="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 shadow-md shadow-sky-600/20 transition flex items-center gap-2 text-sm"
          >
            <span>{{ t('actions.calculateResults') }}</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- STAGE 3: Results - Synthesis & Ranking -->
      <div v-else-if="currentStep === 'results'">
        <ResultView :output="ahpOutput" :model="model" />

        <!-- Return to comparison -->
        <div class="mt-6 flex justify-between">
          <button
            @click="currentStep = 'comparison'"
            class="px-5 py-2 text-slate-600 font-semibold rounded-xl border border-slate-300 hover:bg-white transition text-xs"
          >
            {{ t('actions.backComparison') }}
          </button>
        </div>
      </div>
    </main>

    <!-- Named export dialog -->
    <div v-if="showExportDialog" class="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4" @click.self="showExportDialog = false">
      <form @submit.prevent="exportJSON" class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ t('exportDialog.title') }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ t('exportDialog.description') }}</p>
        </div>
        <input
          v-model="exportFileName"
          autofocus
          required
          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          :placeholder="t('exportDialog.placeholder')"
        />
        <div class="flex justify-end gap-3">
          <button type="button" @click="showExportDialog = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">{{ t('exportDialog.cancel') }}</button>
          <button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg">{{ t('exportDialog.confirm') }}</button>
        </div>
      </form>
    </div>

    <div v-if="showExcelDialog" class="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4" @click.self="showExcelDialog = false">
      <form @submit.prevent="exportExcel" class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ t('excelDialog.title') }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ t('excelDialog.description') }}</p>
        </div>
        <div>
          <label class="block mb-1.5 text-xs font-semibold text-slate-700">{{ t('excelDialog.fileName') }}</label>
          <input v-model="excelFileName" required class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label class="block mb-1.5 text-xs font-semibold text-slate-700">{{ t('excelDialog.reportLanguage') }}</label>
          <select v-model="reportLanguage" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option v-for="language in reportLanguages" :key="language.code" :value="language.code">{{ language.name }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" @click="showExcelDialog = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">{{ t('excelDialog.cancel') }}</button>
          <button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">{{ t('excelDialog.confirm') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { AHPExportFile, AHPModel, AHPNode } from './types/ahp'
import { calculateAHPMultilevel, getLeafNodes } from './ahp/ahp'
import { exportAHPWorkbook, type ReportLanguage } from './excel/exportAHP'
import { useI18n } from './i18n'

import TreeEditor from './components/TreeEditor.vue'
import ComparisonScale from './components/ComparisonScale.vue'
import ComparisonMatrix from './components/ComparisonMatrix.vue'
import ResultView from './components/ResultView.vue'

import {
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
  ArrowRight,
  SlidersHorizontal,
  Globe,
  CheckCircle2
  , FileSpreadsheet
} from 'lucide-vue-next'

const { t, locale, setLocale } = useI18n()

const showLangDropdown = ref(false)
const showExportDialog = ref(false)
const exportFileName = ref('ahp-decision')
const showExcelDialog = ref(false)
const excelFileName = ref('ahp-decision-report')
const reportLanguage = ref<ReportLanguage>('en')
const reportLanguages: { code: ReportLanguage; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '简体中文' },
  { code: 'ru', name: 'Русский' },
]

const availableLocales = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '简体中文', flag: '🇨🇳' },
] as const

const getLocaleLabel = (code: string) => {
  return availableLocales.find((l) => l.code === code)?.name || code
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: MouseEvent) => {
  const dropdown = document.querySelector('.relative > div.absolute')
  const button = document.querySelector('.relative > button')
  if (dropdown && button && !dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
    showLangDropdown.value = false
  }
}

// Default Preset Template
const getDefaultModel = (): AHPModel => ({
  goal: {
    id: 'goal_car',
    name: 'Car Selection Goal',
    children: [
      { id: 'crit_price', name: 'Price' },
      { id: 'crit_performance', name: 'Performance' },
      { id: 'crit_comfort', name: 'Comfort' },
    ],
  },
  alternatives: [
    { id: 'alt_toyota', name: 'Toyota' },
    { id: 'alt_honda', name: 'Honda' },
    { id: 'alt_mazda', name: 'Mazda' },
  ],
  comparisons: {
    goal_car: [
      { itemAId: 'crit_price', itemBId: 'crit_performance', value: 3 },
      { itemAId: 'crit_price', itemBId: 'crit_comfort', value: 5 },
      { itemAId: 'crit_performance', itemBId: 'crit_comfort', value: 2 },
    ],
  },
})

// State
const currentStep = ref<'structure' | 'comparison' | 'results'>('structure')
const comparisonMode = ref<'scale' | 'matrix'>('scale')
const model = ref<AHPModel>(getDefaultModel())

const resetDefaultModel = () => {
  model.value = getDefaultModel()
}

// Compute all target nodes that require pairwise comparison
const comparisonTargets = computed(() => {
  const targets: { id: string; name: string; items: { id: string; name: string }[] }[] = []

  // 1. Criteria internal nodes (parent with children)
  const traverse = (node: AHPNode) => {
    if (node.children && node.children.length >= 2) {
      targets.push({
        id: node.id,
        name: `Comparison for [${node.name}]`,
        items: node.children.map((c) => ({ id: c.id, name: c.name })),
      })
      node.children.forEach(traverse)
    }
  }
  traverse(model.value.goal)

  // 2. Leaf criteria comparing options (if alternatives exist)
  if (model.value.alternatives && model.value.alternatives.length >= 2) {
    const leafNodes = getLeafNodes(model.value.goal)
    const altItems = model.value.alternatives.map((a) => ({ id: a.id, name: a.name }))

    leafNodes.forEach((leaf) => {
      targets.push({
        id: leaf.id,
        name: `Option Ratings under [${leaf.name}]`,
        items: altItems,
      })
    })
  }

  return targets
})

// AHP Synthesis Result
const ahpOutput = computed(() => {
  return calculateAHPMultilevel(model.value)
})

// JSON Export / Import
const exportJSON = () => {
  const name = exportFileName.value.trim() || 'ahp-decision'
  const exportFile: AHPExportFile = {
    format: 'ahp-decision-tool',
    version: 2,
    name,
    exportedAt: new Date().toISOString(),
    model: model.value,
    results: ahpOutput.value,
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportFile, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute("href", dataStr)
  downloadAnchor.setAttribute("download", `${name.replace(/[\\/:*?\"<>|]/g, '_')}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
  showExportDialog.value = false
}

const exportExcel = async () => {
  try {
    await exportAHPWorkbook(model.value, excelFileName.value, reportLanguage.value)
    showExcelDialog.value = false
  } catch (err) {
    alert(t('excelDialog.exportError'))
  }
}

const importJSON = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AHPModel | AHPExportFile
        // Version 2 exports contain a result snapshot; legacy model-only JSON remains supported.
        const importedModel = 'model' in parsed ? parsed.model : parsed
        if (importedModel?.goal && Array.isArray(importedModel.alternatives) && importedModel.comparisons) {
          model.value = importedModel
          currentStep.value = 'results'
          alert(t('actions.importSuccess'))
        }
      } catch (err) {
        alert(t('actions.importError'))
      }
    }
    reader.readAsText(file)
  }
}
</script>
