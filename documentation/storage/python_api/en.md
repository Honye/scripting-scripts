The `scripting` Python package exposes `Storage`, mirroring the JS-side `Storage` namespace. It provides a per-script persistent key-value store backed by `UserDefaults`, so Python and JS index scripts can share the same value when they read/write the same key.

```python
import scripting; Storage = scripting.Storage
```

By default each script's keys are isolated from other scripts. Pass `shared=True` to read/write the cross-script shared domain.

---

## Methods

### `Storage.set(key, value, shared=False) -> bool`

Persist `value` under `key`. `value` must be JSON-serializable (`str`, `int`, `float`, `bool`, `None`, `list`, `dict` and combinations). Returns `True` on success.

```python
Storage.set("counter", 42)
Storage.set("user", {"name": "Alice", "premium": True})
```

### `Storage.get(key, shared=False) -> Any | None`

Read the value previously stored under `key`. Returns `None` if the key doesn't exist.

```python
n = Storage.get("counter") or 0
user = Storage.get("user")  # {"name": "Alice", "premium": True}
```

### `Storage.remove(key, shared=False) -> None`

Delete the entry under `key`. No-op if the key doesn't exist.

### `Storage.contains(key, shared=False) -> bool`

Whether the key exists in storage.

### `Storage.keys() -> list[str]`

List all keys belonging to the current script (per-script namespace only — not the shared domain).

### `Storage.clear() -> None`

Remove all per-script keys for the current script. Does not affect the shared domain or other scripts' data.

---

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| key | str | Yes | The storage key. Per-script keys are automatically prefixed with the script's name; shared keys are used verbatim. |
| value | Any | Yes (set only) | JSON-serializable value to store. |
| shared | bool | No | When `True`, operates on the cross-script shared domain instead of the current script's namespace. Defaults to `False`. |

---

## Examples

### Counter that survives across runs

```python
import scripting; Storage = scripting.Storage; Script = scripting.Script

count = (Storage.get("hits") or 0) + 1
Storage.set("hits", count)
Script.exit({"hits": count})
```

### Sharing data with the JS side

```python
# Python side
import scripting; Storage = scripting.Storage
Storage.set("session_token", "abc123", shared=True)
```

```ts
// JS side reads the same value
const token = Storage.get<string>("session_token", { shared: true })
```

### Listing and clearing this script's data

```python
import scripting; Storage = scripting.Storage

print("Stored keys:", Storage.keys())
Storage.clear()  # wipe everything this script wrote
```
