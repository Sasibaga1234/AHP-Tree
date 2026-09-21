import type {
  AHPModel,
  AHPEngineOutput,
  AHPNode,
  MatrixResult,
  RankingItem,
  PairwiseComparison,
} from '../types/ahp'
import { buildMatrix } from './matrix'
import { computePriorityVector } from './priority'
import { evaluateConsistency } from './consistency'

/**
 * Calculates matrix, local weights, lambdaMax, CI, and CR for a set of items and comparisons.
 */
export function calculateMatrixResult(
  items: { id: string; name: string }[],
  comparisons: PairwiseComparison[] = []
): MatrixResult {
  const n = items.length
  if (n === 0) {
    return {
      matrix: [],
      items: [],
      priorityVector: [],
      lambdaMax: 0,
      consistencyIndex: 0,
      consistencyRatio: 0,
      isConsistent: true,
    }
  }

  const matrix = buildMatrix(items, comparisons)
  const priorityVector = computePriorityVector(matrix)
  const consistency = evaluateConsistency(matrix, priorityVector)

  return {
    matrix,
    items,
    priorityVector,
    ...consistency,
  }
}

/**
 * Collects all leaf nodes from the AHP criteria tree.
 */
export function getLeafNodes(root: AHPNode): AHPNode[] {
  if (!root.children || root.children.length === 0) {
    return [root]
  }

  const leaves: AHPNode[] = []
  const traverse = (node: AHPNode) => {
    if (!node.children || node.children.length === 0) {
      leaves.push(node)
    } else {
      node.children.forEach(traverse)
    }
  }

  // Children of Goal are the top criteria
  root.children.forEach(traverse)
  return leaves
}

/**
 * Executes full AHP multi-level synthesis and alternative ranking.
 */
export function calculateAHPMultilevel(model: AHPModel): AHPEngineOutput {
  const { goal, alternatives, comparisons } = model

  const nodeResults: Record<string, MatrixResult> = {}
  const globalWeights: Record<string, number> = {}
  const warningNodes: { id: string; name: string; cr: number }[] = []

  globalWeights[goal.id] = 1.0

  // 1. Traverse criteria tree and compute global weights for criteria
  const processNode = (node: AHPNode) => {
    if (node.children && node.children.length > 0) {
      const items = node.children.map((c) => ({ id: c.id, name: c.name }))
      const nodeComps = comparisons[node.id] || []
      const res = calculateMatrixResult(items, nodeComps)
      nodeResults[node.id] = res

      if (!res.isConsistent) {
        warningNodes.push({ id: node.id, name: node.name, cr: res.consistencyRatio })
      }

      const parentGlobalWeight = globalWeights[node.id] ?? 1.0
      node.children.forEach((child, index) => {
        const localWeight = res.priorityVector[index] ?? (1 / items.length)
        globalWeights[child.id] = parentGlobalWeight * localWeight
        processNode(child)
      })
    }
  }

  processNode(goal)

  // 2. Identify leaf criteria
  const leafNodes = getLeafNodes(goal)
  const leafNodeIds = leafNodes.map((l) => l.id)

  // 3. Compute alternative scores under each leaf criterion
  const altScores: Record<string, number> = {}
  alternatives.forEach((alt) => {
    altScores[alt.id] = 0
  })

  if (alternatives.length > 0) {
    const altItems = alternatives.map((a) => ({ id: a.id, name: a.name }))

    leafNodes.forEach((leaf) => {
      const leafGlobalWeight = globalWeights[leaf.id] || 0
      const altComps = comparisons[leaf.id] || []
      const res = calculateMatrixResult(altItems, altComps)
      nodeResults[leaf.id] = res

      if (!res.isConsistent) {
        warningNodes.push({ id: leaf.id, name: `${leaf.name} (方案比较)`, cr: res.consistencyRatio })
      }

      alternatives.forEach((alt, index) => {
        const localAltWeight = res.priorityVector[index] ?? (1 / alternatives.length)
        altScores[alt.id] += leafGlobalWeight * localAltWeight
      })
    })
  }

  // 4. Create final ranking
  const totalScore = Object.values(altScores).reduce((a, b) => a + b, 0)
  const ranking: RankingItem[] = alternatives
    .map((alt) => {
      const score = altScores[alt.id] || 0
      const pct = totalScore > 0 ? (score / totalScore) * 100 : 0
      return {
        id: alt.id,
        name: alt.name,
        score,
        percentage: `${pct.toFixed(1)}%`,
      }
    })
    .sort((a, b) => b.score - a.score)

  // 5. Overall consistency check
  let maxCR = 0
  Object.values(nodeResults).forEach((res) => {
    if (res.consistencyRatio > maxCR) {
      maxCR = res.consistencyRatio
    }
  })

  return {
    nodeResults,
    globalWeights,
    leafNodeIds,
    finalRanking: ranking,
    overallConsistency: {
      maxCR,
      isAllConsistent: warningNodes.length === 0,
      warningNodes,
    },
  }
}
