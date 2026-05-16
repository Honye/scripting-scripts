`HMRoom` 表示家中带名字的一组配件。

```ts
class HMRoom {
  readonly uuid: string
  readonly name: string
  readonly accessories: HMAccessory[]

  rename(name: string): Promise<void>
}
```

新增或删除房间通过 `home.addRoom(name)` / `home.removeRoom(room)`；将配件分配到房间用 `home.assignAccessoryToRoom(accessory, room)`。
