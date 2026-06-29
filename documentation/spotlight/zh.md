`Spotlight` 允许脚本把自己的资源加入系统 Spotlight 索引。用户点击其中一条搜索结果后，Scripting 会运行同一脚本项目里的 `spotlight.tsx` 文件。

Spotlight 索引功能需要 Scripting PRO。

## 添加索引

```ts
await Spotlight.index({
  id: "note-42",
  title: "Project Notes",
  contentDescription: "Open the project note from Spotlight.",
  keywords: ["notes", "project"],
  parameters: {
    noteID: "42",
    source: "spotlight"
  }
})
```

`id` 只需要在当前脚本内唯一。再次使用相同 `id` 调用 `Spotlight.index` 会更新已有条目。

```ts
await Spotlight.indexItems([
  {
    id: "task-1",
    title: "Follow up"
  },
  {
    id: "task-2",
    title: "Send invoice",
    parameters: { invoiceID: "2026-001" }
  }
])
```

## 条目字段

只有 `id` 和 `title` 是必填。除了下面两个 Scripting 专有字段，其余字段都与 Apple [`CSSearchableItemAttributeSet`](https://developer.apple.com/documentation/corespotlight/cssearchableitemattributeset) 的属性一一对应，并按官方文档的分类分组。

**Scripting 专有**

- `id`（必填）—— 脚本内唯一的标识符。条目被点击时通过 `Spotlight.current.id` 返回。
- `parameters` —— 点击后传给 `spotlight.tsx` 的任意 JSON，对应 `Spotlight.current.parameters`。它不是 Spotlight 元数据字段，而是你向点击处理脚本传上下文的途径。

**General（通用）**

- `title`（必填）—— 搜索结果显示的主标题。
- `displayName` —— 显示名；省略时回退为 `title`。
- `alternateNames` —— 该条目还能被哪些别名搜到。
- `contentType` —— 统一类型标识符（`UTType`），用于决定结果图标，如 `"public.image"`、`"com.adobe.pdf"`、`"public.movie"`、`"public.folder"`，缺省为纯文本。
- `contentURL` —— 内容本体的 URL；本地内容用 `file://` URL。
- `thumbnailData` —— 缩略图字节。与 `thumbnailURL` 同时设置时优先用它。
- `thumbnailURL` —— 指向缩略图的本地 file URL 字符串。
- `keywords` —— 额外的匹配关键词。
- `rankingHint` —— 数值越大，结果排名越靠前。
- `supportsNavigation` —— 标记为可导航，配合 `latitude` / `longitude` 使用。
- `supportsPhoneCall` —— 标记为可拨打，配合 `phoneNumbers` 使用。

**Documents（文档）**

- `contentDescription` —— 标题下方的较长描述。
- `subject` —— 内容主题。
- `kind` —— 人类可读的类型，如 `"Note"`、`"Invoice"`。
- `creator` —— 创建该内容的实体。
- `pageCount` —— 页数。
- `fileSize` —— 内容大小（字节）。

**Messaging（消息）**

- `textContent` —— 完整可搜索正文，提升自由文本查询的命中率。
- `authorNames` —— 作者显示名。
- `emailAddresses` —— 相关邮箱地址。
- `phoneNumbers` —— 相关电话号码。

**Media（媒体）**

- `comment` —— 自由备注。
- `contentCreationDate` —— 创建日期；省略时回退为首次索引时间。
- `contentModificationDate` —— 修改日期；省略时回退为最后一次索引时间。
- `lastUsedDate` —— 最近一次使用时间。

**Events（事件）**

- `startDate` / `endDate` —— 用于事件类条目。
- `dueDate` / `completionDate` —— 用于任务类条目。
- `allDay` —— 是否为全天事件。

**Places（地点）**

- `latitude` / `longitude` / `altitude` —— 坐标，单位分别为度 / 度 / 米。
- `namedLocation` —— 人类可读的地点名。
- `city` / `stateOrProvince` / `country` / `postalCode` / `fullyFormattedAddress` —— 地址各组成部分。

**Item-level（条目级）**

- `expirationDate` —— Spotlight 何时将该条目移出索引。省略则条目一直保留在索引中，直到你显式删除。

说明：

- **日期字段**（`contentCreationDate`、`lastUsedDate`、`startDate`、`expirationDate` 等）可传 `Date`、ISO-8601 字符串或以秒为单位的数字时间戳。
- **缩略图**：同时设置时 `thumbnailData` 优先于 `thumbnailURL`。

一个覆盖各分组的完整示例：

```ts
await Spotlight.index({
  id: "doc-7",
  parameters: { reportID: "q3" },

  // General
  title: "Q3 Report",
  displayName: "Q3 Report",
  alternateNames: ["Quarterly Report"],
  contentType: "com.adobe.pdf",
  contentURL: "file:///path/to/report.pdf",
  thumbnailData: Data.fromFile("/path/to/thumb.png") ?? undefined,
  thumbnailURL: "/path/to/thumb.png",
  keywords: ["report", "finance"],
  rankingHint: 10,
  supportsNavigation: false,
  supportsPhoneCall: false,

  // Documents
  contentDescription: "Quarterly financials.",
  subject: "Finance",
  kind: "Report",
  creator: "Finance Team",
  pageCount: 12,
  fileSize: 204800,

  // Messaging
  textContent: "Full searchable body text...",
  authorNames: ["Jane Doe"],
  emailAddresses: ["jane@example.com"],
  phoneNumbers: ["+1-555-0100"],

  // Media
  comment: "Reviewed",
  contentCreationDate: new Date(),
  contentModificationDate: new Date(),
  lastUsedDate: Date.now(),

  // Events
  startDate: "2026-07-01T00:00:00Z",
  endDate: "2026-09-30T00:00:00Z",
  dueDate: new Date(),
  completionDate: new Date(),
  allDay: false,

  // Places
  latitude: 37.3349,
  longitude: -122.009,
  altitude: 30,
  namedLocation: "Apple Park",
  city: "Cupertino",
  stateOrProvince: "CA",
  country: "USA",
  postalCode: "95014",
  fullyFormattedAddress: "1 Apple Park Way, Cupertino, CA 95014",

  // Item-level
  expirationDate: new Date(),
})
```

## 搜索可靠性

一条条目能否被搜到由系统决定，而非 Scripting。以下做法有帮助：

- **把每个可搜索的词都作为独立项放进 `keywords`。** Spotlight 匹配整词和词的*前缀*，不匹配任意子串——搜 `"part"` 能命中 `"partner"`，但搜 `"art"` 不能。对词典类数据，请把每种拼写、词形变化、别名各作为一个关键词加入（如 `["run", "runs", "running", "ran"]`）。
- **`title` 保持简短精确。** 它是匹配权重最高的字段；把规范词放这里，变体放进 `keywords` / `alternateNames`。
- **用 `rankingHint`**（越大越靠前）在*你自己的条目之间*调整排序。
- **`textContent`** 能提升较长自由文本查询（释义、正文）的命中率。

需要了解的限制：

- Spotlight 不做子串/模糊匹配，词中间或部分词查询可能不命中。需要时把对应前缀显式加进关键词。
- Apple 内置结果（词典、通讯录等）是特权系统数据源，单独排序。对于短而常见的词，自定义条目通常无法排到它们前面，无论怎么打标签。

## 大批量索引

`indexItems` 接受很大的数组，并分批提交给系统；每个脚本可索引数千条。请 `await` 调用——它在工作交给 Spotlight 后兑现，await 是确认索引完成并捕获错误的推荐方式。用已有 `id` 再次索引会覆盖原条目，因此重复调用重建索引是安全的。

## 处理点击

在脚本项目里创建 `spotlight.tsx`：

```ts
const item = Spotlight.current

if (item) {
  console.log(item.id)
  console.log(JSON.stringify(item.parameters))
}
```

`Spotlight.current` 在其他运行环境中为 `null`。当 `spotlight.tsx` 是由 Spotlight 搜索结果启动时，它一定包含当前点击条目的上下文。

Spotlight 点击参数不会写入 `Script.queryParameters`。

## 管理条目

```ts
const items = await Spotlight.getItems()

await Spotlight.delete("note-42")
await Spotlight.deleteItems(["task-1", "task-2"])
await Spotlight.deleteAll()
```

用户也可以在 Tools > Spotlight 中管理已索引条目，包括删除脚本或 `spotlight.tsx` 文件已经不存在的记录。
