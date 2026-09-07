const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'د.إ',
  AUD: 'A$',
  BHD: 'BD',
  BRL: 'R$',
  CAD: 'CA$',
  CHF: 'CHF',
  CNY: '¥',
  COP: 'COL$',
  CLP: 'CLP$',
  CZK: 'Kč',
  DKK: 'kr',
  EGP: 'E£',
  EUR: '€',
  GBP: '£',
  HKD: 'HK$',
  HUF: 'Ft',
  IDR: 'Rp',
  ILS: '₪',
  INR: '₹',
  JPY: '¥',
  KRW: '₩',
  KWD: 'KD',
  MXN: 'MX$',
  MYR: 'RM',
  NGN: '₦',
  NOK: 'kr',
  NZD: 'NZ$',
  OMR: 'ر.ع.',
  PHP: '₱',
  PKR: '₨',
  PLN: 'zł',
  QAR: 'ر.ق',
  RON: 'lei',
  RUB: '₽',
  SAR: 'ر.س',
  SEK: 'kr',
  SGD: 'S$',
  THB: '฿',
  TRY: '₺',
  TWD: 'NT$',
  UAH: '₴',
  USD: '$',
  VND: '₫',
  ZAR: 'R'
}

/**
 * ISO 4217 currencies with no minor unit. Rendering "₺49.00" where the
 * storefront shows "₺49" reads as a conversion the app never did.
 */
const ZERO_DECIMAL = [
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF'
]

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency + ' '
}

/**
 * Amounts are always shown in their own currency — v1 deliberately does not
 * convert between currencies (spec FR-SUB-04), so there is no exchange-rate
 * dependency and no staleness to reason about.
 */
export function formatMoney(amount: number, currency: string): string {
  const digits = ZERO_DECIMAL.includes(currency) ? 0 : 2
  return currencySymbol(currency) + amount.toFixed(digits)
}

/** Balance is hand-maintained, so we flag it as suspect after this long. */
export const BALANCE_STALE_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

export function daysSince(ts: number, now: number = Date.now()): number {
  return Math.floor((now - ts) / DAY_MS)
}

export function isBalanceStale(updatedAt: number, now: number = Date.now()): boolean {
  return daysSince(updatedAt, now) >= BALANCE_STALE_DAYS
}

export function formatDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Parses a hand-typed amount. Returns null rather than NaN so callers cannot
 * accidentally persist a broken balance.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.trim().replace(/[,\s]/g, '')
  if (cleaned === '') return null
  const value = Number(cleaned)
  if (!isFinite(value) || value < 0) return null
  return value
}

/**
 * Whole calendar days from today until `ts` — 0 is today, 1 tomorrow, negative
 * is overdue. Deliberately not `(ts - now) / DAY`: a charge eight hours from now
 * is "today" to a person, but that arithmetic rounds it to "tomorrow".
 */
export function daysUntil(ts: number, now: number = Date.now()): number {
  const startOfDay = (value: number) => {
    const date = new Date(value)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }
  return Math.round((startOfDay(ts) - startOfDay(now)) / DAY_MS)
}
