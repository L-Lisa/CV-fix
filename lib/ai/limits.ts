// Input-size caps for AI route payloads.
// Cheap defence against budget-burn via oversized requests; pairs with
// per-user rate limiting in lib/ai/rate-limit.ts.
//
// Limits are generous (≥10× the largest legitimate value) so real users
// never hit them. They exist to bound the worst case, not to enforce
// formatting rules — those live in the Zod / RHF layer.

export const MAX_INPUT = {
  // Profile summary: a full Swedish profile is typically ~500 chars. 5 KB
  // is 10× that.
  currentSummary: 5_000,
  // Experience description: similar shape to summary.
  currentDescription: 5_000,
  // Headline / job titles passed in guestData.
  headline: 200,
  jobTitle: 200,
  employer: 200,
  // Job posting can be larger — multi-paragraph ad. The route already
  // truncates to 3 KB before sending to Anthropic; this caps the payload.
  jobPosting: 10_000,
} as const

// Returns the first oversized field's name, or null if all fields fit.
// Pass only the string fields you care about; undefined / null are skipped.
export function findOversizedField(
  fields: Partial<Record<keyof typeof MAX_INPUT, string | null | undefined>>
): keyof typeof MAX_INPUT | null {
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value !== 'string') continue
    const max = MAX_INPUT[name as keyof typeof MAX_INPUT]
    if (max && value.length > max) {
      return name as keyof typeof MAX_INPUT
    }
  }
  return null
}
