`WebViewController` 是一个用于显示和交互网页内容的控制器。它允许你在脚本中加载 HTML、展示 Web 页面、执行 JavaScript 脚本，并与页面中的 JavaScript 进行消息通信。你可以将它作为浏览器使用，也可以嵌入应用功能页面。

---

## 类：`WebViewController`

```ts
const webView = new WebViewController()
```

### 构造函数

```ts
new WebViewController(options?: { ephemeral?: boolean })
```

* **选项**（均为可选）：

  * `ephemeral`：为 `true` 时，WebView 使用非持久化数据存储，cookie 与网站数据与默认容器隔离，在实例释放后一并丢弃。适合沙盒化的登陆流程或需要干净环境的抓取任务。

#### 示例

```ts
// 普通（持久化）WebView —— 与其他 WebViewController 共享 cookie。
const webView = new WebViewController()

// 独立 WebView —— cookie 被隔离，销毁时一并清除。
const isolated = new WebViewController({ ephemeral: true })
```

---

## 属性

### `shouldAllowRequest?: (request) => Promise<boolean>`

一个可选回调，用于决定是否允许或拦截 WebView 发起的请求。每次加载资源之前都会调用此函数，例如导航到新页面或提交表单时。

适用于拦截跳转行为、自定义安全策略或过滤广告等不需要的请求。

#### 参数

回调函数接收一个 `request` 对象，包含以下字段：

* `url: string`
  请求的完整 URL。

* `method: string`
  HTTP 方法，如 `GET`、`POST`。

* `body?: Data | null`
  可选，请求体数据（通常用于 `POST` 请求）。

* `headers: Record<string, string>`
  请求头信息。

* `timeoutInterval: number`
  请求的超时时间（单位为秒）。

* `navigationType: "linkActivated" | "reload" | "backForward" | "formResubmitted" | "formSubmitted" | "other"`
  触发导航的上下文。

#### 返回值

一个 `Promise<boolean>`，用于指示是否允许该请求：

* `true`：允许请求继续
* `false`：阻止该请求

#### 示例

```ts
const webView = new WebViewController()

webView.shouldAllowRequest = async (request) => {
  console.log('拦截到请求：', request.url)

  // 拦截所有访问 example.com 的请求
  if (request.url.includes('example.com')) {
    return false
  }

  return true
}

await webView.loadURL('https://www.wikipedia.org')
await webView.present({ navigationTitle: '已过滤的网页视图' })
```

---

## 方法

### `loadURL(url: string): Promise<boolean>`

加载指定 URL 的网页内容。

* **参数**：

  * `url`：要加载的网页完整地址。
* **返回**：`Promise<boolean>` — 加载成功返回 `true`。

---

### `loadFile(path: string, allowingReadAccessTo?: string): Promise<boolean>`

加载文件内容作为网页。

* **参数**:

  * `path`：要加载的文件路径。
  * `allowingReadAccessTo`（可选）：允许读取文件的路径，默认为 `path`。
* **返回**：`Promise<boolean>`

### `loadHTML(html: string, baseURL?: string): Promise<boolean>`

加载原始 HTML 字符串内容。

* **参数**：

  * `html`：要渲染的 HTML 字符串。
  * `baseURL`（可选）：用于解析相对路径的基础 URL。
* **返回**：`Promise<boolean>` — 加载成功返回 `true`。

---

### `loadData(data: Data, mimeType: string, encoding: string, baseURL: string): Promise<boolean>`

加载原始数据作为网页内容。

* **参数**：

  * `data`：要加载的二进制内容。
  * `mimeType`：内容的 MIME 类型，例如 `"text/html"`。
  * `encoding`：字符编码，例如 `"utf-8"`。
  * `baseURL`：用于解析相对路径的基础地址。
* **返回**：`Promise<boolean>`

---

### `waitForLoad(): Promise<boolean>`

等待 WebView 加载完成。

* **返回**：`Promise<boolean>`

---

### `getHTML(): Promise<string | null>`

获取当前页面的 HTML 内容。

* **返回**：`Promise<string | null>`

---

### `evaluateJavaScript<T = any>(javascript: string): Promise<T>`

在 WebView 中执行指定的 JavaScript 代码。

* **参数**：

  * `javascript`：要执行的 JavaScript 代码字符串。若希望返回值，必须在代码中使用 `return`。
* **返回**：`Promise<T>` — JavaScript 执行结果将作为 Promise 的值返回。

#### 示例

```ts
const webView = new WebViewController()
await webView.loadURL("https://example.com")
const title = await webView.evaluateJavaScript("return document.title")
console.log(title) // "Example Domain"
webView.dispose()
```

或：

```ts
const webView = new WebViewController()
await webView.loadHTML(`
  <html>
    <body>
      <script>
        window.myValue = 42
      </script>
    </body>
  </html>
`)

await webView.waitForLoad()

const result = await webView.evaluateJavaScript('return window.myValue')
console.log(result) // 42
```

---

### `addScriptMessageHandler<P = any, R = any>(name: string, handler: (params?: P) => R): Promise<void>`

添加一个脚本消息处理器，可在网页中通过 JavaScript 调用，并接收原生代码返回的结果。

* **参数**：

  * `name`：消息处理器名称，必须唯一且非空。
  * `handler`：处理函数，接收来自网页的参数并返回一个值，作为 Promise 的结果回传给网页。
* **返回**：`Promise<void>` — 添加成功后完成。

#### 示例

```ts
let webView = new WebViewController()

await webView.addScriptMessageHandler("sayHi", (greeting: string) => {
  console.log("收到消息", greeting)
  return "你好！"
})

await webView.loadHTML(`
  <html>
    <body>
      <script>
        (async () => {
          const response = await window.webkit.messageHandlers.sayHi.postMessage("Hi!")
          alert(response) // 弹出 "你好！"
        })()
      </script>
    </body>
  </html>
`)
```

---

### `present(options?: { fullscreen?: boolean, navigationTitle?: string }): Promise<void>`

以模态窗口形式展示 WebView。

* **选项**：

  * `fullscreen`：是否以全屏模式展示。
  * `navigationTitle`：导航栏标题（可选）。
* **返回**：`Promise<void>`

---

### `canGoBack(): Promise<boolean>`

判断 WebView 是否可以后退。

---

### `canGoForward(): Promise<boolean>`

判断 WebView 是否可以前进。

---

### `goBack(): Promise<boolean>`

返回上一页。

---

### `goForward(): Promise<boolean>`

前进到下一页。

---

### `reload(): Promise<void>`

重新加载当前网页。

---

### `takeSnapshot(options?): Promise<UIImage | null>`

对 WebView 当前可见区域进行截图，返回一个 `UIImage`。

* **选项**（均为可选）：

  * `rect`：要截取的矩形区域（基于 WebView 坐标系，单位为点）。默认为整个可见视口。
  * `snapshotWidth`：结果图像的宽度（单位为点），高度按比例缩放。默认为 WebView 的宽度。
  * `afterScreenUpdates`：是否在应用完待处理的屏幕更新后再截图。默认为 `true`。

* **返回**：`Promise<UIImage | null>` — 成功时返回 `UIImage`；若 WebView 未上屏（即未调用 `present()` 且未被 `<WebView>` 视图使用）或截图失败，返回 `null`。

#### 示例

```ts
const webView = new WebViewController()
await webView.loadURL('https://example.com')
await webView.present({ navigationTitle: '截图示例' })

const image = await webView.takeSnapshot()
if (image) {
  const data = image.pngData()
  // 保存或分享截图......
}

webView.dispose()
```

---

### `getAllCookies(): Promise<Cookie[]>`

返回 WebView cookie 容器中当前保存的全部 cookie，包含 `document.cookie` 无法访问的 `HttpOnly` cookie。

* **返回**：`Promise<Cookie[]>`

`Cookie` 的结构：

```ts
interface Cookie {
  name: string
  value: string
  domain: string
  path: string
  isSecure: boolean
  isHTTPOnly: boolean
  isSessionOnly: boolean
  expiresDate?: Date | null
}
```

---

### `getCookies(url: string): Promise<Cookie[]>`

返回将随给定 URL 一同发送的 cookie。匹配规则遵循 WebKit 的标准：URL 的 host 必须匹配 `cookie.domain`（当 `cookie.domain` 以 `.` 开头时支持子域匹配），且 URL 的路径必须被 `cookie.path` 覆盖。

* **参数**：

  * `url`：用于按域名和路径过滤 cookie 的 URL。
* **返回**：`Promise<Cookie[]>`

---

### `setCookie(cookie: Cookie): Promise<boolean>`

向 WebView cookie 容器写入（或覆盖）一条 cookie。

可以在调用 `loadURL` **之前**先调用 `setCookie` 预置登陆态 —— 只要实例创建完成，cookie 容器即可使用，不需要先把 WebView 展示到屏幕上。

* **参数**：

  * `cookie`：要写入的 cookie。`name`、`value`、`domain` 必填；`path` 默认为 `"/"`；当 `isSessionOnly` 为 `true` 或未提供 `expiresDate` 时，视为会话 cookie。
* **返回**：`Promise<boolean>` — 写入成功返回 `true`，输入非法返回 `false`。

#### 示例

```ts
const webView = new WebViewController()

// 在打开受限页面之前先写入 session cookie。
await webView.setCookie({
  name: "session",
  value: "abc123",
  domain: "example.com",
  path: "/",
  isSecure: true,
  isHTTPOnly: true,
  isSessionOnly: false,
  expiresDate: new Date(Date.now() + 86400_000),
})

await webView.loadURL("https://example.com/dashboard")
```

---

### `deleteCookie(cookie: { name: string, domain?: string, path?: string }): Promise<boolean>`

删除匹配给定描述符的 cookie。

可以把 `getAllCookies` / `getCookies` 返回的完整 `Cookie` 对象传回来精确删除，也可以只传部分字段（比如仅 `name`），此时每一条匹配的 cookie 都会被删除。

* **参数**：

  * `cookie.name`：要匹配的 cookie 名（必填）。
  * `cookie.domain`（可选）：提供时仅删除该域名下的 cookie。
  * `cookie.path`（可选）：提供时仅删除该路径下的 cookie。
* **返回**：`Promise<boolean>` — 至少删除一条返回 `true`，否则返回 `false`。

#### 示例

```ts
const webView = new WebViewController()
await webView.loadURL("https://example.com")

// 删除所有名为 "tracker" 的 cookie。
await webView.deleteCookie({ name: "tracker" })

// 或者把 getCookies 返回的具体 cookie 传回删除。
const [c] = await webView.getCookies("https://example.com/")
if (c) {
  await webView.deleteCookie(c)
}
```

---

### `clearAllCookies(): Promise<void>`

清空 WebView cookie 容器中的全部 cookie。其他网站数据（缓存、localStorage 等）不受影响。

* **返回**：`Promise<void>`

---

### `dismiss(): void`

关闭 WebView 页面（若当前正在展示）。

---

### `dispose(): void`

释放 WebView 实例并清理资源。

* 如果 WebView 正在展示，将先自动关闭。
* **重要**：请务必调用此方法以避免内存泄漏。

---

## 完整示例

```ts
const webView = new WebViewController()

await webView.addScriptMessageHandler('greet', (name) => {
  return `你好，${name}`
})

await webView.loadHTML(`
  <html>
    <body>
      <h1>自定义网页视图</h1>
      <button onclick="sendMessage()">打招呼</button>
      <script>
        async function sendMessage() {
          const response = await window.webkit.messageHandlers.greet.postMessage("Alice")
          alert(response)
        }
      </script>
    </body>
  </html>
`)

await webView.present({ navigationTitle: '网页视图示例' })
webView.dispose()
```