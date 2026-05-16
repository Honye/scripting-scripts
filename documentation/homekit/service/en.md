`HMService` is a typed cluster of characteristics on an `HMAccessory`. The service type (`'lightbulb'`, `'thermostat'`, `'temperatureSensor'`, ...) tells you what role the cluster plays.

```ts
class HMService {
  readonly uuid: string
  readonly name: string
  readonly serviceType: HMServiceType
  readonly accessoryUUID: string
  readonly isPrimaryService: boolean
  readonly isUserInteractive: boolean
  readonly characteristics: HMCharacteristic[]
  readonly linkedServices: HMService[] | null
  readonly associatedServiceType: HMServiceType | null

  rename(name: string): Promise<void>
  updateAssociatedServiceType(type: HMServiceType | null): Promise<void>
}
```

> Service types form an open string union — `HMServiceType` includes the well-known values plus `(string & {})` so newer HomeKit versions still surface unknown types as raw strings.
