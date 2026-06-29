当脚本需要访问多种 HealthKit 数据时,你不必为每个权限单独发起请求。如果你在相近的时间触发多个需要授权的 `Health` API,应用会在一个短暂的时间窗口内收集这些待处理的授权需求,并弹出**一个**列出全部类型的 HealthKit 授权弹框。

这样体验更干净:用户看到的是一个合并后的弹框,而不是一连串分开的提示。

---

## 工作方式

每个读写类 `Health` API(例如 `queryQuantitySamples`、`queryCategorySamples`、`queryWorkouts`、`dateOfBirth`)在执行前都会为其访问的数据申请授权。当你同时发起多个这样的调用时,这些申请会被合并:

* 相近时间到达的请求会被合并进同一个授权弹框。
* 已经授权过的数据类型会被跳过,因此在没有新类型需要授权时不会弹框。
* 如果在弹框仍在屏幕上时又有新的请求到达,它们会排队,等当前弹框关闭后再依次弹出。

你无需调用任何显式的"请求权限"方法——只要调用所需的 API,授权会被自动发起。

---

## 一次性请求多个权限

用 `Promise.all`(或 `Promise.allSettled`)同时发起这些查询:

```ts
const results = await Promise.allSettled([
  Health.queryQuantitySamples("stepCount", { limit: 1 }),
  Health.queryQuantitySamples("heartRate", { limit: 1 }),
  Health.queryCategorySamples("sleepAnalysis", { limit: 1 }),
  Health.queryWorkouts({ limit: 1 }),
  Health.dateOfBirth(),
])

console.log(results)
```

这些查询访问的是不同的 HealthKit 数据类型,因此 HealthKit 会弹出一个涵盖所有仍需授权类型的弹框。

---

## 逐个请求

如果你在发起下一个请求前先 `await` 上一个,那么每个调用都会在下一个开始之前完成自己的授权,用户可能会因此看到多个分开的弹框:

```ts
await Health.queryQuantitySamples("stepCount", { limit: 1 })
await Health.queryCategorySamples("sleepAnalysis", { limit: 1 })
await Health.queryWorkouts({ limit: 1 })
```

当你事先就知道脚本需要哪些数据类型时,优先采用"同时发起"的方式。

---

## 说明

* `Health` 相关 API 需要 Scripting PRO 订阅。
* 查询前先检查 `Health.isHealthDataAvailable`;在不支持 HealthKit 的设备上它为 `false`。
* 授权弹框只会列出尚未确定状态的数据类型。如果所有类型都已授权,则不会弹框,查询会立即执行。
