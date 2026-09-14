# Storefront

管理多区 Apple 账号的余额、订阅与 TestFlight 名额。

> A [Scripting](https://scripting.fun/) app for people who keep Apple accounts in
> several App Store regions: track which account paid for what, keep an eye on
> prepaid balances before a subscription silently fails to renew, compare prices
> across storefronts, and watch TestFlight slots. Bilingual (English / 简体中文),
> entirely local, no account required.

---

## 它解决什么问题

养多个地区 Apple 账号的人，会遇到三个市面订阅管理工具解决不了的问题：

**「这个 app 当年是用哪个号买的？」** 所有订阅管理工具都假设你只有一个支付账户，没有 `账号 × 地区` 这个维度。

**预付余额会静默失败。** 多区账号大多靠礼品卡充值，余额耗尽时订阅**不会提醒你**，只是悄悄扣款失败 —— 等你发现，服务已经断了。Apple 不提供任何余额 API，这个数字只能靠人维护。

**跨区比价没有工具。** 同一个应用在土耳其和美国的价格可能差好几倍，但你得一个个区手动查。

Storefront 围绕这三点构建，其余功能都是它们的衍生。

---

## 功能

### 账号

- 多账号管理，覆盖 **171 个 App Store 地区**，中英双语地区名 + 搜索
- 余额手动维护，超过 30 天未更新会标记「可能已过期」
- 密码可选存入 **iOS 钥匙串**，查看需通过 Face ID / Touch ID / 设备密码
- 币种默认跟随地区，可单独修改（Apple 对部分地区实际以美元结算）
- 标记当前登录账号；拖拽排序

### 记录

- 三种类型共用一套表单：付费应用、内购、订阅
- 自动拉取应用名称、图标、售价（iTunes Lookup API）
- **自动抓取内购价格**（解析 App Store 商品页）—— 官方 API 完全不提供这些字段
- 抓取到的价格与已有记录不一致时**弹窗询问**，绝不静默覆盖
- 任何抓取失败都不阻塞录入，直接手填即可
- 「按应用」视图：一个应用在各账号下的全部记录与花费合计

### 余额预警

- 两级判定：**严重**（下一笔就会扣失败）/ **提醒**（30 天内会耗尽）
- 按**滚动余额**推演 —— 余额 30、三笔各 20 时，第二笔起才告警，而不是全都告警或全都不告警
- 扣费前通知，提前天数可调（0–14 天）
- 严重级使用 `timeSensitive`，可穿透专注模式
- 通知里直接引导更新余额（余额靠手维护，告知扣费的这一刻正是更正它的最佳时机）

### 跨区比价

- 同一应用在多个地区的售价与内购价并列
- 对比全部地区，搜索地区与你各账号所在地区置顶，其余按换算后价格从低到高排序
- 各区以自身币种为准，另附一行按所选基准货币换算的 **≈ 参考价**（汇率来自 [Frankfurter](https://frankfurter.dev)，仅展示，不存储、不相加）
- 未上架的地区折叠为一行
- 支持按应用名搜索（搜索地区显式可选 —— 同一个词在不同区可能搜到完全不同的应用）

### 分享菜单录入

从 App Store 分享任意应用到 Storefront，自动识别应用、填好元信息，**3 次点击内完成录入**。同一应用同一账号已有记录时会询问「再加一条」还是「更新已有」。

### TestFlight

- 跟踪 TF 链接，自动检测名额状态（可加入 / 已满 / 不接受 / 链接失效）
- 手动标记的状态**永远优先于**自动检测
- 由「非开放」变为「开放」时发送通知
- 每一行都显示「最后检查时间」

### 小组件

- small 显示最需要注意的那个账号（会扣费失败的排最前）
- medium / large 显示多账号
- 支持锁屏 accessory 尺寸

### 礼品卡

- **36 个已实测验证**的 Apple 官方礼品卡地址，无线上渠道的地区明确说明而不给死链
- 第三方渠道与官方渠道**分区展示**，附常驻免责声明

### 数据

JSON 备份导出 / 导入。**导出文件绝不包含密码** —— 密码只存在钥匙串里，备份模块在代码结构上就无法访问它。

---

## 它做不到什么

这一节和上面一样重要。

**不能切换账号或地区。** iOS 不允许任何第三方 App 代替你登录 Apple 账号或更改 App Store 地区。「切换助手」是**引导流程**：帮你复制账号密码、打开 App Store，最后几步必须你手动完成。产品内不会出现「一键切换」这类说法。

**不能自动同步余额。** Apple 没有提供任何余额查询接口。余额完全靠手动维护 —— 这是本产品最大的风险，也是通知里反复提示更新余额的原因。

**不适合抢 TestFlight 名额。** 后台检查由 iOS 调度，不保证任何间隔。它适合让你知道某个 beta 重新开放了，不适合用来抢。

**余额与账单不做汇率换算。** 跨币种金额永不相加。唯一的换算是跨区比价里的 ≈ 参考价：原币价格始终是主数字，参考价按日更新的汇率计算，只用于展示和排序。

---

## 安装

1. 把 `Storefront` 目录放进 Scripting 的脚本目录，或在本仓库根目录运行 `pnpm start` 后用 Scripting App 连接开发服务器
2. 首次打开会请求通知权限（用于扣费提醒）
3. 若要用分享菜单录入，需在 Scripting 的 Intent Inputs 设置中确认 Storefront 的 **URLs** 输入已开启

---

## 隐私与数据

- **纯本地。** 无账号、无服务器、无同步。所有数据存在本脚本的 `Storage` 沙箱中
- **密码存于钥匙串**，`accessibility: unlocked_this_device`（不备份、不跨设备同步）。读取必须通过生物识别或设备密码；设备未启用任何验证方式时**明确拒绝**，没有降级路径
- **网络仅访问三个 Apple 域名和一个汇率接口**：`itunes.apple.com`、`apps.apple.com`、`testflight.apple.com`，以及 `api.frankfurter.dev`（只发送基准货币代码）。白名单在网络层强制，重定向逐跳复检
- 第三方礼品卡链接由系统浏览器打开，不经过本应用的网络层

---

## 文件结构

```
Storefront/
├── index.tsx              主 App 入口
├── widget.tsx             桌面小组件
├── intent.tsx             分享菜单入口
├── types.ts               数据模型
├── store.ts               Storage 封装
├── billing.ts             账单周期、汇总、预警判定（纯函数）
├── credentials.ts         钥匙串 + 生物识别门禁
├── notifications.ts       通知排程与配额控制
├── notify_text.ts         通知文案
├── backup.ts              导入导出与校验
├── regions.ts             171 个 App Store 地区
├── giftcards.ts           官方与第三方充值渠道
├── tf_status.ts           TestFlight 状态应用规则
├── format.ts              货币与日期格式化
├── api/
│   ├── http.ts            唯一网络出口（超时、白名单、统一错误）
│   ├── itunes.ts          应用元信息与搜索
│   ├── appstore.ts        内购价格解析
│   └── testflight.ts      TF 名额检测
├── components/            可复用组件
├── views/                 各功能页面
└── strings/               en / zh 文案
```

---

## 开发说明

本仓库没有测试框架、没有 lint、也没有本地 tsc。开发期采用的做法是：

- **纯函数与 UI 分离。** 账单推进、预警判定、通知排程、价格解析、URL 解析、TF 状态判定、备份校验全部写成不依赖 `scripting` 运行时的纯函数，可以在 Node 中直接跑断言验证 —— 开发过程中累计约 115 条
- **类型检查**用一份镜像根 `tsconfig.json` 的临时配置单独跑 `tsc --noEmit`。它曾抓到 `Widget` / `Notification` 并非全局（必须从 `'scripting'` 导入）这类只有在真机上才会暴露的错误

设计文档见 [`.specify/2026-09-04-storefront/`](../../.specify/2026-09-04-storefront/)：`intent.md`（产品意图）、`spec.md`（60 条需求规范）、`plan.md`（实现计划与全部实现记录）。

---

## 版本

v1.0.0
