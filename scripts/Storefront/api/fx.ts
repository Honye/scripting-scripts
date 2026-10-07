import { fetchJson } from './http'
import { currencyFor } from '../regions'
import type { Result } from './http'
import type { Rates } from './fx_parse'

/**
 * The network half of the exchange-rate source. The `Rates` shape and `convert`
 * live in `fx_parse.ts` and are re-exported here, so call sites keep importing
 * `'../api/fx'` unchanged — see the note in `appstore.ts` for why the split
 * exists. Here it is `price_range.ts` that needs the conversion without the
 * runtime attached.
 */
export * from './fx_parse'

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

/** The device region's currency, e.g. `zh_CN` → CNY; USD when it cannot tell. */
export function defaultFxBase(): string {
  const match = Device.systemLocale.match(/[_-]([A-Za-z]{2})(?:$|[_@-])/)
  return match ? currencyFor(match[1].toLowerCase()) : 'USD'
}
