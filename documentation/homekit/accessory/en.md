`HMAccessory` is a single HomeKit accessory — a light, sensor, lock, thermostat, etc. — and its services.

---

## Read-only properties

| Property | Type | Description |
| --- | --- | --- |
| `uuid` | `string` | Stable HomeKit UUID. |
| `name` | `string` | User-assigned name. |
| `room` | `HMRoom \| null` | The room this accessory belongs to. |
| `category` | `HMAccessoryCategory` | High-level category (`'lightbulb'`, `'thermostat'`, ...). |
| `manufacturer` | `string \| null` | |
| `model` | `string \| null` | |
| `firmwareVersion` | `string \| null` | |
| `isReachable` | `boolean` | Whether HomeKit can talk to it right now. |
| `isBlocked` | `boolean` | |
| `isBridged` | `boolean` | True if this accessory is exposed via a HomeKit bridge. |
| `bridgedAccessoryUUIDs` | `string[] \| null` | Children if this is a bridge. |
| `services` | `HMService[]` | Cluster of typed characteristics. |

---

## Operations

```ts
await accessory.rename("Living Room Lamp")
await accessory.identify()                       // ask the accessory to physically identify (e.g. blink)
```

---

## Events

```ts
accessory.onReachabilityChanged    = ok => { /* ... */ }
accessory.onNameChanged            = name => { /* ... */ }
accessory.onServicesChanged        = list => { /* ... */ }
accessory.onFirmwareVersionChanged = v => { /* ... */ }
```

---

## Example: turn a light on

```ts
const home = await HMHomeManager.primaryHome
const light = home?.accessories.find(a => a.category === 'lightbulb')
const power = light?.services
  .find(s => s.serviceType === 'lightbulb')
  ?.characteristics.find(c => c.characteristicType === 'powerState')

await power?.writeValue(true)
```
