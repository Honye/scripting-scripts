`HMActionSet` 是 HomeKit 场景 —— 一组命名的特征值写入动作，被原子执行。

有两种：

- **用户自定义** 场景：通过 `home.addUserActionSet(name)` 创建，再调用 `addCharacteristicAction(...)` 添加动作。
- **系统内置** 场景（`wakeUp` / `sleep` / `homeArrival` / `homeDeparture`），由 Apple 自动维护。可通过 `home.builtinActionSets()` 读取并执行，但不能修改其内部动作。

---

## 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `uuid` | `string` | |
| `name` | `string` | |
| `type` | `HMActionSetType` | `'userDefined' \| 'wakeUp' \| 'sleep' \| 'homeArrival' \| 'homeDeparture' \| 'triggerOwned'`。 |
| `isExecuting` | `boolean` | |
| `lastExecutionDate` | `Date \| null` | |
| `actions` | `HMCharacteristicWriteAction[]` | 包含的写入动作的只读快照。 |

---

## 构建一个场景

```ts
const movie = await home.addUserActionSet("观影模式")

const lampPower = livingRoomLight.services
  .find(s => s.serviceType === 'lightbulb')!
  .characteristics.find(c => c.characteristicType === 'powerState')!

await movie.addCharacteristicAction(lampPower, false)

await home.executeActionSet(movie)
```

用 `removeCharacteristicAction(characteristic)` 移除单个动作；用 `home.removeActionSet(movie)` 删除整个场景。
