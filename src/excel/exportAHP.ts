import type ExcelJS from 'exceljs'
import type { AHPModel, AHPNode, PairwiseComparison } from '../types/ahp'
import { createReportText, type ReportLanguage } from './reportLocales'
import { calculateAHPMultilevel } from '../ahp/ahp'
export type { ReportLanguage } from './reportLocales'

type Item = { id: string; name: string }
type MatrixTarget = { id: string; name: string; items: Item[]; depth: number; isLeafRating: boolean }
type MatrixRefs = {
  scoreStartRow: number
  scoreStartCol: number
  calcStartRow: number
  calcStartCol: number
  weightCells: string[]
  crCell: string
}

const BLUE = '1F4E78'
const BLACK = '000000'
const GREY = 'D9E1F2'
const PALE_GREY = 'F2F2F2'
const YELLOW = 'FFF2CC'
const RED = 'C00000'
const GREEN = 'C6E0B4'
const border = { style: 'thin' as const, color: { argb: BLACK } }
const allBorders = { top: border, left: border, bottom: border, right: border }

const columnName = (column: number) => {
  let result = ''
  let value = column
  while (value > 0) {
    const remainder = (value - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    value = Math.floor((value - 1) / 26)
  }
  return result
}

const cell = (row: number, column: number) => `${columnName(column)}${row}`
const sheetCell = (sheet: string, row: number, column: number) => `'${sheet}'!${cell(row, column)}`

const safeValue = (value: number | undefined) => Number.isFinite(value) && (value as number) > 0 ? value as number : 1

/** Preserve Saaty reciprocal inputs as editable Excel fractions such as 1/3. */
const toExcelJudgmentFormula = (rawValue: number) => {
  const value = safeValue(rawValue)
  if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value))
  const reciprocal = 1 / value
  if (Math.abs(reciprocal - Math.round(reciprocal)) < 1e-9 && reciprocal >= 2 && reciprocal <= 99) {
    return `1/${Math.round(reciprocal)}`
  }
  return String(value)
}

const findComparisonValue = (comparisons: PairwiseComparison[], itemAId: string, itemBId: string) => {
  const comparison = comparisons.find((item) =>
    (item.itemAId === itemAId && item.itemBId === itemBId) ||
    (item.itemAId === itemBId && item.itemBId === itemAId)
  )
  if (!comparison) return 1
  return comparison.itemAId === itemAId ? safeValue(comparison.value) : 1 / safeValue(comparison.value)
}

const getLeafNodes = (root: AHPNode): AHPNode[] => {
  if (!root.children?.length) return [root]
  return root.children.flatMap(getLeafNodes)
}

const collectMatrices = (model: AHPModel): MatrixTarget[] => {
  const targets: MatrixTarget[] = []
  const visit = (node: AHPNode, depth: number) => {
    if (node.children?.length) {
      targets.push({ id: node.id, name: node.name, items: node.children.map(({ id, name }) => ({ id, name })), depth, isLeafRating: false })
      node.children.forEach((child) => visit(child, depth + 1))
    }
  }
  visit(model.goal, 1)
  const alternatives = model.alternatives.map(({ id, name }) => ({ id, name }))
  getLeafNodes(model.goal).forEach((leaf) => {
    if (alternatives.length >= 2) targets.push({ id: leaf.id, name: leaf.name, items: alternatives, depth: nodeDepth(model.goal, leaf.id), isLeafRating: true })
  })
  return targets.filter((target) => target.items.length >= 2)
}

const nodeDepth = (root: AHPNode, targetId: string, depth = 1): number => {
  if (root.id === targetId) return depth
  for (const child of root.children || []) {
    const found = nodeDepth(child, targetId, depth + 1)
    if (found) return found
  }
  return 0
}

const applyTitle = (worksheet: ExcelJS.Worksheet, range: string) => {
  const target = worksheet.getCell(range.split(':')[0])
  target.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } }
  target.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
  target.alignment = { vertical: 'middle', horizontal: 'center' }
}

const forEachCell = (
  worksheet: ExcelJS.Worksheet,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  callback: (entry: ExcelJS.Cell) => void
) => {
  for (let row = fromRow; row <= toRow; row++) {
    for (let col = fromCol; col <= toCol; col++) callback(worksheet.getCell(row, col))
  }
}

export async function exportAHPWorkbook(model: AHPModel, fileName: string, language: ReportLanguage) {
  // Keep the large XLSX writer out of the initial application bundle.
  const exceljsModule = await import('exceljs')
  const workbook = new exceljsModule.default.Workbook()
  workbook.creator = 'AHP Decision Tool'
  workbook.created = new Date()
  workbook.calcProperties.fullCalcOnLoad = true

  type ReportLabels = {
    hierarchy: string; calculations: string; results: string;
    instruction: string; rowName: string;
    product: string; geometric: string; weight: string; aw: string;
    metric: string; checkValue: string; status: string;
    ranking: string; rank: string; alternative: string; finalScore: string;
    percentage: string; best: string; consistency: string;
    topWeights: string; keyCriteria: string; globalWeightCol: string;
    analysisReport: string;
    passed: string; failed: string; resultsTitle: string;
    matrixTitle: (name: string) => string;
    calcTitle: (name: string) => string;
  }
  const labelPacks: Record<ReportLanguage, ReportLabels> = {
    en: {
      hierarchy: 'Hierarchy Model', calculations: 'Ratings & Calculations', results: 'Results & Report',
      instruction: 'Enter 1–9 judgments. The lower triangle and calculations are generated automatically. Blank values default to 1.',
      rowName: 'Row item', product: 'Row product', geometric: 'Geometric mean', weight: 'Weight', aw: 'AW',
      metric: 'Check metric', checkValue: 'Check value', status: 'Status',
      ranking: 'Alternative ranking', rank: 'Rank', alternative: 'Alternative', finalScore: 'Final score', percentage: 'Percentage',
      best: 'Best alternative', consistency: 'Consistency overview',
      topWeights: 'Top Global Weights', keyCriteria: 'Key Criteria', globalWeightCol: 'Global Weight',
      analysisReport: 'Analysis Report',
      passed: '✓ Passed', failed: '✗ Failed', resultsTitle: 'AHP Results & Report',
      matrixTitle: (name) => `Rating matrix for [${name}]`,
      calcTitle: (name) => `Calculation process for [${name}]`,
    },
    zh: {
      hierarchy: '层次结构模型', calculations: '评分与计算过程', results: '综合结果与报告',
      instruction: '请填写1-9标度，下三角及计算会自动生成。未填写处默认为1',
      rowName: '行名', product: '行连乘', geometric: '几何平均', weight: '权重', aw: 'AW',
      metric: '检验指标', checkValue: '检验值', status: '状态',
      ranking: '方案综合排序', rank: '排名', alternative: '方案名称', finalScore: '最终得分', percentage: '百分比',
      best: '最佳方案', consistency: '一致性总览',
      topWeights: '核心指标权重', keyCriteria: '核心指标', globalWeightCol: '全局权重',
      analysisReport: '分析报告',
      passed: '✓ 全部通过', failed: '✗ 存在未通过矩阵', resultsTitle: 'AHP 综合结果与报告',
      matrixTitle: (name) => `针对【${name}】的评分矩阵`,
      calcTitle: (name) => `计算过程: 针对【${name}】`,
    },
    ru: {
      hierarchy: 'Иерархическая модель', calculations: 'Оценки и расчёты', results: 'Результаты и отчёт',
      instruction: 'Введите оценки по шкале 1–9. Нижний треугольник и расчёты формируются автоматически. Пустые значения считаются равными 1.',
      rowName: 'Строка', product: 'Произведение строки', geometric: 'Среднее геометрическое', weight: 'Вес', aw: 'AW',
      metric: 'Показатель', checkValue: 'Значение', status: 'Статус',
      ranking: 'Итоговый рейтинг альтернатив', rank: 'Место', alternative: 'Альтернатива', finalScore: 'Итоговый балл', percentage: 'Доля',
      best: 'Лучшая альтернатива', consistency: 'Общая согласованность',
      topWeights: 'Ведущие критерии', keyCriteria: 'Ключевые критерии', globalWeightCol: 'Глобальный вес',
      analysisReport: 'Аналитический отчёт',
      passed: '✓ Пройдено', failed: '✗ Есть несогласованные матрицы', resultsTitle: 'AHP: общие результаты и отчёт',
      matrixTitle: (name) => `Матрица оценок [${name}]`,
      calcTitle: (name) => `Расчёт [${name}]`,
    },
  }
  const labels = labelPacks[language]
  const hierarchy = workbook.addWorksheet(labels.hierarchy, { views: [{ showGridLines: false }] })
  const calculations = workbook.addWorksheet(labels.calculations, { views: [{ showGridLines: false }] })
  const results = workbook.addWorksheet(labels.results, { views: [{ showGridLines: false }] })
  hierarchy.properties.defaultRowHeight = 22
  calculations.properties.defaultRowHeight = 20
  results.properties.defaultRowHeight = 20

  // Sheet 1: one row per leaf path, with every parent merged over its descendants.
  const paths: AHPNode[][] = []
  const collectPaths = (node: AHPNode, path: AHPNode[]) => {
    const next = [...path, node]
    if (!node.children?.length) paths.push(next)
    else node.children.forEach((child) => collectPaths(child, next))
  }
  collectPaths(model.goal, [])
  const maxDepth = Math.max(...paths.map((path) => path.length), 1)
  paths.forEach((path, pathIndex) => {
    path.forEach((node, index) => hierarchy.getCell(pathIndex + 1, index + 1).value = node.name)
  })
  for (let col = 1; col <= maxDepth; col++) hierarchy.getColumn(col).width = 22
  for (let depth = 0; depth < maxDepth; depth++) {
    let start = 0
    while (start < paths.length) {
      const node = paths[start][depth]
      let end = start
      while (end + 1 < paths.length && paths[end + 1][depth]?.id === node?.id) end++
      if (node && end > start) hierarchy.mergeCells(start + 1, depth + 1, end + 1, depth + 1)
      start = end + 1
    }
  }
  hierarchy.eachRow((row, rowNumber) => row.eachCell((entry, colNumber) => {
    entry.border = allBorders
    entry.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    const pathNode = paths[rowNumber - 1]?.[colNumber - 1]
    if (pathNode?.children?.length) {
      entry.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE_GREY } }
      entry.font = { name: 'Arial', size: 10, bold: true }
    } else entry.font = { name: 'Arial', size: 10 }
  }))

  const targets = collectMatrices(model)
  const refs = new Map<string, MatrixRefs>()
  let scoreCol = 1
  let scoringEndRow = 0
  for (const target of targets) {
    const n = target.items.length
    const endCol = scoreCol + n
    calculations.mergeCells(1, scoreCol, 1, endCol)
    calculations.mergeCells(2, scoreCol, 2, endCol)
    calculations.getCell(1, scoreCol).value = labels.matrixTitle(target.name)
    calculations.getCell(2, scoreCol).value = labels.instruction
    applyTitle(calculations, `${cell(1, scoreCol)}:${cell(1, endCol)}`)
    calculations.getCell(2, scoreCol).font = { name: 'Arial', size: 9, color: { argb: '666666' }, italic: true }
    calculations.getCell(2, scoreCol).alignment = { horizontal: 'center', vertical: 'middle' }
    calculations.getCell(3, scoreCol).value = labels.rowName
    target.items.forEach((item, index) => calculations.getCell(3, scoreCol + 1 + index).value = item.name)
    for (let i = 0; i < n; i++) {
      const row = 4 + i
      calculations.getCell(row, scoreCol).value = target.items[i].name
      for (let j = 0; j < n; j++) {
        const entry = calculations.getCell(row, scoreCol + 1 + j)
        if (i === j) entry.value = 1
        else if (i < j) {
          entry.value = { formula: toExcelJudgmentFormula(findComparisonValue(model.comparisons[target.id] || [], target.items[i].id, target.items[j].id)) }
          entry.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
        } else entry.value = { formula: `1/${cell(4 + j, scoreCol + 1 + i)}` }
      }
    }
    forEachCell(calculations, 3, scoreCol, 3 + n, endCol, (entry) => {
      entry.border = allBorders
      entry.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      entry.font = { name: 'Arial', size: 10 }
    })
    forEachCell(calculations, 4, scoreCol + 1, 3 + n, endCol, (entry) => entry.numFmt = '# ?/?')
    forEachCell(calculations, 3, scoreCol, 3, endCol, (entry) => entry.font = { name: 'Arial', size: 10, bold: true })
    calculations.getColumn(scoreCol).width = 18
    for (let col = scoreCol + 1; col <= endCol; col++) calculations.getColumn(col).width = 13
    scoringEndRow = Math.max(scoringEndRow, n + 3)
    refs.set(target.id, { scoreStartRow: 4, scoreStartCol: scoreCol + 1, calcStartRow: 0, calcStartCol: 0, weightCells: [], crCell: '' })
    scoreCol = endCol + 2
  }

  let calculationRow = scoringEndRow + 3
  for (const target of targets) {
    const n = target.items.length
    const ref = refs.get(target.id)!
    const startCol = 1 + (target.depth - 1) * 2
    const totalCols = n + 8
    const endCol = startCol + totalCols - 1
    // n=2 still needs a third diagnostics row for the mandatory CR value.
    const dataRows = Math.max(n, 3)
    calculations.mergeCells(calculationRow, startCol, calculationRow, endCol)
    calculations.getCell(calculationRow, startCol).value = labels.calcTitle(target.name)
    applyTitle(calculations, `${cell(calculationRow, startCol)}:${cell(calculationRow, endCol)}`)
    const weightCol = startCol + n + 3
    const awCol = startCol + n + 4
    const indicatorCol = startCol + n + 5
    const valueCol = startCol + n + 6
    const statusCol = startCol + n + 7
    const dataStartRow = calculationRow + 2
    const headerLabels = [labels.rowName, ...Array.from({ length: n }, (_, index) => target.items[index].name), labels.product, labels.geometric, labels.weight, labels.aw, labels.metric, labels.checkValue, labels.status]
    headerLabels.forEach((header, index) => {
      const entry = calculations.getCell(calculationRow + 1, startCol + index)
      entry.value = header
      entry.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } }
      entry.font = { name: 'Arial', size: 10, bold: true }
      entry.border = allBorders
      entry.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    })
    for (let i = 0; i < dataRows; i++) {
      const row = dataStartRow + i
      if (i < n) {
        calculations.getCell(row, startCol).value = target.items[i].name
        for (let j = 0; j < n; j++) calculations.getCell(row, startCol + 1 + j).value = { formula: sheetCell(labels.calculations, ref.scoreStartRow + i, ref.scoreStartCol + j) }
        calculations.getCell(row, startCol + n + 1).value = { formula: `PRODUCT(${cell(row, startCol + 1)}:${cell(row, startCol + n)})` }
        calculations.getCell(row, startCol + n + 2).value = { formula: `POWER(${cell(row, startCol + n + 1)},1/${n})` }
        calculations.getCell(row, weightCol).value = { formula: `${cell(row, startCol + n + 2)}/SUM(${cell(dataStartRow, startCol + n + 2)}:${cell(dataStartRow + n - 1, startCol + n + 2)})` }
        calculations.getCell(row, awCol).value = { formula: `MMULT(${cell(row, startCol + 1)}:${cell(row, startCol + n)},$${columnName(weightCol)}$${dataStartRow}:$${columnName(weightCol)}$${dataStartRow + n - 1})` }
        ref.weightCells.push(cell(row, weightCol))
      }
      if (i === 0) {
        calculations.getCell(row, indicatorCol).value = 'λmax'
        const ratios = Array.from({ length: n }, (_, index) => `${cell(dataStartRow + index, awCol)}/${cell(dataStartRow + index, weightCol)}`).join(',')
        calculations.getCell(row, valueCol).value = { formula: `AVERAGE(${ratios})` }
      } else if (i === 1) {
        calculations.getCell(row, indicatorCol).value = 'CI'
        calculations.getCell(row, valueCol).value = { formula: `IF(${n}=1,0,(${cell(dataStartRow, valueCol)}-${n})/(${n}-1))` }
      } else if (i === 2) {
        calculations.getCell(row, indicatorCol).value = 'CR'
        const ri = ({ 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49, 11: 1.51, 12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59 } as Record<number, number>)[n] || 1.59
        calculations.getCell(row, valueCol).value = { formula: `IF(OR(${n}=1,${n}=2),0,${cell(dataStartRow + 1, valueCol)}/${ri})` }
        calculations.getCell(row, statusCol).value = { formula: `IF(${cell(row, valueCol)}>=0.1,"${labels.failed}","${labels.passed}")` }
        ref.crCell = cell(row, valueCol)
      }
    }
    forEachCell(calculations, dataStartRow, startCol, dataStartRow + dataRows - 1, endCol, (entry) => {
      entry.border = allBorders
      entry.font = { name: 'Arial', size: 10 }
      entry.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    })
    forEachCell(calculations, dataStartRow, startCol + 1, dataStartRow + n - 1, startCol + n, (entry) => entry.numFmt = '0.000')
    forEachCell(calculations, dataStartRow, startCol + n + 1, dataStartRow + n - 1, awCol, (entry) => entry.numFmt = '0.000')
    forEachCell(calculations, dataStartRow, weightCol, dataStartRow + n - 1, weightCol, (entry) => entry.numFmt = '0.000%')
    calculations.getCell(dataStartRow, valueCol).numFmt = '0.000'
    calculations.getCell(dataStartRow + 1, valueCol).numFmt = '0.000'
    calculations.getCell(dataStartRow + 2, valueCol).numFmt = '0.000'
    calculations.getCell(dataStartRow + 2, valueCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } }
    calculations.getCell(dataStartRow + 2, valueCol).font = { name: 'Arial', size: 10, bold: true }
    calculations.getCell(dataStartRow + 2, statusCol).font = { name: 'Arial', size: 10, bold: true }
    calculations.addConditionalFormatting({
      ref: cell(dataStartRow + 2, valueCol),
      rules: [{ type: 'expression', priority: 1, formulae: [`${cell(dataStartRow + 2, valueCol)}>=0.1`], style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } }, font: { color: { argb: 'FFFFFF' }, bold: true } } }]
    })
    for (let col = startCol; col <= endCol; col++) calculations.getColumn(col).width = col === startCol ? 18 : 13
    ref.calcStartRow = calculationRow
    ref.calcStartCol = startCol
    calculationRow += dataRows + 3
  }


  // Sheet 3 (minimal): final conclusions only. Detailed math lives on Sheet 2.
  // The ranking is snapshotted in code (no ranking formulas => no cycles, no #NAME?).
  // Only classic functions remain: IF, AND, SUM.
  results.getCell('A1').value = labels.resultsTitle
  results.getCell('A1').font = { name: 'Arial', size: 15, bold: true, color: { argb: BLUE } }

  const snapshot = calculateAHPMultilevel(model)
  const leaves = getLeafNodes(model.goal)
  const alternatives = model.alternatives
  const rankHeaderRow = 10
  const rankFirstRow = 11
  const rankLastRow = 10 + alternatives.length

  // 1. Top overview (A5:B7). B5/B6 point at the first (best) ranking row; no cycles.
  results.getCell('A5').value = labels.best
  results.getCell('A6').value = labels.finalScore
  results.getCell('A7').value = labels.consistency
  forEachCell(results, 5, 1, 7, 1, (entry) => {
    entry.font = { name: 'Arial', size: 11, bold: true }
    entry.alignment = { vertical: 'middle', horizontal: 'left' }
  })
  results.getCell('B5').value = { formula: `B${rankFirstRow}` }
  results.getCell('B6').value = { formula: `C${rankFirstRow}` }
  const crCells = targets.map((target) => `'${labels.calculations}'!${refs.get(target.id)!.crCell}`)
  results.getCell('B7').value = { formula: crCells.length ? `IF(AND(${crCells.map((entry) => `${entry}<0.1`).join(',')}),"${labels.passed}","${labels.failed}")` : '"✓ N/A"' }
  results.getCell('B5').font = { name: 'Arial', size: 14, bold: true }
  results.getCell('B6').font = { name: 'Arial', size: 14, bold: true }
  results.getCell('B6').numFmt = '0.000%'
  results.getCell('B7').font = { name: 'Arial', size: 11, bold: true }
  results.addConditionalFormatting({
    ref: 'B7',
    rules: [
      { type: 'expression', priority: 1, formulae: [`$B$7="${labels.passed}"`], style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } } } },
      { type: 'expression', priority: 2, formulae: [`$B$7="${labels.failed}"`], style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } }, font: { color: { argb: 'FFFFFF' }, bold: true } } },
    ],
  })

  // 2. Ranking (A9:D): static snapshot values sorted in code, rank 1 highlighted.
  results.getCell('A9').value = labels.ranking
  results.mergeCells('A9:D9')
  applyTitle(results, 'A9:D9')
  const rankHeaders = [labels.rank, labels.alternative, labels.finalScore, labels.percentage]
  rankHeaders.forEach((header, index) => {
    const entry = results.getCell(rankHeaderRow, index + 1)
    entry.value = header
    entry.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
    entry.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } }
    entry.border = allBorders
    entry.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  snapshot.finalRanking.forEach((item, index) => {
    const row = rankFirstRow + index
    results.getCell(row, 1).value = index + 1
    results.getCell(row, 2).value = item.name
    results.getCell(row, 3).value = item.score
    results.getCell(row, 3).numFmt = '0.000%'
    results.getCell(row, 4).value = { formula: `C${row}/SUM($C$${rankFirstRow}:$C$${rankLastRow})` }
    results.getCell(row, 4).numFmt = '0.000%'
  })
  forEachCell(results, 9, 1, rankLastRow, 4, (entry) => {
    entry.border = allBorders
    entry.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    if (!entry.font?.name) entry.font = { name: 'Arial', size: 10 }
  })
  if (alternatives.length > 0) {
    forEachCell(results, rankFirstRow, 1, rankFirstRow, 4, (entry) => {
      entry.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
    })
  }

  // 3. Top global weights (F9:H): top 7 leaves, sorted in code, live Sheet 2 refs.
  const parentById = new Map<string, { parentId: string; childIndex: number }>()
  const indexParents = (node: AHPNode) => node.children?.forEach((child, index) => { parentById.set(child.id, { parentId: node.id, childIndex: index }); indexParents(child) })
  indexParents(model.goal)
  const topLeaves = [...leaves]
    .map((leaf) => ({ leaf, weight: snapshot.globalWeights[leaf.id] ?? 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 7)
  results.getCell('F9').value = labels.topWeights
  results.mergeCells('F9:H9')
  applyTitle(results, 'F9:H9')
  results.mergeCells(`${cell(rankHeaderRow, 6)}:${cell(rankHeaderRow, 7)}`)
  results.getCell(rankHeaderRow, 6).value = labels.keyCriteria
  results.getCell(rankHeaderRow, 8).value = labels.globalWeightCol
  forEachCell(results, rankHeaderRow, 6, rankHeaderRow, 8, (entry) => {
    entry.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
    entry.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } }
    entry.border = allBorders
    entry.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  topLeaves.forEach(({ leaf }, index) => {
    const row = rankFirstRow + index
    results.mergeCells(row, 6, row, 7)
    results.getCell(row, 6).value = leaf.name
    const pathWeights: string[] = []
    let current = leaf.id
    while (parentById.has(current)) {
      const parent = parentById.get(current)!
      const parentRef = refs.get(parent.parentId)
      if (parentRef) pathWeights.push(`'${labels.calculations}'!${parentRef.weightCells[parent.childIndex]}`)
      current = parent.parentId
    }
    results.getCell(row, 8).value = { formula: pathWeights.reverse().join('*') || '1' }
    results.getCell(row, 8).numFmt = '0.000%'
  })
  const weightsLastRow = rankHeaderRow + topLeaves.length
  forEachCell(results, 9, 6, weightsLastRow, 8, (entry) => {
    entry.border = allBorders
    if (!entry.font?.name) entry.font = { name: 'Arial', size: 10 }
    entry.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })

  // 4. Report: plain text only (never a "=" formula).
  const reportTitleRow = Math.max(rankLastRow, weightsLastRow) + 3
  results.getCell(reportTitleRow, 1).value = labels.analysisReport
  results.getCell(reportTitleRow, 1).font = { name: 'Arial', size: 11, bold: true }
  results.mergeCells(reportTitleRow + 1, 1, reportTitleRow + 3, 7)
  const topSnapshot = snapshot.finalRanking[0]
  const reportStatus = snapshot.overallConsistency.isAllConsistent ? labels.passed : labels.failed
  const reportScore = topSnapshot ? `${(topSnapshot.score * 100).toFixed(3)}%` : 'N/A'
  results.getCell(reportTitleRow + 1, 1).value = createReportText(language, topSnapshot?.name ?? 'N/A', reportScore, reportStatus)
  results.getCell(reportTitleRow + 1, 1).alignment = { vertical: 'top', wrapText: true }
  results.getCell(reportTitleRow + 1, 1).font = { name: 'Arial', size: 11 }
  for (let row = reportTitleRow + 1; row <= reportTitleRow + 3; row++) results.getRow(row).height = 28

  // Explicit column widths: ranking A-D, spacer E, weights F-H. No more overlap.
  results.getColumn(1).width = 16
  results.getColumn(2).width = 20
  results.getColumn(3).width = 14
  results.getColumn(4).width = 14
  results.getColumn(5).width = 4
  results.getColumn(6).width = 18
  results.getColumn(7).width = 18
  results.getColumn(8).width = 14
  const populatedEndRow = reportTitleRow + 3
  forEachCell(results, 1, 1, populatedEndRow, 8, (entry) => {
    if (!entry.font?.name) entry.font = { name: 'Arial', size: 10 }
  })

  const filename = `${fileName.trim().replace(/[\\/:*?"<>|]/g, '_') || 'ahp-report'}.xlsx`
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  // Must be in the DOM for Firefox/Safari to honor the download.
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking synchronously can abort the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
