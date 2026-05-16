`HMHomeManager` is the top-level entry into HomeKit. It exposes the user's homes and home-update events.

> ⚠️ HomeKit access requires the Scripting PRO upgrade and the system HomeKit permission. The system permission prompt is triggered automatically the first time you call any `HMHomeManager.*` API — you do not need to request it manually. Toggle the permission later from **Settings → Permissions → HomeKit** or **Settings → Privacy & Security → HomeKit**.

---

## Reading homes

```ts
const homes = await HMHomeManager.homes        // HMHome[]
```

The getter waits internally until HomeKit has finished its initial sync (Apple does not deliver `homes` synchronously after construction).

If the user has not yet decided on the system HomeKit permission, the first access shows the standard iOS permission prompt and the promise resolves once the user makes a choice. If the user denies access, the promise rejects with an *"HomeKit access is not authorized"* error.

> Apple removed the explicit "primary home" concept in iOS 16.1, so this API does not expose `primaryHome` / `updatePrimaryHome`. Use `(await HMHomeManager.homes)[0]` if you want a default home.

---

## Mutating homes

```ts
await HMHomeManager.addHome("Beach House")
await HMHomeManager.removeHome(home)
```

---

## Events

```ts
HMHomeManager.onHomesChanged = homes => console.log("homes count:", homes.length)
```

Setting the callback to `null` stops further deliveries.
