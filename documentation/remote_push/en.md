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
| iconColor     | string     | No       | Tint color for an SF Symbol `icon`: a named color (`systemRed`, `label`, …), `#RGB`/`#RRGGBB`, `rgb()/rgba()`, or `hsl()/hsla()`. Defaults to `systemBlue`. Ignored when `icon` is a URL. |
| actionButtons | object[]   | No       | Custom buttons shown when the notification is long‑pressed. Each item is `{ "label": string, "action": string }`, where `action` is a URL scheme opened on tap. |
| badge         | number     | No       | App icon badge number. |
| sound         | string     | No       | Notification sound name. Defaults to `default`. |
| category      | string     | No       | Notification category identifier. |
| threadId      | string     | No       | Thread identifier used to group notifications. |

> `image`, `icon`, and `actionButtons` produce a rich notification: long‑press (or pull down) the delivered notification to see the image, avatar, and action buttons. The server enables the required `mutable-content` flag automatically.

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
    "daily_limit": 100,
    "remaining": 85
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

## Daily Limit & Statistics

### `GET /push/limit`

Returns the daily push limit and how many remain.

```json
{
  "data": {
    "date": "2026-05-25",
    "push_count": 15,
    "limit": 100,
    "remaining": 85
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

## Rate Limiting

* Up to 100 pushes per day per API key.
* The `X-Push-Limit-Remaining` response header shows the remaining count.
