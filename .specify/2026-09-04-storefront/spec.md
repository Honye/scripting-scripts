# Storefront — 需求规范 (spec.md)

- **状态**：Spec（需求定义，待评审）
- **日期**：2026-09-04
- **上游**：[intent.md](./intent.md)
- **平台**：Scripting (iOS)，TSX → SwiftUI
- **版本**：v1

> 本文档定义 **做什么** 与 **做到什么程度算完成**，不定义 **怎么实现**。实现方案见后续 plan.md。
> intent.md 中的决策 D1–D7 在此视为既定前提，不再论证。

---

## 1. 术语表

| 术语 | 定义 |
|---|---|
| **账号 (Account)** | 一个 Apple 账号，绑定唯一地区。本产品的一级实体 |
| **地区 / Storefront** | Apple 账号所属的国家或地区，用 ISO 3166-1 alpha-2 小写码表示（`us` / `cn` / `jp` / `hk`），同时决定币种与 App Store URL 路径 |
| **余额 (Balance)** | 账号内的 Apple 账户余额（礼品卡充值所得）。**由用户手动维护**，本产品无法读取真实值 |
| **当前登录账号** | 用户手动标记的、当前 App Store 处于登录态的账号。全局唯一，可为空 |
| **条目 (Entry)** | 已购/内购/订阅记录的统称，均关联到一个账号与一个应用 |
| **预付模型** | 本产品的核心支付假设：扣费来自账户余额而非信用卡，余额耗尽即扣费失败 |
| **抓取降级** | 网络抓取失败时不阻塞流程、静默回落到手动输入的策略 |

---

## 2. 用户故事

| ID | 作为…… | 我想要…… | 以便…… | 优先级 |
|---|---|---|---|---|
| US-01 | 多区账号持有者 | 集中查看所有账号的地区与余额 | 不再靠记忆区分哪个号是哪个区 | P0 |
| US-02 | 多区账号持有者 | 在余额不足以支付下一笔订阅时被提前告知 | 避免订阅静默失效 | P0 |
| US-03 | 多区账号持有者 | 查到某个应用当初是用哪个号买的 | 换机/重装时能正确恢复 | P0 |
| US-04 | 多区账号持有者 | 从 App Store 分享菜单一步把应用记入库 | 录入成本低到愿意长期坚持 | P0 |
| US-05 | 多区账号持有者 | 切换账号时快速取到账号与密码 | 减少切换时的翻找摩擦 | P1 |
| US-06 | 多区账号持有者 | 看到某应用在不同地区的内购价格 | 决定用哪个号购买更划算 | P1 |
| US-07 | TestFlight 收集者 | 集中管理 TF 链接并知道哪些还能进 | 不必逐个点开试 | P1 |
| US-08 | 多区账号持有者 | 余额不足时快速找到该地区的充值入口 | 立即解决问题而非记下来待办 | P2 |
| US-09 | 多区账号持有者 | 在主屏 widget 上看到余额与近期扣费 | 无需打开 App 即可掌握状态 | P2 |
| US-10 | 多区账号持有者 | 导出/导入全部数据 | 备份与换机迁移 | P2 |

---

## 3. 数据模型

所有实体存于 `Storage`（JSON），**密码单独存于 `Keychain`**，二者通过 `Account.id` 关联。

### 3.1 Account

```ts
type Account = {
  id: string                 // uuid，主键
  alias: string              // 用户自定义昵称，必填，如「日区主号」
  region: string             // ISO 3166-1 alpha-2 小写，如 "jp"
  currency: string           // ISO 4217，如 "JPY"，由 region 推导，允许覆盖
  email: string              // 账号（Apple ID），可为空
  hasPassword: boolean       // 密码是否已存入 Keychain；密码本身不在此
  balance: number            // 余额，以 currency 计价
  balanceUpdatedAt: number   // 余额最后更新时间戳，用于新鲜度提示
  note: string
  sortIndex: number
  createdAt: number
}
```

- 密码存取键：`Keychain` 中 `account_pwd_{id}`，值为明文字符串（Keychain 自身提供加密与脚本级隔离）。
- `region → currency` 使用内置映射表；映射缺失时要求用户手动选择币种。

### 3.2 AppRef（应用元信息，可共享引用）

```ts
type AppRef = {
  appId: string              // App Store 数字 ID，主键
  name: string
  iconUrl: string
  bundleId?: string
  fetchedRegion: string      // 元信息抓取自哪个地区
  fetchedAt: number
}
```

### 3.3 Entry（已购 / 内购 / 订阅统一实体）

```ts
type Entry = {
  id: string
  kind: 'purchase' | 'iap' | 'subscription'
  appId: string              // → AppRef
  accountId: string          // → Account
  title: string              // 买断=应用名；内购/订阅=内购项名称
  price: number
  currency: string           // 冗余存储，因历史价格的币种不随账号变更
  priceSource: 'fetched' | 'manual'
  purchasedAt?: number       // purchase / iap 适用
  // 仅 subscription 适用：
  cycle?: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  customCycleDays?: number
  nextBillingAt?: number
  active?: boolean
  note: string
}
```

**设计说明**：三种类型合并为一个实体而非三张表，因为它们共享「应用 × 账号 × 价格」这一核心结构，且用户经常需要跨类型查询「这个 app 我一共花了多少」。`kind` 决定哪些字段有效。

### 3.4 TFItem

```ts
type TFItem = {
  id: string
  appId?: string             // 可选，TF 应用未必能对应到 App Store 条目
  name: string               // 必填，用户填写
  joinUrl: string            // https://testflight.apple.com/join/{code}
  accountId?: string         // 用哪个账号获得的资格
  status: TFStatus
  statusCheckedAt?: number
  note: string
}

type TFStatus = 'open' | 'full' | 'closed' | 'invalid' | 'unknown'
```

### 3.5 存储键约定

| 键 | 域 | 内容 |
|---|---|---|
| `accounts` | Storage | `Account[]` |
| `appRefs` | Storage | `Record<appId, AppRef>` |
| `entries` | Storage | `Entry[]` |
| `tfItems` | Storage | `TFItem[]` |
| `currentAccountId` | Storage | `string \| null` |
| `settings` | Storage | 提醒提前天数、语言等 |
| `account_pwd_{id}` | Keychain | 明文密码 |

> **约束**：widget.tsx 与 index.tsx 是独立执行环境，通过 `Storage` 共享数据。若实测发现 widget 读不到主 App 写入的数据，则统一改用 `{ shared: true }` 选项。此为实现阶段需验证的第一件事。

---

## 4. 功能需求

### 4.1 账号管理 (ACC)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-ACC-01 | 新增/编辑/删除账号 | 必填 `alias` 与 `region`；删除时若存在关联 Entry/TFItem，须二次确认并说明将一并删除或转为「未关联」 |
| FR-ACC-02 | 账号列表以卡片展示 | 每张卡片显示：地区旗帜+地区名、alias、余额（含币种符号）、本月待扣总额、预警角标 |
| FR-ACC-03 | 余额手动维护 | 提供数字输入；保存时更新 `balanceUpdatedAt` |
| FR-ACC-04 | 余额新鲜度提示 | `balanceUpdatedAt` 超过 30 天时，卡片显示「余额可能已过期」的弱提示 |
| FR-ACC-05 | 密码可选存储 | 密码字段留空即不写 Keychain，`hasPassword=false` |
| FR-ACC-06 | 密码查看/复制需生物识别 | 调用 `LocalAuth.authenticate(reason)`，返回 `false` 或抛错则不得展示密码 |
| FR-ACC-07 | 生物识别不可用时的降级 | `LocalAuth.isAvailable === false` 时，明确提示「设备未启用密码/生物识别，无法查看已存密码」，**不得**降级为直接展示 |
| FR-ACC-08 | 复制账号/密码到剪贴板 | 使用 `Pasteboard.setString`；复制密码后给出「已复制，请尽快使用」的提示 |
| FR-ACC-09 | 标记当前登录账号 | 全局唯一。在账号卡片上以明显标识展示 |
| FR-ACC-10 | 账号排序 | 支持手动排序，持久化 `sortIndex` |

### 4.2 账号切换助手 (SW)

> 前提 D1：iOS 无法程序化切换账号或地区。本模块是**引导流程**，不是自动化。

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-SW-01 | 提供「切换到此账号」入口 | 位于账号详情页 |
| FR-SW-02 | 引导流程 | 依次提供：复制账号 → 复制密码（过生物识别）→ 打开 App Store 按钮 |
| FR-SW-03 | 跳转 App Store | 调用 `Safari.openURL("itms-apps://")`（或等效 scheme）打开 App Store 首页 |
| FR-SW-04 | 返回后确认 | 回到 Scripting 时询问「是否已切换为该账号？」，确认后更新 `currentAccountId` |
| FR-SW-05 | **文案诚实性（强制）** | 全产品**不得**出现「一键切换」「自动切换」等表述。该入口文案须体现「辅助 / 引导」语义 |
| FR-SW-06 | 能力说明 | 首次进入该流程时，一次性说明「iOS 不允许第三方 App 代为切换账号，以下步骤需你手动完成」 |

### 4.3 订阅管理 (SUB)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-SUB-01 | 新增/编辑/删除订阅 | 必填：应用、账号、金额、周期、下次扣费日 |
| FR-SUB-02 | 币种默认继承账号 | 默认取 `Account.currency`，允许手动改 |
| FR-SUB-03 | 账号维度汇总 | 展示：本月待扣总额、下一笔扣费（金额+日期）、余额是否足够 |
| FR-SUB-04 | **多币种不做折算** | 各账号按自身币种独立汇总展示；**v1 不引入汇率**，不提供跨币种合计数 |
| FR-SUB-05 | 扣费日自动推进 | 到达 `nextBillingAt` 后按 `cycle` 自动推进到下一周期 |
| FR-SUB-06 | 推进时请求余额更新 | 扣费日通知中引导用户更新该账号余额（一步完成） |
| FR-SUB-07 | 暂停/恢复订阅 | `active=false` 的订阅不参与汇总与提醒，但保留记录 |
| FR-SUB-08 | 按扣费日排序视图 | 提供跨账号的「即将扣费」时间轴视图作为次级入口 |

### 4.4 余额预警 (ALERT)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-ALERT-01 | 两级预警判定 | **严重**：余额 < 下一笔扣费金额；**提醒**：余额 ≥ 下一笔，但 < 未来 30 天累计扣费额 |
| FR-ALERT-02 | 预警可视化 | 账号卡片以不同颜色/图标区分两级；严重级须在首页可一眼识别 |
| FR-ALERT-03 | 扣费提前通知 | 默认提前 3 天，可在设置中调整（0–14 天） |
| FR-ALERT-04 | 严重级通知升级 | 余额不足以支付下一笔时，通知 `interruptionLevel: 'timeSensitive'` |
| FR-ALERT-05 | 通知内容 | 须含：账号 alias、应用名、金额、扣费日、当前余额 |
| FR-ALERT-06 | 通知点击行为 | 跳转到对应账号详情页 |
| FR-ALERT-07 | 通知配额管理 | 仅为**最近 N 笔**（N 默认 20）排程通知；每次 App 启动与 widget 刷新时用 `removeAllPendingsOfCurrentScript` + 重新排程，避免占满 iOS 全局 64 条待发上限 |

### 4.5 已购 / 内购记录 (ENT)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-ENT-01 | 新增记录 | 支持手动新增与分享菜单导入（见 4.7） |
| FR-ENT-02 | 自动拉取应用元信息 | 通过 `itunes.apple.com/lookup?id={appId}&country={region}` 取名称、图标、售价、币种 |
| FR-ENT-03 | 自动拉取内购价格 | 解析 `apps.apple.com/{region}/app/id{appId}` 页面的 `serialized-server-data` JSON |
| FR-ENT-04 | **解析规则约束（强制）** | 必须按 `$kind === "textPair"` 结构提取 `leadingText`/`trailingText`；**禁止**按标题文案（"In-App Purchases"）匹配，因其随地区本地化 |
| FR-ENT-05 | **抓取降级（强制）** | 任何抓取失败（网络错误、结构变更、无内购）均**不得阻塞**录入流程，须静默回落到手动输入，并保留一次「重试」入口 |
| FR-ENT-06 | 价格可编辑 | 所有自动获取的价格均可修改；修改后 `priceSource` 置为 `manual` |
| FR-ENT-07 | 价格变动提示 | 重新抓取时若价格与已存值不同，**提示差异并询问是否更新**，不得静默覆盖 |
| FR-ENT-08 | 跨区比价 | 应用详情页可选择多个地区，展示各区售价/内购价对照（按各自币种，不折算） |
| FR-ENT-09 | 按应用聚合 | 提供「按应用」视图，显示该应用下所有条目及累计花费（同币种才合计） |
| FR-ENT-10 | 查看 App Store 页面 | 提供 `AppStore.presentApp(appId)` 入口，在 Scripting 内直接打开产品页 |

### 4.6 TestFlight 管理 (TF)

> ⚠️ 本模块的状态判定规则**尚未验证**（见 §8 Q1）。以下需求分为「已确定」与「待验证」两部分。

**已确定**

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-TF-01 | 新增/编辑/删除 TF 记录 | 必填：名称、joinUrl |
| FR-TF-02 | 关联账号 | 可选择获得资格所用的账号 |
| FR-TF-03 | 打开 TF 链接 | 点击跳转 TestFlight App |
| FR-TF-04 | 手动标记状态 | 用户始终可手动覆盖状态，手动值优先于自动检测结果 |

**待验证（依赖 Q1）**

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-TF-05 | 自动检测名额状态 | 抓取 joinUrl 页面，判定为 `open` / `full` / `closed` / `invalid` |
| FR-TF-06 | 手动批量刷新 | 列表页下拉刷新，批量检测全部记录 |
| FR-TF-07 | 机会性后台刷新 | widget 时间线刷新时顺带检测 |
| FR-TF-08 | 状态变化通知 | 由非 `open` 变为 `open` 时发通知 |
| FR-TF-09 | **非实时性明示（强制）** | 列表页须显示「最后检查时间」，并有一次性说明「后台检查由系统调度，间隔不保证，本功能不适合抢名额」 |

> **降级方案**：若 Q1 验证表明页面无法稳定判定状态，则 FR-TF-05~08 全部取消，本模块退化为纯书签管理（仅保留 FR-TF-01~04），且不得在 UI 上暗示具备监控能力。

### 4.7 分享菜单录入 (SHARE)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-SHARE-01 | 注册 URL 类型 Intent | `script.json` 配置 `intentInputTypes: ["urls"]`，入口文件 `intent.tsx` |
| FR-SHARE-02 | 解析 App Store URL | 从 `https://apps.apple.com/{region}/app/{slug}/id{digits}` 中提取 region 与 appId；须容忍缺失 slug、带 query 参数等变体 |
| FR-SHARE-03 | 解析失败处理 | 非 App Store URL 时给出明确提示并退出，不得静默失败 |
| FR-SHARE-04 | 快速录入流程 | 拉取元信息 → 选择类型（已购/内购/订阅）→ 选择账号 → 保存 |
| FR-SHARE-05 | 录入步数 | **从分享菜单到保存完成不超过 3 次点击**（在已有账号且类型默认的前提下） |
| FR-SHARE-06 | 重复检测 | 若同一 appId + accountId 已存在条目，提示并询问是覆盖还是新增 |

### 4.8 礼品卡充值入口 (GIFT)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-GIFT-01 | 官方充值入口 | 按账号 `region` 跳转 Apple 官方礼品卡页面 |
| FR-GIFT-02 | 地区无官方在线渠道时 | 明确提示该地区不支持在线购买，而非跳转到失效链接 |
| FR-GIFT-03 | 三方渠道列表 | 数据硬编码于常量文件（D5），字段：地区、名称、链接、排序 |
| FR-GIFT-04 | **三方渠道视觉区隔（强制）** | 三方渠道须与官方渠道**分区展示**，不得混排 |
| FR-GIFT-05 | **免责声明（强制）** | 三方区块须常驻显示免责说明：非 Apple 官方渠道、由第三方运营、交易风险自负 |
| FR-GIFT-06 | 赞助标注 | 若某渠道为赞助性质，须显式标注「赞助」 |
| FR-GIFT-07 | 入口可达性 | 余额预警处提供直达该账号地区充值入口的快捷方式 |

### 4.9 Widget (WG)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-WG-01 | 账号为中心的展示 | 显示账号 alias、地区、余额、下一笔扣费 |
| FR-WG-02 | 预警高亮 | 严重级预警的账号须在 widget 上视觉突出 |
| FR-WG-03 | 尺寸适配 | 至少支持 small 与 medium；small 显示单个（优先级最高的预警）账号 |
| FR-WG-04 | 承担后台任务 | 时间线刷新时执行：重排通知（FR-ALERT-07）、TF 状态检测（FR-TF-07） |
| FR-WG-05 | 刷新策略 | 使用 `Widget.present(view, reloadPolicy)`，策略取 `after` 并设定合理间隔 |

### 4.10 数据管理 (DATA)

| ID | 需求 | 验收标准 |
|---|---|---|
| FR-DATA-01 | 导出 JSON | 导出全部 Storage 数据 |
| FR-DATA-02 | **导出不含密码（强制）** | 导出文件中**不得**包含任何 Keychain 内的密码 |
| FR-DATA-03 | 导入 JSON | 支持覆盖导入；导入前须二次确认并提示将清除现有数据 |
| FR-DATA-04 | 导入校验 | 结构不合法时拒绝导入并说明原因，不得部分写入造成脏数据 |

---

## 5. 非功能需求

| ID | 类别 | 需求 |
|---|---|---|
| NFR-01 | 安全 | 密码仅存于 `Keychain`；内存中不长期驻留；不写入日志；不出现在导出文件中 |
| NFR-02 | 安全 | 除 Apple 官方域名（`itunes.apple.com`、`apps.apple.com`、`testflight.apple.com`、`apple.com`）外，**不向任何第三方发送用户数据**；三方渠道仅为跳转链接，不携带任何参数 |
| NFR-03 | 隐私 | 无任何遥测、统计、埋点 |
| NFR-04 | 可用性 | 全部核心功能（除价格抓取与 TF 检测外）**离线可用** |
| NFR-05 | 性能 | 首页在 50 个账号 / 500 条 Entry 规模下打开无可感卡顿 |
| NFR-06 | 健壮性 | 任何网络请求须设超时（建议 10s）与失败降级，不得出现无限 loading |
| NFR-07 | 健壮性 | App Store 页面 HTML 约 750KB，解析后须及时释放，不得整页长期驻留内存 |
| NFR-08 | 国际化 | 支持中文与英文，遵循仓库既有 `strings/` 模式 |
| NFR-09 | 代码规范 | 遵循仓库 `.prettierrc`：无分号、单引号、2 空格缩进、无尾逗号 |
| NFR-10 | API 规范 | `ForEach` 必须使用 `data` + `builder`；滑动操作仅用于 `List` 内的行 |

---

## 6. 信息架构

```
NavigationStack
├── 首页：账号列表（账号为中心，D7）
│   ├── 账号卡片 ×N（地区旗 / alias / 余额 / 本月待扣 / 预警角标）
│   └── 次级入口：即将扣费时间轴、按应用浏览、TestFlight、设置
├── 账号详情
│   ├── 概览（余额、编辑余额、本月待扣、预警）
│   ├── 凭据（账号 / 密码，密码需 Face ID）
│   ├── 切换助手入口
│   ├── 充值入口（官方 + 三方）
│   └── 该账号下的：订阅 / 已购 / TestFlight
├── 应用详情
│   ├── 元信息 + App Store 入口
│   ├── 跨区价格对照
│   └── 该应用的全部条目（含跨账号）
├── TestFlight 列表
└── 设置（提醒提前天数、语言、导入导出）
```

---

## 7. 关键流程的错误与降级矩阵

| 场景 | 期望行为 |
|---|---|
| 元信息抓取失败 | 保留用户已填内容，提示「未能获取，请手动填写」，提供重试 |
| 内购价格解析失败 | 静默跳过内购部分，其余流程照常，不打断用户 |
| `serialized-server-data` 结构变更 | 视同解析失败；不得抛出未捕获异常导致脚本崩溃 |
| TF 页面无法访问 | 状态置 `unknown`，保留上次已知状态与检查时间 |
| 生物识别失败/取消 | 不展示密码，不给任何绕过路径 |
| 生物识别不可用 | 明确告知无法查看密码；其余功能不受影响 |
| Widget 读不到数据 | 显示占位内容与「打开 App 以初始化」，不显示错误堆栈 |
| 通知权限未授予 | 首次需要时请求；被拒绝后在预警处以 App 内提示替代，并说明如何开启 |

---

## 8. 未决问题

| # | 问题 | 状态 | 影响 | 需在何时解决 |
|---|---|---|---|---|
| Q1 | 需要真实 TestFlight 公开链接（含一个已满的）验证页面结构与状态判定规则 | **未解决，阻塞** | 决定 FR-TF-05~08 是实现还是取消 | **进入 plan.md 前** |
| Q2 | 多币种是否需要折算为本位币 | 已在 v1 定为「不折算」(FR-SUB-04) | 若改变则需引入汇率源 | v2 再议 |
| Q3 | 三方购卡渠道具体收录清单与免责声明措辞 | 未解决，不阻塞 | 仅影响 FR-GIFT-03 的常量内容 | 实现阶段 |
| Q4 | 余额不足判定口径 | 已定为两级判定 (FR-ALERT-01) | — | 已解决 |
| Q5 | 扣费日推进方式 | 已定为「自动推进 + 通知中引导更新余额」(FR-SUB-05/06) | — | 已解决 |
| Q6 | widget 与主 App 共享 Storage 是否需要 `{ shared: true }` | 未解决，不阻塞 | 影响存储读写的统一封装 | 实现阶段首个验证项 |

> **本规范作出的假设**（若与预期不符请在评审时指出）：
> - Q2 取「分区显示、不折算」：避免引入汇率依赖与数据陈旧问题，且多区用户通常对各区币值有直觉。
> - Q4 取两级判定：单看下一笔会漏报「下月集中扣费」，只看 30 天累计则对单笔紧急情况不够敏感。
> - Q5 取自动推进：完全依赖用户确认会导致数据快速失真，而这是 intent.md 中标记的最高风险。

---

## 9. 范围外（v1 明确不做）

- 自动切换 App Store 地区或账号（平台不支持，D1）
- 读取真实账单、余额、订阅状态（Apple 无接口）
- 跨设备同步（D6）
- 汇率折算与统一本位币汇总（Q2）
- 账号共享 / 多人协作
- 遥测与使用统计
- 订阅费用的历史趋势图表

---

## 10. 验收检查清单

进入实现完成态前，以下每项须逐条验证：

- [ ] 全产品文案中不存在「一键切换」「自动切换」表述（FR-SW-05）
- [ ] 密码在无生物识别时无任何展示路径（FR-ACC-06/07）
- [ ] 导出文件中不含密码（FR-DATA-02）
- [ ] 断网状态下除价格抓取与 TF 检测外全部功能可用（NFR-04）
- [ ] 内购价格解析对中文区（标题为「App 内购买项目」）同样生效（FR-ENT-04）
- [ ] 抓取失败时录入流程仍可完成（FR-ENT-05）
- [ ] 从分享菜单录入不超过 3 次点击（FR-SHARE-05）
- [ ] 三方渠道与官方渠道分区展示且免责声明常驻（FR-GIFT-04/05）
- [ ] TF 列表显示「最后检查时间」及非实时说明（FR-TF-09）
- [ ] 待发通知数量受控，不占满系统配额（FR-ALERT-07）
- [ ] 通知权限被拒绝时有 App 内替代提示（§7）
- [ ] Widget 能读到主 App 写入的数据（Q6）

---

## 11. 变更记录

- 2026-09-04：基于 intent.md 首次输出。确定 10 条用户故事、5 个实体的数据模型、10 个模块共 60 条功能需求；Q4/Q5 在本规范中作出决策，Q2 定为 v1 不做；Q1 仍为进入 plan.md 的阻塞项；新增 Q6（widget 存储共享）。
