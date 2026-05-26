`HttpServer` 类提供了在本地或局域网中启动一个轻量级 HTTP 服务器的能力，可用于处理 HTTP 请求、静态文件服务、WebSocket 通信等场景。该类在脚本中常用于本地 Web 调试、远程控制、设备通信等。

---

## 概述

`HttpServer` 支持以下功能：

* 处理自定义路径的 HTTP 请求。
* 提供静态文件或目录的访问。
* 注册 WebSocket 服务端，实现实时通信。
* 支持 IPv4 与 IPv6 地址。
* 可选择端口号（支持随机端口）。
* 支持服务器状态查询。

---

## 属性

### `state: HttpServerState`

服务器当前状态。
可能值包括：

| 状态           | 说明       |
| ------------ | -------- |
| `"starting"` | 正在启动服务器。 |
| `"running"`  | 服务器运行中。  |
| `"stopping"` | 正在停止服务器。 |
| `"stopped"`  | 服务器已停止。  |

---

### `port: number | null`

服务器监听的端口号。
如果服务器未运行，则为 `null`。

---

### `isIPv4: boolean`

指示服务器是否在 IPv4 地址上监听。若为 `false`，则可能监听 IPv6 地址。

---

### `listenAddressIPv4: string | null`

IPv4 监听地址，仅当 `forceIPv4` 为 `true` 时使用。

---

### `listenAddressIPv6: string | null`

IPv6 监听地址，仅当 `forceIPv6` 为 `true` 时使用。

---

## 方法

### `registerHandler(path: string, handler: (request: HttpRequest) => HttpResponse): void`

> **已废弃。** 推荐使用 `registerAsyncHandler`。同步入口无法在响应前 `await` Keychain 访问、网络 IO 或文件读取，仅为兼容历史脚本保留。

为指定路径注册一个同步 HTTP 请求处理器。处理函数会在 JavaScript 主线程上同步执行，必须立刻返回 `HttpResponse`。

**参数：**

| 参数        | 类型                                       | 说明                           |
| --------- | ---------------------------------------- | ---------------------------- |
| `path`    | `string`                                 | 请求路径（支持动态参数，例如 `/user/:id`）。 |
| `handler` | `(request: HttpRequest) => HttpResponse` | 处理函数，接收请求对象并返回响应对象。          |

**示例：**

```ts
const server = new HttpServer()

server.registerHandler("/hello", (req) => {
  return HttpResponse.ok(HttpResponseBody.text("Hello, world!"))
})
```

---

### `registerAsyncHandler(path: string, handler: (request: HttpRequest) => Promise<HttpResponse>): void`

注册一个异步处理器。处理函数可以返回 `Promise<HttpResponse>`，服务器会等待 promise 兑现后再发送响应。若 promise 被 reject，服务器会以 500 状态码返回错误信息。

**参数：**

| 参数        | 类型                                                | 说明                                  |
| --------- | ------------------------------------------------- | ----------------------------------- |
| `path`    | `string`                                          | 请求路径（支持动态参数，例如 `/user/:id`）。      |
| `handler` | `(request: HttpRequest) => Promise<HttpResponse>` | 异步处理函数，返回 `HttpResponse` 的 Promise。 |

**示例：**

```ts
const server = new HttpServer()

server.registerAsyncHandler("/slow", async (req) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return HttpResponse.ok(HttpResponseBody.text("slow ok"))
})
```

---

### `registerFile(path: string, filePath: string): void`

为指定路径注册一个静态文件响应。

**参数：**

| 参数         | 类型       | 说明        |
| ---------- | -------- | --------- |
| `path`     | `string` | 请求路径。     |
| `filePath` | `string` | 要响应的文件路径。 |

**示例：**

```ts
server.registerFile("/readme", Path.join(Script.directory, "README.md"))
```

当访问 `/readme` 时，服务器将返回该文件的内容。

---

### `registerFilesFromDirectory(path: string, directory: string, options?: { defaults?: string[] }): void`

注册指定目录下的所有文件，使其可通过 HTTP 访问。

**参数：**

| 参数                 | 类型         | 说明                                                             |
| ------------------ | ---------- | -------------------------------------------------------------- |
| `path`             | `string`   | 路径模板，例如 `/static/:file`。                                       |
| `directory`        | `string`   | 目录路径。                                                          |
| `options.defaults` | `string[]` | 默认文件名，若未指定文件则尝试加载此列表中的文件（默认：`["index.html", "default.html"]`）。 |

**示例：**

```ts
server.registerFilesFromDirectory("/static/:file", Path.join(Script.directory, "html"), {
  defaults: ["index.html", "index.htm"]
})
```

当访问 `/static/` 时，会返回该目录下的默认首页文件。

---

### `registerWebsocket(path: string, handlers: WebSocketHandlers): void`

注册 WebSocket 服务端处理程序，用于实时通信。

**参数：**

| 参数         | 类型                  | 说明                |
| ---------- | ------------------- | ----------------- |
| `path`     | `string`            | WebSocket 路径。     |
| `handlers` | `WebSocketHandlers` | WebSocket 事件处理函数。 |

**WebSocketHandlers 类型定义：**

```ts
interface WebSocketHandlers {
  onPong?: (session: WebSocketSession) => void
  onConnected?: (session: WebSocketSession) => void
  onDisconnected?: (session: WebSocketSession) => void
  handleText?: (session: WebSocketSession, text: string) => void
  handleBinary?: (session: WebSocketSession, data: Data) => void
}
```

**示例：**

```ts
const connectedSessions: WebSocketSession[] = []

server.registerWebsocket("/ws", {
  onConnected: (session) => {
    connectedSessions.push(session)
  },
  onDisconnected: (session) => {
    connectedSessions.splice(connectedSessions.indexOf(session), 1)
  },
  handleText: (session, text) => {
    session.writeText("Echo: " + text)
  }
})
```

---

### `registerMiddleware(handler: (request: HttpRequest) => Promise<HttpResponse | null | undefined>): void`

注册一层 async 中间件，按注册顺序在所有路由处理器之前执行。中间件可以：

- resolve `null` / `undefined` — 放行，继续走下一层中间件或路由处理器；
- resolve 一个 `HttpResponse` — 直接截胡，后续中间件和路由处理器都不再执行。

reject 或抛错会被转成 `500` 响应。

**参数：**

| 参数        | 类型                                                              | 说明              |
| --------- | ----------------------------------------------------------------- | --------------- |
| `handler` | `(req: HttpRequest) => Promise<HttpResponse \| null \| undefined>` | 异步中间件函数。        |

**示例：简单鉴权拦截**

```ts
server.registerMiddleware(async (req) => {
  if (!req.headers["x-auth"]) {
    return HttpResponse.unauthorized(HttpResponseBody.text("missing token"))
  }
  return null
})
```

---

### `setNotFoundHandler(handler: (request: HttpRequest) => Promise<HttpResponse>): void`

设置自定义 async 404 兜底处理器。当所有路由都未命中时调用。多次调用会覆盖之前的注册。reject 或抛错会被转成 `500`。

**参数：**

| 参数        | 类型                                            | 说明              |
| --------- | --------------------------------------------- | --------------- |
| `handler` | `(req: HttpRequest) => Promise<HttpResponse>` | 异步 404 处理函数。    |

**示例：**

```ts
server.setNotFoundHandler(async (req) => {
  return HttpResponse.notFound(HttpResponseBody.text(`未找到路径: ${req.path}`))
})
```

---

### `start(options?: { port?, forceIPv4?, tls? }): string | null`

启动服务器。成功返回 `null`，失败（配置错误、端口被占等）返回错误描述字符串。

**参数：**

| 参数                      | 类型                | 说明                                                                                                                  |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.port`          | `number`          | 指定监听端口，默认为 `8080`。如果设为 `0`，则自动选择可用端口，启动后通过 `server.port` 获取实际端口。                                                  |
| `options.forceIPv4`     | `boolean`         | 是否强制使用 IPv4 地址，默认 `false`。                                                                                          |
| `options.tls.p12`       | `string \| Data`  | PKCS#12 身份。可以是文件绝对路径（`string`），也可以是 P12 原始字节（`Data`）。当 P12 从 Keychain 等内存源加载时，直接传 `Data` 更方便。                       |
| `options.tls.password`  | `string`          | P12 解密密码。                                                                                                           |
| `options.tls.minVersion`| `"1.2" \| "1.3"` | 最低 TLS 协议版本，默认 `"1.2"`。Apple 在 macOS 12 / iOS 15 后弃用了 TLSv1.0/1.1，本接口不支持。                                          |
| `options.tls.maxVersion`| `"1.2" \| "1.3"` | 最高 TLS 协议版本，默认不限。把 `minVersion` 与 `maxVersion` 都设为 `"1.3"` 即可强制只跑 TLSv1.3。                                          |

**HTTP 示例：**

```ts
const error = server.start({ port: 8080 })
if (error) {
  console.error("启动失败:", error)
} else {
  console.log("服务器运行在端口:", server.port)
}
```

**HTTPS（P12 文件）：**

```ts
const error = server.start({
  port: 8443,
  tls: {
    p12: Path.join(Script.directory, "server.p12"),
    password: "your-p12-password",
  },
})
```

**HTTPS（P12 字节 + 强制 TLS 1.3）：**

```ts
// Keychain 接口是同步的，未找到时返回 null。
const p12Bytes = Keychain.getData("server.p12")
if (!p12Bytes) {
  throw new Error("Keychain 中未存储 server.p12")
}
server.start({
  port: 8443,
  tls: {
    p12: p12Bytes,
    password: "your-p12-password",
    minVersion: "1.3",
    maxVersion: "1.3",
  },
})
```

本地测试用的自签名 P12 可以这样生成：

```sh
openssl req -x509 -newkey rsa:2048 \
    -keyout localhost.key -out localhost.crt \
    -days 3650 -nodes -subj "/CN=localhost"
openssl pkcs12 -export -out localhost.p12 \
    -inkey localhost.key -in localhost.crt \
    -name "scripting-test" -password pass:yourpassword \
    -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES
```

---

### `stop(): void`

停止服务器并释放资源。

**示例：**

```ts
server.stop()
console.log("服务器已停止")
```

---

## 类型定义

### `HttpServerState`

```ts
type HttpServerState = "starting" | "running" | "stopping" | "stopped"
```

### `WebSocketSession`

表示一个 WebSocket 连接。

**常用方法：**

| 方法                        | 说明       |
| ------------------------- | -------- |
| `writeText(text: string)` | 发送文本消息。  |
| `writeData(data: Data)`   | 发送二进制消息。 |
| `close()`                 | 关闭连接。    |

---

## 综合示例

以下示例展示了一个完整的 HTTP 与 WebSocket 服务器：

```ts
const server = new HttpServer()

// 注册简单的 HTTP 处理
server.registerHandler("/api/hello", (req) => {
  return HttpResponse.ok(HttpResponseBody.text("Hello from Scripting Server"))
})

// 注册静态目录
server.registerFilesFromDirectory("/public/:file", Path.join(Script.directory, "html"))

// 注册 WebSocket 服务
server.registerWebsocket("/chat", {
  onConnected: (session) => {
    console.log("新连接")
    session.writeText("欢迎加入聊天")
  },
  handleText: (session, text) => {
    console.log("收到:", text)
    session.writeText("你说: " + text)
  }
})

// 启动服务器
const error = server.start({ port: 8080 })
if (error) {
  console.error("启动失败:", error)
} else {
  console.log("HTTP服务器已启动，端口:", server.port)
}
```
