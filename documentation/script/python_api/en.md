The `scripting` Python package provides a `Script` namespace that mirrors the JS-side `Script` global, so a Python `index.py` can read its runtime context and hand a result back to the JS caller of `await Script.run({name})`.

The package is bundled with the runtime — `from scripting import Script` works out of the box in any Python index script.

---

## Properties

### `Script.name: str`

Name of the currently running script. Empty string if the host did not inject the name (e.g. ad-hoc `Python.run` snippets).

```python
import scripting; Script = scripting.Script
print(Script.name)  # "MyAwesomeScript"
```

### `Script.queryParameters: dict`

Parameters the caller passed via `Script.run({queryParameters})`, the `scripting-ts run ... --queryparameters '<json>'` command, or the `scripting://run/<name>?a=1&b=2` URL scheme. JSON value types are preserved (`bool` / `int` / `float` / `None` / `list` / `dict`); values from a URL scheme are always strings, because URL query strings cannot carry typed values. Returns an empty dict if no parameters were provided.

```python
import scripting; Script = scripting.Script
foo = Script.queryParameters.get("foo", "default")
```

### `Script.metadata: dict`

Display metadata declared in the script's `metadata.json`. Mirrors the JS-side `Script.metadata` object. Common keys:

| Key | Type | Description |
| --- | --- | --- |
| name | string | Script name. |
| icon | string | SFSymbol name. |
| iconImage | string | Optional path to a custom icon image. |
| color | string | Hex color string (`#FF0000`) or CSS color name. |
| version | string | Script version. |
| description | string | English description. |
| localizedName | string | Resolved localized name for the current system language. |
| localizedDescription | string | Resolved localized description. |
| localizedNames | dict | Localized names by language code. |
| localizedDescriptions | dict | Localized descriptions by language code. |
| author | dict | `{ name, email?, homepage? }`. |
| contributors | list | List of objects with the same shape as `author`. |

Returns an empty dict for ad-hoc `Python.run` calls that aren't tied to an index script.

### `Script.directory: str`

Filesystem path to the current script's source directory (typically `<documents>/scripts/<name>/`). Mirrors the JS-side `Script.directory`. Use this to reference files bundled with the script (assets, sub-modules, etc.). Empty string for ad-hoc `Python.run` snippets that aren't tied to an index script.

```python
import os
import scripting; Script = scripting.Script
asset = os.path.join(Script.directory, "assets", "icon.png")
```

---

## Methods

### `Script.run(name, queryParameters=None, singleMode=False)`

Run another script and synchronously wait for it to exit. Mirrors `await Script.run({name, queryParameters, singleMode})` on the JS side.

```python
def run(name: str, queryParameters: dict | None = None, singleMode: bool = False) -> Any | None
```

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| name | str | Yes | Name of the script to launch. |
| queryParameters | dict | No | Passed to the called script as `Script.queryParameters`; JSON value types are preserved. |
| singleMode | bool | No | When `True`, exits any currently-running instance of `name` before launching. Defaults to `False`. |

Returns whatever the called script delivered through `Script.exit(value)`, or `None` if the script didn't call `Script.exit` with a value.

Raises `RuntimeError` if the host fails to launch the script (script not found, runtime not available, etc.) or if the RPC bridge is missing. Raises `ValueError` for an empty `name`.

```python
import scripting; Script = scripting.Script

result = Script.run("DataFetcher", queryParameters={"url": "https://example.com"})
print("got:", result)
```

### `Script.runTS(path, queryParameters=None, scriptName=None)`

Run a `.ts` / `.tsx` file by absolute filesystem path and synchronously wait for it to exit. Useful when you have a TypeScript helper sitting next to your Python `index.py` (or anywhere on disk) and want to call it directly without registering it as a separate index script.

```python
def runTS(path: str, queryParameters: dict | None = None, scriptName: str | None = None) -> Any | None
```

The host transpiles the source on the fly and runs it as an entry-style JS script — `Script.queryParameters`, `Script.exit(value)`, and the rest of the JS-side `Script` API all work inside the file.

`scriptName` controls the script-namespace the called file runs under — that is the key under which Storage / Keychain etc. are isolated. By default it falls back to the current Python script's `Script.name`, so a Python `index.py` and the `.tsx` helpers it invokes **share the same Storage / Keychain scope**. Pass an explicit string to override; pass an empty string to fall back to the file's basename (independent scope).

`Script.directory` inside the called file is the parent directory of `path`.

Returns whatever the file delivers through `Script.exit(value)`, or `None` if the file completed without calling `Script.exit` with a value. Raises `RuntimeError` if the path doesn't exist, can't be read, fails to transpile, or the JS code throws during evaluation.

```python
import os
import scripting; Script = scripting.Script

helper_path = os.path.join(Script.directory, "helper.tsx")
result = Script.runTS(helper_path, queryParameters={"limit": "10"})
print(result)
```

```typescript
// helper.tsx
const limit = Number(Script.queryParameters.limit ?? "5")
const items = await fetchTopItems(limit)
Script.exit(items)
```

### `Script.exit(value=None)`

Exit the current script. If `value` is provided, it is JSON-serialized and delivered back to the JS caller of `await Script.run({name})` as the resolution value. Without `value`, the JS caller receives `None`.

```python
def exit(value: Any | None = None) -> NoReturn
```

`value` must be JSON-serializable (`dict`, `list`, `str`, `int`, `float`, `bool`, `None`, and combinations). If serialization fails, the JS caller receives `None` (no exception is raised — the call still terminates the script).

```python
import scripting; Script = scripting.Script

result = compute_something()
Script.exit({"ok": True, "result": result})
# Script.exit returns NoReturn — code after this line never runs.
```

---

## Examples

### Receiving parameters and returning a value

```python
# index.py
import scripting; Script = scripting.Script

params = Script.queryParameters
name = params.get("name", "world")
greeting = f"Hello, {name}!"

Script.exit({"greeting": greeting, "length": len(greeting)})
```

```ts
// caller (JS / TS)
const r = await Script.run({
  name: "Greeter",
  queryParameters: { name: "Alice" },
})
console.log(r.greeting)  // "Hello, Alice!"
console.log(r.length)    // 13
```

### Chaining Python scripts

```python
# orchestrator.py
import scripting; Script = scripting.Script

raw = Script.run("Fetcher", queryParameters={"id": "42"})
processed = Script.run("Processor", queryParameters={"data": raw["body"]})
Script.exit(processed)
```

### Reading metadata and resolving asset paths

```python
import os, json
import scripting; Script = scripting.Script

print(f"Running {Script.name} v{Script.metadata.get('version', '?')}")

# Read a file shipped with the script.
config_path = os.path.join(Script.directory, "config.json")
with open(config_path) as f:
    config = json.load(f)
```
