HTTP capture scripts let you rewrite matching requests and responses with JavaScript while capturing traffic. A script is attached to a **capture rule** and runs inside the capture engine when the rule's pattern matches a request URL.

> These APIs (`$request`, `$response`, `$done`, `$argument`, `console`, `$httpClient`, `$persistentStore`, `$notification`, `$utils`) are available **only inside capture rule scripts** — not in regular scripts, and they are not imported.

---

## Rule configuration

Each rule is configured in the rule editor:

| Field | Meaning |
| ----- | ------- |
| **Pattern** | A regular expression matched against the request URL. The script runs only when it matches. |
| **Type** | `Request` runs before the request is sent; `Response` runs after the response is received. |
| **Requires Body** | When on, the message body is buffered so the script can read and rewrite it. When off, the script sees headers only. |
| **Max Body Size** | Bodies larger than this pass through untouched (the script is skipped for that message). |
| **Binary Body** | When on, `body` is exposed as a `Uint8Array`; when off, as a string. |
| **Timeout** | If the script does not call `$done(...)` within this many seconds, the message passes through unchanged. |
| **Argument** | A value exposed to the script as `$argument`. |

---

## Execution model

When several rules match the same message, they run **in the order they appear in the list**, and the effects accumulate: each script sees the output of the previous one. A request script that returns a mock response (see below) short-circuits the chain — no upstream request is made and no response scripts run.

If a script throws, times out, or never calls `$done(...)`, the message passes through unchanged. Scripts can never break traffic they don't intend to.

---

## `$request`

Available in both request and response scripts.

```ts
$request: {
  url: string
  method: string
  headers: Record<string, string>
  body?: string | Uint8Array   // present only when Requires Body is on
}
```

In a response script, `$request` is read-only and exposes `url` and `method` for context.

## `$response`

Available in response scripts.

```ts
$response: {
  status: number
  headers: Record<string, string>
  body?: string | Uint8Array   // present only when Requires Body is on
}
```

The body is already decompressed: if the response used `Content-Encoding` such as gzip, `body` is the decoded content. Use [`$utils.ungzip`](capture_scripts_utils/en.md) only for data that is gzip-compressed at the application layer.

---

## `$done`

Every script must call `$done(...)` exactly once to finish. The shape of the argument determines the outcome.

### Request scripts

```ts
// Pass through unchanged
$done({})

// Rewrite the outgoing request (any field may be omitted)
$done({
  url?: string,
  headers?: Record<string, string>,
  body?: string | Uint8Array,
})

// Return a mock response without contacting the server (short-circuits the chain)
$done({
  response: {
    status: number,
    headers?: Record<string, string>,
    body?: string | Uint8Array,
  }
})
```

### Response scripts

```ts
// Pass through unchanged
$done({})

// Rewrite the response (any field may be omitted)
$done({
  status?: number,
  headers?: Record<string, string>,
  body?: string | Uint8Array,
})
```

When you return `headers`, they replace the header set that is forwarded. Omit `headers` to keep the original ones.

---

## `$argument`

The value configured on the rule. For a plain argument it is a string; for a structured argument (input / select / switch fields) it is an object keyed by field name.

```ts
// Rule argument: token=abc123
const token = $argument            // "abc123"

// Structured argument
const enabled = $argument.enabled  // true
```

---

## `console`

```ts
console.log(...args: any[]): void
```

`console.log` writes to the capture log for debugging.

---

## Example

```js
// Request script: inject a header and add a query flag.
const headers = $request.headers
headers["X-Debug"] = "1"
$done({ url: $request.url + "?trace=1", headers })
```

```js
// Response script (Requires Body on): add a field to a JSON response.
try {
  const json = JSON.parse($response.body)
  json.injected = true
  $done({ body: JSON.stringify(json) })
} catch (e) {
  $done({})
}
```

## Related APIs

* [`$httpClient`](capture_scripts_httpclient/en.md) — send HTTP requests from a script.
* [`$persistentStore`](capture_scripts_store/en.md) — read and write persistent values.
* [`$notification`](capture_scripts_notification/en.md) — post a local notification.
* [`$utils`](capture_scripts_utils/en.md) — utility helpers (`ungzip`, …).
