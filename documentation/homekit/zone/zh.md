`HMZone` 表示用户对房间的分组（例如 "楼上"、"户外"）。一个房间可同时属于多个区域。

```ts
class HMZone {
  readonly uuid: string
  readonly name: string
  readonly rooms: HMRoom[]

  rename(name: string): Promise<void>
  addRoom(room: HMRoom): Promise<void>
  removeRoom(room: HMRoom): Promise<void>
}
```

新增 / 删除区域通过 `home.addZone(name)` / `home.removeZone(zone)`。
