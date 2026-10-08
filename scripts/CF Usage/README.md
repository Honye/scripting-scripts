# CF Usage

查看 Cloudflare 账号与单个 Worker 的用量，并在接近额度时提醒。

> A [Scripting](https://scripting.fun/) app that shows Cloudflare Workers usage —
> account-wide against the Free / Paid quota, and per Worker — and sends a local
> notification when usage crosses a threshold. Bilingual (English / 简体中文),
> multiple accounts, read-only API token.

---

## 它解决什么问题

Workers Free 计划每天只有 **10 万次请求**（Workers 与 Pages Functions 合计，UTC 0 点重置）。超了之后请求直接报错，而 Free 计划没法自己设置用量阈值提醒。想知道今天用了多少，只能登录 Dashboard 去翻 Workers & Pages 的 Usage 面板。

CF Usage 把 Dashboard 里这两块信息搬到手机上：

- **账号总用量**：对应 Workers & Pages 页右侧的 Usage 面板（今日请求 / 100,000、本月请求、CPU 时间）
- **单个 Worker 用量**：对应 Worker 的 Metrics 页（调用数、子请求、错误、CPU / 墙钟时间、按小时的柱状图）

另外，小组件在后台检查用量，越过阈值时发通知。

---

## 功能

### 账号

- 支持**多个 API Token**，每个 Token 绑定一个账号。一个 Token 能访问多个账号时，验证后可以选择
- Token 只存在本机**钥匙串**里，不进 `Storage`
- 计划可选 **Free** 或 **Paid**，额度可手动修改：
  - Free：每日请求数（默认 100,000），周期是 UTC 自然日
  - Paid：每月请求数（默认 1000 万）、每月 CPU 毫秒（默认 3000 万），周期从账单日开始（1–28 日，UTC）
- 提醒阈值可选 50% / 80% / 95% / 100%，默认 80 / 95 / 100

### 账号用量页

- 额度进度条：Free 显示「今日请求」，Paid 显示「本周期请求」和「本周期 CPU」，附重置倒计时
- 本月（Paid 为本周期）合计：请求、CPU 时间、子请求、错误、Pages Functions 请求
- 最近 24 小时的账号请求柱状图
- Worker 列表：按今日请求数排序。主数字是今日请求，下方小字是本月请求和 CPU 时间。没有流量的 Worker 也会列出（来自 Workers 脚本列表接口）
- 下拉刷新；右上角「编辑」修改额度和阈值

### Worker 详情页

- 24 小时 / 7 天切换，按小时（7 天按天）的调用柱状图
- 调用数、子请求、错误、CPU 总时间、CPU 中位数 / P99、墙钟中位数 / P99
- **单独提醒**：打开「为此 Worker 单独提醒」并设置每日请求上限，这个 Worker 当日（UTC）请求数达到上限时提醒一次。设了提醒的 Worker 在列表里有 🔔 标记

### 提醒

- 小组件每次刷新时检查**所有账号**（小组件上显示的账号按参数顺序优先，其余按最久未刷新排序），App 内刷新也会检查
- 每个额度周期内，每档阈值只提醒一次
- 一次越过多档时只发**最高那一档**。例如两次刷新之间从 70% 涨到 97%，只收到一条「95%」，不会连收「80%」和「95%」
- 达到 100% 的提醒使用 `timeSensitive`，可以穿透专注模式
- 额度周期一变（Free 是第二天 UTC 0 点，即北京时间早上 8 点），阈值状态就重置
- 通知发送失败（例如没有通知权限）时不记为已提醒，下次刷新会重试

### 小组件

在桌面添加「CF 用量」小组件后，长按 › 编辑小组件，在 **Parameter** 里填写要显示的内容：

| 参数 | 显示 |
| --- | --- |
| 留空 | 第一个账号 |
| `个人` | 名称（或 Cloudflare 账号名）为「个人」的账号，不区分大小写 |
| `个人/storefront-api` | 该账号下的 `storefront-api` 这个 Worker |
| `个人, 工作` | 多个账号，各自显示用量 |
| `个人, 工作/storefront-api` | 账号和 Worker 可以混排 |
| `*` | 所有账号 |

多个条目之间可以用 `,`、`;`、`|` 或换行分隔，中文的 `，`、`；` 也可以。找不到的名称会被跳过，重复的会合并；一个都没匹配上时显示第一个账号。

**单个条目**时：

| 尺寸 | 账号 | Worker |
| --- | --- | --- |
| small | 用量环 + 已用 / 额度 + 重置倒计时 | 今日请求；设了上限时附进度环 |
| medium | 用量环 + 今日请求最多的 4 个 Worker | 同 small |
| large | 所有账号概览 + 24 小时柱状图 + Top Worker | — |
| 锁屏 | 圆形：容量环；矩形：名称 + 数字 + 进度条；行内：数字 | — |

**多个条目**时，每个条目显示为一条加粗的横向进度条：左上是 Worker 图标和名称，右上是「已用 / 额度」，进度条上写着百分比，颜色随用量变化。

| 尺寸 | 显示 |
| --- | --- |
| small | 最多 3 条 |
| medium | 最多 3 条，字号更大 |
| large | 最多 6 条，每条下方附重置倒计时或更新时间 |
| 锁屏 | 圆形：第一个条目；矩形：前 3 个条目的百分比；行内：前 2 个条目 |

条目超过可显示数量时，标题右侧显示「+N」。

账号条目的进度是额度用量（Paid 取请求与 CPU 中较高的一项）。Worker 条目设了单独提醒上限时，进度是「今日请求 / 上限」；没设上限时进度条为空，右上只显示今日请求数。

颜色：≥ 95% 红色，≥ 80% 橙色，其余蓝色。

---

## 使用

### 1. 创建 API Token

1. 打开 [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) › **Create Token** › **Create Custom Token**
2. 权限添加两条，都只需要**读取**：
   - `Account` › `Account Analytics` › `Read`
   - `Account` › `Workers Scripts` › `Read`
3. Account Resources 选择要查看的账号（或 All accounts）
4. 创建后复制 Token，它只显示一次

### 2. 添加账号

1. 打开 CF 用量，点右上角 **+**
2. 粘贴 Token，点「验证并加载账号」
3. 选择账号，按实际情况选择 Free / Paid，必要时调整额度和阈值
4. 保存。回到列表后会自动拉取一次用量

要接入多个 Cloudflare 账号（例如不同邮箱注册的），重复以上步骤，每个账号用各自的 Token。

### 3. 添加小组件以启用后台提醒

iOS 不允许脚本常驻后台，后台检查只能借助小组件刷新。**不放小组件，就只有打开 App 时才会检查和提醒。**

1. 首次打开时允许通知权限
2. 主屏长按 › 添加小组件 › Scripting › 选择 CF 用量
3. 按上表填写 Parameter（可留空）。想在一个小组件里同时看几个账号，就用逗号分隔，或填 `*`

### 4. 第一次使用时运行诊断

账号用量页底部有「诊断」。点「运行检测」会逐条执行每种查询，并显示 Cloudflare 返回的原始结果，详见下文「已知限制」。全部是绿色对勾说明字段都可用。

---

## 它做不到什么

**不是实时监控。** 后台检查的时机由 iOS 决定，大约 15–60 分钟一次，不保证间隔。它能让你在额度快用完时知道，但不能在流量突增的几分钟内就告警。需要更及时的告警，可以看看 Cloudflare 控制台 Notifications 里有没有适合你计划的选项，或自己部署一个定时 Worker 来检查。

**统计口径与 Dashboard 可能略有出入。** 数据来自 GraphQL Analytics API 的自适应采样数据集，与 Dashboard 同源，但有几分钟延迟，大流量时数字是估算值。

**不统计 Observability 事件数**（Free 每天 20 万），也不统计 KV、D1、R2 等其他产品的用量。

**Paid 计划的账单日需要手动设置。** API 不提供账单周期，周期按你设定的日期推算。

---

## 已知限制：未经官方文档确认的字段

Cloudflare 公开文档的示例查询只用到 `requests`、`subrequests`、`errors`、`cpuTimeP50/P99` 和 `datetime`。本应用还用到了以下字段：

- `workersInvocationsAdaptive` 的 `sum.cpuTimeUs`、`date` / `datetimeHour` 维度、`wallTimeP50/P99`
- `pagesFunctionsInvocationsAdaptiveGroups` 数据集

处理方式：

- CPU 字段被拒绝时自动去掉重试，界面提示「API 不接受 CPU 时间字段」，其他数字照常显示
- Pages Functions 数据读不到时提示「总量可能偏低」，账号总量只按 Workers 计算
- 诊断页显示每个查询的原始报错，便于修正字段名

---

## 隐私与数据

- **纯本地。** 没有自建服务器，App 只访问 Cloudflare 官方 API
- **网络只访问 `api.cloudflare.com`。** 白名单在网络层强制，重定向逐跳复检，Token 不会被发往其他域名
- **Token 存于钥匙串**，`accessibility` 为默认的 `first_unlock_this_device`：不随 iCloud 同步，设备开机解锁一次后小组件即可读取。与 Storefront 存密码不同，这里**没有 Face ID 门禁**，因为小组件必须能独立调用 API 才能提醒。所以请只授予上面两个只读权限
- 用量快照、提醒状态存在本脚本的 `Storage` 沙箱中；删除账号时会一并删除 Token、快照和提醒状态

---

## 文件结构

```
CF Usage/
├── index.tsx              主 App 入口
├── widget.tsx             小组件 + 后台检查与提醒
├── widget_param.ts        小组件参数解析（纯函数）
├── types.ts               数据模型与默认额度
├── store.ts               Storage / 钥匙串封装
├── limits.ts              UTC 周期、额度计量（纯函数）
├── alerts.ts              提醒判定（纯函数）与通知发送
├── refresh.ts             拉取 → 缓存 → 提醒，App 与小组件共用
├── format.ts              数字、时间格式化
├── i18n.ts                语言选择
├── api/
│   ├── http.ts            唯一网络出口（超时、白名单、统一错误）
│   ├── cloudflare.ts      REST（Token 验证、账号、Worker 列表）与 GraphQL
│   ├── usage.ts           用量查询、字段降级、诊断探测
│   └── usage_parse.ts     GraphQL 结果汇总（纯函数）
├── components/            用量环、进度行
├── views/                 账号列表、编辑、账号用量、Worker 详情、诊断
└── strings/               en / zh 文案
```

---

## 开发说明

- 在仓库根目录运行 `pnpm start`，在 Scripting App 中连接开发服务器
- 周期计算、数据汇总、提醒判定、小组件参数解析都是不依赖 `scripting` 运行时的纯函数，可以转译后在 Node 里直接跑断言
- 类型检查：`npx -p typescript tsc --noEmit -p .`（根目录）。`Storage.get/set` 会报与 DOM `Storage` 冲突的错误，这是仓库现有的类型环境问题，所有项目都有

---

## 版本

v1.0.0
