`$persistentStore` 为抓包规则脚本提供一个小型键值存储,跨运行持久化,并在脚本之间共享。可用它在多次请求之间记住一个 token、一个计数器,或任意小段字符串。它仅在[抓包规则脚本](capture_scripts/zh.md)中可用。

---

## 方法

```ts
$persistentStore.read(key?: string): string | null
$persistentStore.write(value: string, key?: string): boolean
$persistentStore.remove(key?: string): boolean
```

* `read` 返回存储的字符串,键不存在时返回 `null`。
* `write` 存入一个字符串并返回 `true`。
* `remove` 删除该键并返回 `true`。

省略 `key` 时使用一个默认键。

---

## 说明

* 值为字符串。要存结构化数据,请用 `JSON.stringify` 序列化、`JSON.parse` 解析。
* 该存储在所有抓包规则脚本间共享,持久保留直到被删除。

---

## 示例

```js
// 记住上一次看到的请求 URL。
const previous = $persistentStore.read("last")
$persistentStore.write($request.url, "last")
console.log("previous:", previous)
$done({})
```

```js
// 存取一个 JSON 对象。
$persistentStore.write(JSON.stringify({ count: 3 }), "state")
const state = JSON.parse($persistentStore.read("state") || "{}")
```
