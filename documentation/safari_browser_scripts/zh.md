Safari 浏览器脚本通过 Safari Web Extension 在 Safari 页面中运行用户脚本。运行时支持类似 Greasemonkey / 油猴的 `GM.*` API，并提供部分 Scripting API。

---

## 脚本运行位置

目前有两类脚本来源：

- Scripting 脚本项目中的 `browser.tsx`，构建后会生成 `browser.js`。
- 从 Safari 扩展弹窗安装的 `.user.js` / `.js` 脚本。

从 Safari 扩展弹窗安装的脚本会保存到：

```ts
scripting-safari-extension/userscripts/
```

下载文件和 GM 存储也在同一个根目录下：

```ts
scripting-safari-extension/downloads/
scripting-safari-extension/storages/
```

这个根目录会跟随 Settings 中配置的 Safari Browser Data 存储位置，包括启用 WebDAV 时的同步位置。

---

## 脚本格式

创建或安装 `.user.js` / `.js` 文件，并包含 userscript 头：

```js
// ==UserScript==
// @name GitHub Demo
// @match https://github.com/*
// @grant GM.log
// @grant Scripting.FileManager
// ==/UserScript==

GM.log("loaded", location.href)
```

常用元数据：

```ts
// @name
// @namespace
// @version
// @description
// @author
// @match
// @include
// @exclude
// @exclude-match
// @connect
// @grant
// @require
// @resource
// @run-at document-start | document-body | document-end | document-idle
// @inject-into auto | content | page
// @weight 1..999
// @noframes
// @homepageURL
// @supportURL
// @updateURL
// @downloadURL
// @license
```

`@weight` 用于控制多个匹配脚本的执行顺序，数值越大越先执行。如果没有写 `@run-at`，默认在 `document-end` 运行。

`@inject-into` 默认为 `auto`。在 `auto` 下，声明了任意 `@grant`（`GM.*` 或 `Scripting.*`）的脚本运行在 **content world**（可用特权 API，与页面 JavaScript 隔离）；而 `@grant none` 或未声明 grant 的脚本运行在 **page world**（共享页面真实 `window`，可读页面全局变量）。可用 `@inject-into content` 或 `@inject-into page` 显式指定世界。`GM.*`、`Scripting.*` 和扩展消息能力只在 content world 可用；page world 下 grant 会被忽略。在 Content-Security-Policy 拦截注入脚本的页面上，`auto` 的 page-world 脚本会自动回退到 content world。

---

## 权限

特权 API 需要通过 `@grant` 声明：

```js
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.xmlHttpRequest
// @grant GM.cookie
// @grant Scripting.FileManager
```

`@grant none` 会关闭 GM API，但为了兼容已有用户脚本，`GM_info` 和 `GM.info` 仍然可以访问。

跨域网络、下载、资源和 Cookie 访问需要通过 `@connect` 允许：

```js
// @connect api.github.com
// @connect https://api.github.com/*
// @connect *
```

缺少权限时，运行时会抛出带稳定 `code` 的错误，例如 `permissionDenied` 或 `connectDenied`。

---

## `GM_info`

`GM_info` 和 `GM.info` 会暴露解析后的元数据和运行时信息：

```ts
GM_info.script.name
GM_info.script.version
GM_info.script.matches
GM_info.script.connects
GM_info.script.runAt
GM_info.script.injectInto
GM_info.script.weight
GM_info.scriptHandler
GM_info.version
```

---

## 已支持的 GM API

### 存储

```ts
await GM.getValue(key, defaultValue)
await GM.setValue(key, value)
await GM.deleteValue(key)
await GM.listValues()

const id = GM.addValueChangeListener(key, (key, oldValue, newValue, remote) => {})
GM.removeValueChangeListener(id)
```

GM 存储会以 JSON 文件保存到 `scripting-safari-extension/storages/`。

### DOM 和菜单

```ts
GM.log(...items)
GM.addStyle(css)
GM.addElement("div", { textContent: "Hello" })
GM.addElement(document.body, "button", { textContent: "Run" })

const id = GM.registerMenuCommand("Run", () => {})
GM.unregisterMenuCommand(id)
GM.removeMenuCommand(id)
```

菜单命令会显示在当前页面的 Safari 扩展弹窗中。

### 标签页、剪贴板、通知

```ts
const tab = await GM.openInTab("https://github.com/trending", { active: false })
tab.close()
await GM.closeTab()

await GM.setClipboard("Hello")
await GM.notification({ title: "Scripting", text: "Done" })
```

`GM.closeTab()` 会在 Safari 支持时关闭当前标签页。`GM.openInTab()` 会返回带 `close()` 方法的标签页控制对象。

### 资源

```ts
const text = await GM.getResourceText("name")
const url = await GM.getResourceURL("name")
```

资源需要在 userscript 头中声明：

```js
// @resource name https://example.com/file.txt
```

### 下载

```ts
await GM.download({
  url: "https://example.com/file.txt",
  name: "file.txt",
  onload(response) {
    GM.log(response.path)
  }
})
```

下载文件会保存到 `scripting-safari-extension/downloads/`。

### XHR

```ts
await GM.xmlHttpRequest({
  method: "GET",
  url: "https://api.github.com/zen",
  responseType: "text",
  overrideMimeType: "text/plain",
  onloadstart(event) {},
  onprogress(event) {},
  onreadystatechange(response) {},
  onload(response) {},
  onloadend(response) {}
})
```

运行时支持 `text`、`json`、`arraybuffer`、`blob` 和 `document` 类型，也支持 `user`、`password`、`headers`、`data`、`timeout`、`binary`、`overrideMimeType`、`upload` 回调、`finalUrl` 和 `responseURL`。

### Cookie

```ts
await GM.cookie.set({
  url: location.href,
  name: "scripting_test",
  value: "1",
  path: "/",
  secure: true
})

const cookies = await GM.cookie.list({ url: location.href, name: "scripting_test" })
await GM.cookie.delete({ url: location.href, name: "scripting_test" })
```

也支持 callback 风格：

```ts
GM.cookie.list({ url: location.href }, cookies => {
  GM.log(cookies)
})
```

---

## `Scripting.FileManager`

使用 `@grant Scripting.FileManager` 或 `@grant Scripting.*` 开启 API。

### 属性

```ts
Scripting.FileManager.documentsDirectory: string
Scripting.FileManager.iCloudDocumentsDirectory: string | null
Scripting.FileManager.appGroupDocumentsDirectory: string | null
Scripting.FileManager.safariBrowserDirectory: string
Scripting.FileManager.safariBrowserStorageDirectory: string
Scripting.FileManager.safariBrowserDownloadsDirectory: string
Scripting.FileManager.safariBrowserUserscriptsDirectory: string
Scripting.FileManager.isiCloudEnabled: boolean
```

在普通 Scripting app 脚本中，也可以通过 `FileManager.safariBrowserDirectory`、`FileManager.safariBrowserStorageDirectory`、`FileManager.safariBrowserDownloadsDirectory` 和 `FileManager.safariBrowserUserscriptsDirectory` 访问同一套 Safari 数据目录。

### 方法

```ts
await Scripting.FileManager.readAsString(path)
await Scripting.FileManager.writeAsString(path, contents)
await Scripting.FileManager.createDirectory(path, true)
await Scripting.FileManager.readDirectory(path)
await Scripting.FileManager.exists(path)
await Scripting.FileManager.remove(path)
```

所有文件操作都被限制在 `Scripting.FileManager` 暴露的目录下。

---

## 已安装脚本

Safari 扩展弹窗支持从当前页面或 URL 安装 userscript。已安装脚本可以在弹窗和 Tools > Development > Safari Browser Scripts 中启用、禁用、更新或删除。

Tools 页面可以查看：

- 已安装的 userscript。
- GM 存储 JSON 文件。
- `GM.download` 下载的文件。

---

## 示例

```ts
// ==UserScript==
// @name Save Page URL
// @match https://github.com/*
// @grant GM.log
// @grant Scripting.FileManager
// ==/UserScript==

const fm = Scripting.FileManager
const dir = `${fm.appGroupDocumentsDirectory ?? fm.documentsDirectory}/Safari Notes`
const file = `${dir}/last-url.txt`

await fm.createDirectory(dir)
await fm.writeAsString(file, location.href)

GM.log(await fm.readAsString(file))
```
