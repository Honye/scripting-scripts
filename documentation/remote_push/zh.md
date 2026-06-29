远程推送（Remote Push）让你的设备接收来自你自己的服务器和自动化流程发送的推送通知。设置完成后，你会得到一个 API key，通过 HTTPS 调用即可向已注册的设备投递通知。

---

## 获取 API Key

打开 **工具 → 远程推送**，点击 **设置远程推送**。这会注册当前设备并为你的账户签发一个 API key。

* 同一个 Apple ID 登录的所有设备共享同一个 API key。
* 一个 key 可以注册多台设备。
* 请妥善保管 key —— 任何持有它的人都能向你的设备发送通知。

在同一页面里，你还可以重命名设备、按设备开关推送、发送测试推送以及查看最近的日志。

---

## 基础地址与鉴权

```
https://push.scripting.fun
```

所有接口都需要把 API key 作为 Bearer token：

```
Authorization: Bearer <your_api_key>
```

---

## 发送推送

### `POST /push`

向指定设备发送通知，或发送给你的所有设备。

```ts
POST /push
Authorization: Bearer <your_api_key>
Content-Type: application/json

{
  "title": "构建完成",
  "body": "你的部署已成功完成。",
  "deviceIds": ["a8336eb5-708b-4e4c-93a0-d8a3feb99e89"],
  "action": "scripting://run/MyScript?action=Deploy",
  "image": "https://example.com/preview.jpg",
  "icon": "hammer.fill",
  "iconColor": "systemOrange",
  "actionButtons": [
    { "label": "查看日志", "action": "scripting://run/MyScript?action=Logs" },
    { "label": "重新运行", "action": "scripting://run/MyScript?action=Rerun" }
  ],
  "badge": 1,
  "sound": "default"
}
```

### 参数

| 名称          | 类型       | 必填 | 说明 |
| ------------- | ---------- | ---- | ---- |
| title         | string     | 是   | 通知标题。 |
| body          | string     | 是   | 通知正文。 |
| deviceIds     | string[]   | 否   | 目标设备 ID（UUID）。不传则发送给你所有处于激活状态的设备。已关闭推送的设备始终会被跳过。 |
| action        | string     | 否   | 点击通知时打开的 URL scheme（例如 `scripting://` 深链）。 |
| image         | string     | 否   | 远程图片 URL。设备会下载该图片，并在展开（长按）通知时展示。 |
| icon          | string     | 否   | SF Symbol 名称（如 `hammer.fill`）或远程图片 URL，作为发件人头像展示。 |
| iconColor     | string     | 否   | SF Symbol `icon` 的着色：命名色（`systemRed`、`label` 等）、`#RGB`/`#RRGGBB`、`rgb()/rgba()` 或 `hsl()/hsla()`。缺省为 `systemBlue`。`icon` 为 URL 时忽略。 |
| actionButtons | object[]   | 否   | 长按通知时展示的自定义按钮。每项为 `{ "label": string, "action": string }`，`action` 为点击时打开的 URL scheme。 |
| badge         | number     | 否   | 应用图标角标数字。 |
| sound         | string     | 否   | 通知声音名称，默认为 `default`。 |
| category      | string     | 否   | 通知分类标识符。 |
| threadId      | string     | 否   | 用于对通知分组的线程标识符。 |
| interruptionLevel | string | 否   | 通知打断级别：`passive`、`active`（默认）、`time-sensitive` 或 `critical`。 |
| criticalVolume | number    | 否   | `critical` 告警的声音音量 `0.0`–`1.0`（默认 `1.0`）。仅在 `interruptionLevel` 为 `critical` 时生效。 |

> `image`、`icon`、`actionButtons` 会生成富通知：长按（或下拉）已送达的通知即可看到图片、头像与动作按钮。服务端会自动开启所需的 `mutable-content` 标志。

> `time-sensitive` 通知会突破专注模式与定时推送摘要。`critical` 告警还会无视静音开关与勿扰模式并强制发声——但需要 App 具备 Apple 的 Critical Alerts 权限。在该权限获批前，`critical` 推送会自动降级为 `time-sensitive`。

### 响应

```json
{
  "ok": true,
  "data": {
    "push_id": "uuid",
    "target_devices": 2,
    "sent_at": "2026-05-25T10:00:00.000Z",
    "results": [
      { "deviceId": "a8336eb5-...", "status": "sent", "apnsId": "uuid" },
      { "deviceId": "b7220fa4-...", "status": "failed", "errorCode": "BadDeviceToken" }
    ],
    "daily_limit": 1000,
    "remaining": 985
  }
}
```

body 中的 `remaining` 与 `daily_limit` 反映本次推送后的配额。响应头 `X-Push-Limit-Remaining` 携带相同的剩余次数（按发送前计算），并且在触发限流错误时同样会带上。

---

## 列出设备

### `GET /devices`

列出你已注册的设备。发送推送时，用每个设备的 `id` 填入 `deviceIds` 数组。

```json
{
  "ok": true,
  "data": {
    "devices": [
      {
        "id": "a8336eb5-708b-4e4c-93a0-d8a3feb99e89",
        "device_name": "iPhone 15",
        "is_active": true,
        "push_enabled": true,
        "created_at": "2026-05-25T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

`push_enabled: false` 的设备仍会留在列表中，但发送推送时会被跳过。

---

## 订阅 Key（Subscription Keys）

有时你想让第三方——订阅源、内容 feed、你并不完全掌控的自动化——往你的设备推送，但又不想把主 API key 交出去（主 key 还能管理设备、读取订阅、生成更多 key）。

在 **工具 → 远程推送 → 订阅 Key** 里，你可以从主 key 派生**只能发送**的 key：

* 订阅 key 只能 `POST /push` 推到**你自己的**设备。所有管理接口（设备、key 信息、其它订阅 key、日志、统计）都会以 `MASTER_KEY_REQUIRED` 拒绝。
* 用法和主 key 完全一样——把订阅 key 放进 `Authorization: Bearer` 头即可。
* 它的推送计入账号共享的每日上限。
* 你可以在 App 内随时**停用**（可恢复）或**删除**（永久）订阅 key；停用/删除后立即失效。

这样一个订阅源就能服务多个用户：每个用户各自生成一个订阅 key 交给它，订阅源用各自的 key 推给各自的用户，任何用户都能独立切断。

---

## 每日限额与统计

### `GET /push/limit`

返回每日推送限额以及剩余次数。

```json
{
  "data": {
    "date": "2026-05-25",
    "push_count": 15,
    "limit": 1000,
    "remaining": 985
  }
}
```

### `GET /push/stats`

返回整体与当日的推送统计，包含总数与成功率。

---

## 推送日志

### `GET /push/logs`

返回最近的推送历史。可选 `limit` 查询参数（1–100，默认 50）。

```
GET /push/logs?limit=20
```

---

## 示例

```bash
curl -X POST https://push.scripting.fun/push \
  -H "Authorization: Bearer <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"World"}'
```

---

## 兼容 Bark 的 API

本服务同时兼容 [Bark](https://github.com/Finb/Bark) 的 API：把 Bark 工具/脚本指向 `https://push.scripting.fun`，并用你的某个**订阅 key** 作为 Bark 的 key 即可。

### 接口

* `GET|POST /:key/:body`
* `GET|POST /:key/:title/:body`
* `GET|POST /:key/:title/:subtitle/:body`
* `POST /:key` —— 全部字段放 JSON body
* `POST /push` —— body 带 `device_key`（或 `device_keys` 数组）
* `GET /ping`、`GET /healthz`、`GET /info`、`GET /register/:key`

`key` / `device_key` 就是订阅 key（工具 → 远程推送 → 订阅 Key）。它推送到你已注册的设备，并计入账号共享的每日上限。

### 支持的参数

`title`、`subtitle`、`body`、`level`（`active` / `timeSensitive` / `passive` / `critical`）、`badge`、`sound`、`icon`(URL)、`group`、`url`、`copy`、`autoCopy`、`call`、`volume`、`ciphertext` + `iv`、`id`。

* `sound` —— Bark 内置铃声名，如 `minuet`。
* `call=1` —— 铃声重复响约 30 秒。
* `level=critical` + `volume`（0–10）—— 关键警告。需要 App 的 Critical Alerts 权限；在 Apple 审批通过前自动降级为 `time-sensitive`。
* `url` —— 点击通知时打开。
* `copy` —— 长按通知点 **Copy** 复制该文本（不传则复制整条 body）。`autoCopy=1` 在送达时自动复制。
* `badge` —— 设置应用角标；发 `badge=0` 清除（iOS 会保留上次角标，直到你显式重置）。
* 加密推送 —— 在 **工具 → 远程推送 → 加密** 里设置 AES key，然后发送 `ciphertext`（base64）和可选的 `iv`。

`markdown` 按普通文本处理；`isArchive` / `ttl` 忽略（无应用内历史）。

### 示例

```bash
curl "https://push.scripting.fun/<key>/构建完成/部署成功?sound=minuet&group=ci"
```

---

## 频率限制

* 每个账号有每日推送上限，由账号下所有 key（主 key 与订阅 key）共享。可通过 `GET /push/limit` 查询当前上限与剩余次数。
* 响应头 `X-Push-Limit-Remaining` 显示剩余次数。
