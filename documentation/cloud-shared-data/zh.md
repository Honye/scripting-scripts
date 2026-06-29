`CloudSharedData` 类让脚本读写一份基于 iCloud 的共享数据源,并与其他用户协同维护——例如一份宝宝成长记录,全家通过同一个脚本一起查看和录入。

数据存储在 CloudKit(归属者的 iCloud 私有数据库)并在协作者之间同步。需要用户已登录 iCloud,且拥有 **Pro** 订阅;脚本需声明 `cloudSharedData` 权限。

---

## 谁来创建 store

一个 store 由一个 **UUID** 标识。脚本是纯消费者——不能创建、也不能列出 store。流程如下:

* 在「设置 → iCloud Shared Data」里创建 store(或让 Agent 创建),得到一个 store **UUID**。
* 把 UUID 粘进脚本:`new CloudSharedData(uuid)`。
* 要协作,先分享(在管理页,或用下面的 `share()` / `presentShareSheet()`)让对方接受。接受后,对方在同一脚本里粘贴**同一个** UUID。

隔离靠「同意授权」而非结构:

* **按脚本/技能** —— 某脚本或技能第一次访问某 store 时,会弹框让用户为「该脚本 + 该 store」授权;拒绝则该 store 的所有调用都失败。授权可在「设置 → iCloud Shared Data」撤销。
* **跨用户** —— 由 CloudKit 和 Apple ID 保证。用户只能访问明确分享给自己、且已接受的 store。

---

## 创建实例

```ts
// UUID 来自「设置 → iCloud Shared Data」,或你接受的某次分享。
const store = new CloudSharedData("3F2504E0-4F89-41D3-9A0C-0305E82C3301")
```

---

## 目录语义(entries)

当多人各自追加或编辑独立记录时用键值条目——并发追加永不冲突。

```ts
// 归属者或任意协作者
await store.put("2026-06-20", { height: 75, weight: 9.2 })

const entry = await store.get("2026-06-20")
// entry?.value -> { height: 75, weight: 9.2 }

const all = await store.entries()
// [{ key: "2026-06-20", value: {...}, hasBlob: false }, ...]

await store.remove("2026-06-20")
```

给条目附带二进制 blob:

```ts
const photo = Data.fromJPEG(image, 0.8)!
await store.put("first-smile", { note: "🙂" }, photo)
const e = await store.get("first-smile")
// e?.blob -> Data | null
```

同一个 key 再次写入会覆盖(后写者胜)。并发编辑*同一条*为后写者胜;追加或删除*不同* key 永不冲突。

---

## 单文件语义

当整个 store 就是一份文档时,用文件接口(与目录语义并存):

```ts
await store.writeFile(Data.fromString(JSON.stringify(state))!)
const data = await store.readFile()
```

对文件的并发写入为后写者胜。

---

## 分享

```ts
// 拿到邀请链接(所有宿主可用,包括小组件):
const info = await store.share({ permission: "readWrite" })
// info.url -> 通过信息等发送

// 或唤起系统原生邀请面板(主 App、Share / 翻译 UI 扩展):
await store.presentShareSheet({ permission: "readWrite" })

// 查看协作者 / 权限:
const current = await store.shareInfo()

// 停止分享(仅归属者):
await store.stopSharing()
```

在系统面板里,用户可选择「仅受邀的人」或「任何持链接的人」,以及只读 / 可读写。

---

## 保持同步

```ts
// 拉取式:廉价地探测是否有变化,再重读。
if (await store.refresh()) {
  const all = await store.entries()
}

// 推送式:他人改动时收到通知。
const unsubscribe = store.onChange(async () => {
  const all = await store.entries()
  // 更新你的界面
})
// 不再需要更新时调用 unsubscribe()。
```

---

## 方法

| 方法 | 说明 |
| ---- | ---- |
| `new CloudSharedData(storeId)` | 按 UUID 连接到一个 store(在设置里创建,或别人分享给你)。 |
| `put(key, value, blob?)` | 写入/覆盖一条条目。 |
| `get(key)` | 读取一条条目,或 `null`。 |
| `remove(key)` | 删除一条条目。 |
| `entries()` | 列出全部条目(不加载 blob)。 |
| `writeFile(data)` | 覆盖 store 的单文件数据。 |
| `readFile()` | 读取单文件数据,或 `null`。 |
| `refresh()` | 自上次调用以来有变化则返回 `true`。 |
| `onChange(callback)` | 观察远端变化;返回注销函数。 |
| `share(options?)` | 开始/获取分享;返回含链接的分享信息。 |
| `presentShareSheet(options?)` | 唤起系统原生邀请面板。 |
| `shareInfo()` | 当前分享信息,或 `null`。 |
| `stopSharing()` | 停止分享(仅归属者)。 |

---

## 说明

* 需登录 iCloud 且有 Pro 订阅;脚本需声明 `cloudSharedData` 权限。
* 脚本不能创建或列出 store —— 请在「工具 → iCloud Shared Data」创建,或让 Agent 创建;脚本按 UUID 消费 store。
* 加入他人分享的 store:别人把 store 分享给你时,点开分享链接即可打开 Scripting,会展示该 store 并提供 Accept 按钮;接受后,store 会出现在「工具 → iCloud Shared Data」里,你可在此复制其 ID 并粘贴进脚本。
* 数据接口(读写/分享链接)在 App 和扩展均可用;系统原生邀请面板仅在有展示上下文处可用(App、Share / 翻译 UI 扩展)。
* 不再观察时务必调用 `onChange` 返回的注销函数。
