`$notification` posts a local notification from a capture rule script — handy for alerting yourself when a rule fires or surfacing a value the script extracted. It is available only inside [capture rule scripts](capture_scripts/en.md).

---

## Method

```ts
$notification.post(title: string, subtitle: string, body: string): void
```

All three fields are strings. Pass an empty string for any field you don't need. If all three are empty, no notification is posted.

---

## Notes

* Notification permission is requested by the app. If notifications are not authorized, the post is silently ignored.
* Delivery is immediate.

---

## Example

```js
// Alert when a rule matches, showing the request path.
$notification.post("Capture", "Rule fired", $request.url)
$done({})
```

```js
// Surface a decoded value.
try {
  const json = JSON.parse($response.body)
  $notification.post("Balance", "", String(json.balance))
} catch (e) {}
$done({})
```
