`WebScraper` 模块提供一个轻量级网页抓取服务，用于在脚本中稳定地加载网页并获取 HTML 内容或执行页面内的数据提取逻辑。

该模块内部通过受控的网页加载环境执行页面请求，并提供多种等待策略（例如 DOM 完成、网络空闲、特定元素出现），以提高在复杂网站中的抓取稳定性。

`WebScraper` 主要适用于以下场景：

* 获取网页最终渲染后的 HTML
* 在页面上下文执行 JavaScript 提取数据
* 等待动态页面加载完成后再抓取
* 编写稳定的自动化网页抓取脚本

所有抓取操作均为 **异步任务**，每个任务都有唯一 `taskId`，可用于取消任务或追踪执行状态。

---

# 类型定义

## WaitOptions

用于指定网页加载完成的等待策略。

```ts
type WaitOptions =
  | "domComplete"
  | "networkIdle"
  | {
      mode: "domComplete"
    }
  | {
      mode: "networkIdle"
      idleSeconds?: number
    }
  | {
      mode: "selector"
      selector: string
    }
```

### 可选模式

#### `"domComplete"`

等待页面 `document.readyState === "complete"`。

适用于：

* 普通网页
* 静态页面
* 不依赖大量异步请求的网站

示例：

```ts
wait: "domComplete"
```

---

#### `"networkIdle"`

等待网络请求进入空闲状态。

当页面在指定时间内没有新的网络请求时，视为加载完成。

适用于：

* SPA 应用
* 动态数据加载页面
* 需要等待 API 请求完成的网页

示例：

```ts
wait: "networkIdle"
```

可指定空闲时间：

```ts
wait: {
  mode: "networkIdle",
  idleSeconds: 2
}
```

---

#### `"selector"`

等待指定 DOM 元素出现。

当页面出现匹配 `selector` 的元素时，任务继续执行。

适用于：

* 页面数据异步渲染
* 需要等待某个元素加载完成
* 精确控制抓取时机

示例：

```ts
wait: {
  mode: "selector",
  selector: ".article-content"
}
```

---

# Error

表示抓取任务发生的错误信息。

```ts
type Error = {
  code: string
  message: string
}
```

### 属性

#### code

错误代码，用于标识错误类型。

示例：

```
NETWORK_ERROR
TIMEOUT
SCRIPT_ERROR
```

#### message

错误的详细描述。

示例：

```
Request timed out
```

---

# Timing

任务执行耗时信息。

```ts
type Timing = {
  totalMs: number
}
```

### 属性

#### totalMs

任务总耗时（毫秒）。

---

# Result

所有 WebScraper API 的返回结果统一使用 `Result` 类型。

```ts
type Result<T = any> = {
  ok: boolean
  taskId: string
  url?: string
  html?: string
  data?: T
  error?: Error
  timing?: Timing
}
```

### 属性

#### ok

表示任务是否成功。

```
true  任务成功
false 任务失败
```

---

#### taskId

任务唯一 ID。

如果未手动指定 `taskId`，系统会自动生成。

可用于取消任务：

```ts
WebScraper.cancel(taskId)
```

---

#### url

最终加载的 URL。

某些网站可能发生重定向，该字段返回最终地址。

---

#### html

页面最终 HTML。

通常为 **浏览器渲染后的 DOM HTML**，而不是原始响应 HTML。

---

#### data

`extractScript` 或 `eval` 返回的数据。

该字段类型由泛型 `T` 决定。

---

#### error

任务失败时返回错误信息。

---

#### timing

任务执行时间信息。

---

# API

## load

加载网页并返回最终 HTML。

```ts
function load(options: {
  url: string
  wait?: WaitOptions
  timeout?: number
  taskId?: string
}): Promise<Result<string>>
```

### 参数

#### url

要加载的网页地址。

```ts
url: "https://example.com"
```

---

#### wait

等待策略，用于控制何时认为页面加载完成。

默认：

```
"domComplete"
```

---

#### timeout

任务超时时间（毫秒）。

如果超过该时间仍未完成，则任务失败。

示例：

```
timeout: 15000
```

---

#### taskId

任务 ID。

如果不指定，系统会自动生成。

---

### 示例

```ts
const result = await WebScraper.load({
  url: "https://example.com",
  wait: "networkIdle"
})

if (result.ok) {
  console.log(result.html)
}
```

---

# scrape

加载网页并在页面中执行数据提取脚本。

```ts
function scrape<T = any>(options: {
  url: string
  wait?: WaitOptions
  timeout?: number
  extractScript?: string
  taskId?: string
}): Promise<Result<T>>
```

该方法会：

1. 加载网页
2. 等待指定条件
3. 在页面环境执行 `extractScript`
4. 返回 HTML 与提取数据

---

### 参数

#### extractScript

在页面上下文执行的 JavaScript 代码。

脚本应返回需要提取的数据。

示例：

```ts
extractScript: `
  return {
    title: document.title,
    articles: Array.from(document.querySelectorAll("article")).map(el => ({
      title: el.querySelector("h2")?.innerText,
      link: el.querySelector("a")?.href
    }))
  }
`
```

---

### 示例

```ts
const result = await WebScraper.scrape({
  url: "https://news.ycombinator.com",
  wait: {
    mode: "selector",
    selector: ".athing"
  },
  extractScript: `
    return Array.from(document.querySelectorAll(".athing")).map(el => ({
      title: el.querySelector(".titleline a")?.innerText,
      url: el.querySelector(".titleline a")?.href
    }))
  `
})

if (result.ok) {
  console.log(result.data)
}
```

---

# eval

在页面上下文执行 JavaScript 并返回结果。

```ts
function eval<T = any>(options: {
  url: string
  script: string
  wait?: WaitOptions
  timeout?: number
  taskId?: string
}): Promise<Result<T>>
```

该方法用于执行自定义 JavaScript 逻辑。

与 `scrape` 不同的是：

* `eval` 只返回脚本执行结果
* `scrape` 更偏向数据提取

---

### 参数

#### script

在页面上下文执行的 JavaScript 代码。

必须返回一个值。

---

### 示例

```ts
const result = await WebScraper.eval({
  url: "https://example.com",
  script: `
    return {
      title: document.title,
      links: document.links.length
    }
  `
})

if (result.ok) {
  console.log(result.data)
}
```

---

# cancel

取消一个正在执行的抓取任务。

```ts
function cancel(taskId: string): Promise<boolean>
```

### 参数

#### taskId

要取消的任务 ID。

---

### 返回值

```
true  任务成功取消
false 未找到任务或任务已完成
```

---

### 示例

```ts
const taskId = "scrape-news"

WebScraper.scrape({
  url: "https://example.com",
  taskId
})

await WebScraper.cancel(taskId)
```

---

# 使用建议

## 选择合适的等待策略

不同网站适合不同策略：

| 场景     | 推荐 wait         |
| ------ | --------------- |
| 普通网页   | `"domComplete"` |
| SPA 网站 | `"networkIdle"` |
| 等待某元素  | `"selector"`    |

---

## 使用 selector 提高稳定性

对于动态加载网站，推荐：

```ts
wait: {
  mode: "selector",
  selector: ".content"
}
```

这样可以避免页面尚未渲染完成就抓取。

---

## 控制超时时间（秒）

复杂页面建议增加 `timeout`：

```ts
timeout: 20
```

---

## 使用 extractScript 减少 HTML 解析

相比获取 HTML 再解析：

```ts
const html = result.html
```

更推荐直接提取数据：

```ts
extractScript: `
  return document.title
`
```

可以显著提高性能并减少脚本复杂度。
