`Python` 全局对象通过内嵌 Python 解释器在 Scripting app 内执行 Python 代码片段 —— 与 Python 索引脚本使用同一个运行时。适合一次性计算、临时数据处理,或在 JS / TS 脚本里调用 Python 库,而不必专门注册一个 Python 脚本。

代码以 `python -c <code>` 形式执行,因此每次调用都是一个全新的顶层模块 —— **不会**保留上一次调用的模块状态。import 与中间值都必须写在 `code` 内部。

`Shell.run` 与 `Python.run` 共享同一条串行队列:其中一个执行时,其他调用排队等待。内嵌 Python 解释器与 `ios_system` 共享全局状态(env 变量、`sys.modules`),不可并发执行。

> 当前版本**不支持** `options.timeout` —— 长时运行的 Python 片段会阻塞后续的 `Shell.run` / `Python.run` 调用直到结束。如有需要请在代码内自行实现超时逻辑。

---

## 方法

### `Python.run(code, options?): Promise<{ output, exitCode }>`

执行一段 Python 代码。代码退出时返回。

```ts
function run(code: string, options?: ShellRunOptions): Promise<{
  output: string
  exitCode: number
}>
```

#### `ShellRunOptions`

| 名称            | 类型                       | 必填 | 说明 |
| --------------- | -------------------------- | ---- | ---- |
| cwd             | string                     | 否   | 代码片段的工作目录(Python 内 `os.getcwd()`)。调用结束后恢复。 |
| env             | Record<string, string>     | 否   | 额外环境变量。同时注入 Python 的 `os.environ` 与进程级 `setenv`,调用结束后恢复。 |
| queryParameters | Record<string, string>     | 否   | 便利字段 —— 序列化为 JSON 后以 `os.environ["SCRIPTING_QUERY_PARAMETERS"]` 暴露。等同于 `Script.queryParameters`。 |
| timeout         | number                     | 否   | 当前版本**不生效**(保留供与 `Shell.run` 接口对齐)。 |

#### 返回值

| 名称      | 类型    | 说明 |
| --------- | ------- | ---- |
| output    | string  | 代码片段的 stdout + stderr 合并输出。 |
| exitCode  | number  | 成功为 `0`。非零值(例如脚本抛出未捕获异常)以 resolve 返回,不会 reject;只有参数缺失才 reject。 |

> 与 `Shell.run` 不同,`Python.run` 返回值**不**包含 `timedOut` / `cancelled` 字段,因为底层 Python 桥没有超时 / 取消原语。

---

## 关于 env 注入

内嵌 Python 解释器在首次 `Py_Initialize` 时对 `os.environ` 做快照,Swift 端的纯 `setenv` 调用**不会**反向同步到 Python 后续对 `os.environ` 的读取。为了让 `env` 与 `queryParameters` 真正在代码内可见,宿主会在用户代码前注入一段小 prelude,在 Python 层 `os.environ.update(...)`。整个过程对调用者透明 —— `code` 原样执行。代码内通过 `subprocess`、`os.system` 等派生的子进程也能拿到这些变量,因为 `setenv` 同时也被应用。

---

## 示例

### 基本片段

```ts
const r = await Python.run("print(1 + 2)")
console.log(r.output)   // "3\n"
console.log(r.exitCode) // 0
```

### 读取参数

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

### 使用 Python 库

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

### 处理错误

```ts
const r = await Python.run("raise RuntimeError('boom')")
if (r.exitCode !== 0) {
  console.log("代码片段失败:")
  console.log(r.output) // 含 Python traceback
}
```

### 工作目录

```ts
const r = await Python.run("import os; print(os.listdir('.'))", {
  cwd: "/tmp",
})
console.log(r.output) // /tmp 下的内容
```
