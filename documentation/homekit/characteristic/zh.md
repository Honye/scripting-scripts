`HMCharacteristic` 是 `HMService` 上一个可读 / 可写 / 可订阅的值。提供当前值、范围与格式（`metadata`）、以及事件订阅 API。

---

## 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `uuid` | `string` | HomeKit 稳定 UUID。 |
| `serviceUUID` | `string` | 父服务 UUID。 |
| `characteristicType` | `HMCharacteristicType` | 语义角色（`'powerState'` / `'currentTemperature'` 等）。 |
| `properties` | `HMCharacteristicProperty[]` | `'readable' \| 'writable' \| 'supportsEvent' \| 'hidden'`。 |
| `metadata` | `HMCharacteristicMetadata \| null` | 格式 / 单位 / 最小最大值 / validValues。 |
| `value` | `HMCharacteristicValue \| null` | 最近缓存值（如需刷新，调用 `readValue()`）。 |

---

## 读写

```ts
const v = await ch.readValue()                   // 触达配件
await ch.writeValue(true)                        // 按 metadata 做 coerce 与范围校验
```

如果传入值违反 `metadata.minimumValue` / `metadata.maximumValue` / `metadata.validValues` / `metadata.maxLength`，`writeValue` 会以 `Error` reject。

---

## 订阅值变更

```ts
await ch.subscribe((err, value) => {
  if (err) return console.error(err)
  console.log("更新：", value)
})

// 之后
await ch.unsubscribe()
```

> HomeKit 通知投递是 best-effort。关键场景请配合定期 `readValue()` 轮询。
