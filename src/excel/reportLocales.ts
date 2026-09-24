/** Excel report language packs are independent from the application UI locale. */
export type ReportLanguage = 'zh' | 'en' | 'ru'

type ReportTemplate = (bestName: string, scoreText: string, statusText: string) => string

/**
 * Plain-text report snapshots. The Report cell must NEVER be an Excel formula
 * (no leading "="), otherwise Excel 2016/2019/WPS may show #NAME? errors.
 */
export const reportTextPacks: Record<ReportLanguage, ReportTemplate> = {
  zh: (bestName, scoreText, statusText) => `推荐方案为“${bestName}”，最终得分为 ${scoreText}。一致性检查：${statusText}`,
  en: (bestName, scoreText, statusText) => `The recommended alternative is ${bestName} with a final score of ${scoreText}. Consistency review: ${statusText}`,
  ru: (bestName, scoreText, statusText) => `Рекомендуемый вариант: ${bestName}. Итоговый балл: ${scoreText}. Проверка согласованности: ${statusText}`,
}

export const createReportText = (language: ReportLanguage, bestName: string, scoreText: string, statusText: string) =>
  reportTextPacks[language](bestName, scoreText, statusText)
