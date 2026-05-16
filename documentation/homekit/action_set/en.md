`HMActionSet` is a HomeKit scene — a named bundle of characteristic write actions executed atomically.

There are two kinds:

- **User-defined** scenes you create via `home.addUserActionSet(name)`, then populate with `addCharacteristicAction(...)`.
- **System** scenes (`wakeUp`, `sleep`, `homeArrival`, `homeDeparture`) that Apple maintains automatically. You can read them via `home.builtinActionSets()` and execute them, but not modify their actions.

---

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `uuid` | `string` | |
| `name` | `string` | |
| `type` | `HMActionSetType` | `'userDefined' \| 'wakeUp' \| 'sleep' \| 'homeArrival' \| 'homeDeparture' \| 'triggerOwned'`. |
| `isExecuting` | `boolean` | |
| `lastExecutionDate` | `Date \| null` | |
| `actions` | `HMCharacteristicWriteAction[]` | Read-only snapshot of the included writes. |

---

## Building a scene

```ts
const movie = await home.addUserActionSet("Movie Time")

const lampPower = livingRoomLight.services
  .find(s => s.serviceType === 'lightbulb')!
  .characteristics.find(c => c.characteristicType === 'powerState')!

await movie.addCharacteristicAction(lampPower, false)

await home.executeActionSet(movie)
```

Remove individual actions with `removeCharacteristicAction(characteristic)`, or remove the whole scene with `home.removeActionSet(movie)`.
