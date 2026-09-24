<template>
  <div class="space-y-8">
    <div
      v-for="target in targets"
      :key="target.id"
      class="p-5 rounded-2xl border bg-white border-slate-200 shadow-sm space-y-4"
    >
      <!-- Matrix Header & Live CR Indicator -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div>
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            {{ t('comparison.matrixTitle', { name: target.name }) }}
          </h3>
        </div>

        <!-- Live CR Indicator -->
        <div
          :class="[
            'px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 border',
            getMatrixResult(target).isConsistent
              ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          ]"
        >
          <AlertTriangle v-if="!getMatrixResult(target).isConsistent" class="w-3.5 h-3.5 text-amber-600" />
          <CheckCircle2 v-else class="w-3.5 h-3.5 text-emerald-600" />
          <span>
            CR = {{ getMatrixResult(target).consistencyRatio.toFixed(3) }}
          </span>
        </div>
      </div>

      <!-- Reciprocal Matrix Table -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <table class="w-full text-xs text-center border-collapse min-w-[500px]">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="p-2 text-left font-bold text-slate-600 w-32">{{ t('comparison.matrixCriteriaCol') }}</th>
              <th
                v-for="item in target.items"
                :key="item.id"
                class="p-2 font-semibold text-slate-700 max-w-[100px] truncate"
                :title="item.name"
              >
                {{ item.name }}
              </th>
              <th class="p-2 font-bold text-sky-700 bg-sky-50 w-24">{{ t('comparison.matrixWeightCol') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(rowItem, rowIndex) in target.items"
              :key="rowItem.id"
              class="border-b border-slate-100 hover:bg-slate-50/50"
            >
              <!-- Row Header -->
              <td class="p-2 font-semibold text-slate-800 text-left bg-slate-50/70 border-r border-slate-200 truncate">
                {{ rowItem.name }}
              </td>

              <!-- Cells -->
              <td
                v-for="(colItem, colIndex) in target.items"
                :key="colItem.id"
                class="p-1.5"
              >
                <!-- Diagonal (i === j) -->
                <input
                  v-if="rowIndex === colIndex"
                  type="text"
                  value="1"
                  disabled
                  class="w-full py-1 text-center bg-slate-100 text-slate-400 font-semibold rounded border border-slate-200 cursor-not-allowed"
                />

                <!-- Upper Triangle (i < j) - Editable -->
                <input
                  v-else-if="rowIndex < colIndex"
                  :value="getCellValueStr(target.id, rowItem.id, colItem.id)"
                  @blur="onCellInput(target.id, rowItem.id, colItem.id, ($event.target as HTMLInputElement).value)"
                  @keyup.enter="($event.target as HTMLInputElement).blur()"
                  type="text"
                  inputmode="decimal"
                  :class="[
                    'w-full py-1 text-center rounded font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 hover:border-slate-400 transition touch-manipulation',
                    isCellAnswered(target.id, rowItem.id, colItem.id)
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-slate-300'
                  ]"
                />

                <!-- Lower Triangle (i > j) - Auto reciprocal -->
                <input
                  v-else
                  :value="getCellValueStr(target.id, rowItem.id, colItem.id)"
                  disabled
                  :class="[
                    'w-full py-1 text-center bg-slate-50 text-slate-600 font-mono rounded border cursor-not-allowed opacity-90',
                    isCellAnswered(target.id, colItem.id, rowItem.id)
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200'
                  ]"
                />
              </td>

              <!-- Computed Weight Column -->
              <td class="p-2 font-bold text-sky-800 bg-sky-50/50 border-l border-slate-200">
                {{ (getMatrixResult(target).priorityVector[rowIndex] * 100).toFixed(1) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!getMatrixResult(target).isConsistent" class="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle class="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div class="space-y-2">
          <div>{{ t('comparison.crWarningText', { cr: getMatrixResult(target).consistencyRatio.toFixed(3) }) }}</div>
          <div v-if="getRepairSuggestion(target)" class="flex flex-wrap items-center gap-2">
            <span>
              {{ t('comparison.repairSuggestion', {
                itemA: getItemName(target.items, getRepairSuggestion(target)!.itemAId),
                itemB: getItemName(target.items, getRepairSuggestion(target)!.itemBId),
                current: formatMatrixValue(getRepairSuggestion(target)!.currentValue),
                suggested: formatMatrixValue(getRepairSuggestion(target)!.suggestedValue),
              }) }}
            </span>
            <button @click="applyRepair(target)" class="px-2.5 py-1 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700 transition">
              {{ t('comparison.applyRepair') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PairwiseComparison } from '../types/ahp'
import { calculateMatrixResult } from '../ahp/ahp'
import { suggestConsistencyRepair } from '../ahp/consistency'
import { parseMatrixValue, formatMatrixValue } from '../ahp/matrix'
import { useI18n } from '../i18n'
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps<{
  targets: { id: string; name: string; items: { id: string; name: string }[] }[]
  comparisons: Record<string, PairwiseComparison[]>
}>()

const emit = defineEmits<{
  (e: 'update:comparisons', value: Record<string, PairwiseComparison[]>): void
}>()

const { t } = useI18n()

const getMatrixResult = (target: { id: string; items: { id: string; name: string }[] }) => {
  const comps = props.comparisons[target.id] || []
  return calculateMatrixResult(target.items, comps)
}

const getItemName = (items: { id: string; name: string }[], id: string) =>
  items.find((item) => item.id === id)?.name || id

const getRepairSuggestion = (target: { id: string; items: { id: string; name: string }[] }) => {
  const result = getMatrixResult(target)
  return result.isConsistent ? null : suggestConsistencyRepair(result.matrix, target.items.map((item) => item.id))
}

const applyRepair = (target: { id: string; items: { id: string; name: string }[] }) => {
  const suggestion = getRepairSuggestion(target)
  if (!suggestion) return
  onCellInput(target.id, suggestion.itemAId, suggestion.itemBId, String(suggestion.suggestedValue))
}

const getCellValue = (targetId: string, itemAId: string, itemBId: string): number => {
  const list = props.comparisons[targetId] || []
  const match = list.find(
    (c) =>
      (c.itemAId === itemAId && c.itemBId === itemBId) ||
      (c.itemAId === itemBId && c.itemBId === itemAId)
  )
  if (!match) return 1
  if (match.itemAId === itemAId) return match.value
  return match.value === 0 ? 1 : 1 / match.value
}

const getCellValueStr = (targetId: string, itemAId: string, itemBId: string): string => {
  const val = getCellValue(targetId, itemAId, itemBId)
  return formatMatrixValue(val)
}

const onCellInput = (targetId: string, itemAId: string, itemBId: string, inputRaw: string) => {
  const parsedVal = parseMatrixValue(inputRaw)
  const allDict = { ...props.comparisons }
  const list = [...(allDict[targetId] || [])]

  const idx = list.findIndex(
    (c) =>
      (c.itemAId === itemAId && c.itemBId === itemBId) ||
      (c.itemAId === itemBId && c.itemBId === itemAId)
  )

  if (idx !== -1) {
    list[idx] = { itemAId, itemBId, value: parsedVal }
  } else {
    list.push({ itemAId, itemBId, value: parsedVal })
  }

  allDict[targetId] = list
  emit('update:comparisons', allDict)
}

const isCellAnswered = (targetId: string, itemAId: string, itemBId: string): boolean => {
  const list = props.comparisons[targetId] || []
  const match = list.find(
    (c) =>
      (c.itemAId === itemAId && c.itemBId === itemBId) ||
      (c.itemAId === itemBId && c.itemBId === itemAId)
  )
  return !!match
}
</script>
