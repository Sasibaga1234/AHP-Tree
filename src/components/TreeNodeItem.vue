<template>
  <div class="tree-node-item my-1.5">
    <!-- Node Header Bar -->
    <div
      :class="[
        'flex items-center justify-between px-3 py-2 rounded-lg border transition',
        isRoot
          ? 'bg-sky-50 border-sky-200 text-sky-900 font-bold'
          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 text-xs'
      ]"
    >
      <!-- Left: Icon + Label/Input -->
      <div class="flex items-center gap-2 flex-1 mr-3">
        <FolderTree v-if="isRoot" class="w-4 h-4 text-sky-600" />
        <CornerDownRight v-else class="w-3.5 h-3.5 text-slate-400" />

        <input
          v-if="isEditing"
          v-model="editName"
          @keyup.enter="saveRename"
          @blur="saveRename"
          type="text"
          class="px-2 py-0.5 text-xs border border-sky-400 rounded focus:outline-none bg-white"
          ref="inputRef"
        />
        <span
          v-else
          @dblclick="startEdit"
          class="cursor-pointer hover:underline"
        >
          {{ node.name }}
        </span>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1 opacity-90">
        <button
          @click="startEdit"
          title="重命名"
          class="p-1 text-slate-400 hover:text-sky-600 rounded"
        >
          <Edit2 class="w-3 h-3" />
        </button>

        <button
          @click="$emit('add-child', node.id)"
          title="添加子指标"
          class="px-2 py-0.5 text-[11px] font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 rounded flex items-center gap-0.5"
        >
          <Plus class="w-3 h-3" />
          <span>子指标</span>
        </button>

        <button
          v-if="!isRoot"
          @click="$emit('delete-node', node.id)"
          title="删除此节点"
          class="p-1 text-slate-400 hover:text-rose-600 rounded"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Children Subtree (Recursive) -->
    <div
      v-if="node.children && node.children.length > 0"
      class="ml-5 pl-3 border-l-2 border-slate-200 mt-1.5 space-y-1"
    >
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :is-root="false"
        @add-child="$emit('add-child', $event)"
        @delete-node="$emit('delete-node', $event)"
        @rename-node="(id, name) => $emit('rename-node', id, name)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { AHPNode } from '../types/ahp'
import { FolderTree, CornerDownRight, Plus, Trash2, Edit2 } from 'lucide-vue-next'

const props = defineProps<{
  node: AHPNode
  isRoot?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-child', parentId: string): void
  (e: 'delete-node', nodeId: string): void
  (e: 'rename-node', nodeId: string, newName: string): void
}>()

const isEditing = ref(false)
const editName = ref(props.node.name)
const inputRef = ref<HTMLInputElement | null>(null)

const startEdit = () => {
  editName.value = props.node.name
  isEditing.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const saveRename = () => {
  if (editName.value.trim()) {
    emit('rename-node', props.node.id, editName.value.trim())
  }
  isEditing.value = false
}
</script>
