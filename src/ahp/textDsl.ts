import type { AHPNode } from '../types/ahp'

export type ValidationResult = {
  isValid: boolean
  error?: string
  line?: number
}

/**
 * Validates hyphen-based text DSL outline.
 * Rules:
 * - 1st non-empty line is Goal (must not start with '-').
 * - Subsequent lines: Number of leading '-' specifies depth (level 1: '-', level 2: '--', etc.).
 * - Cannot skip depth levels going deeper (e.g. level 1 '-' to level 3 '---' without level 2 '--').
 * - Node names must not be empty after hyphens.
 */
export function validateTextDsl(text: string): ValidationResult {
  const lines = text.split('\n')
  let firstLineFound = false
  let prevLevel = 0

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    if (!firstLineFound) {
      if (trimmed.startsWith('-')) {
        return {
          isValid: false,
          error: 'Line 1 (Goal layer) cannot start with "-". Please write Goal name on line 1.',
          line: i + 1,
        }
      }
      firstLineFound = true
      prevLevel = 0
      continue
    }

    // Count leading hyphens
    let hyphenCount = 0
    while (hyphenCount < trimmed.length && trimmed[hyphenCount] === '-') {
      hyphenCount++
    }

    if (hyphenCount === 0) {
      return {
        isValid: false,
        error: `Line ${i + 1}: Criteria lines must start with "-" (e.g. -Criterion Name).`,
        line: i + 1,
      }
    }

    const nodeName = trimmed.substring(hyphenCount).trim()
    if (!nodeName) {
      return {
        isValid: false,
        error: `Line ${i + 1}: Node name cannot be empty after hyphens.`,
        line: i + 1,
      }
    }

    const currentLevel = hyphenCount
    if (currentLevel > prevLevel + 1) {
      return {
        isValid: false,
        error: `Line ${i + 1}: Cannot jump from Level ${prevLevel} (${'-'.repeat(prevLevel || 1)}) to Level ${currentLevel} (${'-'.repeat(currentLevel)}). Missing Level ${prevLevel + 1}.`,
        line: i + 1,
      }
    }

    prevLevel = currentLevel
  }

  if (!firstLineFound) {
    return {
      isValid: false,
      error: 'Text editor is empty. Please type your Goal name on Line 1.',
      line: 1,
    }
  }

  return { isValid: true }
}

/**
 * Parses validated hyphen-based text DSL into an AHPNode hierarchy.
 */
export function parseTextDsl(text: string): AHPNode {
  const lines = text.split('\n')
  const nonLeaves: { line: string; originalIndex: number }[] = []

  lines.forEach((l, idx) => {
    if (l.trim()) {
      nonLeaves.push({ line: l.trim(), originalIndex: idx })
    }
  })

  if (nonLeaves.length === 0) {
    return { id: 'goal_root', name: 'Car Selection Goal' }
  }

  const goalName = nonLeaves[0].line
  const goal: AHPNode = {
    id: `goal_${Date.now().toString(36)}`,
    name: goalName,
    children: [],
  }

  // Stack to track parent nodes at each level [level 0 = Goal, level 1 = -Criterion, level 2 = --Sub, ...]
  const stack: { level: number; node: AHPNode }[] = [{ level: 0, node: goal }]

  for (let i = 1; i < nonLeaves.length; i++) {
    const item = nonLeaves[i].line
    let level = 0
    while (level < item.length && item[level] === '-') {
      level++
    }

    const name = item.substring(level).trim() || `Node ${i}`
    const newNode: AHPNode = {
      id: `node_${Date.now().toString(36)}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      name,
    }

    // Pop stack until parent level < current level
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]?.node || goal
    if (!parent.children) parent.children = []
    parent.children.push(newNode)

    stack.push({ level, node: newNode })
  }

  return goal
}

/**
 * Serializes an AHPNode tree into hyphen-based text DSL format.
 */
export function serializeToTextDsl(goal: AHPNode): string {
  const lines: string[] = []

  lines.push(goal.name)

  const traverse = (node: AHPNode, level: number) => {
    if (node.children) {
      node.children.forEach((child) => {
        const prefix = '-'.repeat(level)
        lines.push(`${prefix}${child.name}`)
        traverse(child, level + 1)
      })
    }
  }

  traverse(goal, 1)

  return lines.join('\n')
}
