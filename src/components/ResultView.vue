<template>
  <div class="space-y-6">
    <!-- Top Summary Banner -->
    <div class="bg-gradient-to-r from-sky-700 to-indigo-800 text-white p-6 rounded-2xl shadow-md">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Trophy class="w-3.5 h-3.5 text-amber-300" />
            <span>{{ t('results.title') }}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
            {{ t('results.bestOption') }}
            <span class="text-amber-300 font-extrabold">{{ topAlternative?.name || 'N/A' }}</span>
            <span v-if="topAlternative" class="text-sm font-normal ml-2 opacity-90">({{ topAlternative.percentage }})</span>
          </h2>
        </div>

        <!-- Global Consistency Badge -->
        <div
          :class="[
            'px-4 py-2 rounded-xl border font-semibold text-xs flex items-center gap-2 backdrop-blur-sm',
            output.overallConsistency.isAllConsistent
              ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100'
              : 'bg-amber-500/30 border-amber-300/40 text-amber-100'
          ]"
        >
          <CheckCircle2 v-if="output.overallConsistency.isAllConsistent" class="w-5 h-5 text-emerald-300" />
          <AlertTriangle v-else class="w-5 h-5 text-amber-300" />
          <div>
            <div>{{ t('results.overallConsistency') }}{{ output.overallConsistency.isAllConsistent ? t('results.good') : t('results.needReview') }}</div>
            <div class="text-[10px] opacity-80">Max CR = {{ output.overallConsistency.maxCR.toFixed(3) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Results Grid (2 Columns) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 1. Final Alternatives Ranking Card -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award class="w-5 h-5 text-amber-500" />
              {{ t('results.rankingTitle') }}
            </h3>
            <span class="text-xs text-slate-400">{{ t('results.totalPct') }}</span>
          </div>

          <div class="space-y-4">
            <div
              v-for="(item, idx) in output.finalRanking"
              :key="item.id"
              class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2.5">
                  <span
                    :class="[
                      'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm',
                      idx === 0 ? 'bg-amber-400 text-amber-950' :
                      idx === 1 ? 'bg-slate-300 text-slate-900' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                    ]"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="font-bold text-slate-800 text-sm">{{ item.name }}</span>
                </div>
                <span class="font-extrabold text-sky-700 text-sm">{{ item.percentage }}</span>
              </div>

              <!-- Animated Progress Bar -->
              <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  class="bg-sky-600 h-2.5 rounded-full transition-all duration-500"
                  :style="{ width: item.percentage }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-[11px] text-slate-500 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/60">
          {{ t('results.rankingFootnote') }}
        </div>
      </div>

      <!-- 2. Global Criteria Weights Card -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
              <PieChart class="w-5 h-5 text-sky-600" />
              {{ t('results.criteriaTitle') }}
            </h3>
            <span class="text-xs text-slate-400">{{ t('results.criteriaSub') }}</span>
          </div>

          <div class="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            <div
              v-for="item in criteriaGlobalList"
              :key="item.id"
              class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs"
            >
              <div class="flex items-center gap-2 flex-1 mr-3">
                <span class="w-2 h-2 rounded-full bg-sky-500"></span>
                <span class="font-medium text-slate-700">{{ item.name }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="bg-indigo-600 h-1.5 rounded-full"
                    :style="{ width: `${(item.weight * 100).toFixed(1)}%` }"
                  ></div>
                </div>
                <span class="font-bold text-slate-900 w-12 text-right">
                  {{ (item.weight * 100).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-[11px] text-slate-500 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/60">
          {{ t('results.criteriaFootnote') }}
        </div>
      </div>
    </div>

    <!-- 3. Consistency Assessment Details Section -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
        <CheckCircle2 class="w-4 h-4 text-emerald-600" />
        {{ t('results.consistencyReport') }}
      </h3>

      <!-- Consistency Warnings if any -->
      <div v-if="!output.overallConsistency.isAllConsistent" class="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
        <div class="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
          <AlertTriangle class="w-4 h-4 text-amber-600" />
          {{ t('results.warningListTitle') }}
        </div>
        <ul class="list-disc list-inside space-y-1 text-amber-800 font-medium pl-1">
          <li v-for="node in output.overallConsistency.warningNodes" :key="node.id">
            {{ t('results.warningItem', { name: node.name, cr: node.cr.toFixed(3) }) }}
          </li>
        </ul>
      </div>

      <div v-else class="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>{{ t('results.allPassed') }}</span>
      </div>

      <!-- Detail breakdown of matrices -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        <div
          v-for="(res, key) in output.nodeResults"
          :key="key"
          class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5"
        >
          <div class="font-semibold text-slate-800 flex items-center justify-between">
            <span class="truncate max-w-[140px]">{{ getNodeName(key) }}</span>
            <span
              :class="[
                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                res.isConsistent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              ]"
            >
              CR = {{ res.consistencyRatio.toFixed(3) }}
            </span>
          </div>
          <div class="text-[11px] text-slate-500 space-y-0.5 font-mono">
            <div>λmax = {{ res.lambdaMax.toFixed(3) }}</div>
            <div>CI = {{ res.consistencyIndex.toFixed(3) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AHPEngineOutput, AHPModel, AHPNode } from '../types/ahp'
import { useI18n } from '../i18n'
import { Trophy, Award, PieChart, CheckCircle2, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  output: AHPEngineOutput
  model: AHPModel
}>()

const { t } = useI18n()

const topAlternative = computed(() => {
  return props.output.finalRanking[0] || null
})

const getNodeName = (nodeId: string): string => {
  if (nodeId === props.model.goal.id) return `${props.model.goal.name} ${t('results.primaryGoal')}`

  const findName = (n: AHPNode): string | null => {
    if (n.id === nodeId) return n.name
    if (n.children) {
      for (const c of n.children) {
        const res = findName(c)
        if (res) return res
      }
    }
    return null
  }

  const name = findName(props.model.goal)
  if (name) return name

  // Check if it's a leaf node for alternatives
  const leaf = props.output.leafNodeIds.find((id) => id === nodeId)
  if (leaf) {
    const leafName = findName({ id: leaf, name: leaf } as AHPNode) || leaf
    return `${leafName} ${t('results.optionRating')}`
  }

  return nodeId
}

const criteriaGlobalList = computed(() => {
  const result: { id: string; name: string; weight: number }[] = []

  const collect = (n: AHPNode) => {
    if (n.id !== props.model.goal.id) {
      result.push({
        id: n.id,
        name: n.name,
        weight: props.output.globalWeights[n.id] || 0,
      })
    }
    if (n.children) {
      n.children.forEach(collect)
    }
  }

  collect(props.model.goal)
  return result.sort((a, b) => b.weight - a.weight)
})
</script>
