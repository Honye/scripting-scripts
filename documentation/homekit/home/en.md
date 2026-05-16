`HMHome` represents a single HomeKit home and its full graph of rooms, accessories, scenes, zones, and users.

---

## Read-only graph

| Property | Type | Description |
| --- | --- | --- |
| `uuid` | `string` | Stable HomeKit UUID. |
| `name` | `string` | Display name. |
| `isPrimary` | `boolean` | Whether this is the user's primary home (deprecated by Apple in iOS 16.1). |
| `rooms` | `HMRoom[]` | All rooms (including the default "entire-home" room). |
| `accessories` | `HMAccessory[]` | All accessories paired in this home. |
| `actionSets` | `HMActionSet[]` | All scenes (user-defined + system: wakeUp / sleep / arrival / departure). |
| `zones` | `HMZone[]` | Zones (user groupings of rooms). |
| `serviceGroups` | `HMServiceGroup[]` | Service groups (read-only in v1). |
| `currentUser` | `HMUser` | The current logged-in user. |

---

## Mutations

```ts
await home.rename("Cabin")

const room = await home.addRoom("Garage")
await home.removeRoom(room)

await home.addAndSetupAccessories()              // shows the system add-accessory UI
await home.removeAccessory(accessory)
await home.assignAccessoryToRoom(accessory, room)

const zone = await home.addZone("Upstairs")
await home.removeZone(zone)

await home.executeActionSet(scene)
const scene = await home.addUserActionSet("Movie Time")
await home.removeActionSet(scene)
```

`builtinActionSets()` returns the four system scenes:

```ts
const { wakeUp, sleep, homeArrival, homeDeparture } = home.builtinActionSets()
if (homeArrival) await home.executeActionSet(homeArrival)
```

---

## Events

```ts
home.onAccessoriesChanged = list => { /* ... */ }
home.onRoomsChanged       = list => { /* ... */ }
home.onActionSetsChanged  = list => { /* ... */ }
home.onNameChanged        = name => { /* ... */ }
```
