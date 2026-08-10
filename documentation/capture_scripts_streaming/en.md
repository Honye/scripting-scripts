Streaming scripts process a response **frame by frame** instead of buffering the whole body. Set a [capture rule](capture_scripts/en.md) to type **Response** and pick a **Frame Codec** in the rule's **Streaming** section. The script then runs once per frame, so memory stays tiny and output starts flowing before the response finishes.

Streaming only applies where the format has frame boundaries. The first codec is **SSE** (`text/event-stream`, identity encoding only). Whole-document formats like a single JSON body cannot be streamed and keep using the buffering model.

---

## Modes

* **Modify** — inline rewrite. Each frame runs the script and the result is re-emitted, so the script can change, drop, or inject frames. Forwarding waits for the script (natural backpressure).
* **Observe** — a tee. The original stream is forwarded unchanged and a copy is handed to the script for side effects only (logging, `$notification`). The return value is ignored and the script never slows the stream. Observe is a stateless snapshot per frame; use Modify when you need `$streamState`.

---

## Globals

```ts
// The current frame.
$frame: {
  data: string       // SSE: the concatenated `data:` payload
  event?: string     // SSE: the `event:` name, if any
  id?: string        // SSE: the `id:` field, if any
  index: number      // 0-based frame index within this stream
  isFirst: boolean
  isLast: boolean    // true only on a final synthetic empty frame (flush signal)
}

// A per-stream object shared across every frame of the same response.
// Mutations persist to the next frame (Modify mode only). Kept in memory,
// not on disk. Capped at 256 KB; over the cap the rest of the stream passes through.
$streamState: object
```

All the usual capture-script globals are also available: `$argument`, `$persistentStore`, `$httpClient`, `$notification`, `$utils`, `console`.

---

## $done outcomes

```js
$done()                        // Pass the frame through unchanged (fast path)
$done({ data })                // Replace this frame's data (keeps original event/id)
$done({ data, event, id })     // Replace data and the event/id fields
$done({ drop: true })          // Drop this frame (emit nothing)
$done({ inject: [ { data, event?, id? }, ... ] })   // Keep this frame, then emit extra frames
$done({ data, inject: [ ... ] })                    // Replace, then inject
```

---

## Examples

```js
// Modify: redact tokens in each SSE event as it streams.
const text = $frame.data.replace(/secret-token-\d+/g, "***")
$done(text === $frame.data ? undefined : { data: text })
```

```js
// Modify: accumulate across frames and emit one summary at the end.
const s = $streamState
if (!s.lines) s.lines = []
if ($frame.isLast) {
  $done({ data: "SUMMARY: " + s.lines.join(" | ") })
} else {
  s.lines.push($frame.data)
  $done({ drop: true })
}
```

```js
// Observe: alert without touching the stream.
if (/secret/i.test($frame.data)) {
  $notification.post("Stream alert", "", $frame.data)
}
$done()
```

---

## Notes

* `isLast` arrives on a final synthetic empty frame after the last real frame; use it to flush accumulated `$streamState`.
* SSE output is re-serialized in canonical form, so unknown fields and exact whitespace are not preserved.
* Responses with `Content-Encoding` (gzip/br) fall back to non-streaming header-only handling.
