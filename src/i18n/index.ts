import { ref, computed } from 'vue'
import en from '../locales/en'
import ru from '../locales/ru'
import zh from '../locales/zh'

export type LocaleType = 'en' | 'ru' | 'zh'

const savedLocale = (localStorage.getItem('ahp_locale') as LocaleType) || 'en'
export const currentLocale = ref<LocaleType>(savedLocale)

const locales = {
  en,
  ru,
  zh,
}

export function setLocale(locale: LocaleType) {
  currentLocale.value = locale
  localStorage.setItem('ahp_locale', locale)
}

export function t(keyPath: string, params?: Record<string, string | number>): string {
  const keys = keyPath.split('.')
  let current: any = locales[currentLocale.value] || locales.en

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k]
    } else {
      // Fallback to English if missing
      let fallback: any = locales.en
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk]
        } else {
          return keyPath
        }
      }
      current = fallback
      break
    }
  }

  if (typeof current !== 'string') return keyPath

  let result = current
  if (params) {
    Object.entries(params).forEach(([pKey, pVal]) => {
      result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal))
    })
  }

  return result
}

// Composition API helper
export function useI18n() {
  return {
    locale: currentLocale,
    setLocale,
    t,
    isEn: computed(() => currentLocale.value === 'en'),
    isRu: computed(() => currentLocale.value === 'ru'),
    isZh: computed(() => currentLocale.value === 'zh'),
  }
}
