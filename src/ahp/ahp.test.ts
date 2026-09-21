import { describe, it, expect } from 'vitest'
import { parseMatrixValue, formatMatrixValue } from './matrix'
import { calculateMatrixResult, calculateAHPMultilevel } from './ahp'
import type { AHPModel } from '../types/ahp'

describe('AHP Matrix Utilities', () => {
  it('should correctly parse fraction and float strings', () => {
    expect(parseMatrixValue('3')).toBe(3)
    expect(parseMatrixValue('1/3')).toBeCloseTo(0.33333, 4)
    expect(parseMatrixValue(' 1 / 5 ')).toBeCloseTo(0.2, 4)
    expect(parseMatrixValue('0.2')).toBe(0.2)
    expect(parseMatrixValue('invalid')).toBe(1)
  })

  it('should format values into human-readable Saaty values', () => {
    expect(formatMatrixValue(1)).toBe('1')
    expect(formatMatrixValue(3)).toBe('3')
    expect(formatMatrixValue(1 / 3)).toBe('1/3')
    expect(formatMatrixValue(0.2)).toBe('1/5')
  })
})

describe('AHP Priority & Consistency Engine', () => {
  it('should compute correct priority vector and consistency for a consistent 3x3 matrix', () => {
    // Standard test matrix:
    // [1,   3, 5]
    // [1/3, 1, 3]
    // [1/5, 1/3, 1]
    const items = [
      { id: '1', name: 'Price' },
      { id: '2', name: 'Performance' },
      { id: '3', name: 'Comfort' },
    ]

    const comparisons = [
      { itemAId: '1', itemBId: '2', value: 3 },
      { itemAId: '1', itemBId: '3', value: 5 },
      { itemAId: '2', itemBId: '3', value: 3 },
    ]

    const result = calculateMatrixResult(items, comparisons)

    // Weights sum to 1
    const sum = result.priorityVector.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 4)

    // Price should have highest weight
    expect(result.priorityVector[0]).toBeGreaterThan(result.priorityVector[1])
    expect(result.priorityVector[1]).toBeGreaterThan(result.priorityVector[2])

    // LambdaMax should be close to 3
    expect(result.lambdaMax).toBeGreaterThanOrEqual(3.0)

    // Matrix is consistent (CR <= 0.1)
    expect(result.consistencyRatio).toBeLessThan(0.10)
    expect(result.isConsistent).toBe(true)
  })

  it('should synthesize multi-level AHP model correctly', () => {
    const model: AHPModel = {
      goal: {
        id: 'goal',
        name: '选择汽车',
        children: [
          { id: 'c1', name: '价格' },
          { id: 'c2', name: '性能' },
          { id: 'c3', name: '舒适度' },
        ],
      },
      alternatives: [
        { id: 'a1', name: 'Toyota' },
        { id: 'a2', name: 'Honda' },
        { id: 'a3', name: 'Mazda' },
      ],
      comparisons: {
        goal: [
          { itemAId: 'c1', itemBId: 'c2', value: 3 },
          { itemAId: 'c1', itemBId: 'c3', value: 5 },
          { itemAId: 'c2', itemBId: 'c3', value: 2 },
        ],
        c1: [
          { itemAId: 'a1', itemBId: 'a2', value: 5 },
          { itemAId: 'a1', itemBId: 'a3', value: 7 },
          { itemAId: 'a2', itemBId: 'a3', value: 3 },
        ],
      },
    }

    const output = calculateAHPMultilevel(model)

    expect(output.finalRanking).toHaveLength(3)
    expect(output.finalRanking[0].id).toBe('a1') // Toyota highest score under Price
    expect(output.overallConsistency.isAllConsistent).toBe(true)
  })
})
