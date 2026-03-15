// Shared helpers for all PDF layouts

import type { CVExperience, CVEducation } from '@/types'

const MONTHS_SV = [
  '', 'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
]

const MONTHS_EN = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatExpDate(
  month: number | null,
  year: number | null,
  isCurrent: boolean,
  lang: 'sv' | 'en'
): string {
  if (isCurrent) return lang === 'sv' ? 'pågående' : 'present'
  if (!year) return ''
  const months = lang === 'sv' ? MONTHS_SV : MONTHS_EN
  return month ? `${months[month]} ${year}` : `${year}`
}

export function formatExpRange(exp: CVExperience, lang: 'sv' | 'en'): string {
  const start = formatExpDate(exp.start_month, exp.start_year, false, lang)
  const end = formatExpDate(exp.end_month, exp.end_year, exp.is_current, lang)
  return start && end ? `${start} – ${end}` : start || end
}

export function formatEduRange(edu: CVEducation, lang: 'sv' | 'en'): string {
  const ongoing = lang === 'sv' ? 'pågående' : 'present'
  if (!edu.start_year) return ''
  const end = edu.is_current ? ongoing : edu.end_year ? `${edu.end_year}` : ''
  return end ? `${edu.start_year} – ${end}` : `${edu.start_year}`
}

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  gymnasium: 'Gymnasium',
  yh: 'YH',
  hogskola: 'Högskola',
  kurs: 'Kurs',
  annat: 'Annat',
}

export const LANGUAGE_LEVEL_LABELS: Record<string, { sv: string; en: string }> = {
  native: { sv: 'Modersmål', en: 'Native' },
  fluent: { sv: 'Flytande', en: 'Fluent' },
  good: { sv: 'God', en: 'Good' },
  basic: { sv: 'Grundläggande', en: 'Basic' },
}

export const EXP_TYPE_LABELS: Record<string, { sv: string; en: string }> = {
  job: { sv: 'Jobb', en: 'Job' },
  internship: { sv: 'Praktik', en: 'Internship' },
  summer: { sv: 'Sommarjobb', en: 'Summer job' },
  volunteer: { sv: 'Volontär', en: 'Volunteer' },
}
