`$utils` provides small helper functions for capture rule scripts. It is available only inside [capture rule scripts](capture_scripts/en.md).

---

## `ungzip`

```ts
$utils.ungzip(data: Uint8Array): Uint8Array
```

Decompresses gzip data and returns the result as a `Uint8Array`. If the input is not valid gzip, the original bytes are returned unchanged.

Response bodies are already decompressed by the capture engine when the response declares `Content-Encoding: gzip`, so you only need `ungzip` for data that is gzip-compressed at the **application layer** (for example a gzip blob embedded inside a field). Enable **Binary Body** on the rule so that `body` is exposed as a `Uint8Array`.

```js
// Response rule with Requires Body + Binary Body on.
const plain = $utils.ungzip($response.body)   // Uint8Array
const text = new TextDecoder().decode(plain)
console.log(text)
$done({})
```

---

## `geoip` / `ipasn` / `ipaso`

```ts
$utils.geoip(ip: string): string | null
$utils.ipasn(ip: string): string | null
$utils.ipaso(ip: string): string | null
```

These look up the country (ISO 3166 code), the autonomous system number, and the autonomous system organization for an IP address.

> These functions currently return `null` — IP geolocation data is not bundled. They are provided so that scripts referencing them do not fail; treat a `null` result as "unknown".
