`HMHomeManager` 是 HomeKit 的顶层入口，暴露当前用户的所有家以及家变更事件。

> **首次调用任意 `HMHomeManager.*` 接口时会自动触发系统授权弹窗**，无需手动请求权限。后续可在 **设置 → 权限 → HomeKit** 或 **设置 → 隐私与安全性 → HomeKit** 中切换。

---

## 读取家

```ts
const homes = await HMHomeManager.homes        // HMHome[]
```

getter 内部会等待 HomeKit 完成首次同步（Apple 不会在构造后立刻给出 `homes`，必须等 delegate 回调）。

如果用户尚未对系统 HomeKit 权限作出选择，首次访问会自动弹出标准 iOS 授权框，并在用户做出选择后 resolve。若用户拒绝授权，调用会以 *"HomeKit access is not authorized"* 错误 reject。

> Apple 在 iOS 16.1 已移除"主家"概念，本 API 不再暴露 `primaryHome` / `updatePrimaryHome`。如需默认家，请用 `(await HMHomeManager.homes)[0]`。

---

## 修改家

```ts
await HMHomeManager.addHome("海边的家")
await HMHomeManager.removeHome(home)
```

---

## 事件

```ts
HMHomeManager.onHomesChanged = homes => console.log("家数量：", homes.length)
```

将回调置为 `null` 即可停止接收。
