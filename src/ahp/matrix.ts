import type { PairwiseComparison } from '../types/ahp'

/**
 * Parses user matrix cell input into a positive number.
 * Examples: "3" -> 3, "1/3" -> 0.33333333, "0.2" -> 0.2
 */
export function parseMatrixValue(input: string | number): number {
  if (typeof input === 'number') {
    return isFinite(input) && input > 0 ? input : 1
  }

  const trimmed = input.trim()
  if (!trimmed) return 1

  // Fraction format e.g. "1/3", "1 / 5", "3/7"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    if (parts.length === 2) {
      const num = parseFloat(parts[0].trim())
      const den = parseFloat(parts[1].trim())
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        const result = num / den
        return result > 0 ? result : 1
      }
    }
  }

  const val = parseFloat(trimmed)
  return !isNaN(val) && val > 0 ? val : 1
}

/**
 * Formats a numeric value into a human-readable Saaty scale representation.
 * e.g. 0.333333 -> "1/3", 0.2 -> "1/5", 5 -> "5"
 */
export function formatMatrixValue(val: number): string {
  if (Math.abs(val - 1) < 1e-4) return '1'

  // Check common Saaty fractions
  const standardFractions: [number, string][] = [
    [1 / 9, '1/9'],
    [1 / 8, '1/8'],
    [1 / 7, '1/7'],
    [1 / 6, '1/6'],
    [1 / 5, '1/5'],
    [1 / 4, '1/4'],
    [1 / 3, '1/3'],
    [1 / 2, '1/2'],
    [2, '2'],
    [3, '3'],
    [4, '4'],
    [5, '5'],
    [6, '6'],
    [7, '7'],
    [8, '8'],
    [9, '9'],
  ]

  for (const [numeric, str] of standardFractions) {
    if (Math.abs(val - numeric) < 1e-3) {
      return str
    }
  }

  if (val < 1) {
    const recip = 1 / val
    if (Math.abs(recip - Math.round(recip)) < 1e-2) {
      return `1/${Math.round(recip)}`
    }
    return val.toFixed(3)
  }

  return Number.isInteger(val) ? val.toString() : val.toFixed(2)
}

/**
 * Constructs a reciprocal judgment matrix A from a list of items and comparisons.
 */
export function buildMatrix(
  items: { id: string }[],
  comparisons: PairwiseComparison[]
): number[][] {
  const n = items.length
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(1))

  const indexMap = new Map<string, number>()
  items.forEach((item, index) => {
    indexMap.set(item.id, index)
  })

  // Fill in comparison values
  comparisons.forEach((comp) => {
    const i = indexMap.get(comp.itemAId)
    const j = indexMap.get(comp.itemBId)

    if (i !== undefined && j !== undefined && i !== j) {
      const val = parseMatrixValue(comp.value)
      matrix[i][j] = val
      matrix[j][i] = 1 / val
    }
  })

  return matrix
}
