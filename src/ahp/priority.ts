/**
 * Calculates priority vector (local weights) for a reciprocal judgment matrix
 * using the Geometric Mean Method (Root Method / 方根法).
 */
export function computePriorityVector(matrix: number[][]): number[] {
  const n = matrix.length
  if (n === 0) return []
  if (n === 1) return [1.0]

  const geometricMeans: number[] = []
  let sumMeans = 0

  for (let i = 0; i < n; i++) {
    let product = 1.0
    for (let j = 0; j < n; j++) {
      product *= matrix[i][j]
    }
    const root = Math.pow(product, 1 / n)
    geometricMeans.push(root)
    sumMeans += root
  }

  // Normalize
  if (sumMeans === 0) {
    return Array(n).fill(1 / n)
  }

  return geometricMeans.map((val) => val / sumMeans)
}
