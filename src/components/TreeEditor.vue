<template>
  <div class="space-y-6">
    <!-- Header Actions & Mode Toggle (Visual Canvas vs Text Outline Editor) -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div>
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-sky-600" />
          {{ t('tree.title') }}
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ t('tree.desc') }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Editor Mode Switcher with i18n -->
        <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            @click="editorMode = 'visual'"
            :class="[
              'px-3.5 py-1.5 rounded-md font-bold transition flex items-center gap-1.5',
              editorMode === 'visual'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            <FolderTree class="w-3.5 h-3.5" />
            <span>{{ t('editor.visualMode') }}</span>
          </button>

          <button
            @click="editorMode = 'text'"
            :class="[
              'px-3.5 py-1.5 rounded-md font-bold transition flex items-center gap-1.5',
              editorMode === 'text'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>{{ t('editor.textMode') }}</span>
          </button>
        </div>

        <button
          @click="resetToDefault"
          class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          {{ t('actions.resetDefault') }}
        </button>
      </div>
    </div>

    <!-- Main Layout: Goal & Criteria Tree (2 Cols) & Dedicated Alternatives Panel (1 Col) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 1. Goal & Criteria Hierarchy Editor (2 Cols) -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Mode A: Visual Tree Canvas -->
        <div v-if="editorMode === 'visual'" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FolderTree class="w-4 h-4 text-sky-600" />
              <span>{{ t('layers.goal') }} & {{ t('layers.criteria') }}</span>
            </h3>
            <span class="text-xs text-slate-400 font-normal">{{ t('tree.doubleClickHint') }}</span>
          </div>

          <VisualTreeCanvas
            :goal="modelValue.goal"
            @add-child="addChildNode"
            @delete-node="deleteNode"
            @rename-node="renameNode"
          />
        </div>

        <!-- Mode B: Text Outline Editor -->
        <div v-else>
          <TextTreeEditor
            :goal="modelValue.goal"
            @update:goal="updateGoal"
          />
        </div>
      </div>

      <!-- 2. Dedicated Alternatives Panel / 方案层 (1 Col) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers class="w-4 h-4 text-emerald-600" />
              <span>{{ t('tree.alternativesTitle') }}</span>
            </h3>
            <span class="text-xs text-slate-400">
              {{ t('tree.alternativesCount', { count: modelValue.alternatives.length }) }}
            </span>
          </div>

          <p class="text-xs text-slate-500 mb-4">
            Configure candidates to be evaluated under every leaf criterion in the tree.
          </p>

          <!-- Add Alternative Input -->
          <div class="flex items-center gap-2 mb-4">
            <input
              v-model="newAltName"
              @keyup.enter="addAlternative"
              type="text"
              :placeholder="t('tree.altPlaceholder')"
              class="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              @click="addAlternative"
              class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm"
            >
              <Plus class="w-3.5 h-3.5" />
              {{ t('actions.add') }}
            </button>
          </div>

          <!-- Alternatives List -->
          <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="(alt, idx) in modelValue.alternatives"
              :key="alt.id"
              class="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs hover:border-emerald-400 hover:bg-emerald-50/40 transition"
            >
              <div class="flex items-center gap-2 flex-1 mr-2">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                  {{ idx + 1 }}
                </span>
                <input
                  v-model="alt.name"
                  type="text"
                  class="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none px-1 py-0.5 rounded font-bold text-slate-800"
                />
              </div>

              <button
                @click="deleteAlternative(alt.id)"
                :disabled="modelValue.alternatives.length <= 2"
                :title="t('actions.delete')"
                class="text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <p v-if="modelValue.alternatives.length < 2" class="text-[11px] text-amber-700 mt-4 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
          {{ t('tree.altMinWarning') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AHPModel, AHPNode } from '../types/ahp'
import VisualTreeCanvas from './VisualTreeCanvas.vue'
import TextTreeEditor from './TextTreeEditor.vue'
import { useI18n } from '../i18n'
import { Sparkles, FolderTree, FileText, RotateCcw, Plus, Trash2, Layers } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: AHPModel
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: AHPModel): void
  (e: 'reset-default'): void
}>()

const { t } = useI18n()
const editorMode = ref<'visual' | 'text'>('visual')
const newAltName = ref('')

// Update Goal hierarchy tree from Text DSL Editor
const updateGoal = (newGoal: AHPNode) => {
  const model = JSON.parse(JSON.stringify(props.modelValue)) as AHPModel
  model.goal = newGoal
  emit('update:modelValue', model)
}

// Add sub-node to Criteria Tree
const addChildNode = (parentId: string) => {
  const model = JSON.parse(JSON.stringify(props.modelValue)) as AHPModel
  const findAndAdd = (node: AHPNode): boolean => {
    if (node.id === parentId) {
      if (!node.children) node.children = []
      const newId = `node_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
      node.children.push({
        id: newId,
        name: `Criterion ${node.children.length + 1}`,
      })
      return true
    }
    if (node.children) {
      for (const child of node.children) {
        if (findAndAdd(child)) return true
      }
    }
    return false
  }

  findAndAdd(model.goal)
  emit('update:modelValue', model)
}

// Delete node from Criteria Tree
const deleteNode = (nodeId: string) => {
  const model = JSON.parse(JSON.stringify(props.modelValue)) as AHPModel
  const findAndDelete = (node: AHPNode): boolean => {
    if (node.children) {
      const idx = node.children.findIndex((c) => c.id === nodeId)
      if (idx !== -1) {
        node.children.splice(idx, 1)
        return true
      }
      for (const child of node.children) {
        if (findAndDelete(child)) return true
      }
    }
    return false
  }

  findAndDelete(model.goal)
  emit('update:modelValue', model)
}

// Rename node in Criteria Tree
const renameNode = (nodeId: string, newName: string) => {
  const model = JSON.parse(JSON.stringify(props.modelValue)) as AHPModel
  const findAndRename = (node: AHPNode): boolean => {
    if (node.id === nodeId) {
      node.name = newName
      return true
    }
    if (node.children) {
      for (const child of node.children) {
        if (findAndRename(child)) return true
      }
    }
    return false
  }

  findAndRename(model.goal)
  emit('update:modelValue', model)
}

// Manage Alternatives / 方案层
const addAlternative = () => {
  const name = newAltName.value.trim()
  if (!name) return

  const model = JSON.parse(JSON.stringify(props.modelValue)) as AHPModel
  const newId = `alt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
  model.alternatives.push({
    id: newId,
    name,
  })
  newAltName.value = ''
  emit('update:modelValue', model)
}

const deleteAlternative = (altId: string) => {
  if (props.modelValue.alternatives.length <= 2) return
  const model = JSON.parse(JSON.stringify(props.modelValue)) as AHPModel
  model.alternatives = model.alternatives.filter((a) => a.id !== altId)
  emit('update:modelValue', model)
}

const resetToDefault = () => {
  emit('reset-default')
}
</script>
