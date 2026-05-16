`HMZone` is a user-defined grouping of rooms (e.g. "Upstairs", "Outdoor"). Rooms can belong to multiple zones.

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

Create / delete zones via `home.addZone(name)` / `home.removeZone(zone)`.
