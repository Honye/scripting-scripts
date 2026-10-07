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

/** `amount` in `from`, expressed in `rates.base`; null when there is no rate. */
export function convert(amount: number, from: string, rates: Rates): number | null {
  if (from === '') return null
  const rate = rates.rates[from.toUpperCase()]
  return rate != null ? amount / rate : null
}
