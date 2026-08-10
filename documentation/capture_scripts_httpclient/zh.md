`$httpClient` 让抓包规则脚本自行发起 HTTP 请求——例如拉取一个 token、调用 webhook,或用另一个接口的数据构造响应。它仅在[抓包规则脚本](capture_scripts/zh.md)中可用。

---

## 方法

```ts
$httpClient.get(options, callback)
$httpClient.post(options, callback)
$httpClient.put(options, callback)
$httpClient.delete(options, callback)
$httpClient.head(options, callback)
$httpClient.options(options, callback)
$httpClient.patch(options, callback)
```

`options` 可以是 URL 字符串,也可以是一个对象:

```ts
type Options = string | {
  url: string
  headers?: Record<string, string>
  body?: string | object     // 对象会被 JSON 编码, 并把 Content-Type 设为 application/json
  timeout?: number           // 秒; 默认取规则的 timeout
}
```

## 回调

```ts
type Callback = (
  error: string | null,
  response: { status: number, headers: Record<string, string> } | null,
  data: string | null,       // 响应体(文本)
) => void
```

成功时 `error` 为 `null`,`response`/`data` 有值;失败时(网络错误或超时)`error` 为字符串,`response`/`data` 为 `null`。

---

## 说明

* 请求经物理网卡发出,不会回环进抓包隧道。
* `data` 以文本返回,二进制响应不做解码。
* 实际超时受规则自身 timeout 限制——脚本不会比它的规则活得更久。
* 不自动跟随重定向,也不携带 cookie。

---

## 示例

```js
// 拉取一个值, 再把它作为请求 header 注入。
$httpClient.get("https://example.com/token", (error, response, data) => {
  if (error) { $done({}); return }
  const headers = $request.headers
  headers["X-Token"] = data.trim()
  $done({ headers })
})
```

```js
// 向 webhook POST 一段 JSON, 忽略结果, 请求原样透传。
$httpClient.post({
  url: "https://example.com/hook",
  body: { path: $request.url },
}, () => {})
$done({})
```
