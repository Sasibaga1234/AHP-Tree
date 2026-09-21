import { describe, it, expect } from 'vitest'
import { validateTextDsl, parseTextDsl, serializeToTextDsl } from './textDsl'
import type { AHPNode } from '../types/ahp'

describe('Text DSL Outline Parser & Validator', () => {
  it('should validate correct hyphen DSL text', () => {
    const text = `Car Selection Goal
-Price
-Performance
--Power
--Handling
-Comfort`

    const val = validateTextDsl(text)
    expect(val.isValid).toBe(true)
  })

  it('should detect invalid Goal line starting with hyphen', () => {
    const text = `-Car Selection Goal
-Price`

    const val = validateTextDsl(text)
    expect(val.isValid).toBe(false)
    expect(val.line).toBe(1)
  })

  it('should detect level jump error (from level 1 - to level 3 ---)', () => {
    const text = `Car Selection Goal
-Price
---Purchase Price`

    const val = validateTextDsl(text)
    expect(val.isValid).toBe(false)
    expect(val.line).toBe(3)
  })

  it('should parse text into correct AHPNode tree structure', () => {
    const text = `选择最优智慧物流供应商
-技术能力
--系统稳定性
--算法与AI能力
-服务与成本
--报价与资费
--售后与响应速度`

    const goal = parseTextDsl(text)
    expect(goal.name).toBe('选择最优智慧物流供应商')
    expect(goal.children).toHaveLength(2)
    expect(goal.children![0].name).toBe('技术能力')
    expect(goal.children![0].children).toHaveLength(2)
    expect(goal.children![0].children![0].name).toBe('系统稳定性')
  })

  it('should serialize AHPNode tree back into hyphen text', () => {
    const goal: AHPNode = {
      id: 'g1',
      name: 'Car Selection Goal',
      children: [
        { id: 'c1', name: 'Price' },
        {
          id: 'c2',
          name: 'Performance',
          children: [
            { id: 'c2_1', name: 'Power' },
            { id: 'c2_2', name: 'Handling' },
          ],
        },
      ],
    }

    const text = serializeToTextDsl(goal)
    expect(text).toContain('Car Selection Goal')
    expect(text).toContain('-Price')
    expect(text).toContain('-Performance')
    expect(text).toContain('--Power')
  })
})
