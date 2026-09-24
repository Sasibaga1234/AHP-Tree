<template>
  <div class="text-tree-editor bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
    <!-- Action Bar & Syntax Indicator -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
      <!-- Validation Status Badge -->
      <div class="flex items-center gap-2">
        <div
          v-if="validation.isValid"
          class="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          <span>{{ t('editor.syntaxValid') }}</span>
        </div>

        <div
          v-else
          class="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold shadow-2xs"
        >
          <AlertTriangle class="w-4 h-4 text-amber-600" />
          <span>{{ validation.error }}</span>
        </div>
      </div>

      <!-- Actions: Syntax Help Button -->
      <div class="flex items-center gap-2">
        <button
          @click="showHelpModal = true"
          class="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
        >
          <HelpCircle class="w-3.5 h-3.5 text-sky-600" />
          <span>{{ t('editor.syntaxHelp') }}</span>
        </button>
      </div>
    </div>

    <!-- Textarea Editor with Native Multiline & Monospace Font -->
    <div class="relative">
      <textarea
        v-model="rawText"
        @input="onTextInput"
        rows="12"
        placeholder="Type Goal on Line 1, then use - for Criteria, -- for Sub-criteria..."
        class="w-full p-4 font-mono text-xs sm:text-sm text-slate-800 bg-slate-900/5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 leading-relaxed shadow-inner resize-y"
      ></textarea>
    </div>

    <!-- Syntax Help Modal Popup (Max Height 85vh, Scrollable, Fully i18n translated) -->
    <div
      v-if="showHelpModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col my-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle class="w-5 h-5 text-sky-600" />
            {{ t('helpModal.title') }}
          </h3>
          <button
            @click="showHelpModal = false"
            class="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div class="text-xs text-slate-600 space-y-3 leading-relaxed overflow-y-auto flex-1 pr-1">
          <p class="font-semibold text-slate-800">
            {{ t('helpModal.rulesTitle') }}
          </p>
          <ul class="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
            <li><strong>{{ t('helpModal.ruleLine1') }}</strong></li>
            <li><strong>{{ t('helpModal.ruleL1') }}</strong></li>
            <li><strong>{{ t('helpModal.ruleL2') }}</strong></li>
            <li><strong>{{ t('helpModal.ruleL3') }}</strong></li>
          </ul>

          <p class="font-semibold text-slate-800 pt-1">
            {{ t('helpModal.templatesTitle') }}
          </p>

          <div class="space-y-2">
            <!-- Sample 1: Logistics Provider (智慧物流供应商) -->
            <button
              @click="loadSampleLogistics"
              class="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition"
            >
              <div class="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>{{ t('helpModal.logisticsTitle') }}</span>
                <span class="text-[10px] text-sky-600 font-normal">{{ t('helpModal.clickToLoad') }}</span>
              </div>
              <pre class="font-mono text-[10px] text-slate-500 mt-1 whitespace-pre-wrap">{{ t('helpModal.logisticsTemplateText') }}</pre>
            </button>

            <!-- Sample 2: Car Selection Goal -->
            <button
              @click="loadSampleCar"
              class="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition"
            >
              <div class="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>{{ t('helpModal.carTitle') }}</span>
                <span class="text-[10px] text-sky-600 font-normal">{{ t('helpModal.clickToLoad') }}</span>
              </div>
              <pre class="font-mono text-[10px] text-slate-500 mt-1 whitespace-pre-wrap">{{ t('helpModal.carTemplateText') }}</pre>
            </button>
          </div>
        </div>

        <div class="flex justify-end pt-2 flex-shrink-0 border-t border-slate-100">
          <button
            @click="showHelpModal = false"
            class="px-5 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition text-xs"
          >
            {{ t('editor.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { AHPNode } from '../types/ahp'
import { validateTextDsl, parseTextDsl, serializeToTextDsl, applyStableIds } from '../ahp/textDsl'
import { useI18n } from '../i18n'
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-vue-next'

const props = defineProps<{
  goal: AHPNode
}>()

const emit = defineEmits<{
  (e: 'update:goal', value: AHPNode): void
}>()

const { t } = useI18n()
const rawText = ref('')
const validation = ref(validateTextDsl(''))
const showHelpModal = ref(false)
let isSelfEditing = false

const syncFromProps = () => {
  rawText.value = serializeToTextDsl(props.goal)
  validation.value = validateTextDsl(rawText.value)
}

const onTextInput = () => {
  isSelfEditing = true
  const result = validateTextDsl(rawText.value)
  validation.value = result

  if (result.isValid) {
    // Keep previous IDs so existing pairwise judgments survive text edits.
    const newGoal = applyStableIds(props.goal, parseTextDsl(rawText.value))
    emit('update:goal', newGoal)
  }
}

const loadSampleLogistics = () => {
  isSelfEditing = true
  rawText.value = t('helpModal.logisticsTemplateText')
  onTextInput()
  showHelpModal.value = false
}

const loadSampleCar = () => {
  isSelfEditing = true
  rawText.value = t('helpModal.carTemplateText')
  onTextInput()
  showHelpModal.value = false
}

onMounted(() => {
  syncFromProps()
})

watch(
  () => props.goal,
  () => {
    if (isSelfEditing) {
      isSelfEditing = false
      return
    }
    syncFromProps()
  },
  { deep: true }
)
</script>
