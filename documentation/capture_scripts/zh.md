HTTP 抓包脚本让你在抓包过程中用 JavaScript 改写匹配到的请求与响应。脚本挂在一条**抓包规则**上,当规则的 pattern 匹配到请求 URL 时,脚本便在抓包引擎内运行。

> 这些 API(`$request`、`$response`、`$done`、`$argument`、`console`、`$httpClient`、`$persistentStore`、`$notification`、`$utils`)**仅在抓包规则脚本中可用**——普通脚本里没有,也无需 import。

---

## 规则配置

每条规则在规则编辑器中配置:

| 字段 | 含义 |
| ---- | ---- |
| **Pattern** | 一个针对请求 URL 匹配的正则表达式。仅当匹配时脚本才运行。 |
| **Type** | `Request` 在请求发出前运行;`Response` 在收到响应后运行。 |
| **Requires Body** | 打开后会缓冲消息体,脚本得以读取并改写它;关闭时脚本只能看到 headers。 |
| **Max Body Size** | 超过此大小的 body 原样透传(该消息跳过脚本)。 |
| **Binary Body** | 打开时 `body` 以 `Uint8Array` 暴露;关闭时以字符串暴露。 |
| **Timeout** | 若脚本在此秒数内未调用 `$done(...)`,消息原样透传。 |
| **Argument** | 以 `$argument` 暴露给脚本的值。 |

---

## 执行模型

当多条规则命中同一条消息时,它们**按列表中的先后顺序**依次运行,且效果累积:每个脚本都能看到上一个脚本的输出。请求脚本若返回 mock 响应(见下),则短路整条链——不再发起上游请求,也不再运行响应脚本。

若脚本抛错、超时或始终未调用 `$done(...)`,消息将原样透传。脚本永远不会破坏它无意改动的流量。

---

## `$request`

在请求脚本与响应脚本中均可用。

```ts
$request: {
  url: string
  method: string
  headers: Record<string, string>
  body?: string | Uint8Array   // 仅当 Requires Body 打开时存在
}
```

在响应脚本中,`$request` 为只读,提供 `url` 与 `method` 作为上下文。

## `$response`

在响应脚本中可用。

```ts
$response: {
  status: number
  headers: Record<string, string>
  body?: string | Uint8Array   // 仅当 Requires Body 打开时存在
}
```

body 已经解压:若响应使用了 `Content-Encoding`(如 gzip),`body` 即为解码后的内容。仅当数据在**应用层**被 gzip 压缩时,才需要用 [`$utils.ungzip`](capture_scripts_utils/zh.md)。

---

## `$done`

每个脚本都必须调用一次 `$done(...)` 来结束。参数的形状决定结果。

### 请求脚本

```ts
// 原样透传
$done({})

// 改写发出的请求(任意字段可省略)
$done({
  url?: string,
  headers?: Record<string, string>,
  body?: string | Uint8Array,
})

// 直接返回 mock 响应,不联系服务器(短路整条链)
$done({
  response: {
    status: number,
    headers?: Record<string, string>,
    body?: string | Uint8Array,
  }
})
```

### 响应脚本

```ts
// 原样透传
$done({})

// 改写响应(任意字段可省略)
$done({
  status?: number,
  headers?: Record<string, string>,
  body?: string | Uint8Array,
})
```

当你返回 `headers` 时,它会替换掉转发出去的 header 集合;省略 `headers` 则保留原有的。

---

## `$argument`

规则上配置的值。普通 argument 是字符串;结构化 argument(input / select / switch 字段)则是一个以字段名为键的对象。

```ts
// 规则 argument: token=abc123
const token = $argument            // "abc123"

// 结构化 argument
const enabled = $argument.enabled  // true
```

---

## `console`

```ts
console.log(...args: any[]): void
```

`console.log` 会写入抓包日志,便于调试。

---

## 示例

```js
// 请求脚本: 注入一个 header 并加一个 query 标记。
const headers = $request.headers
headers["X-Debug"] = "1"
$done({ url: $request.url + "?trace=1", headers })
```

```js
// 响应脚本(Requires Body 打开): 给 JSON 响应加一个字段。
try {
  const json = JSON.parse($response.body)
  json.injected = true
  $done({ body: JSON.stringify(json) })
} catch (e) {
  $done({})
}
```

## 相关 API

* [`$httpClient`](capture_scripts_httpclient/zh.md) —— 在脚本中发起 HTTP 请求。
* [`$persistentStore`](capture_scripts_store/zh.md) —— 读写持久化的值。
* [`$notification`](capture_scripts_notification/zh.md) —— 发一条本地通知。
* [`$utils`](capture_scripts_utils/zh.md) —— 实用工具(`ungzip` 等)。
