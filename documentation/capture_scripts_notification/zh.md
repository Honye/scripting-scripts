`$notification` 让抓包规则脚本发一条本地通知——便于在规则命中时提醒自己,或把脚本提取到的值展示出来。它仅在[抓包规则脚本](capture_scripts/zh.md)中可用。

---

## 方法

```ts
$notification.post(title: string, subtitle: string, body: string): void
```

三个字段都是字符串。不需要的字段传空字符串即可。若三者全空,则不发通知。

---

## 说明

* 通知权限由 app 申请。若未授权通知,该调用会被静默忽略。
* 立即投递。

---

## 示例

```js
// 规则命中时提醒, 并显示请求路径。
$notification.post("Capture", "Rule fired", $request.url)
$done({})
```

```js
// 展示一个解析出的值。
try {
  const json = JSON.parse($response.body)
  $notification.post("Balance", "", String(json.balance))
} catch (e) {}
$done({})
```
