<template>
  <div class="visual-tree-wrapper relative w-full rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-inner min-h-[600px] flex flex-col">
    <!-- Top Floating Toolbar: Zoom Controls -->
    <div class="flex items-center justify-end p-3 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-20">
      <!-- Zoom Controls -->
      <div class="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          @click="zoomOut"
          title="Zoom Out"
          class="p-1 hover:bg-white rounded text-slate-600 transition"
        >
          <ZoomOut class="w-4 h-4" />
        </button>

        <span class="font-mono font-bold text-slate-700 w-12 text-center select-none">
          {{ Math.round(zoomScale * 100) }}%
        </span>

        <button
          @click="zoomIn"
          title="Zoom In"
          class="p-1 hover:bg-white rounded text-slate-600 transition"
        >
          <ZoomIn class="w-4 h-4" />
        </button>

        <div class="h-4 w-px bg-slate-300 mx-0.5"></div>

        <button
          @click="resetZoom"
          title="Reset Zoom (100%)"
          class="px-2 py-0.5 font-bold hover:bg-white rounded text-slate-600 text-[11px] transition"
        >
          1:1
        </button>
      </div>
    </div>

    <!-- Scalable / Pan Viewport Container -->
    <div
      class="canvas-viewport flex-1 w-full overflow-auto p-4 sm:p-8 relative flex justify-center touch-pan-x touch-pan-y select-none"
      ref="viewportRef"
    >
      <!-- Transformed Scalable Tree Container -->
      <div
        class="transformed-content relative transition-transform duration-150 ease-out origin-top flex flex-col items-center min-w-max pb-12"
        :style="{ transform: `scale(${zoomScale})` }"
        ref="contentRef"
      >
        <!-- Dynamic SVG Connector Canvas Overlay -->
        <svg
          class="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          ref="svgRef"
        >
          <path
            v-for="(path, idx) in connectorPaths"
            :key="`c_${idx}`"
            :d="path"
            fill="none"
            stroke="#0284c7"
            stroke-width="2.5"
            stroke-dasharray="5 3"
            stroke-linecap="round"
            class="transition-all duration-200"
          />
        </svg>

        <!-- Top-Down Recursive N-Level Hierarchical Tree Layout -->
        <div class="relative z-10 flex flex-col items-center gap-16 w-full px-8 py-4">
          <!-- Recursive Node Renderer Component -->
          <TreeNodeRenderer
            :node="goal"
            :is-root="true"
            :editing-node-id="editingNodeId"
            :editing-name="editingName"
            @start-rename="startRename"
            @save-rename="saveRename"
            @add-child="$emit('add-child', $event)"
            @delete-node="$emit('delete-node', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { AHPNode } from '../types/ahp'
import TreeNodeRenderer from './TreeNodeRenderer.vue'
import { ZoomIn, ZoomOut } from 'lucide-vue-next'

const props = defineProps<{
  goal: AHPNode
}>()

const emit = defineEmits<{
  (e: 'add-child', parentId: string): void
  (e: 'delete-node', nodeId: string): void
  (e: 'rename-node', nodeId: string, newName: string): void
}>()

// Canvas Zoom Scale
const zoomScale = ref(1.0)
const zoomIn = () => {
  if (zoomScale.value < 2.5) {
    zoomScale.value = Math.min(2.5, zoomScale.value + 0.15)
  }
}
const zoomOut = () => {
  if (zoomScale.value > 0.4) {
    zoomScale.value = Math.max(0.4, zoomScale.value - 0.15)
  }
}
const resetZoom = () => {
  zoomScale.value = 1.0
}

const svgRef = ref<SVGElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const connectorPaths = ref<string[]>([])

const editingNodeId = ref<string | null>(null)
const editingName = ref('')

const startRename = (id: string, name: string) => {
  editingNodeId.value = id
  editingName.value = name
}

const saveRename = (id: string) => {
  if (editingName.value.trim()) {
    emit('rename-node', id, editingName.value.trim())
  }
  editingNodeId.value = null
}

/**
 * Bulletproof relative offset calculation inside contentRef.
 * Computes layout offsets before CSS transform scale matrix application!
 */
const getElementOffset = (el: HTMLElement, container: HTMLElement) => {
  let x = 0
  let y = 0
  let current: HTMLElement | null = el

  while (current && current !== container) {
    x += current.offsetLeft
    y += current.offsetTop
    current = current.offsetParent as HTMLElement | null
  }

  return {
    left: x,
    top: y,
    width: el.offsetWidth,
    height: el.offsetHeight,
  }
}

/**
 * Deterministic SVG Connector Line Update Engine
 * Queries live DOM elements by data-node-id attribute.
 * Guarantees visible stroke for vertical lines (1 child, odd 3/5/7 center child).
 */
const updateConnectors = () => {
  if (!contentRef.value) return
  const container = contentRef.value
  const paths: string[] = []

  const drawTreeConnections = (parent: AHPNode) => {
    if (!parent.children || parent.children.length === 0) return

    const parentEl = container.querySelector(`[data-node-id="${parent.id}"]`) as HTMLElement | null
    if (!parentEl) return

    const pOffset = getElementOffset(parentEl, container)
    const px = pOffset.left + pOffset.width / 2
    const py = pOffset.top + pOffset.height

    parent.children.forEach((child) => {
      const childEl = container.querySelector(`[data-node-id="${child.id}"]`) as HTMLElement | null
      if (childEl) {
        const cOffset = getElementOffset(childEl, container)
        const cx = cOffset.left + cOffset.width / 2
        const cy = cOffset.top

        // If parent and child are vertically aligned (1 child or center of 3/5/7 odd children), draw straight line
        if (Math.abs(px - cx) < 3) {
          paths.push(`M ${px} ${py} L ${px} ${cy}`)
        } else {
          // If offset, draw smooth Bezier curve
          const midY = py + (cy - py) / 2
          paths.push(`M ${px} ${py} C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`)
        }
      }

      // Deep recursion for N layers
      drawTreeConnections(child)
    })
  }

  drawTreeConnections(props.goal)
  connectorPaths.value = paths
}

// Multi-phase connector refresh helper
const refreshConnectorsMultiPhase = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      updateConnectors()
      setTimeout(updateConnectors, 30)
      setTimeout(updateConnectors, 100)
      setTimeout(updateConnectors, 250)
    })
  })
}

let mutationObserver: MutationObserver | null = null

onMounted(() => {
  refreshConnectorsMultiPhase()
  window.addEventListener('resize', updateConnectors)

  if (contentRef.value) {
    mutationObserver = new MutationObserver(() => {
      refreshConnectorsMultiPhase()
    })
    mutationObserver.observe(contentRef.value, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateConnectors)
  if (mutationObserver) {
    mutationObserver.disconnect()
  }
})

watch(
  () => props.goal,
  () => {
    refreshConnectorsMultiPhase()
  },
  { deep: true }
)

watch(zoomScale, () => {
  refreshConnectorsMultiPhase()
})
</script>