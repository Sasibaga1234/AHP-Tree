<template>
  <div class="space-y-8">
    <div
      v-for="target in targets"
      :key="target.id"
      class="p-5 rounded-2xl border bg-white border-slate-200 shadow-sm space-y-5"
    >
      <!-- Target Section Header -->
      <div class="flex items-center justify-between border-b border-slate-200/60 pb-3">
        <div>
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            {{ target.name }}
          </h3>
        </div>
      </div>

      <!-- Pairwise Scale Cards for this Target -->
      <div class="space-y-4">
        <div
          v-for="(pair, idx) in getPairs(target.items)"
          :key="`${pair.itemAId}_${pair.itemBId}`"
          :class="[
            'p-4 rounded-xl border shadow-2xs space-y-3 transition-all duration-200',
            isPairAnswered(target.id, pair.itemAId, pair.itemBId)
              ? 'bg-emerald-50/60 border-emerald-300/80'
              : 'bg-white border-slate-200/90'
          ]"
        >
          <!-- Pair Label header -->
          <div class="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div class="flex items-center gap-1.5 text-sky-700 font-bold">
              <span class="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-[11px]">
                {{ idx + 1 }}
              </span>
              <span>{{ getItemName(target.items, pair.itemAId) }}</span>
            </div>
            <span class="text-slate-400 text-[11px] font-normal">{{ t('comparison.vs') }}</span>
            <div class="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span>{{ getItemName(target.items, pair.itemBId) }}</span>
            </div>
          </div>

          <!-- Saaty 1-9 Bidirectional Scale Control -->
          <div class="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
            <div class="flex justify-between text-[11px] text-slate-500 font-medium mb-2.5 px-1">
              <span class="text-sky-600 font-semibold flex items-center gap-1">
                {{ t('comparison.leftMoreImportant', { name: getItemName(target.items, pair.itemAId) }) }}
              </span>
              <span class="text-emerald-600 font-semibold flex items-center gap-1">
                {{ t('comparison.rightMoreImportant', { name: getItemName(target.items, pair.itemBId) }) }}
              </span>
            </div>

            <!-- 17-Button Horizontal Saaty Scale Grid (9 8 7 6 5 4 3 2 1 2 3 4 5 6 7 8 9) -->
            <div class="w-full grid grid-cols-[repeat(17,minmax(0,1fr))] gap-0.5 sm:gap-1">
              <button
                v-for="opt in scaleOptions"
                :key="opt.labelKey"
                @click="selectScaleValue(target.id, pair.itemAId, pair.itemBId, opt.numericValue)"
                :class="[
                  'w-full py-2 sm:py-2.5 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm font-extrabold transition flex items-center justify-center border shadow-2xs touch-manipulation select-none active:scale-95',
                  isSelected(target.id, pair.itemAId, pair.itemBId, opt.numericValue)
                    ? opt.activeClass
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                ]"
              >
                <span>{{ opt.displayScale }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PairwiseComparison } from '../types/ahp'
import { useI18n } from '../i18n'

const props = defineProps({
  targets: {
    type: Array as () => { id: string; name: string; items: { id: string; name: string }[] }[],
    required: true,
  },
  comparisons: {
    type: Object as () => Record<string, PairwiseComparison[]>,
    required: true,
  },
})

const emit = defineEmits(['update:comparisons'])

const { t } = useI18n()

const getItemName = (items: { id: string; name: string }[], id: string) => {
  return items.find((item) => item.id === id)?.name || id
}

const getPairs = (items: { id: string; name: string }[]) => {
  const result: { itemAId: string; itemBId: string }[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      result.push({
        itemAId: items[i].id,
        itemBId: items[j].id,
      })
    }
  }
  return result
}

// Full 17-point Bidirectional Scale UI: 9 8 7 6 5 4 3 2 1 2 3 4 5 6 7 8 9
const scaleOptions = [
  // Left: Item A is more important (9 .. 2)
  { labelKey: 'L9', displayScale: '9', numericValue: 9, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },
  { labelKey: 'L8', displayScale: '8', numericValue: 8, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },
  { labelKey: 'L7', displayScale: '7', numericValue: 7, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },
  { labelKey: 'L6', displayScale: '6', numericValue: 6, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },
  { labelKey: 'L5', displayScale: '5', numericValue: 5, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },
  { labelKey: 'L4', displayScale: '4', numericValue: 4, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },
  { labelKey: 'L3', displayScale: '3', numericValue: 3, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },
  { labelKey: 'L2', displayScale: '2', numericValue: 2, activeClass: 'bg-sky-600 border-sky-600 text-white shadow-sm' },

  // Center: Equally important (1)
  { labelKey: 'EQ', displayScale: '1', numericValue: 1, activeClass: 'bg-slate-700 border-slate-700 text-white shadow-sm' },

  // Right: Item B is more important (2 .. 9)
  { labelKey: 'R2', displayScale: '2', numericValue: 1 / 2, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
  { labelKey: 'R3', displayScale: '3', numericValue: 1 / 3, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
  { labelKey: 'R4', displayScale: '4', numericValue: 1 / 4, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
  { labelKey: 'R5', displayScale: '5', numericValue: 1 / 5, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
  { labelKey: 'R6', displayScale: '6', numericValue: 1 / 6, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
  { labelKey: 'R7', displayScale: '7', numericValue: 1 / 7, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
  { labelKey: 'R8', displayScale: '8', numericValue: 1 / 8, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
  { labelKey: 'R9', displayScale: '9', numericValue: 1 / 9, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
]

const getComparisonValue = (targetId: string, itemAId: string, itemBId: string): number => {
  const targetList = props.comparisons[targetId] || []
  const match = targetList.find(
    (c) =>
      (c.itemAId === itemAId && c.itemBId === itemBId) ||
      (c.itemAId === itemBId && c.itemBId === itemAId)
  )
  if (!match) return 1
  if (match.itemAId === itemAId) return match.value
  return match.value === 0 ? 1 : 1 / match.value
}

const isSelected = (targetId: string, itemAId: string, itemBId: string, targetVal: number): boolean => {
  const currentVal = getComparisonValue(targetId, itemAId, itemBId)
  return Math.abs(currentVal - targetVal) < 1e-3
}

const selectScaleValue = (targetId: string, itemAId: string, itemBId: string, val: number) => {
  const allDict = { ...props.comparisons }
  const list = [...(allDict[targetId] || [])]

  const idx = list.findIndex(
    (c) =>
      (c.itemAId === itemAId && c.itemBId === itemBId) ||
      (c.itemAId === itemBId && c.itemBId === itemAId)
  )

  if (idx !== -1) {
    list[idx] = { itemAId, itemBId, value: val }
  } else {
    list.push({ itemAId, itemBId, value: val })
  }

  allDict[targetId] = list
  emit('update:comparisons', allDict)
}

const isPairAnswered = (targetId: string, itemAId: string, itemBId: string): boolean => {
  const targetList = props.comparisons[targetId] || []
  const match = targetList.find(
    (c) =>
      (c.itemAId === itemAId && c.itemBId === itemBId) ||
      (c.itemAId === itemBId && c.itemBId === itemAId)
  )
  return !!match
}
</script>