/** Display helpers. Server timestamps are UTC ISO strings. */
import { i18n } from '../stores/i18n'

const FORMATTERS: Record<string, Intl.DateTimeFormat> = {}

/** Built per locale on first use: ar-IQ for Arabic, en-GB for English. */
function formatter(): Intl.DateTimeFormat {
  const tag = i18n.locale.value === 'ar' ? 'ar-IQ' : 'en-GB'
  FORMATTERS[tag] ??= new Intl.DateTimeFormat(tag, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return FORMATTERS[tag]
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return '—'
  return formatter().format(new Date(ms))
}

export function roleLabel(role: string): string {
  return role === 'Admin' ? i18n.t('role.admin') : i18n.t('role.user')
}
