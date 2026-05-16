`Rime` namespace 暴露了一个可编程的中文输入法引擎，可在主 App 和键盘扩展中使用。脚本可以加载方案（schema）、喂入按键事件、自行绘制候选条，并提交所选文本。

引擎是进程级的：调用一次 `Rime.setup()` 即可，之后每次输入会话用 `new Rime.Session()` 拿一个独立 session。

---

## 数据目录

`Rime` 从「共享数据目录」读取方案 / 词典等只读资源，把用户状态（用户词频、构建缓存）写入「用户数据目录」。两者默认都放在主 App 和键盘扩展共享的 App Group 容器中，主 App 导入的方案可直接被键盘读取。

* `Rime.sharedDataDir` —— 共享数据目录路径。
* `Rime.userDataDir` —— 用户数据目录路径。

如有需要（如测试用私有沙盒），调用 `Rime.setup({ sharedDataDir, userDataDir })` 时可覆盖默认路径。

---

## 生命周期

### `Rime.setup(options?): Promise<void>`

初始化引擎。在调用其它 `Rime.*` 接口之前**必须**先 setup。同一进程内重复调用会幂等 resolve，不会重新初始化。

```ts
await Rime.setup()
// 或：
await Rime.setup({
  sharedDataDir: "/path/to/shared",
  userDataDir: "/path/to/user",
  appName: "my.input.method",  // 日志标识
})
```

### `Rime.deploy(options?): Promise<void>`

重新编译方案、必要时重建用户词典。导入或修改 `sharedDataDir` 内的方案 / 词典文件后调用一次即可。

```ts
await Rime.deploy()
await Rime.deploy({ fullCheck: true })  // 强制全量重建
```

### 状态属性（同步）

```ts
Rime.version       // string, 例如 "1.16.1"
Rime.isSetUp       // boolean
Rime.isDeploying   // boolean
```

---

## 方案管理

### `Rime.listSchemas(): Promise<{ id, name }[]>`

```ts
const schemas = await Rime.listSchemas()
// [{ id: "luna_pinyin", name: "朙月拼音" }, ...]
```

### `Rime.getCurrentSchema(): { id, name } | null`

返回当前引擎级方案；尚未激活时返回 `null`。

### `Rime.selectSchema(schemaId): Promise<void>`

切换引擎级默认方案。**只对调用后新创建的 session 生效**；已有 session 仍保留其原来的方案，除非显式调用 `session.selectSchema(id)`。

```ts
await Rime.selectSchema("luna_pinyin")
```

---

## 引擎级选项

下面这些开关（如 `ascii_mode`、`full_shape`、`simplification`）通过一个内部共享 session 维护，会被新建 session 继承。如需 per-session 覆盖，请用 `session.setOption(...)`。

```ts
Rime.getOption("ascii_mode")           // boolean
Rime.setOption("ascii_mode", true)
Rime.getProperty("language")           // string | null
Rime.setProperty("language", "zh")
```

---

## 通知

`Rime.onNotification` 是一个可选的单回调，引擎事件触发时在主线程调用。

```ts
Rime.onNotification = (event) => {
  switch (event.type) {
    case "deployStart":
    case "deploySuccess":
    case "deployFailure":
      // event.sessionId —— 引擎级事件通常为 0
      break
    case "schemaChanged":
      // event.schemaId, 可选 event.schemaName
      break
    case "optionChanged":
      // event.option (string), event.enabled (boolean)
      break
    case "other":
      // event.raw = { type, value } —— 未识别的事件
      break
  }
}

// 取消订阅：
Rime.onNotification = null
```

如需多订阅者，在 JS 端做一次 fan-out 即可：

```ts
const subs = []
Rime.onNotification = (e) => subs.forEach((s) => s(e))
```

---

## `Rime.Session`

每个 session 表示一次独立的输入会话。`new Rime.Session()` 创建，用完调 `session.close()` 释放。

```ts
const session = new Rime.Session()
try {
  if (!session.processKey(charCode)) {
    // 引擎未吸收，按键透传给宿主输入框
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

### 按键处理

```ts
session.processKey(keyCode: number, modifiers?: number): boolean
```

`keyCode` 使用 X11 keysym 编码（例如 `'w'.charCodeAt(0)` 是 `0x77`，回车键是 `0xff0d`）。返回 `true` 表示引擎吸收了该按键。

### Composition 状态

```ts
session.context  // Rime.Context | null —— 每次读取都是新快照
session.commit   // string | null —— 读取后会清空 pending commit
session.status   // Rime.Status | null —— 方案 + 模式开关
```

`session.context` 的形状：

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

### 候选词

```ts
session.selectCandidate(index: number): boolean              // 全菜单绝对下标
session.selectCandidateOnCurrentPage(index: number): boolean // 当前页 0-based 下标
```

### Commit / clear

```ts
session.commitComposition(): { text: string | null } | null  // 强制 commit
session.clearComposition(): void                              // 丢弃
```

### Per-session 方案 / 选项

```ts
session.selectSchema(schemaId: string): boolean
session.setOption(name: string, value: boolean): void
session.getOption(name: string): boolean
session.setProperty(name: string, value: string): void
session.getProperty(name: string): string | null
session.currentSchema  // { id, name } | null（从 status 派生）
```

### 关闭

```ts
session.close(): void
```

调用后所有方法变 no-op（`processKey` 返回 `false`、`context` 返回 `null` 等），`session.closed` 变为 `true`。可重复调用，幂等。

---

## 完整示例

```ts
await Rime.setup()
await Rime.deploy()

const session = new Rime.Session()

try {
  // 键入 "wo"
  session.processKey(0x77 /* w */)
  session.processKey(0x6f /* o */)

  const ctx = session.context!
  console.log(ctx.preedit)                       // "wo"
  console.log(ctx.menu?.candidates[0].text)      // "我"

  // 选第一个候选
  session.selectCandidate(0)
  console.log(session.commit)                    // "我"
} finally {
  session.close()
}
```

---

## 备注

* 共享 / 用户目录必须存在且可写。默认 App Group 目录会在 `setup()` 时自动创建。
* 方案部署在后台进行，可在 `Rime.isDeploying` 为 `true` 时显示一个 loading 指示。
* 若想用 Shift 键在中英文模式间切换，方案需要配 `key_binder` 段。没有 `key_binder` 时，`Rime.setOption("ascii_mode", true)` 仍然有效，但 Shift 切换键不会触发。
* 导入用户词典：把 `.dict.yaml` 文件放入 `sharedDataDir`，然后调用 `Rime.deploy()`。
