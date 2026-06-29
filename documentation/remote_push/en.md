Remote Push lets your devices receive push notifications sent from your own servers and automations. After setting it up, you get a single API key that you call over HTTPS to deliver notifications to your registered devices.

---

## Getting Your API Key

Open **Tools → Remote Push** and tap **Set Up Remote Push**. This registers the current device and issues one API key for your account.

* The API key is shared across every device signed in with the same Apple ID.
* One key can have multiple registered devices.
* Keep the key private — anyone who has it can send notifications to your devices.

On the same page you can rename devices, toggle delivery per device, send a test push, and review recent logs.

---

## Base URL & Authentication

```
https://push.scripting.fun
```

All endpoints require your API key as a Bearer token:

```
Authorization: Bearer <your_api_key>
```

---

## Send a Push

### `POST /push`

Send a notification to specific devices, or to all of your devices.

```ts
POST /push
Authorization: Bearer <your_api_key>
Content-Type: application/json

{
  "title": "Build finished",
  "body": "Your deploy completed successfully.",
  "deviceIds": ["a8336eb5-708b-4e4c-93a0-d8a3feb99e89"],
  "action": "scripting://run/MyScript?action=Deploy",
  "image": "https://example.com/preview.jpg",
  "icon": "hammer.fill",
  "iconColor": "systemOrange",
  "actionButtons": [
    { "label": "Open Logs", "action": "scripting://run/MyScript?action=Logs" },
    { "label": "Re-run", "action": "scripting://run/MyScript?action=Rerun" }
  ],
  "badge": 1,
  "sound": "default"
}
```

### Parameters

| Name          | Type       | Required | Description |
| ------------- | ---------- | -------- | ----------- |
| title         | string     | Yes      | Notification title. |
| body          | string     | Yes      | Notification body text. |
| deviceIds     | string[]   | No       | Target device IDs (UUIDs). Omit to send to all of your active devices. Devices with delivery turned off are always skipped. |
| action        | string     | No       | A URL scheme opened when the notification is tapped (for example a `scripting://` deep link). |
| image         | string     | No       | A remote image URL. The image is downloaded on the device and shown in the expanded (long‑press) notification. |
| icon          | string     | No       | An SF Symbol name (e.g. `hammer.fill`) or a remote image URL, shown as the sender avatar. |
| iconColor     | string     | No       | Tint color for an SF Symbol `icon`: a named color (`systemRed`, `label`, ...), `#RGB`/`#RRGGBB`, `rgb()/rgba()`, or `hsl()/hsla()`. Defaults to `systemBlue`. Ignored when `icon` is a URL. |
| actionButtons | object[]   | No       | Custom buttons shown when the notification is long‑pressed. Each item is `{ "label": string, "action": string }`, where `action` is a URL scheme opened on tap. |
| badge         | number     | No       | App icon badge number. |
| sound         | string     | No       | Notification sound name. Defaults to `default`. |
| category      | string     | No       | Notification category identifier. |
| threadId      | string     | No       | Thread identifier used to group notifications. |
| interruptionLevel | string | No   | How the notification interrupts: `passive`, `active` (default), `time-sensitive`, or `critical`. |
| criticalVolume | number    | No       | Sound volume `0.0`–`1.0` for `critical` alerts (default `1.0`). Ignored unless `interruptionLevel` is `critical`. |

> `image`, `icon`, and `actionButtons` produce a rich notification: long‑press (or pull down) the delivered notification to see the image, avatar, and action buttons. The server enables the required `mutable-content` flag automatically.

> `time-sensitive` notifications break through Focus modes and the scheduled notification summary. `critical` alerts additionally bypass the mute switch and Do Not Disturb and always play a sound — but they require Apple's Critical Alerts entitlement on the app. Until that entitlement is approved, a `critical` push automatically falls back to `time-sensitive`.

### Response

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

`remaining` and `daily_limit` in the body reflect your quota after this push. The `X-Push-Limit-Remaining` response header carries the same remaining count (measured before the push) and is also present on rate-limit errors.

---

## List Devices

### `GET /devices`

List your registered devices. Use each device `id` for the `deviceIds` array when sending a push.

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

A device with `push_enabled: false` stays in the list but is skipped when sending pushes.

---

## Subscription Keys

Sometimes you want a third party — a subscription source, a feed, an automation you don't fully control — to push to your devices, without handing over your master API key (which can also manage devices, read your subscription, and mint more keys).

In **Tools → Remote Push → Subscription Keys** you can mint **send-only** keys derived from your master key:

* A subscription key can only `POST /push` to **your** devices. Every management endpoint (devices, key info, other subscription keys, logs, stats) is rejected with `MASTER_KEY_REQUIRED`.
* It uses the exact same request as the master key — just put the subscription key in the `Authorization: Bearer` header.
* Its pushes count against your account's shared daily limit.
* You can disable (reversible) or delete (permanent) a subscription key from the app at any time. A disabled or deleted key immediately stops working.

This lets a single source serve many users: each user mints one subscription key and hands it over; the source pushes to each user through that user's key, and any user can cut it off independently.

---

## Daily Limit & Statistics

### `GET /push/limit`

Returns the daily push limit and how many remain.

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

Returns overall and daily push statistics, including totals and success rate.

---

## Push Logs

### `GET /push/logs`

Returns recent push history. Accepts an optional `limit` query parameter (1–100, default 50).

```
GET /push/logs?limit=20
```

---

## Example

```bash
curl -X POST https://push.scripting.fun/push \
  -H "Authorization: Bearer <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"World"}'
```

---

## Bark-Compatible API

This server also speaks the [Bark](https://github.com/Finb/Bark) API, so Bark-compatible tools and scripts work by pointing them at `https://push.scripting.fun` and using one of your **subscription keys** as the Bark key.

### Endpoints

* `GET|POST /:key/:body`
* `GET|POST /:key/:title/:body`
* `GET|POST /:key/:title/:subtitle/:body`
* `POST /:key` — all fields in the JSON body
* `POST /push` — with `device_key` (or a `device_keys` array) in the JSON body
* `GET /ping`, `GET /healthz`, `GET /info`, `GET /register/:key`

`key` / `device_key` is a subscription key (Tools → Remote Push → Subscription Keys). It pushes to your registered devices and counts against your account's shared daily limit.

### Supported parameters

`title`, `subtitle`, `body`, `level` (`active` / `timeSensitive` / `passive` / `critical`), `badge`, `sound`, `icon` (URL), `group`, `url`, `copy`, `autoCopy`, `call`, `volume`, `ciphertext` + `iv`, `id`.

* `sound` — a built-in Bark sound name such as `minuet`.
* `call=1` — repeats the sound for ~30 seconds.
* `level=critical` with `volume` (0–10) — a critical alert. Requires the app's Critical Alerts entitlement; until that is approved by Apple it falls back to `time-sensitive`.
* `url` — opened when the notification is tapped.
* `copy` — long-press the notification and tap **Copy** to copy this text (or the whole body if omitted). `autoCopy=1` copies on delivery.
* `badge` — sets the app icon badge; send `badge=0` to clear it (iOS keeps the last badge until you explicitly reset it).
* Encrypted push — set the AES key in **Tools → Remote Push → Encryption**, then send `ciphertext` (base64) and an optional `iv`.

`markdown` is treated as plain text; `isArchive` / `ttl` are ignored (there is no in-app message history).

### Example

```bash
curl "https://push.scripting.fun/<key>/Build%20finished/Deploy%20succeeded?sound=minuet&group=ci"
```

---

## Rate Limiting

* Each account has a daily push limit, shared across the account's keys (master and subscription keys). Check the current limit and remaining count with `GET /push/limit`.
* The `X-Push-Limit-Remaining` response header shows the remaining count.
