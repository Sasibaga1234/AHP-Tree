export type AHPNode = {
  id: string
  name: string
  children?: AHPNode[]
}

export type Alternative = {
  id: string
  name: string
}

export type PairwiseComparison = {
  itemAId: string
  itemBId: string
  value: number // a_ij: value of A relative to B
}

export type MatrixResult = {
  matrix: number[][]
  items: { id: string; name: string }[]
  priorityVector: number[]
  lambdaMax: number
  consistencyIndex: number
  consistencyRatio: number
  isConsistent: boolean
}

export type RankingItem = {
  id: string
  name: string
  score: number
  percentage: string
}

export type AHPModel = {
  goal: AHPNode
  alternatives: Alternative[]
  // Key is parent node ID (for criteria comparison) or leaf criterion ID (for alternative comparison)
  comparisons: Record<string, PairwiseComparison[]>
}

export type AHPEngineOutput = {
  nodeResults: Record<string, MatrixResult>
  globalWeights: Record<string, number> // node.id -> global weight
  leafNodeIds: string[]
  finalRanking: RankingItem[]
  overallConsistency: {
    maxCR: number
    isAllConsistent: boolean
    warningNodes: { id: string; name: string; cr: number }[]
  }
}
