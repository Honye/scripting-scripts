The `Python` global runs Python code snippets inside the Scripting app via the embedded Python interpreter — the same runtime that powers Python index scripts. Useful for one-off computations, ad-hoc data wrangling, or invoking Python libraries from a JS / TS script without registering a separate Python script.

Code is executed using `python -c <code>`, so each call runs a fresh top-level module — module state from previous calls is **not** preserved. Imports and computed values must be set up inside `code` itself.

`Shell.run` and `Python.run` share a single serial queue: while one is running, others wait. The embedded Python interpreter shares global state (env vars, `sys.modules`) with `ios_system`, so the two cannot run concurrently.

> The current version does **not** honor `options.timeout` — long-running Python snippets will block subsequent `Shell.run` / `Python.run` calls until they finish. Wrap your code with your own timeout logic if needed.

---

## Methods

### `Python.run(code, options?): Promise<{ output, exitCode }>`

Execute a Python code snippet. Returns when the snippet exits.

```ts
function run(code: string, options?: ShellRunOptions): Promise<{
  output: string
  exitCode: number
}>
```

#### `ShellRunOptions`

| Name            | Type                       | Required | Description |
| --------------- | -------------------------- | -------- | ----------- |
| cwd             | string                     | No       | Working directory for the snippet (`os.getcwd()` inside Python). Restored after the call. |
| env             | Record<string, string>     | No       | Extra environment variables. Injected into `os.environ` (Python-level) and into the process via `setenv`, then restored after the call. |
| queryParameters | Record<string, string>     | No       | Convenience field — serialized as JSON and exposed as `os.environ["SCRIPTING_QUERY_PARAMETERS"]`. Mirrors `Script.queryParameters`. |
| timeout         | number                     | No       | **Not honored** in the current version (kept for API parity with `Shell.run`). |

#### Result

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| output    | string  | Combined stdout + stderr produced by the snippet. |
| exitCode  | number  | `0` on success. Non-zero values (e.g. when the snippet raises an unhandled exception) resolve normally; only argument validation errors reject the promise. |

> Unlike `Shell.run`, the Python.run result does **not** include `timedOut` / `cancelled` fields, because the underlying Python bridge has no timeout / cancel primitives.

---

## env injection note

The embedded Python interpreter snapshots `os.environ` at first `Py_Initialize`, so plain `setenv` from Swift does **not** propagate to subsequent reads of `os.environ`. To make `env` and `queryParameters` actually visible inside the snippet, the host injects a small prelude before your code that updates `os.environ` at the Python layer. This is transparent — your `code` runs as-is. Subprocesses spawned by the snippet (via `subprocess`, `os.system`, etc.) also see the variables because `setenv` is still applied.

---

## Examples

### Basic snippet

```ts
const r = await Python.run("print(1 + 2)")
console.log(r.output)   // "3\n"
console.log(r.exitCode) // 0
```

### Reading parameters

```ts
const r = await Python.run(`
import os, json
qp = json.loads(os.environ["SCRIPTING_QUERY_PARAMETERS"])
print(f"hello {qp['name']}")
`, {
  queryParameters: { name: "Alice" },
})
console.log(r.output) // "hello Alice\n"
```

### Using a Python library

```ts
const r = await Python.run(`
import statistics
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print(f"mean={statistics.mean(data):.2f}")
print(f"stdev={statistics.stdev(data):.2f}")
`)
console.log(r.output)
// mean=5.50
// stdev=3.03
```

### Handling errors

```ts
const r = await Python.run("raise RuntimeError('boom')")
if (r.exitCode !== 0) {
  console.log("snippet failed:")
  console.log(r.output) // contains the Python traceback
}
```

### Working directory

```ts
const r = await Python.run("import os; print(os.listdir('.'))", {
  cwd: "/tmp",
})
console.log(r.output) // contents of /tmp
```
