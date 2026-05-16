`scripting` Python 包提供了 `Storage` 命名空间,对应 JS 端的 `Storage`。底层基于 `UserDefaults`,提供按脚本隔离的键值持久化存储 —— Python 与 JS 索引脚本读写同一个 key 能拿到同一份数据。

```python
import scripting; Storage = scripting.Storage
```

默认每个脚本的 key 与其他脚本隔离。`shared=True` 时操作所有脚本共享的全局域。

---

## 方法

### `Storage.set(key, value, shared=False) -> bool`

把 `value` 存到 `key` 下。`value` 必须可 JSON 序列化(`str` / `int` / `float` / `bool` / `None` / `list` / `dict` 及其嵌套)。成功返回 `True`。

```python
Storage.set("counter", 42)
Storage.set("user", {"name": "Alice", "premium": True})
```

### `Storage.get(key, shared=False) -> Any | None`

读取之前存到 `key` 下的值。key 不存在返回 `None`。

```python
n = Storage.get("counter") or 0
user = Storage.get("user")  # {"name": "Alice", "premium": True}
```

### `Storage.remove(key, shared=False) -> None`

删除 `key` 对应的项。key 不存在时 no-op。

### `Storage.contains(key, shared=False) -> bool`

判断 key 是否存在。

### `Storage.keys() -> list[str]`

列出当前脚本所有 key(仅当前脚本命名空间,不含 shared 域)。

### `Storage.clear() -> None`

清空当前脚本所有 key。不会影响 shared 域和其他脚本数据。

---

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| key | str | 是 | 存储的 key。脚本命名空间下的 key 会自动加上脚本名前缀;shared 域下原样使用。 |
| value | Any | 是(仅 set) | 可 JSON 序列化的值。 |
| shared | bool | 否 | `True` 时操作跨脚本共享域而非当前脚本命名空间。默认 `False`。 |

---

## 示例

### 跨次运行保留的计数器

```python
import scripting; Storage = scripting.Storage; Script = scripting.Script

count = (Storage.get("hits") or 0) + 1
Storage.set("hits", count)
Script.exit({"hits": count})
```

### 与 JS 端共享数据

```python
# Python 侧
import scripting; Storage = scripting.Storage
Storage.set("session_token", "abc123", shared=True)
```

```ts
// JS 侧读到同一份数据
const token = Storage.get<string>("session_token", { shared: true })
```

### 查看与清空当前脚本数据

```python
import scripting; Storage = scripting.Storage

print("已有 keys:", Storage.keys())
Storage.clear()  # 清空当前脚本写入的所有数据
```
