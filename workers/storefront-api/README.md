# storefront-api

Edge price-comparison API for the [`Storefront`](../../scripts/Storefront) Scripting app.

## Why

Comparing one app across all 171 App Store storefronts costs the phone 171
iTunes lookups plus, for in-app prices, 171 product pages at **670–780KB each**
— roughly **120MB** and several minutes. The in-app price is only obtainable by
parsing that page (the iTunes API has no in-app fields at all), and the parsed
answer is a few hundred bytes.

This Worker does the fetching and parsing at the edge. The phone receives
NDJSON: about **25KB per round**, roughly 100KB for a complete comparison, and
near-zero on a repeat because parsed results are cached.

The parsers are not reimplemented here — `src/upstream.ts` imports `parseIAP`
and `toAppInfo` straight out of `scripts/Storefront/api/`, so when Apple changes
the product page there is one place to fix it and both sides move together.

## Deploy

```bash
pnpm install
pnpm exec wrangler login
pnpm run deploy
```

Then paste the resulting `https://storefront-api.<you>.workers.dev` into the
app's Settings → acceleration endpoint. Leaving that field empty keeps the app
on its original all-local path; a request that fails falls back to it silently.

## Budget, and why `partial` exists

Cloudflare caps each invocation at **50 subrequests and 10ms of CPU** on the
free plan (1000 and 30s on Workers Paid). A full comparison is 342 origin
fetches, so it cannot finish in one request on the free plan — and measured
parse time is ~3ms per product page, which is what sets the in-app budget.

So `/v1/compare` does as much as its budget allows and ends the stream with
`{"type":"partial", ...}` listing what it did not do; the client asks again for
exactly those storefronts. `wrangler.jsonc` holds the two numbers:

| | free plan (default) | Workers Paid |
|---|---|---|
| `MAX_LOOKUPS` | `40` | `400` |
| `MAX_IAP` | `3` | `120` |

On the paid values a comparison finishes in a single request. The contract does
not change — the client runs the same loop either way.

Cache hits cost neither a subrequest nor meaningful CPU, so they are served
outside the budget. That is why parsed results are cached rather than upstream
bodies (`src/cache.ts`).

## Endpoints

### `GET /v1/health`
```json
{ "ok": true, "protocol": 1, "budget": { "lookups": 40, "iap": 3 } }
```

### `GET /v1/compare`
| param | meaning |
|---|---|
| `id` | required, numeric App Store id |
| `regions` | csv of storefront codes to look up; default all 171, `none` for none |
| `iap` | csv of storefront codes to fetch in-app prices for; default none, `all` means "the same ones as `regions`" |
| `format` | `ndjson` (default) or `json` |

`application/x-ndjson`, one message per line: `meta`, then a `region` line per
storefront lookup, then an `iap` line per storefront, then `done` or `partial`.
Lookups are emitted before in-app prices on purpose — the phone can paint every
store price while the large pages are still downloading here.

A storefront that does not carry the app has no product page either, so it is
never fetched for in-app prices. That is worth more than it sounds: for most
apps the majority of the 171 storefronts do not carry them, and asking anyway
would spend the entire budget collecting 404s.

`regions` and `iap` are independent lists, which is what keeps the follow-up
rounds small: a client that already holds every store price asks for
`regions=&iap=<the rest>` and gets back only in-app lines. Measured against a
cold cache on the free-plan defaults:

```
round 1: 19.9KB  lookups=40  in-app=3
round 4: 19.0KB  lookups=160 in-app=12
round 5:  6.6KB  lookups=171 in-app=15   <- every store price, 5 rounds, ~85KB
round 8:  2.1KB  lookups=171 in-app=24
```

Store prices for all 171 storefronts therefore land in about five rounds and
under 100KB. In-app prices are the slow half by nature — one ~700KB page each —
and on the free plan they arrive three per round; the app stops batching after
eight rounds and lets its own per-storefront queue ask `/v1/iap` for the rest,
so rows keep filling instead of the screen waiting. On Workers Paid the whole
comparison, in-app included, is one or two rounds.

`format=json` returns the same messages as one array, for clients that cannot
read a stream.

The message types are defined once, in
[`scripts/Storefront/api/wire.ts`](../../scripts/Storefront/api/wire.ts), and
imported by both sides.

### `GET /v1/iap?id=&region=`
A single storefront's in-app prices — what the app's entry editor needs when
adding one in-app record. Returns the same `Result<IAPItem[]>` shape.

## No authentication, on purpose — and what replaces it

There are no tokens. What keeps this from being an open proxy is that every URL
it fetches is built from two closed-domain values: `id` must match `^\d{6,}$`
and every storefront code must be one of the 171 in the region table. Anything
else is a 400, so there is no input that can aim it at another host.

It sees an app id and a list of storefront codes. It is never sent an account,
a balance, an email, or a password — the app's keychain module is not imported
by its network layer at all.

If a public URL does get abused, add a rate-limiting rule in the Cloudflare
dashboard (Security → WAF → Rate limiting rules) rather than changing this code.

## Caching

Parsed results only, via the Cache API (per-colo, zero config):

| | TTL |
|---|---|
| lookup | 6h |
| in-app prices | 24h |
| `notfound` | 24h — most storefronts do not carry any given app, so this is the majority answer and the one most worth keeping |

Transient failures (timeout, network) are never cached. For a global,
cross-colo cache, uncomment the KV namespace in `wrangler.jsonc`.

## Development

```bash
pnpm run dev        # wrangler dev on :8787
pnpm run typecheck  # worker src, then the Node-side probe
pnpm run probe      # parse live product pages: node tools/probe.ts [appId] [region...]
```

`pnpm run probe` is the regression check that matters. The in-app parse is
structural (`$kind === 'textPair'`) precisely so it survives localization, and
the China storefront proves it — its section title, "App内购买", shares no
substring with the US "In-App Purchases". Matching on that title is forbidden.
