/** Display helpers. Pure. */

/** 1234 → "1.23k", 1530000 → "1.53M" — the dashboard's compact style. */
export function compact(n: number): string {
  const abs = Math.abs(n)
  const fmt = (v: number, unit: string) => {
    const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2
    return `${Number(v.toFixed(digits))}${unit}`
  }
  if (abs >= 1e9) return fmt(n / 1e9, 'B')
  if (abs >= 1e6) return fmt(n / 1e6, 'M')
  if (abs >= 1e3) return fmt(n / 1e3, 'k')
  return String(Math.round(n))
}

/** Full number with grouping, e.g. "100,000". */
export function grouped(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function percent(ratio: number): string {
  const p = ratio * 100
  if (p > 0 && p < 1) return '<1%'
  return `${p >= 10 ? Math.round(p) : Number(p.toFixed(1))}%`
}

/** Milliseconds for CPU / wall time: "1.1 ms", "4.21k ms". */
export function ms(value: number | undefined): string {
  if (value == null) return '—'
  if (value >= 1000) return `${compact(value)} ms`
  return `${Number(value.toFixed(value >= 10 ? 0 : 1))} ms`
}

/** Whole hours (or minutes when under one) until `t`. */
export function untilShort(t: number, now: number = Date.now()): string {
  const diff = Math.max(0, t - now)
  const hours = Math.floor(diff / 3_600_000)
  if (hours >= 48) return `${Math.floor(hours / 24)}d`
  if (hours >= 1) return `${hours}h`
  return `${Math.max(1, Math.ceil(diff / 60_000))}m`
}

export function agoShort(t: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - t)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/** "Oct 1 – Oct 8" style UTC range. */
export function utcRange(start: number, end: number): string {
  const f = (t: number) =>
    new Date(t).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    })
  return `${f(start)} – ${f(end)}`
}

/** One line for a failed request: Cloudflare's own message when it sent one. */
export function failureText(failure: {
  reason: string
  status?: number
  message?: string
}): string {
  const head =
    failure.status != null
      ? `${failure.reason} ${failure.status}`
      : failure.reason
  return failure.message != null && failure.message !== ''
    ? `${head}: ${failure.message}`
    : head
}
