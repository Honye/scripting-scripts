`$persistentStore` gives a capture rule script a small key-value store that persists across runs. Use it to remember a token, a counter, or any small string between requests. Values saved under a key you choose are visible to every capture script; the one saved without a key belongs to your script alone. It is available only inside [capture rule scripts](capture_scripts/en.md).

---

## Methods

```ts
$persistentStore.read(key?: string): string | null
$persistentStore.write(value: string | null, key?: string): boolean
$persistentStore.remove(key?: string): boolean
```

* `read` returns the stored string, or `null` if the key is absent.
* `write` stores a string and returns `true`. It returns `false` and stores nothing if the value is not a string it can accept, or is over the size limit — see Notes. Passing `null` as the value deletes the key, exactly like `remove`.
* `remove` deletes the key and returns `true`.

If `key` is omitted, a default key is used. That default key belongs to **the script**, not to the module that installed it: two rules that run the same script share it — including rules in two different modules that point at the same `script-path` — and a different script gets its own. Pass an explicit `key` when you want to share a value between different scripts.

A duplicated module is the one exception: its copy starts with an empty default key of its own, even though it points at the same script. That is what makes it possible to run two copies of the same module side by side — one per account, say — without them writing over each other. Rules inside the copy still share with each other as usual.

---

## Reading and writing without being interrupted

A `read`, a comparison and a `write` that sit in the same run of **synchronous** code cannot be interrupted by another script. All capture scripts run in a single JavaScript environment, on one thread, and that thread never switches to another script in the middle of a synchronous block. So this is safe even while many requests are being handled at once:

```js
// Only one of the concurrent runs can win this.
const current = $persistentStore.read("revision")
if (current === "5") {
  $persistentStore.write("6", "revision")
}
```

**The guarantee ends at the first asynchronous step.** A `$httpClient` callback, a `Promise`, a timer — each lets other scripts run in the gap, so a value read before it may already be stale by the time the callback runs:

```js
// NOT safe: another script can change "revision" while the request is in flight.
const current = $persistentStore.read("revision")
$httpClient.get("https://example.com/", (err, resp, data) => {
  $persistentStore.write(String(Number(current) + 1), "revision")   // may overwrite someone else
  $done({})
})
```

If you need a counter across an asynchronous step, read it again **inside** the callback and do the compare-and-write there, in one synchronous block.

---

## Notes

* Values are strings. Numbers and booleans are converted; objects and arrays are **rejected** (`write` returns `false`) — serialize them with `JSON.stringify` first and parse with `JSON.parse` on the way out.
* `write(undefined, key)` is also rejected, and leaves whatever was there untouched. This is on purpose: `undefined` is what you get from a header or field that was not there, and deleting a good value because of a missing field is rarely what you meant. Use `null` when you really mean delete.
* A single value can be at most 4 MB. `write` returns `false` and stores nothing if the value is larger, and a note appears in the script log.
* Values persist until they are removed. Reinstalling the app clears them.
* Keys cannot start with `scope:`. That prefix is reserved for the slot each script gets when no key is given, so a key that used it could write straight into another script's slot. `read`, `write` and `remove` refuse such a key and a note appears in the script log.
* Values are stored as plain text. Treat them the same way you treat anything else on the device: fine for a session token, not a place to keep something you would not want another script to read — any script can read any key whose name it knows.

---

## Example

```js
// Remember the last seen request URL.
const previous = $persistentStore.read("last")
$persistentStore.write($request.url, "last")
console.log("previous:", previous)
$done({})
```

```js
// Store and read a JSON object.
$persistentStore.write(JSON.stringify({ count: 3 }), "state")
const state = JSON.parse($persistentStore.read("state") || "{}")
```

```js
// Delete a value. These two lines do the same thing.
$persistentStore.write(null, "state")
$persistentStore.remove("state")
```
