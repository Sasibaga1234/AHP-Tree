<template>
  <div class="flex flex-col items-center gap-14">
    <!-- Node Card with data-node-id attribute for stable DOM querying -->
    <div
      :data-node-id="node.id"
      :class="[
        'node-card transition-all p-3.5 rounded-xl border shadow-md w-60',
        isRoot
          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-2 border-sky-300/40 w-72 shadow-lg'
          : !hasChildren
          ? 'bg-emerald-50/90 border-2 border-emerald-300 text-emerald-950 hover:border-emerald-500'
          : 'bg-white border-slate-200 hover:border-sky-400 text-slate-800'
      ]"
    >
      <!-- Header Badge -->
      <div class="flex items-center justify-between text-[11px] font-semibold mb-1 opacity-90">
        <span class="flex items-center gap-1 font-bold">
          <Sparkles v-if="isRoot" class="w-3.5 h-3.5 text-amber-300" />
          <FolderTree v-else class="w-3.5 h-3.5" />
          <span>{{ isRoot ? 'Goal (Root)' : !hasChildren ? 'Leaf (Alternative/Item)' : 'Node' }}</span>
        </span>

        <button
          v-if="!isRoot"
          @click="$emit('delete-node', node.id)"
          class="p-1 hover:text-rose-600 rounded transition opacity-75 touch-manipulation active:scale-95"
          :title="t('actions.delete')"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Title / Input -->
      <div class="flex items-center justify-between gap-1 mt-1">
        <input
          v-if="editingNodeId === node.id"
          :value="editingName"
          @input="$emit('start-rename', node.id, ($event.target as HTMLInputElement).value)"
          @keyup.enter="$emit('save-rename', node.id)"
          @blur="$emit('save-rename', node.id)"
          type="text"
          class="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-white rounded border border-sky-400 focus:outline-none"
          ref="editInput"
        />
        <h4
          v-else
          @dblclick="$emit('start-rename', node.id, node.name)"
          @click="$emit('start-rename', node.id, node.name)"
          class="font-bold text-xs truncate cursor-pointer hover:underline flex-1 py-0.5"
          :title="t('tree.doubleClickHint')"
        >
          {{ node.name }}
        </h4>

        <button
          @click="$emit('start-rename', node.id, node.name)"
          class="p-1 opacity-70 hover:opacity-100 rounded touch-manipulation active:scale-95"
          :title="t('actions.rename')"
        >
          <Edit3 class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Actions -->
      <div class="mt-2.5 flex items-center justify-end">
        <button
          @click="$emit('add-child', node.id)"
          :class="[
            'px-2.5 py-1 text-[11px] font-medium rounded-md transition flex items-center gap-1 touch-manipulation active:scale-95 shadow-2xs',
            isRoot ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60'
          ]"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>{{ t('actions.addChild') }}</span>
        </button>
      </div>
    </div>

    <!-- Children Subtree Horizontally (Strict flex-nowrap) -->
    <div
      v-if="hasChildren"
      class="flex flex-nowrap justify-center gap-8 min-w-max"
    >
      <TreeNodeRenderer
        v-for="c in node.children"
        :key="c.id"
        :node="c"
        :is-root="false"
        :editing-node-id="editingNodeId"
        :editing-name="editingName"
        @start-rename="(id, name) => $emit('start-rename', id, name)"
        @save-rename="$emit('save-rename', $event)"
        @add-child="$emit('add-child', $event)"
        @delete-node="$emit('delete-node', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AHPNode } from '../types/ahp'
import { useI18n } from '../i18n'
import { Sparkles, FolderTree, Plus, Trash2, Edit3 } from 'lucide-vue-next'

const props = defineProps<{
  node: AHPNode
  isRoot?: boolean
  editingNodeId: string | null
  editingName: string
}>()

defineEmits<{
  (e: 'start-rename', id: string, name: string): void
  (e: 'save-rename', id: string): void
  (e: 'add-child', parentId: string): void
  (e: 'delete-node', nodeId: string): void
}>()

const { t } = useI18n()

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})
</script>
