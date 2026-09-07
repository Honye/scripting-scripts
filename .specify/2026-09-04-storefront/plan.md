# Storefront — 实现计划 (plan.md)

- **状态**：Plan（已评审通过，待执行）
- **日期**：2026-09-04
- **上游**：[intent.md](./intent.md) → [spec.md](./spec.md)
- **平台**：Scripting (iOS)，TSX → SwiftUI
- **项目路径**：`scripts/Storefront/`

> 本文档定义 **怎么做** 与 **分几步做**。需求定义见 spec.md，不在此重复论证。

---

## 0. 背景

spec.md 已定义 10 个模块共 60 条需求。用户确认规范无误、选定项目正式名 **Storefront**、要求**分阶段交付且每阶段可在真机验收**。

本计划把 spec 拆成 10 个阶段。**排序原则：仓库里零先例、平台行为不确定的能力尽量前置**，避免后期才发现平台不支持而大面积返工。

---

## 1. 规划期已验证的结论（实现时直接采信）

| 结论 | 依据 |
|---|---|
| **widget 能读到主 App 用普通 `Storage` 写的数据**，不需要 `{shared: true}` | `scripts/Calendar/`、`scripts/CatMe/`、`scripts/Photo/`、`scripts/Life Quartets/` 四个项目实证。**spec 的 Q6 就此解除** |
| **内购价格可从 App Store 网页提取** | `apps.apple.com/{region}/app/id{id}` 的 `<script id="serialized-server-data">`，路径 `data[0].data.shelfMapping.information.items`，取 `items_V3` 中 `$kind === 'textPair'` 的 annotation。美区/中国区实测均**唯一命中** |
| **内购标题必须按结构匹配，不能按文案** | 美区 `In-App Purchases`、中国区 `App内购买`（无空格，与 spec 起草时的推测不同）。印证 FR-ENT-04 的必要性 |
| **TestFlight 状态可判定，Q1 解除** | 实测 `https://testflight.apple.com/join/u6iogfd0`（Telegram beta，已满）。最稳信号是服务端渲染的内联布尔 `var showSteps = false && (isIOS \|\| false);` |
| **TF 页面不做本地化** | en-US / zh-CN / ja-JP 三种 `Accept-Language` 返回的都是英文 `This beta is full.`。文案匹配在此处安全（与 App Store 页面相反） |
| **iTunes Lookup 无任何内购字段**，且应用名与价格**随 country 本地化** | 日区返回日文名与 JPY |
| `Keychain` 支持 `accessibility: 'passcode'` | `dts/global.d.ts:1428`。语义为「仅在设备设有密码时可访问、不备份、不同步」，是存 Apple ID 密码的正确档位，也契合 D6 |
| `AbortController` / `AbortSignal` / `SecureField` 均由 `'scripting'` 导出 | 可实现真正的 fetch 超时与密码输入框 |
| `Notification` 提供按脚本作用域的 `getAllPendingsOfCurrentScript` / `removeAllPendingsOfCurrentScript` | `dts/scripting.d.ts:10623+`。重排通知不会误伤仓库里其他脚本 |

### ⚠️ 仓库里零先例的高风险 API

`Keychain`、`LocalAuth`、`Notification.schedule` 的 trigger/tapAction/重排、`WebScraper`、`AbortController` —— 全仓库**没有任何可抄的代码**，只能照 `documentation/` 与 `dts/` 从零写。

**这是本计划把 P1 设为纯 spike 阶段的唯一理由。** 这几样恰好是本产品的安全底座与提醒底座。

---

## 2. 文件清单

```
scripts/Storefront/
  script.json          # name "Storefront" / icon "creditcard.circle.fill"
                       # color "rgba(0, 198, 165, 1)" / version / author / localizedNames
                       # 关键：intentInputTypes: ["URLs"]（大写），entry: "index.tsx"
  index.tsx            # 主 App 入口：async main() → Navigation.present → Script.exit()
  widget.tsx           # 小组件入口：Widget.present(view, { reloadPolicy })
  intent.tsx           # 分享菜单入口：读 Intent.urlsParameter
  i18n.ts              # 5 行范式，照抄 scripts/Epical/i18n.ts
  types.ts             # Account / AppRef / Entry / TFItem / TFStatus 等纯类型
  store.ts             # Storage 薄封装（账号/条目/TF/设置）
  credentials.ts       # Keychain + LocalAuth 封装（密码存取与门禁）
  regions.ts           # 地区表：code/name/flag/currency/giftCardUrl
  sponsors.ts          # 三方购卡渠道常量（D5 硬编码）
  format.ts            # 货币格式化、日期格式化
  billing.ts           # 扣费日推进、本月待扣、两级预警判定（纯函数）
  notifications.ts     # 通知排程、重排、配额控制
  api/
    http.ts            # fetch + AbortController 超时 + 统一错误
    itunes.ts          # iTunes Lookup 封装
    appstore.ts        # App Store 页面内购解析
    testflight.ts      # TF 状态检测
  strings/{en.ts,zh.ts}
  views/
    App.tsx            # 根组件，持有全部状态
    AccountList.tsx    # 首页（账号为中心，D7）
    AccountDetail.tsx
    AccountEditor.tsx
    SwitchGuide.tsx    # 切换助手引导
    EntryEditor.tsx
    AppDetail.tsx      # 应用详情 + 跨区比价
    UpcomingBills.tsx  # 即将扣费时间轴
    TestFlightList.tsx
    GiftCards.tsx
    Settings.tsx
  components/
    AccountCard.tsx
    RegionPicker.tsx   # 移植自 scripts/Launch/SearchSheet.tsx
    AmountField.tsx
```

**视觉约定**：**不建 `theme.ts`**，一律用 iOS 语义色字符串（`'label'` / `'secondaryLabel'` / `'systemBlue'` 等），自动跟随深色模式。预警两级用 `'systemRed'`（严重）与 `'systemOrange'`（提醒）区分。与 `scripts/GitHub Secrets/`、`scripts/VodHub/` 做法一致。

### 可直接复用的既有代码

| 来源 | 复用内容 |
|---|---|
| `scripts/Launch/SearchSheet.tsx:47-62` 及 346-459 | `REGIONS`（14 地区 + 国旗）与 `RegionPicker`/`RegionPill` 组件。整体移植，**需补上币种与礼品卡地址两列**（原表没有币种） |
| `scripts/GitHub Secrets/views/SharedSecretEditor.tsx` | 表单页完整样板：`NavigationStack > Form > Section` + toolbar 取消/保存 + `Navigation.useDismiss()` + `UUID.string()` |
| `scripts/Epical/views/Home.tsx:171-283` | `ForEach` data(Observable) + builder + 双向 useEffect 桥接 + swipe actions |
| `scripts/Epical/i18n.ts` 与 `strings/` | i18n 范式逐字照抄 |
| `scripts/CLS Telegraph/widget.tsx` | 仓库唯一用了 `reloadPolicy` 的 widget |
| `scripts/GitHub Scriptings/intent.tsx` | `Intent.urlsParameter` 读取范式（其 `console.present()` 是上游 bug，不要照抄那行） |

---

## 3. 阶段划分

### P0 — 骨架与环境验证
**目标**：项目能在真机跑起来，验证跨运行面的数据共享。
- `script.json`、`i18n.ts`、`strings/`、`types.ts`、`store.ts`、最小 `index.tsx` 与 `widget.tsx`。
- widget 只显示一个从 `Storage` 读出的计数。

**验收**：`pnpm start` → 真机连接 → App 打开无报错；App 内写一个值，桌面 widget 能读到。

**为什么第一**：Q6 虽有四个项目佐证，但这是全盘架构的地基，必须亲眼确认一次。

---

### P1 — 平台能力 spike（零先例 API）
**目标**：用一个临时 `DebugView` 把没有先例的 API 全部跑通，**不写业务**。
- `Keychain.set/get/remove`（含 `accessibility: 'passcode'`）。
- `LocalAuth.isAvailable` / `biometryType` / `authenticate(reason)` —— 成功、失败、取消三条路径。
- `Notification.schedule` —— `CalendarNotificationTrigger` 定时、`tapAction: { type: 'runScript' }`、`userInfo` 透传、`getAllPendingsOfCurrentScript` / `removeAllPendingsOfCurrentScript` 重排。
- `AbortController` + `fetch` 超时。

**验收**：DebugView 上每项都有按钮与结果显示，逐个点通；通知能在锁屏出现并正确跳回。

**产出**：`credentials.ts`、`notifications.ts`、`api/http.ts` 的可用骨架。

**风险控制**：若某项平台行为与文档不符，此时调整方案成本最低。P1 结束后 DebugView 保留但从主导航移除。

---

### P2 — 账号管理 + 切换助手
覆盖 **FR-ACC-01~10、FR-SW-01~06**。
- `regions.ts`（地区/国旗/币种/官方礼品卡地址）、`RegionPicker` 移植。
- `AccountList`（账号卡片：地区旗/余额/余额新鲜度）、`AccountEditor`（`SecureField` 输密码）、`AccountDetail`。
- 密码查看/复制走 `credentials.ts` 的生物识别门禁；`LocalAuth` 不可用时明确拒绝，**不提供任何绕过路径**（FR-ACC-07）。
- `SwitchGuide`：复制账号 → 复制密码 → `Safari.openURL('itms-apps://')` → 返回后确认更新 `currentAccountId`。

**验收**：能建多个账号、改余额、Face ID 后看到密码、走完切换引导。

**强制项落点**：FR-SW-05（全产品无「一键切换」字样）在此阶段文案定稿时逐条检查。

---

### P3 — 网络层与应用元信息
覆盖 **FR-ENT-02~04、FR-ENT-08、FR-ENT-10**。
- `api/http.ts`：`fetch` + `AbortController` 10s 超时 + 统一错误类型。
- `api/itunes.ts`：lookup 封装，返回名称/图标/售价/币种。
- `api/appstore.ts`：内购解析。**按 `$kind === 'textPair'` 结构提取，禁止按标题匹配**（FR-ENT-04）；解析后立即释放 HTML 字符串（页面 670–780KB，对应 NFR-07）。
- `AppDetail`：元信息 + 跨区比价（多地区并列，各自币种，不折算）+ `AppStore.presentApp(appId)`。

**验收**：输入一个 appId，能取到中国区/美区/日区的售价与内购价；断网时不卡死、给出明确错误。

---

### P4 — 条目管理与汇总
覆盖 **FR-ENT-01、FR-ENT-05~07、FR-ENT-09、FR-SUB-01~08**。
- `EntryEditor`（三种 kind 共用表单，按 kind 显隐字段）。
- `billing.ts`：周期推进、本月待扣、下一笔。
- 价格差异提示（FR-ENT-07，**不静默覆盖**）；抓取失败静默回落手填（FR-ENT-05）。
- `UpcomingBills` 时间轴视图。

**验收**：录入订阅后账号卡片汇总正确；**抓取失败仍能完成录入**。

---

### P5 — 预警与通知
覆盖 **FR-ALERT-01~07**。
- 两级预警判定（严重 / 提醒）与卡片可视化。
- 排程：仅为最近 20 笔排；每次启动与 widget 刷新时 `removeAllPendingsOfCurrentScript` 后重排（守住 iOS 全 App 共享的 64 条待发上限）。
- 严重级 `interruptionLevel: 'timeSensitive'`；`tapAction` 跳对应账号；通知里引导更新余额（FR-SUB-06，对冲「数据失真」这一最高风险）。
- 通知权限被拒绝时的 App 内替代提示。

**验收**：构造一笔次日扣费且余额不足的数据，收到 timeSensitive 通知，点击跳转正确。

---

### P6 — 分享菜单录入
覆盖 **FR-SHARE-01~06**。
- `intent.tsx`：解析 `apps.apple.com/{region}/app/{slug}/id{digits}`，容忍缺 slug、带 query。
- 快速录入：拉元信息 → 选类型 → 选账号 → 保存，**≤3 次点击**。
- 重复检测（同 appId + accountId）。

**验收**：在 App Store 里分享任意应用到 Storefront，3 次点击内完成入库；分享非 App Store 链接时给出明确提示。

---

### P7 — TestFlight
覆盖 **FR-TF-01~09**。
- `api/testflight.ts` 判定链：
  - HTTP 404 → `invalid`
  - `showSteps` 字面量为 `true` → `open`
  - `false` 且 `.beta-status` span 含 `full` → `full`
  - `false` 且含 `accepting` → `closed`
  - 其余 → `unknown`（**保留上次已知状态**）
- 从 `<title>`（`Join the {AppName} beta - TestFlight - Apple`）自动填应用名，从 `.app-icon` 的 `background-image` 取图标。
- 手动批量刷新；手动标记优先于自动检测。
- **必须显示「最后检查时间」+ 非实时说明**（FR-TF-09）。

**验收**：已知已满链接（Telegram）检测出 `full`；伪造 code 检测出 `invalid`。

**外部依赖**：需要一个「可加入」状态的 TF 链接来验证 `open` 分支 —— 本阶段唯一未验证的分支。

---

### P8 — Widget
覆盖 **FR-WG-01~05**。
- `Widget.family` 分支：small 显示优先级最高的预警账号，medium 显示多账号。
- 承担后台任务：重排通知（FR-ALERT-07）+ TF 状态检测（FR-TF-07）。
- `reloadPolicy: { policy: 'after', date }`。

**验收**：桌面小组件显示正确、预警高亮；数据变更后 `Widget.reloadAll()` 能刷新。

---

### P9 — 礼品卡、数据管理与验收
覆盖 **FR-GIFT-01~07、FR-DATA-01~04**。
- 官方链接按地区跳转；无在线渠道的地区明确提示。
- 三方渠道**分区展示 + 常驻免责声明 + 赞助标注**（FR-GIFT-04/05/06）。
- JSON 导入导出，**导出不含密码**（FR-DATA-02）。
- 逐条走完 spec §10 验收清单。

---

## 4. 模块设计要点

**`store.ts`** — 沿用仓库范式（薄封装、领域化函数、不在业务代码里裸调 `Storage`）：
`loadAccounts()/saveAccounts()`、`loadEntries()/saveEntries()`、`loadTFItems()/saveTFItems()`、`getCurrentAccountId()/setCurrentAccountId()`、`loadSettings()/saveSettings()`。

状态管理照仓库惯例：`views/App.tsx` 顶层 `useState` 持有全部数据 + props 下钻 + 回调上抛，`useEffect` 写回 Storage 并 `Widget.reloadAll()`。**不引入 Context**（全仓库无 `createContext` 使用先例）。

**`credentials.ts`** — `setPassword(accountId, pwd)` / `revealPassword(accountId)` / `removePassword(accountId)`。写入用 `accessibility: 'passcode'`、`synchronizable: false`（对应 D6 不同步）。`revealPassword` 内部先 `LocalAuth.authenticate`，失败即抛。密码值不进任何日志、不进导出（NFR-01、FR-DATA-02）。

**`api/http.ts`** — `fetchText` / `fetchJson` 返回**判别联合**而非抛异常：

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'timeout' | 'network' | 'http' | 'parse'; status?: number }
```

**这两个函数永不抛错**，全部 try/catch 转成 `Failure`。这样 FR-ENT-05「抓取失败不得阻塞」由类型系统强制 —— 调用方拿到 `Result` 就不可能「忘了 catch」，比靠 code review 保证可靠。超时默认 10s（NFR-06）。
内置**域名白名单**（`itunes.apple.com` / `apps.apple.com` / `testflight.apple.com`），非白名单直接返回 `Failure` —— 这是 NFR-02「不向第三方发送用户数据」的结构化落点；三方购卡链接只走 `Safari.openURL`，永不经过本模块。

**`api/appstore.ts`** — 正则取出 `serialized-server-data` 的 JSON 后立刻 `JSON.parse` 并只保留需要字段，原始 HTML 字符串不持有引用。解析函数写成纯函数，便于日后 Apple 改版时单点修复。

**`notifications.ts`** — `rescheduleAll(accounts, entries, settings)`：先 `removeAllPendingsOfCurrentScript()`（**必须是 `...OfCurrentScript` 版本**，`removeAllPendings()` 会清掉用户其他脚本的通知），再按扣费日排序取最近 20 笔排程，`userInfo` 带 `{ accountId, entryId }` 供 tapAction 路由。
一律用 `repeats: false` + 每次全量重排，**不用重复触发器**：扣费日会被 `reconcileBilling` 推进、被用户编辑、被暂停，重复触发器必然与真实数据漂移。

**`billing.ts`** — 月/季/年推进用日历运算（`setMonth(+1)`）而非固定天数，并做**月末钳制**：1 月 31 日 + 1 月 → 2 月 28/29 日。这是最容易写出 bug 的一处，单独抽函数。若 `nextBillingAt` 远落后于当前（用户长期未打开），循环推进并设最大迭代次数防死循环。

**`backup.ts`（P9）** — **不 import `credentials.ts`，也不 import `Keychain`**。这样 FR-DATA-02「导出不含密码」在模块依赖图层面就不可能被违反，而不是靠「记得别导出」。文件顶部注释写明该约束。

---

## 5. 风险与待真机验证的假设

| 风险 / 假设 | 阶段 | 说明 |
|---|---|---|
| `Keychain` / `LocalAuth` / `Notification` 真机行为与文档不符 | P1 | 仓库零先例。前置为独立 spike 就是为此 |
| `Notification` 权限首次请求时机与拒绝后表现 | P1 / P5 | 需确认被拒后 `schedule` 是静默失败还是抛错 |
| widget 时间线刷新的真实频率 | P8 | iOS 按电量/使用习惯配额，**做不到「名额一放出就抢到」**，UI 须明示 |
| App Store 页面结构被 Apple 改版 | 长期 | 已按结构而非文案解析；失败必须静默降级到手填 |
| TF `open` 状态分支未验证 | P7 | 需一个可加入的 TF 链接 |
| 用户不持续维护余额导致数据失真 | 全程 | intent 中标记的**最高风险**。缓解手段是 FR-SUB-06 |
| 无 tsc、无测试，只能靠真机 | 全程 | 每阶段必须真机验收，不能积压 |

---

## 6. 验证方式

全仓库**没有测试、没有 lint、没有本地 tsc**（`devDependencies` 里无 typescript，`pnpm test` 是失败占位符）。唯一验证途径：

```bash
pnpm start          # scripting-cli start --no-auto-open
```

然后在 iOS 的 Scripting App 里连接本机开发服务器、打开 Storefront 项目，改代码即热重载。每阶段按「验收」逐条在真机上点一遍。widget 改动需把小组件加到桌面后观察；通知改动需真机锁屏验证。

---

## 7. 变更记录

- 2026-09-04：基于 spec.md 输出。规划期实测解除 spec 的 Q1（TF 状态判定）与 Q6（widget 存储共享）；发现 Keychain/LocalAuth/Notification/AbortController 在仓库零先例，据此新增 P1 spike 阶段；确定项目名 Storefront、图标 `creditcard.circle.fill`、不建 theme.ts。

---

## 8. 计划补充（规划期复核追加）

以下几条在 plan.md 初稿之后补入，均为「不写清楚就很可能写错」的约束。

### Widget 的硬约束（P8）

- **`Widget.present` 必须无条件到达。** 每个后台任务各自包 try/catch，任何一个失败都不能阻止渲染 —— widget 扩展被系统杀掉的表现是主屏白块，且没有任何错误提示。
- **绝对禁止在 widget 里抓 App Store 页面**（670–780KB vs 扩展的严格内存上限）。widget 只允许做 TF 页面检测（体积小），每次最多 3 条、单条 6s、后台段总预算 15s，超时即放弃剩余任务直接渲染。
- **widget.tsx 不 import `credentials.ts`** —— widget 与密码零关系，且它可能在设备锁定态运行。

### 数据竞态（P6 分享录入）

`intent.tsx` 与 `index.tsx` 是两个进程，都会写 `entries`。主 App 在后台仍持有旧内存快照时，可能覆盖 intent 刚写入的数据。
缓解：intent 保存前**重新 `loadEntries()` 再 push**；index 在 `AppEvents.scenePhase` 回到 `active` 时从 Storage 重载。仍存在窗口，v1 接受并记录。

### spec 的一处笔误

spec FR-SHARE-01 写的是 `intentInputTypes: ["urls"]`，但仓库实证（`scripts/GitHub Scriptings/script.json`）是**大写 `["URLs"]`**。按 `URLs` 实现，否则分享菜单里不会出现本脚本。已在 P0 的 script.json 中按 `URLs` 落地。

### 新增未决问题

| # | 问题 | 影响 | 何时解决 |
|---|---|---|---|
| Q7 | Keychain `accessibility` 档位 | **已定：`'unlocked_this_device'`** —— `'passcode'` 虽更严，但用户移除设备密码时系统会静默删除全部已存密码且不可恢复，该风险不可接受 | ✅ 已解决 |
| Q8 | 跨币种条目如何参与余额预警（spec 未定义） | **已定：只比同币种**；异币种订阅在账号详情单列一节并标注「未计入余额预警」。既不引入汇率，也不静默漏报 | ✅ 已解决 |
| Q9 | `LocalAuth.authenticate` 是否允许回落设备密码 | **已定：允许**（`useBiometrics = false`）。Face ID 失败后回落密码是 iOS 标准体验，也与 FR-ACC-07 的措辞一致 | ✅ 已解决 |

### FR-TF-04 的实现取法

spec §3.4 的 `TFItem` 只有一个 `status`，无法表达「手动值优先于自动检测」。
本实现在 `types.ts` 中加了 `statusIsManual?: boolean`：为 true 时自动检测跳过该条、只更新 `statusCheckedAt`，UI 标注「手动」并提供「恢复自动」操作。

---

## 9. 实现记录

### P0 / P1（已完成，待真机验收）

静态检查手段：仓库无 tsc，改为在 scratchpad 安装 TypeScript 5.6.3 + 一份镜像根 tsconfig 的临时配置，对 `scripts/Storefront/` 单独 `--noEmit`。这是本项目在真机之外唯一的验证途径，此后每阶段都跑。

它抓到一个真 bug：**`Widget` 与 `Notification` 不是全局，必须从 `'scripting'` 导入**（`dts/global.d.ts` 中无对应 `namespace`，`scripts/Epical/widget.tsx` 亦是 import）。CLAUDE.md 把 `Widget` 列入全局 API，与实际不符 —— **以 `dts/` 为准**。该错误在真机上表现为运行时崩溃，且要等小组件加到桌面才暴露。

残留的 `Storage.get/set` 类型报错是**仓库既有问题**，与本项目无关：用同一配置跑 `scripts/Epical/store.ts` 报完全相同的错，根因是未纳入版本控制的 `dts/web-fetch.d.ts` / `node.d.ts` / `safari-ext.d.ts` 用 DOM 式声明遮蔽了 Scripting 的 `Storage`。

### P2（已完成，待真机验收）

覆盖 FR-ACC-01~10、FR-SW-01~06。新增 `billing.ts`、`components/{AccountCard,AmountField,RegionPicker}.tsx`、`views/{AccountList,AccountEditor,AccountDetail,SwitchGuide}.tsx`，重写 `views/App.tsx`。

实现期作出的几处判断：

- **`billing.ts` 提前到 P2。** FR-ACC-02 要求卡片显示「本月待扣 + 预警角标」，若不实现汇总逻辑，卡片布局在 P4/P5 需返工。该文件为纯函数，无 Storage / 网络 / UI 依赖。
- **月度推进自己实现，不用 `Date.setMonth`。** 后者溢出（1 月 31 日 + 1 月 = 3 月 3 日），而 31 号起订的订阅在 2 月是 28 号扣费。`addMonths` 按目标月天数做钳位。
- **`balanceUpdatedAt` 只在金额真的变化时刷新。** 否则「打开编辑器再保存」会把一个陈旧余额伪装成刚更新过，直接架空 FR-ACC-04 的新鲜度提示。
- **删除账号 = 删除其 Entry、解除 TFItem 关联。** Entry 的语义是「这个 app 是用哪个号买的」，账号没了它就没有意义；TFItem 的 `accountId` 本就是可选的。二次确认文案逐项说明影响条数（FR-ACC-01）。
- **详情页自持状态。** 仓库里 `NavigationLink` 的 destination 都是自取数据的独立视图（如 VodHub 的 `<HistoryView />`），说明 push 出去的节点不会因父级 props 变化而重渲。`AccountDetail` 因此保留一份本地镜像，改动同时上抛父级 —— 父级仍是唯一持久化方，视图不会显示成陈旧值。
- **地区选择改为模态而非 push。** `Navigation.useDismiss()` 在 push 场景下能否 pop 无仓库先例；`Navigation.present` + `dismiss(result)` 是 `scripts/GitHub Secrets/` 已验证的范式，直接复用。
- **FR-SW-05 已核。** 全项目 grep `一键 / 自动切换 / one-tap / automatic`，命中的三处全部是标注该禁令本身的注释，无任何用户可见文案违规。

### P2 补丁：地区表补全

原表只有 14 个地区（从 `scripts/Launch/SearchSheet.tsx` 移植），土耳其、印尼、尼日利亚、阿根廷这些「多区账号」最常用的区都不在其中 —— 而这些恰恰是本产品的核心用户会开的号。

改为**全量 App Store storefront（171 个）**：

- **国旗由 code 推导**（regional indicator letters），不手写。手写 171 面旗就是 171 次贴错国家的机会。
- **中英双语地区名由 `Intl.DisplayNames` 生成**，同样避免手敲。`regionName()` 按 `Device.systemLocale` 选择，`code` 始终是唯一标识符。
- **搜索是必需项**，不是加分项：171 条列表没有搜索无法使用。`searchRegions()` 同时匹配 code、英文名、中文名。
- **币种改为可编辑**（`components/CurrencyPicker.tsx`）。Apple 对部分小区实际以美元而非当地货币结算，且会随时间调整，`regions.ts` 的币种表**只能是默认值**。与其假装该表权威，不如让用户一键改单个账号 —— 表错了代价是一次点击，而不是一个错误的余额。
- `format.ts` 的货币符号表由 13 条扩到 44 条，零小数币种按 ISO 4217 补全（JPY/KRW/VND/CLP/XOF/XAF 等）。把 `₺49` 显示成 `₺49.00` 会读起来像做过一次本产品从未做过的汇率换算。

原 14 个 code 全部包含在新表中，已有账号数据无需迁移。

### P3（已完成，待真机验收）

覆盖 FR-ENT-02~04、FR-ENT-08、FR-ENT-10。新增 `api/itunes.ts`、`api/appstore.ts`、`views/{AppLookup,AppDetail}.tsx`，加固 `api/http.ts`。

**解析已在三个区实测通过**（用真实页面离线跑纯函数）：

| 区 | 内购项 | 原始价格串 | 解析结果 |
|---|---|---|---|
| us | Monthly / Yearly Pro subscription | `$2.99` / `$29.99` | 2.99 / 29.99 |
| cn | Pro 按月订阅 / Pro 按年订阅 | `¥22.00` / `¥198.00` | 22 / 198 |
| tr | Monthly / Yearly Pro subscription | `₺29,99` / `₺299,99` | 29.99 / 299.99 |

土耳其区用**逗号作小数点**，是这次补全地区表后顺带获得的真实反例，正好验证了价格解析规则。

**价格串解析规则**：分隔符是全部难点 —— `$2.99` 是两位小数，`Rp 39.000` 是三万九，`€1.234,56` 两个符号角色互换。统一规则：**最后出现的分隔符即小数点，且仅当其后恰好跟两位数字**。已对 12 种写法逐一验证。

**内购提取用双结构冗余**。Apple 目前同时输出两种编码：`items_V3` 里的 `$kind === 'textPair'`（`leadingText`/`trailingText`），以及旧的 `items[].textPairs` 元组数组。两种都收、按名去重，任何一种被下线都不至于失效。

**标题匹配禁令再获实证**：tr 区标题是 `In-App Purchases`，cn 区是 `App内购买`（无空格）。FR-ENT-04 的约束是对的。

**`Accept-Language` 头已移除**。实测对中国区页面加不加该头，内购项名称都是「Pro 按月订阅」—— 项目名是开发者的分区文案，不是页面 chrome。留一个证明无效的配置项只会误导后来者。

**`api/http.ts` 两处加固**（读 `RequestInit` 定义后发现）：

- **加上原生 `timeout`**。原先只有 `AbortController` + `Promise.race`：race 能把超时和其他失败区分开（fetch 被拒时不告诉你是哪种），但下载仍在后台继续。原生 `timeout` 才真正拆掉连接。两者都要。
- **重定向要重新过白名单**。`handleRedirect` 的存在说明重定向是默认跟随的，而白名单原先只校验首个 URL —— 一个 Apple 地址 302 到站外就能绕过 NFR-02。现在每跳都校验。

**内购与元信息分两种加载策略**（NFR-07）：iTunes lookup 是小 JSON，进页面即对所有地区**串行**拉取；内购需要完整商品页（实测土耳其区 640KB），只在用户点某个地区时按需拉，**绝不预取、绝不并发**。

**已实测的端点行为**：lookup 的应用名与币种均随 `country` 本地化（tr → TRY）；不存在的 id 返回 `resultCount: 0`（→ `notfound`，与网络错误分开报）；商品页 301 到带 slug 的地址后 200，重定向不出 `apps.apple.com`；错误 id 的商品页返回 404（→ `notfound`）。

### P3 补丁：按应用名搜索

原来只能输 App Store 链接或数字 ID —— 但记录一个「当年用哪个号买的」应用时，用户手上往往只有名字。`api/itunes.ts` 增加 `searchApps(term, region, limit)`（`itunes.apple.com/search?entity=software`，仍在 http 白名单内）。

**一个输入框，两种模式**：文本里能解析出 app id（任意形态的 App Store 链接，或裸数字）就直接进比价页，否则按名搜索。用户不该被要求先分辨自己手里是哪种东西。

**搜索地区必须显式，且切换地区要清空结果**。实测结果说明了原因：

| 搜索词 | us | cn |
|---|---|---|
| `procreate` | Procreate Pocket，$5.99 | **画世界**（完全另一个 app），免费 |
| `熊掌记` | Bear - Markdown Notes | 熊掌记 - Markdown 笔记软件 |

同一个词在不同区搜到的**可能根本不是同一个应用** —— Procreate 就没上中国区。把旧区的结果挂在新区旗帜下展示等于撒谎，所以换区即清空。应用名本身也随区本地化（jp 返回「Bear - プライベートメモ」）。

搜索默认区取用户第一个账号所在区，而不是设备区域 —— 这个产品的用户本来就不在自己的设备区买东西。

另注：该端点是模糊匹配，乱敲一个词也会返回结果，所以「无结果」很少见且**不代表该应用不存在**，文案按此措辞。

### P4（已完成，待真机验收）

覆盖 FR-ENT-01、FR-ENT-05~07、FR-ENT-09、FR-SUB-01~08。新增 `views/{EntryEditor,UpcomingBills,AppEntries}.tsx`，`AccountDetail` 增加记录区，`App.tsx` 接管条目 CRUD 与 `appRefs` 缓存。

**账单算法已离线跑通 20 条断言**（把 `billing.ts` 抽成纯函数，用 node 直接验）：

- **月末钳位**：`Date.setMonth` 溢出（1/31 + 1 月 = 3/3），实测本实现 1/31→2/28、闰年 1/31→2/29、3/31→4/30、2/29 + 1 年→2/28 全部正确。
- **FR-SUB-05 推进**：过期扣费日滚到 now 之后（1/15 → 9/15），未来日期不动，非订阅条目不动。
- **窗口内多次扣费**：7 天周期在 30 天窗口内计 5 次，月付计 1 次 —— `dueBetween` 是按次累加而不是按周期折算。
- **两级预警**：severe / warn / none / 无订阅 / 已暂停 五种情形全对。
- **跨币种隔离（Q8）**：异币种订阅完全不参与预警判定，只出现在单列计数里。

**顺带修掉一个日期显示 bug**。原先「N 天后」用 `(now - ts) / 86400000` 取整算，但今晚 22:00 看一笔明早 00:30 的扣费会显示「明天」（对），而看一笔今晚 23:30 的扣费会显示「明天」（**错，那是今天**）。新增 `daysUntil()` 按**日历日**（各自归零到当天 0 点）比较。P5 的通知排程会用同一个函数，那里算错就是提前一天或晚一天推送。

**FR-ENT-07 的落点**：`applyFetchedPrice` 是抓取价格进入表单的唯一入口，只要新值与已有值不同就必定弹确认，无静默覆盖路径。用户手填过的价格是「他实际付的钱」，不该被今天的标价改掉。

**FR-ENT-06**：`editPrice` 一被调用就把 `priceSource` 打成 `manual` —— 人一碰这个数字它就不再是 Apple 的了。

**FR-ENT-05**：编辑器里每个网络步骤都是可选的，失败只在 footer 说一句「没能连上 App Store —— 请手动填写金额」，按钮仍在原地可重试，任何时候都能直接保存。

**`AppLookup` 增加 `select` 模式**复用给编辑器选应用，而不是再写一个更差的应用选择器。注意 browse 模式是 push 进调用方的 NavigationStack，select 模式是模态呈现、必须自带 NavigationStack，否则 toolbar 无处安放。

**FR-ENT-09 的分组键**：手动录入的条目可能没有 appId，按 `title` 兜底分组，否则它们会全部塌进同一个空字符串桶里。合计**按币种分开**，美区买断 + 中国区订阅是两个数字，不是一个。

### P4 缺陷：左滑删除记录导致 Scripting 崩溃

**现象**：账号详情页左滑删除一条记录 → App 崩溃。

**堆栈**（`logs/202609061959391454.txt`）：

```
-[UICollectionView _validateSortedDeleteItems:moveItems:movedSourceIndexPaths:...]
-[UICollectionView _endItemAnimationsWithInvalidationContext:...]
SwiftUI...UICollectionViewListCoordinatorBase.performUpdates
```

不是 JS 异常，是 UIKit 在 `performBatchUpdates` 里做一致性校验时抛的 NSException。

**根因（我写错了）**：记录行是用 `accountEntries.map(...)` 直接铺在 `Section` 里的 —— 这是一组**静态声明的子视图**。左滑手势触发的 `trailingSwipeActions` 回调去改父级状态，UIKit 随即要为这一行播删除动画，但它校验的数据源还是旧的行数，于是抛异常。

雪上加霜的是 `accountEntries` 派生自 `entries` **prop**，而详情页是 push 出来的目标视图、拿不到父级新 props（这一点在 P2 记录过），所以渲染出的行和父级数组何时对齐是不确定的。

**修复**：改用 `ForEach` + `useObservable` + `editActions="delete"` —— 这是 `dts/scripting.d.ts` 里明确给出的可删除列表范式（`ForEach` 通过**就地重写 observable** 来执行删除），和 `AccountList` 用 `editActions="move"` 做拖拽排序是同一套机制。同时把本账号的记录改为**本地 state 持有**，与 P2 对 account 的处理一致：列表的数据源和它渲染的行从此只有一个出处，不可能不一致。

顺带修正：详情页的本月待扣、下一笔、预警角标原先读的是 `entries` prop，编辑记录后不会刷新；现在读本地记录，改完立刻生效。

**取舍**：`editActions="delete"` 走系统原生左滑，原来那个二次确认弹窗没有了。这与 `scripts/Epical` 的既有做法一致，也是 iOS 惯例 —— 左滑本身已经是一个足够刻意的手势。

**同类风险排查**：全项目已无其他 `SwipeActions`。唯一剩下的「用户主动从 List 中移除元素」是 `AppDetail` 的移除地区按钮（移除的是整个 Section，且无左滑动画）。其余 `.map()` 变长列表（地区搜索、币种搜索、搜索结果、内购列表、Diagnostics 日志）都只是内容长度变化、不请求删除动画 —— 地区选择器每敲一个字就变长度且实测未崩，可作旁证。**不做无凭据的大范围改写**，但 `AppDetail` 那处标记为观察对象。

### P5（已完成，待真机验收）

覆盖 FR-ALERT-01~07、FR-SUB-06、§7 通知权限降级。`notifications.ts` 增加排程规划器，新增 `notify_text.ts`、`views/SettingsView.tsx`，`App.tsx` 接管重排与通知跳转。

**排程规划器已离线跑通 18 条断言**（`planReminders` 是纯函数，无 Notification 调用）。

**最重要的一个设计判断：按「滚动余额」而非单笔金额判断余额是否够。** 余额 $30、月内三笔各 $20 时：

| 扣费 | 扣费前余额 | 是否告警 |
|---|---|---|
| 第 1 笔 $20 | 30 | 否 |
| 第 2 笔 $20 | 10 | **是** |
| 第 3 笔 $20 | -10 | **是** |

按 spec 字面「余额 < 下一笔扣费金额」只会对第一笔判断，三笔全都不告警 —— 而实际上第二笔就会失败。反过来若拿全额余额逐笔比，则三笔全告警。两种都错。规划器按时间顺序推演账号余额，逐笔扣减，这是唯一能对上真实扣费顺序的算法。

异币种订阅**不参与扣减也不参与判断**（`comparable: false`），通知文案单独写明「该笔为其他币种，未计入本账号余额」—— 既不静默漏报，也不引入汇率。

**其余已验证行为**：提前天数只移动提醒时间、不动扣费日（提前 3 天 → 扣费日前 3 天的 10:00 本地时间）；已经过去的提醒直接丢弃而不是补发（now 09:00 时当天 10:00 的提醒仍会排，11:00 时则丢弃）；配额截断到最近 20 笔且按时间升序；暂停的订阅与账号已删除的孤儿条目都跳过。

**并发保护**：`rescheduleAll` 先清空再排程，两次重叠执行会让第二次的清空抹掉第一次刚排好的一半。`App.tsx` 用一个 in-flight 标记把重排串行化，期间到达的变更记为 pending、在当前这轮结束后补跑一次。

**FR-ALERT-04**：只有「这笔真的会扣失败」才升级为 `timeSensitive`。能穿透专注模式的权限不该发给一条普通提醒。

**FR-ALERT-06**：不需要 `tapAction: runScript` —— dts 写明点击通知默认就会启动排程它的脚本。启动时读 `Notification.current.request.content.userInfo.accountId`，以模态方式打开对应账号（而不是 push：用户不是自己走过来的，返回键不该假装他走过）。

**FR-SUB-06**（对冲全项目最高风险）：余额不足的通知文案直接写「请充值，或打开 Storefront 更正余额」。余额全靠手动维护，而告知扣费的这一刻，正是请用户更正这个数字的最佳时机。

**§7 通知权限降级**：dts 里没有查询权限状态的 API，`schedule` 被拒时返回 false。设置页因此显示实际待发条数 —— 有待扣费却排到 0 条，就是 iOS 拒绝了我们，此时红字提示去系统设置开启。这是在没有权限 API 的情况下唯一诚实的信号。

**留给 P8**：FR-ALERT-07 提到 widget 刷新时也应重排。widget 执行窗口短、排 20 条通知偏重，按原计划留到 P8 与其他后台任务一并处理。

### P6（已完成，待真机验收）

覆盖 FR-SHARE-01~06。新增 `intent.tsx`、`views/QuickAdd.tsx`。

**URL 解析加固后跑通 13 条断言**，其中一条抓到了真 bug：

原正则 `\bid(\d{6,})\b` 是全串松散扫描。App 的 slug 就是它自己的名字，可以包含任何东西 —— 遇到 `.../app/id2048-puzzle-id9999999/id1016366447` 会**先匹配到 slug 里的 `id9999999`**，录进一个不存在的应用。改为优先用锚定 `/id…` 路径段的正则，松散形式仅作兜底。

已验证形态：带本地化 slug、缺 slug、百分号编码的中文 slug、带 `?uo=4`/`?mt=8&at=…` 联盟参数、带 `#see-all/reviews` 锚点、裸数字 ID。已验证拒绝：非 App Store 域名、`music.apple.com` 专辑链接、纯文本、位数不足的数字。

**FR-SHARE-05（≤3 次点击）决定了整个界面形态**：每个字段都带可用默认值（账号取当前登录账号，类型由抓到的价格推断），元信息自动填充，Save 一进来就可点。因此**任何网络步骤都不得阻塞** —— 抓取失败只在 footer 提示一句，记录照样能存。

**类型默认值由价格推断**：从 App Store 分享过来的免费应用几乎不可能是「付费应用」记录，而是它里面的订阅或内购，所以 `price === 0` 时默认选「订阅」。

**FR-SHARE-06 重复检测**：同 appId + accountId 已存在时弹二次选择「再加一条 / 更新已有」—— 两种都不得静默执行。

**跨进程竞态已实际处理**（plan §8 记录的问题）：

- `QuickAdd` 保存前**重新 `loadEntries()`** 再写，而不是用打开面板时的快照。
- `index.tsx` 通过 `AppEvents.scenePhase` 在回到前台时**从 Storage 重载** entries 与 appRefs。主 App 挂在后台时其内存副本会过期，下一次保存就会抹掉分享菜单刚写入的记录 —— 回前台重载关掉了这个窗口。

`script.json` 的 `intentInputTypes` 已是大写 `["URLs"]`（spec FR-SHARE-01 写的小写是笔误，小写会导致脚本根本不出现在分享菜单里）。`intent.tsx` 额外读 `textsParameter` 兜底，因为有些来源会把链接当纯文本递过来。

### P7（已完成，`open` 分支待真链验证）

覆盖 FR-TF-01~09。新增 `api/testflight.ts`、`tf_status.ts`、`views/{TestFlightList,TFEditor}.tsx`。

**检测信号已重新实测确认**（规划期的结论在实现前重跑了一遍）：

| 链接 | HTTP | `showSteps` | 状态文案 |
|---|---|---|---|
| `join/u6iogfd0`（Telegram） | 200 | `false && (isIOS \|\| false)` | `This beta is full.` |
| `join/zzzz9999`（伪造） | 404 | 无 | 无 |

**页面不做本地化**，这次用四种 `Accept-Language`（en-US / zh-CN / ja-JP / tr-TR）重验，返回的都是同一句英文。所以此处文案匹配是安全的 —— 与 App Store 商品页恰好相反，那边必须禁止按文案匹配。即便如此，判定链仍以服务端渲染的布尔 `showSteps` 为主、文案为辅。

**解析器 16 条断言 + 状态应用规则 13 条断言全部通过。**

两条容易写错、且写错代价很大的规则（均已单测）：

- **手动状态永远优先**（FR-TF-04）。自动检测可以更新「最后检查时间」，但**不得**改动状态，否则用户的手动更正会在下一次刷新时被静默还原。
- **`unknown` 绝不覆盖已知状态**。`unknown` 是在说「我们的解析器没认出来」，不是在说这个 beta 怎么样。拿它覆盖一个真实状态就是用无知替换事实。

**FR-TF-08 的措辞是刻意保守的**：通知正文写「Storefront 上次检查时还有名额，现在不一定还有」。承诺更多就等于把产品定位成抢名额工具 —— 那正是 FR-TF-09 明令禁止的。

**FR-TF-09（强制）落在两处**：每一行都显示「最后检查时间」，永不脱离时间戳单独呈现状态；列表页常驻说明「时机由 iOS 决定，不保证任何间隔，不适合用来抢名额」。

**批量刷新串行执行**，单条 8 秒预算。十几个并发请求在手机网络下产生的超时会被误读成「检查过了」，对谁都没好处。网络失败时记录**原样不动**，连「最后检查时间」也不更新 —— 这才是诚实的。

**列表删除一开始就用 `ForEach` + `editActions="delete"`**，不重犯 P4 那个用 `.map()` 配左滑导致 UIKit 崩溃的错误。

**仍未验证**：`open` 分支只有合成页面的单测覆盖，缺一个真实的「可加入」TestFlight 链接。这是 plan §5 风险表里记的唯一外部依赖，至今未解除。

### P8（已完成，待真机验收）

覆盖 FR-WG-01~05、FR-TF-07、FR-ALERT-07 的 widget 部分。重写 `widget.tsx`，`billing.ts` 增加 `rankAccounts`。

**排序决定了「瞥一眼桌面」值不值**（4 条断言）：会扣失败的账号 → 30 天内会耗尽的 → 下一笔更近的 → 用户自己的排序。只按用户排序会把一个健康账号放在一个即将扣费失败的账号前面，那 small 尺寸就白给了。

**§8 三条硬约束已结构化验证**。遍历 `widget.tsx` 的完整 import 图：

```
api/http.ts  api/testflight.ts  billing.ts  format.ts  i18n.ts
notifications.ts  notify_text.ts  regions.ts  store.ts  strings/*  tf_status.ts  types.ts
```

`credentials.ts` 不可达、`api/appstore.ts` 不可达 —— 不是靠「记得别 import」，而是图上根本没有路径。前者因为 widget 可能在锁屏态运行、跟密码毫无关系；后者因为商品页 670–780KB，远超扩展的内存上限。TF 页面约 40KB，是唯一便宜到能在这里抓的。

**`Widget.present` 无条件到达**：后台任务整体套 15s 预算 + try/catch，渲染本身不依赖其中任何一项，`build()` 再包一层 try/catch 兜底到 EmptyView。widget 扩展抛异常的表现是主屏一块白板，没有报错也无从诊断。

**发现并规避了一个会毁数据的设计**：FR-ALERT-07 要求 widget 刷新时重排通知，但 `rescheduleAll` 是**先清空再排程**。如果扩展进程其实无权排程通知，这个顺序会静默抹掉主 App 排好的全部提醒，用户要等到下次打开 App 才能恢复。改为 widget **只填空不重排** —— 仅当待发数为 0 时才排，否则完全不碰主 App 的那一套。widget 只能增加，不可能破坏。

**TF 检测（FR-TF-07）**：最多 3 条、单条 6s，按「最久没检查」优先，跳过手动状态的条目。

尺寸适配覆盖全部 7 种 family：小尺寸显示优先级最高的单个账号，中/大显示 4/8 行，三种锁屏 accessory 尺寸走单行视图（否则它们会拿到为主屏设计的多行布局）。`reloadPolicy` 取 `after` + 60 分钟。

顺带修正：`App.tsx` 原先只在账号变化时 `Widget.reloadAll()`，但 widget 显示的下一笔扣费与预警等级都派生自 entries，现在条目变化也会刷新。

### P9（已完成，待真机验收）—— v1 收尾

覆盖 FR-GIFT-01~07、FR-DATA-01~04。新增 `giftcards.ts`、`backup.ts`、`views/GiftCards.tsx`，`SettingsView` 增加导入导出。`script.json` 版本 → 1.0.0。

#### 礼品卡链接是实测出来的，不是猜的

FR-GIFT-02 要求「无官方在线渠道的地区须明确提示，而非跳转失效链接」。逐个探测 43 个地区的 `apple.com/{}/shop/gift-cards` 后，发现这条需求完全不是假想：

| 情形 | 地区 | 表现 |
|---|---|---|
| **看似正常实则不是** | kr、sg | 返回 200，但**重定向到 `/kr/store`** 通用商店页。直接挂链接会把用户扔到一个毫无解释的页面 |
| 真 404 | gr、il、id、za | 无线上礼品卡页面 |
| 路径带语言后缀 | ch、be、sa | 只有 `ch-de` / `be-fr` / `sa-en` 存在，裸国家码 404 |

最终收录 **36 个已验证地区**；不在表内的一律显示「Apple 在该地区不提供线上购买」，不给任何链接。kr/sg 那种「200 但重定向」的情况，靠读文档或猜测是发现不了的。

#### 三方渠道：机制完整，名单留空

FR-GIFT-03~06 的机制全部实现 —— 独立分区（FR-GIFT-04）、常驻不可关闭的免责声明（FR-GIFT-05，**无论列表是否为空都显示**）、赞助标注（FR-GIFT-06）—— 但 `CHANNELS` 数组**刻意留空**，文件内注明了原因与填写方法。

这不是没做完，是分工问题：礼品卡转售是欺诈高发领域，这些链接带有作者的隐含背书，而赞助位本身是作者的商业关系。选哪些商家不是技术决策，Q3 至此明确为**产品方决定**。加进去即刻生效，无需改代码。

#### FR-DATA-02 做成了结构性保证

`backup.ts` **没有任何通往 `credentials.ts` 的 import 路径**（已用完整依赖图遍历验证）。「导出不含密码」因此是模块图的性质，而不是每个调用点都要记得的事。`Account.hasPassword` 只是布尔标记，明文全程不进入这个文件。恢复也因此不动钥匙串：密码在本机存活，备份换到另一台设备则本就没有。

#### 备份校验 15 条断言全过

FR-DATA-04 要求「结构不合法时拒绝并说明原因，不得部分写入」。校验在**任何写入之前**一次性完成，拒绝理由逐条可读：非 JSON、裸数组、null、缺 format、format 版本过新、accounts 缺失/非对象、账号无 id、余额是字符串、余额是 null、记录无 id、**记录指向备份中不存在的账号**、tfItems 格式错误。部分导入比拒绝导入更糟 —— 它留下的既不是旧数据也不是备份。

#### spec §10 验收清单：可静态验证项

| 项 | 方式 | 结果 |
|---|---|---|
| 密码在无生物识别时无展示路径（FR-ACC-06/07） | `revealPassword` 在 `LocalAuth.isAvailable === false` 时无分支通向明文 | ✅ |
| 导出文件不含密码（FR-DATA-02） | `backup.ts` 依赖图不可达 `credentials.ts` | ✅ |
| 内购解析对中文区生效（FR-ENT-04） | us/cn/tr 三区真实页面实测 | ✅ |
| 禁止按内购标题匹配（FR-ENT-04） | `api/` 内无标题文案匹配，仅结构匹配 | ✅ |
| 全产品无「一键切换」字样（FR-SW-05） | 全项目 grep，仅命中标注该禁令的注释 | ✅ |
| 待发通知受控（FR-ALERT-07） | 上限 20，实测截断且按时间升序 | ✅ |
| 通知权限被拒有 App 内提示（§7） | 设置页显示实际待发条数，为 0 且有待扣费即红字提示 | ✅ |
| 网络仅限 Apple 域名（NFR-02） | 白名单 3 个域名；全项目无 `http.ts` 之外的 `fetch` 调用；重定向逐跳复检 | ✅ |
| widget 不接触密码 / 不抓商品页（§8） | 依赖图不可达 `credentials.ts` 与 `api/appstore.ts` | ✅ |

需真机验证的剩余项：断网可用性（NFR-04）、分享录入 ≤3 次点击（FR-SHARE-05）、widget 读取主 App 数据（Q6）、TF 列表显示最后检查时间（FR-TF-09，代码已实现待目视确认）。

#### v1 交付物

41 个文件、约 6900 行。静态类型检查干净（仅剩仓库既有的 `Storage` 声明冲突，已证实与本项目无关）。离线单测累计 **约 115 条断言**，覆盖账单推进、预警判定、通知排程、价格解析、URL 解析、TF 状态判定、账号排序、备份校验。

**唯一未验证的代码路径**：TestFlight 的 `open` 分支（缺一个真实的可加入链接），自 plan §5 风险表登记至今未解除。
