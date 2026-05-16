The `Rime` namespace exposes a programmable Chinese input-method engine that ships with the main app and the keyboard extension. Use it to build custom input flows: load schemas, feed key events, render candidates yourself, and commit the chosen text.

The engine is process-global; you set it up once and create one `Rime.Session` per input session.

---

## Data directories

`Rime` reads schemas/dictionaries from a **shared data directory** and stores user state (user dictionaries, build cache) in a **user data directory**. Both default to the app group container shared between the main app and the keyboard extension, so the schemas you import in the main app are immediately available from the keyboard.

* `Rime.sharedDataDir` — string path to the shared (read-only) directory.
* `Rime.userDataDir` — string path to the user directory.

You may override either path when calling `Rime.setup({ sharedDataDir, userDataDir })`, for example when running tests in a private sandbox.

---

## Lifecycle

### `Rime.setup(options?): Promise<void>`

Initializes the engine. Call this once before any other `Rime.*` API. Subsequent calls in the same process resolve successfully without re-initializing.

```ts
await Rime.setup()
// or:
await Rime.setup({
  sharedDataDir: "/path/to/shared",
  userDataDir: "/path/to/user",
  appName: "my.input.method",  // log identifier
})
```

### `Rime.deploy(options?): Promise<void>`

Recompiles schemas and rebuilds user dictionaries when needed. Call after importing or modifying schema/dict files in `sharedDataDir`.

```ts
await Rime.deploy()
await Rime.deploy({ fullCheck: true })  // force a full rebuild
```

### Status getters (synchronous)

```ts
Rime.version       // string, e.g. "1.16.1"
Rime.isSetUp       // boolean
Rime.isDeploying   // boolean
```

---

## Schemas

### `Rime.listSchemas(): Promise<{ id, name }[]>`

```ts
const schemas = await Rime.listSchemas()
// [{ id: "luna_pinyin", name: "朙月拼音" }, ...]
```

### `Rime.getCurrentSchema(): { id, name } | null`

Returns the engine-wide current schema, or `null` when no schema is active.

### `Rime.selectSchema(schemaId): Promise<void>`

Switches the engine-wide default schema. New sessions created after this call inherit the new schema; existing sessions keep their previous schema until you call `session.selectSchema(id)` on them.

```ts
await Rime.selectSchema("luna_pinyin")
```

---

## Engine-wide options

These flags (e.g. `ascii_mode`, `full_shape`, `simplification`) are propagated to new sessions through an internal shared session. Per-session overrides are still possible via `session.setOption(...)`.

```ts
Rime.getOption("ascii_mode")           // boolean
Rime.setOption("ascii_mode", true)
Rime.getProperty("language")           // string | null
Rime.setProperty("language", "zh")
```

---

## Notifications

`Rime.onNotification` is a single optional handler invoked on the main thread when the engine fires events.

```ts
Rime.onNotification = (event) => {
  switch (event.type) {
    case "deployStart":
    case "deploySuccess":
    case "deployFailure":
      // event.sessionId — usually 0 for engine-wide events
      break
    case "schemaChanged":
      // event.schemaId, optional event.schemaName
      break
    case "optionChanged":
      // event.option (string), event.enabled (boolean)
      break
    case "other":
      // event.raw = { type, value } — unrecognised events
      break
  }
}

// Detach when no longer needed:
Rime.onNotification = null
```

To support multiple subscribers, fan out from one handler:

```ts
const subs = []
Rime.onNotification = (e) => subs.forEach((s) => s(e))
```

---

## `Rime.Session`

A session represents a single input attempt. Create one with `new Rime.Session()` and release it with `session.close()` when done.

```ts
const session = new Rime.Session()
try {
  if (!session.processKey(charCode)) {
    // engine did not consume the key — pass it through to the host text field
    CustomKeyboard.insertText(String.fromCharCode(charCode))
  }
  if (session.commit) {
    CustomKeyboard.insertText(session.commit)
  }
  if (session.context?.preedit) {
    CustomKeyboard.setMarkedText(session.context.preedit, 0, 0)
  } else {
    CustomKeyboard.unmarkText()
  }
} finally {
  session.close()
}
```

### Key handling

```ts
session.processKey(keyCode: number, modifiers?: number): boolean
```

`keyCode` uses X11 keysym values (e.g. `'w'.charCodeAt(0)` is `0x77`, `Return` is `0xff0d`). Returns `true` when the engine consumed the key.

### Composition state

```ts
session.context  // Rime.Context | null — fresh snapshot per access
session.commit   // string | null — drains pending commit text
session.status   // Rime.Status | null — schema + mode flags
```

`session.context` has the shape:

```ts
{
  preedit: string | null,
  cursorPos: number,
  selectionStart: number,
  selectionEnd: number,
  commitTextPreview?: string,
  selectKeys?: string,
  selectLabels?: string[],
  menu: {
    pageNo: number,
    pageSize: number,
    isLastPage: boolean,
    highlightedIndex: number,
    candidates: Array<{ text: string, comment: string | null }>,
  } | null,
}
```

### Candidate selection

```ts
session.selectCandidate(index: number): boolean              // absolute index in the full menu
session.selectCandidateOnCurrentPage(index: number): boolean // 0-based on current page
```

### Commit / clear

```ts
session.commitComposition(): { text: string | null } | null  // force commit
session.clearComposition(): void                              // discard
```

### Per-session schema and options

```ts
session.selectSchema(schemaId: string): boolean
session.setOption(name: string, value: boolean): void
session.getOption(name: string): boolean
session.setProperty(name: string, value: string): void
session.getProperty(name: string): string | null
session.currentSchema  // { id, name } | null (derived from status)
```

### Closing

```ts
session.close(): void
```

After `close()`, all methods become no-ops (`processKey` returns `false`, `context` returns `null`, etc.) and `session.closed` is `true`. Calling `close()` again is safe.

---

## End-to-end example

```ts
await Rime.setup()
await Rime.deploy()

const session = new Rime.Session()

try {
  // type "wo"
  session.processKey(0x77 /* w */)
  session.processKey(0x6f /* o */)

  const ctx = session.context!
  console.log(ctx.preedit)                       // "wo"
  console.log(ctx.menu?.candidates[0].text)      // "我"

  // accept first candidate
  session.selectCandidate(0)
  console.log(session.commit)                    // "我"
} finally {
  session.close()
}
```

---

## Notes

* The shared and user directories must exist and be writable. The default app-group locations are created on first `setup()` automatically.
* The engine deploys schemas in the background; render a "loading" indicator while `Rime.isDeploying` is `true`.
* To switch between Chinese and ASCII (English) modes from a key, your schema needs a `key_binder` section. Without one, `Rime.setOption("ascii_mode", true)` still works, but a Shift-toggle key will not.
* Importing user dictionaries: drop `.dict.yaml` files into `sharedDataDir`, then call `Rime.deploy()`.
