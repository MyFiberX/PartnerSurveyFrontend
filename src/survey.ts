/**
 * Local rules for the public survey form.
 *
 * The questions themselves are not here: they come from GET /api/RatingCriteria,
 * each with its own scale.
 */

export const NOTES_MAX = 500

/** Iraqi mobile format: 07XX XXX XXXX (11 digits starting with 07). */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11)
}

export function formatPhone(digits: string): string {
  const d = normalizePhone(digits)
  const parts = [d.slice(0, 4), d.slice(4, 7), d.slice(7, 11)].filter(Boolean)
  return parts.join(' ')
}

export function isValidPhone(digits: string): boolean {
  return /^07\d{9}$/.test(normalizePhone(digits))
}
