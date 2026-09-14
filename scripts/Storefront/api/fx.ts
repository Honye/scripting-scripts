import { fetchJson } from './http'
import { currencyFor } from '../regions'
import type { Result } from './http'

/**
 * Exchange rates from Frankfurter (https://frankfurter.dev), v2 — v1 only
 * carries the ~30 ECB currencies, which misses most storefronts.
 *
 * Conversion is display-only and always approximate: the storefront's own price
 * stays the fact, the converted figure is a hint shown next to it with `≈`.
 * Nothing converted is ever stored or summed.
 */
export type Rates = {
  base: string
  /** Newest rate date in the response, `YYYY-MM-DD`. */
  date: string
  /** Units of each quote currency per one unit of `base`. */
  rates: Record<string, number>
}

type RateRow = {
  date: string
  base: string
  quote: string
  rate: number
}

/** One fetch per base per run; switching back and forth should not refetch. */
const cache = new Map<string, Rates>()

export async function fetchRates(base: string): Promise<Result<Rates>> {
  const cached = cache.get(base)
  if (cached != null) return { ok: true, value: cached }

  const response = await fetchJson<RateRow[]>(
    `https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`
  )
  if (!response.ok) return response
  if (!Array.isArray(response.value)) return { ok: false, reason: 'parse' }

  const rates: Record<string, number> = { [base]: 1 }
  let date = ''
  for (const row of response.value) {
    if (typeof row.quote !== 'string' || !(row.rate > 0)) continue
    rates[row.quote.toUpperCase()] = row.rate
    if (row.date > date) date = row.date
  }

  const value = { base, date, rates }
  cache.set(base, value)
  return { ok: true, value }
}

/** `amount` in `from`, expressed in `rates.base`; null when there is no rate. */
export function convert(amount: number, from: string, rates: Rates): number | null {
  if (from === '') return null
  const rate = rates.rates[from.toUpperCase()]
  return rate != null ? amount / rate : null
}

/** The device region's currency, e.g. `zh_CN` → CNY; USD when it cannot tell. */
export function defaultFxBase(): string {
  const match = Device.systemLocale.match(/[_-]([A-Za-z]{2})(?:$|[_@-])/)
  return match ? currencyFor(match[1].toLowerCase()) : 'USD'
}
