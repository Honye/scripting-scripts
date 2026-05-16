`HMHome` 表示一个 HomeKit 家，承载完整的房间、配件、场景、区域、用户图。

---

## 只读结构

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `uuid` | `string` | HomeKit 稳定 UUID。 |
| `name` | `string` | 显示名。 |
| `isPrimary` | `boolean` | 是否为用户主家（Apple 在 iOS 16.1 已弃用此概念）。 |
| `rooms` | `HMRoom[]` | 所有房间（包含默认 "整个家" 房间）。 |
| `accessories` | `HMAccessory[]` | 此家中已配对的所有配件。 |
| `actionSets` | `HMActionSet[]` | 所有场景（用户自定义 + 系统内置：起床 / 睡眠 / 到家 / 离家）。 |
| `zones` | `HMZone[]` | 区域（用户对房间的分组）。 |
| `serviceGroups` | `HMServiceGroup[]` | 服务组（v1 仅只读）。 |
| `currentUser` | `HMUser` | 当前已登录用户。 |

---

## 操作

```ts
await home.rename("小屋")

const room = await home.addRoom("车库")
await home.removeRoom(room)

await home.addAndSetupAccessories()              // 弹出系统添加配件 UI
await home.removeAccessory(accessory)
await home.assignAccessoryToRoom(accessory, room)

const zone = await home.addZone("楼上")
await home.removeZone(zone)

await home.executeActionSet(scene)
const scene = await home.addUserActionSet("观影模式")
await home.removeActionSet(scene)
```

`builtinActionSets()` 返回四个系统场景：

```ts
const { wakeUp, sleep, homeArrival, homeDeparture } = home.builtinActionSets()
if (homeArrival) await home.executeActionSet(homeArrival)
```

---

## 事件

```ts
home.onAccessoriesChanged = list => { /* ... */ }
home.onRoomsChanged       = list => { /* ... */ }
home.onActionSetsChanged  = list => { /* ... */ }
home.onNameChanged        = name => { /* ... */ }
```
