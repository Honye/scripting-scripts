`HMRoom` is a named grouping of accessories within an `HMHome`.

```ts
class HMRoom {
  readonly uuid: string
  readonly name: string
  readonly accessories: HMAccessory[]

  rename(name: string): Promise<void>
}
```

To create / delete a room, use `home.addRoom(name)` / `home.removeRoom(room)`. To move an accessory between rooms, use `home.assignAccessoryToRoom(accessory, room)`.
