`HMCharacteristic` is a single readable / writable / observable value on an `HMService`. It exposes its current value, allowed range/format via `metadata`, and an event-subscription API.

---

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `uuid` | `string` | Stable HomeKit UUID. |
| `serviceUUID` | `string` | UUID of the parent service. |
| `characteristicType` | `HMCharacteristicType` | Semantic role (`'powerState'`, `'currentTemperature'`, ...). |
| `properties` | `HMCharacteristicProperty[]` | `'readable' \| 'writable' \| 'supportsEvent' \| 'hidden'`. |
| `metadata` | `HMCharacteristicMetadata \| null` | Format / units / min / max / validValues. |
| `value` | `HMCharacteristicValue \| null` | Last cached value (use `readValue()` to refresh). |

---

## Read & write

```ts
const v = await ch.readValue()                   // hits the accessory
await ch.writeValue(true)                        // coerced & range-checked vs metadata
```

`writeValue` rejects with an `Error` when the value violates `metadata.minimumValue` / `metadata.maximumValue` / `metadata.validValues` / `metadata.maxLength`.

---

## Subscribe to value changes

```ts
await ch.subscribe((err, value) => {
  if (err) return console.error(err)
  console.log("update:", value)
})

// later
await ch.unsubscribe()
```

> HomeKit notification delivery is best-effort. For mission-critical observation, also poll `readValue()` periodically.
