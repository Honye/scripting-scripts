`$httpClient` lets a capture rule script send its own HTTP request — for example to fetch a token, call a webhook, or build a response from another endpoint. It is available only inside [capture rule scripts](capture_scripts/en.md).

---

## Methods

```ts
$httpClient.get(options, callback)
$httpClient.post(options, callback)
$httpClient.put(options, callback)
$httpClient.delete(options, callback)
$httpClient.head(options, callback)
$httpClient.options(options, callback)
$httpClient.patch(options, callback)
```

`options` may be a URL string or an object:

```ts
type Options = string | {
  url: string
  headers?: Record<string, string>
  body?: string | object     // an object is JSON-encoded and Content-Type set to application/json
  timeout?: number           // seconds; defaults to the rule's timeout
}
```

## Callback

```ts
type Callback = (
  error: string | null,
  response: { status: number, headers: Record<string, string> } | null,
  data: string | null,       // response body as text
) => void
```

On success, `error` is `null` and `response`/`data` are provided. On failure (network error or timeout), `error` is a string and `response`/`data` are `null`.

---

## Notes

* The request is sent over the physical network interface, so it does not loop back through the capture tunnel.
* `data` is returned as text. Binary responses are not decoded.
* The effective timeout is capped by the rule's own timeout — a script cannot outlive its rule.
* Redirects and cookies are not followed automatically.

---

## Example

```js
// Fetch a value, then inject it as a request header.
$httpClient.get("https://example.com/token", (error, response, data) => {
  if (error) { $done({}); return }
  const headers = $request.headers
  headers["X-Token"] = data.trim()
  $done({ headers })
})
```

```js
// POST JSON to a webhook, ignore the result, pass the request through.
$httpClient.post({
  url: "https://example.com/hook",
  body: { path: $request.url },
}, () => {})
$done({})
```
