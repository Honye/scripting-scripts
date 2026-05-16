`HMService` 表示 `HMAccessory` 上一组分类的特征值。`serviceType`（`'lightbulb'` / `'thermostat'` / `'temperatureSensor'` 等）告知此组特征值的语义角色。

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

> `HMServiceType` 是开放联合类型，除已列出的常用值外允许任意字符串透传 `(string & {})`，新版本 iOS 引入的未知 service 仍能以原始字符串呈现。
