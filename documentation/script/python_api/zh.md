`scripting` Python 包提供了 `Script` 命名空间,与 JS 端的 `Script` 全局对象一一对应,让 Python 索引脚本(`index.py`)既能读取自身运行上下文,也能把执行结果回传给调用方 `await Script.run({name})`。

该包随运行时一起内置 —— 任意 Python 索引脚本里直接 `from scripting import Script` 即可使用。

---

## 属性

### `Script.name: str`

当前脚本的名称。如果宿主没有注入名字(比如临时的 `Python.run` 代码片段),返回空串。

```python
import scripting; Script = scripting.Script
print(Script.name)  # "MyAwesomeScript"
```

### `Script.queryParameters: dict`

调用方通过 `Script.run({queryParameters})`、`scripting-ts run ... --queryparameters '<json>'` 命令，或 `scripting://run/<name>?a=1&b=2` URL Scheme 传入的参数。会保留 JSON 值的类型（`bool` / `int` / `float` / `None` / `list` / `dict`）；经 URL Scheme 传入的值始终是字符串，因为 URL 查询字符串无法携带带类型的值。无参数时返回空 dict。

```python
import scripting; Script = scripting.Script
foo = Script.queryParameters.get("foo", "default")
```

### `Script.metadata: dict`

脚本 `metadata.json` 中声明的展示信息,与 JS 端 `Script.metadata` 字段对齐。常见键:

| 键 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 脚本名。 |
| icon | string | SFSymbol 名称。 |
| iconImage | string | 自定义图标的可选路径。 |
| color | string | 16 进制颜色(`#FF0000`)或 CSS 颜色名。 |
| version | string | 版本号。 |
| description | string | 英文描述。 |
| localizedName | string | 当前系统语言下解析后的本地化名。 |
| localizedDescription | string | 当前系统语言下解析后的本地化描述。 |
| localizedNames | dict | 各语言的本地化名(语言码 -> 名称)。 |
| localizedDescriptions | dict | 各语言的本地化描述。 |
| author | dict | `{ name, email?, homepage? }`。 |
| contributors | list | 与 `author` 同结构的对象列表。 |

非索引脚本(`Python.run` 临时片段)调用时返回空 dict。

### `Script.directory: str`

当前脚本源代码目录的文件系统路径(通常是 `<documents>/scripts/<name>/`),与 JS 端 `Script.directory` 一致。用它引用脚本内的随附文件(资源、子模块等)。非索引脚本(`Python.run` 临时片段)调用时返回空串。

```python
import os
import scripting; Script = scripting.Script
asset = os.path.join(Script.directory, "assets", "icon.png")
```

---

## 方法

### `Script.run(name, queryParameters=None, singleMode=False)`

启动另一个脚本并同步阻塞等待其退出。语义对应 JS 端 `await Script.run({name, queryParameters, singleMode})`。

```python
def run(name: str, queryParameters: dict | None = None, singleMode: bool = False) -> Any | None
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | str | 是 | 要运行的脚本名。 |
| queryParameters | dict | 否 | 作为 `Script.queryParameters` 传给被调脚本;保留 JSON 值的类型。 |
| singleMode | bool | 否 | `True` 时先退出 `name` 已有实例再启动新的。默认 `False`。 |

返回值为被调脚本通过 `Script.exit(value)` 传出的值;若未调 `Script.exit` 或未提供 value,则返回 `None`。

宿主启动脚本失败(找不到脚本、运行时不可用等)或 RPC 桥不可用时抛 `RuntimeError`;`name` 为空字符串抛 `ValueError`。

```python
import scripting; Script = scripting.Script

result = Script.run("DataFetcher", queryParameters={"url": "https://example.com"})
print("got:", result)
```

### `Script.runTS(path, queryParameters=None, scriptName=None)`

按文件路径直接跑一个 `.ts` / `.tsx` 文件,并同步阻塞等待其退出。适合手边有一个跟 `index.py` 放一起(或在磁盘任意位置)的 TS 辅助脚本、又不想专门把它注册成独立索引脚本时。

```python
def runTS(path: str, queryParameters: dict | None = None, scriptName: str | None = None) -> Any | None
```

宿主在调用时即时 transpile 源码,以 entry-style 的方式跑——文件内 `Script.queryParameters` / `Script.exit(value)` 等 JS 端 `Script` API 全部可用。

`scriptName` 决定被调文件运行时所属的脚本作用域,也即 Storage / Keychain 的命名空间。默认会回退到当前 Python 脚本的 `Script.name`,让 Python `index.py` 与它调起的 `.tsx` 辅助脚本**共享同一份 Storage / Keychain 作用域**。可显式传字符串覆盖;传空串则按文件 basename 跑(独立作用域)。

`Script.directory` 在被调文件内为 `path` 所在目录。

返回值为被调文件通过 `Script.exit(value)` 回传的值;未调 `Script.exit` 时返回 `None`。文件不存在、读取失败、transpile 失败或 JS 执行抛异常时,抛 `RuntimeError`。

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

退出当前脚本。提供 `value` 时,会把它 JSON 序列化后回传给调用方 `await Script.run({name})` 作为 resolution;不提供时,调用方收到 `None`。

```python
def exit(value: Any | None = None) -> NoReturn
```

`value` 必须可 JSON 序列化(`dict`、`list`、`str`、`int`、`float`、`bool`、`None` 及它们的嵌套组合)。序列化失败时调用方收到 `None`(不会抛异常 —— 进程仍正常退出)。

```python
import scripting; Script = scripting.Script

result = compute_something()
Script.exit({"ok": True, "result": result})
# exit 返回 NoReturn,后续代码不会执行。
```

---

## 示例

### 接收参数并返回值

```python
# index.py
import scripting; Script = scripting.Script

params = Script.queryParameters
name = params.get("name", "world")
greeting = f"Hello, {name}!"

Script.exit({"greeting": greeting, "length": len(greeting)})
```

```ts
// 调用方 (JS / TS)
const r = await Script.run({
  name: "Greeter",
  queryParameters: { name: "Alice" },
})
console.log(r.greeting)  // "Hello, Alice!"
console.log(r.length)    // 13
```

### Python 脚本之间链式调用

```python
# orchestrator.py
import scripting; Script = scripting.Script

raw = Script.run("Fetcher", queryParameters={"id": "42"})
processed = Script.run("Processor", queryParameters={"data": raw["body"]})
Script.exit(processed)
```

### 读取 metadata 与脚本随附资源

```python
import os, json
import scripting; Script = scripting.Script

print(f"Running {Script.name} v{Script.metadata.get('version', '?')}")

# 读取脚本目录下随附的配置文件
config_path = os.path.join(Script.directory, "config.json")
with open(config_path) as f:
    config = json.load(f)
```
