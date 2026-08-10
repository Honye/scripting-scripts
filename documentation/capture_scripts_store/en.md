`$persistentStore` gives a capture rule script a small key-value store that persists across runs and is shared between scripts. Use it to remember a token, a counter, or any small string between requests. It is available only inside [capture rule scripts](capture_scripts/en.md).

---

## Methods

```ts
$persistentStore.read(key?: string): string | null
$persistentStore.write(value: string, key?: string): boolean
$persistentStore.remove(key?: string): boolean
```

* `read` returns the stored string, or `null` if the key is absent.
* `write` stores a string and returns `true`.
* `remove` deletes the key and returns `true`.

If `key` is omitted, a default key is used.

---

## Notes

* Values are strings. To store structured data, serialize with `JSON.stringify` and parse with `JSON.parse`.
* The store is shared across all capture rule scripts and persists until removed.

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
