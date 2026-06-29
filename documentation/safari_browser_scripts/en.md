Safari Browser Scripts let Scripting run userscripts in Safari through the Safari Web Extension. The runtime supports Greasemonkey-style `GM.*` APIs and selected Scripting APIs.

---

## Where Scripts Run

There are two sources:

- `browser.tsx` in a Scripting script project. It is built to `browser.js`.
- Installed `.user.js` / `.js` files from Safari's extension popup.

Scripts installed from Safari's extension popup are stored under:

```ts
scripting-safari-extension/userscripts/
```

Downloads and GM storage live in the same root:

```ts
scripting-safari-extension/downloads/
scripting-safari-extension/storages/
```

This root follows the Safari Browser Data storage location configured in Settings, including WebDAV when enabled.

---

## Script Format

Create or install a `.user.js` / `.js` file with a userscript metadata block:

```js
// ==UserScript==
// @name GitHub Demo
// @match https://github.com/*
// @grant GM.log
// @grant Scripting.FileManager
// ==/UserScript==

GM.log("loaded", location.href)
```

Common metadata keys:

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

`@weight` controls execution order when multiple scripts match the page. Larger weights run first. If no `@run-at` is provided, scripts run at `document-end`.

`@inject-into` defaults to `auto`. With `auto`, a script that declares any `@grant` (`GM.*` or `Scripting.*`) runs in the **content world** (privileged APIs available, isolated from the page's JavaScript), while a script with `@grant none` or no grant runs in the **page world** (shares the page's real `window`, can read page globals). Use `@inject-into content` or `@inject-into page` to force a world explicitly. `GM.*`, `Scripting.*`, and extension messaging are only available in the content world; grants are ignored in the page world. On pages whose Content-Security-Policy blocks injected scripts, `auto` page-world scripts automatically fall back to the content world.

---

## Permissions

Privileged APIs must be declared with `@grant`.

```js
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.xmlHttpRequest
// @grant GM.cookie
// @grant Scripting.FileManager
```

`@grant none` disables GM APIs, but `GM_info` and `GM.info` remain available for compatibility.

Cross-origin network, download, resource, and cookie access must be allowed with `@connect`.

```js
// @connect api.github.com
// @connect https://api.github.com/*
// @connect *
```

When a required grant or connect rule is missing, the runtime throws an error with a stable `code` such as `permissionDenied` or `connectDenied`.

---

## `GM_info`

`GM_info` and `GM.info` expose parsed metadata and runtime details:

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

## Supported GM APIs

### Storage

```ts
await GM.getValue(key, defaultValue)
await GM.setValue(key, value)
await GM.deleteValue(key)
await GM.listValues()

const id = GM.addValueChangeListener(key, (key, oldValue, newValue, remote) => {})
GM.removeValueChangeListener(id)
```

GM storage is stored as JSON under `scripting-safari-extension/storages/`.

### DOM and Menu

```ts
GM.log(...items)
GM.addStyle(css)
GM.addElement("div", { textContent: "Hello" })
GM.addElement(document.body, "button", { textContent: "Run" })

const id = GM.registerMenuCommand("Run", () => {})
GM.unregisterMenuCommand(id)
GM.removeMenuCommand(id)
```

Menu commands are shown in Safari's extension popup for the current page.

### Tabs, Clipboard, Notification

```ts
const tab = await GM.openInTab("https://github.com/trending", { active: false })
tab.close()
await GM.closeTab()

await GM.setClipboard("Hello")
await GM.notification({ title: "Scripting", text: "Done" })
```

`GM.closeTab()` closes the current tab when supported by Safari. `GM.openInTab()` returns a tab control with `close()`.

### Resources

```ts
const text = await GM.getResourceText("name")
const url = await GM.getResourceURL("name")
```

Declare resources in the metadata block:

```js
// @resource name https://example.com/file.txt
```

### Download

```ts
await GM.download({
  url: "https://example.com/file.txt",
  name: "file.txt",
  onload(response) {
    GM.log(response.path)
  }
})
```

Downloaded files are stored under `scripting-safari-extension/downloads/`.

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

The runtime supports `responseType` values `text`, `json`, `arraybuffer`, `blob`, and `document`, plus `user`, `password`, `headers`, `data`, `timeout`, `binary`, `overrideMimeType`, `upload` callbacks, `finalUrl`, and `responseURL`.

### Cookies

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

Callback style is also supported:

```ts
GM.cookie.list({ url: location.href }, cookies => {
  GM.log(cookies)
})
```

---

## `Scripting.FileManager`

Use `@grant Scripting.FileManager` or `@grant Scripting.*` to access the API.

### Properties

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

In regular Scripting app scripts, the same Safari data directories are available as `FileManager.safariBrowserDirectory`, `FileManager.safariBrowserStorageDirectory`, `FileManager.safariBrowserDownloadsDirectory`, and `FileManager.safariBrowserUserscriptsDirectory`.

### Methods

```ts
await Scripting.FileManager.readAsString(path)
await Scripting.FileManager.writeAsString(path, contents)
await Scripting.FileManager.createDirectory(path, true)
await Scripting.FileManager.readDirectory(path)
await Scripting.FileManager.exists(path)
await Scripting.FileManager.remove(path)
```

All file operations are limited to directories exposed by `Scripting.FileManager`.

---

## Installed Scripts

Safari's extension popup can install userscripts from the current page or from a URL. Installed scripts can be enabled, disabled, updated, or deleted in the popup and in Tools > Development > Safari Browser Scripts.

Use the Tools page to inspect:

- Installed userscripts.
- GM storage JSON files.
- Downloads created by `GM.download`.

---

## Example

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
