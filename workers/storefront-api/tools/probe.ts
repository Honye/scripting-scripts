/**
 * Checks the in-app-purchase parser against live product pages.
 *
 * There is no test framework in this repo; the standing practice is a script
 * you can run and read. This is the one that matters for this Worker — the
 * parse is structural (`$kind === 'textPair'`) precisely so it survives
 * localization, and the China storefront is the regression case that proves it,
 * since its section title ("App内购买") shares no substring with the US one.
 *
 * Run: node --experimental-strip-types tools/probe.ts [appId] [region...]
 */
import {
  USER_AGENT,
  parseIAP,
  parsePriceText
} from '../../../scripts/Storefront/api/appstore_parse.ts'

const [, , appIdArg, ...regionArgs] = process.argv
const appId = appIdArg ?? '1016366447'
const regions = regionArgs.length > 0 ? regionArgs : ['us', 'cn', 'tr']

let failures = 0

for (const region of regions) {
  const url = `https://apps.apple.com/${region}/app/id${appId}`
  const started = Date.now()
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })

  if (!response.ok) {
    console.log(`${region}: HTTP ${response.status}`)
    if (response.status !== 404) failures += 1
    continue
  }

  const html = await response.text()
  const fetched = Date.now()
  const items = parseIAP(html)
  const parsed = Date.now()

  console.log(
    `${region}: ${(html.length / 1024).toFixed(0)}KB in ${fetched - started}ms, ` +
      `parsed in ${parsed - fetched}ms, ${items.length} item(s)`
  )
  for (const item of items.slice(0, 5)) {
    const amount = parsePriceText(item.priceText)
    console.log(
      `   ${item.name} — ${item.priceText} → ${amount ?? 'unreadable'}`
    )
    if (amount == null) failures += 1
  }
}

// The parse time printed above is the number that decides the Worker's per-
// invocation IAP budget: the free plan allows 10ms of CPU per request.
if (failures > 0) {
  console.error(`\n${failures} problem(s)`)
  process.exit(1)
}
console.log('\nok')
