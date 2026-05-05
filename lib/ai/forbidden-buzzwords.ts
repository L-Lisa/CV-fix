// Forbidden-buzzwords lists for the AI prompts (PRD §15.2, expanded
// 2026-05-06 in v1.4). Used by all 5 AI routes — the klyscha rule was
// also moved from absolute to contextual: these words may appear in
// generated text only when accompanied by concrete proof in the same
// sentence.
//
// Source: docs/v1.4/AI_PROMPTS_v1.md §1. Single source of truth so the
// list cannot drift across routes.

export const FORBIDDEN_SV = [
  'driven',
  'lösningsorienterad',
  'lagspelare',
  'flexibel',
  'engagerad',
  'passionerad',
  'ansvarstagande',
  'motiverad',
  'självgående',
  'social',
  'strukturerad',
  'noggrann',
  'prestigelös',
  'resultatinriktad',
  'kommunikativ',
  'innovativ',
  'dynamisk',
  'proaktiv',
  'team player',
  'self-starter',
] as const

export const FORBIDDEN_EN = [
  'driven',
  'motivated',
  'passionate',
  'dynamic',
  'proactive',
  'hard-working',
  'team player',
  'self-starter',
  'results-oriented',
  'detail-oriented',
  'go-getter',
  'results-driven',
  'energetic',
  'enthusiastic',
  'dedicated',
  'committed',
  'flexible',
  'innovative',
  'strategic thinker',
  'problem solver',
] as const

export type ForbiddenSv = typeof FORBIDDEN_SV[number]
export type ForbiddenEn = typeof FORBIDDEN_EN[number]
