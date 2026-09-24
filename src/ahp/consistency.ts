/**
 * Saaty's Random Index (RI) table for matrix sizes 1 to 15.
 */
export const RANDOM_INDEX_TABLE: Record<number, number> = {
  1: 0.00,
  2: 0.00,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
  11: 1.51,
  12: 1.48,
  13: 1.56,
  14: 1.57,
  15: 1.59,
}

export type ConsistencyResult = {
  lambdaMax: number
  consistencyIndex: number
  consistencyRatio: number
  isConsistent: boolean
}

import type { ConsistencyRepairSuggestion } from '../types/ahp'

/**
 * Finds the judgment with the largest disagreement against the indirect paths
 * through the other items. The proposed value is their geometric mean, which
 * preserves the multiplicative logic used by AHP.
 */
export function suggestConsistencyRepair(
  matrix: number[][],
  itemIds: string[]
): ConsistencyRepairSuggestion | null {
  if (matrix.length < 3 || itemIds.length !== matrix.length) return null

  let best: ConsistencyRepairSuggestion | null = null
  let largestDeviation = 0

  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix.length; j++) {
      const impliedLogs: number[] = []
      for (let k = 0; k < matrix.length; k++) {
        if (k !== i && k !== j) {
          const implied = matrix[i][k] * matrix[k][j]
          if (Number.isFinite(implied) && implied > 0) impliedLogs.push(Math.log(implied))
        }
      }
      if (!impliedLogs.length) continue

      const suggestedValue = Math.exp(impliedLogs.reduce((sum, value) => sum + value, 0) / impliedLogs.length)
      const currentValue = matrix[i][j]
      const deviation = Math.abs(Math.log(currentValue) - Math.log(suggestedValue))
      if (deviation > largestDeviation) {
        largestDeviation = deviation
        best = {
          itemAId: itemIds[i],
          itemBId: itemIds[j],
          currentValue,
          suggestedValue,
          supportingPaths: impliedLogs.length,
        }
      }
    }
  }
  return best
}

/**
 * Calculates max eigenvalue (lambda_max), CI, CR, and checks consistency.
 */
export function evaluateConsistency(
  matrix: number[][],
  priorityVector: number[]
): ConsistencyResult {
  const n = matrix.length
  if (n <= 2) {
    return {
      lambdaMax: n,
      consistencyIndex: 0,
      consistencyRatio: 0,
      isConsistent: true,
    }
  }

  // Calculate (A * w)_i
  let lambdaMaxSum = 0
  for (let i = 0; i < n; i++) {
    let aw_i = 0
    for (let j = 0; j < n; j++) {
      aw_i += matrix[i][j] * priorityVector[j]
    }
    lambdaMaxSum += aw_i / priorityVector[i]
  }

  const lambdaMax = lambdaMaxSum / n
  const consistencyIndex = Math.max(0, (lambdaMax - n) / (n - 1))
  const ri = RANDOM_INDEX_TABLE[n] || 1.59
  const consistencyRatio = ri === 0 ? 0 : consistencyIndex / ri
  const isConsistent = consistencyRatio <= 0.10

  return {
    lambdaMax,
    consistencyIndex,
    consistencyRatio,
    isConsistent,
  }
}
