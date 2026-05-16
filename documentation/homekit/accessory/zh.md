`HMAccessory` 表示一个 HomeKit 配件 —— 灯、传感器、锁、温控等 —— 以及它包含的服务。

---

## 只读属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `uuid` | `string` | HomeKit 稳定 UUID。 |
| `name` | `string` | 用户起的名字。 |
| `room` | `HMRoom \| null` | 配件所属房间。 |
| `category` | `HMAccessoryCategory` | 高层类别（`'lightbulb'` / `'thermostat'` 等）。 |
| `manufacturer` | `string \| null` | |
| `model` | `string \| null` | |
| `firmwareVersion` | `string \| null` | |
| `isReachable` | `boolean` | HomeKit 当前是否可与此配件通信。 |
| `isBlocked` | `boolean` | |
| `isBridged` | `boolean` | 是否通过 HomeKit 桥接器暴露。 |
| `bridgedAccessoryUUIDs` | `string[] \| null` | 若是桥接器，列出其子配件。 |
| `services` | `HMService[]` | 由分类的特征值组成的服务集合。 |

---

## 操作

```ts
await accessory.rename("客厅台灯")
await accessory.identify()                       // 请求配件自我识别（例如闪烁）
```

---

## 事件

```ts
accessory.onReachabilityChanged    = ok => { /* ... */ }
accessory.onNameChanged            = name => { /* ... */ }
accessory.onServicesChanged        = list => { /* ... */ }
accessory.onFirmwareVersionChanged = v => { /* ... */ }
```

---

## 示例：开灯

```ts
const home = await HMHomeManager.primaryHome
const light = home?.accessories.find(a => a.category === 'lightbulb')
const power = light?.services
  .find(s => s.serviceType === 'lightbulb')
  ?.characteristics.find(c => c.characteristicType === 'powerState')

await power?.writeValue(true)
```
