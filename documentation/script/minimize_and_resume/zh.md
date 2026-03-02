本节说明 `Script` 模块中与脚本最小化及恢复相关的 API，用于在 iPhone 端支持“UI 可收起但脚本实例不终止”的运行模式，以及在脚本实例存活期间对恢复与再次触发行为进行监听。

这些能力适用于：

* 带有 UI 的长生命周期脚本，需要在用户收起界面后保持状态
* 不提供 UI 但希望常驻运行的脚本，例如仅发送通知或等待外部触发

---

## 运行机制概述

### 脚本实例生命周期

* 调用 `Script.minimize()` 不会终止脚本实例
* 只有调用 `Script.exit()` 才会真正结束脚本实例并释放资源
* `Script.onResume()` 仅在脚本实例仍然存活时触发
* 若脚本实例已调用 `Script.exit()`，后续触发将创建新的脚本实例并重新执行入口文件

### 与 URL Scheme 的关系

* 使用 `scripting://run/...` 触发同一脚本时：

  * 若已有实例存活，则触发 `Script.onResume()`
  * 不会重新执行入口文件
* 使用 `scripting://run_single/...` 触发时：

  * 会关闭之前的所有脚本实例
  * 不会触发既有实例的 `onResume`
  * 会创建新实例并重新运行入口文件

---

## API 说明

### `Script.supportsMinimization(): boolean`

判断当前运行环境是否支持脚本最小化能力。

并非所有运行环境都支持最小化，例如特定扩展环境可能不允许。

```ts
if (Script.supportsMinimization()) {
  // 可以启用最小化逻辑
}
```

---

### `Script.isMinimized(): boolean`

判断当前脚本是否处于最小化状态。

```ts
if (Script.isMinimized()) {
  console.log("当前处于最小化状态")
}
```

---

### `Script.minimize(): Promise<boolean>`

将当前脚本最小化。最小化后：

* UI 会被收起
* 脚本实例继续存活
* 不会触发 `Script.exit()`

行为规则：

* 若脚本已处于最小化状态，不会重复执行
* 若启用了多窗口模式，该方法会被忽略
* 返回值：

  * `true` 表示最小化成功
  * `false` 表示未执行最小化（例如环境不支持或被忽略）

```ts
async function handleMinimize() {
  if (!Script.supportsMinimization()) return

  const success = await Script.minimize()
  if (!success) {
    console.log("最小化未执行")
  }
}
```

---

### `Script.onMinimize(callback: () => void): () => void`

监听脚本进入最小化状态。

触发时机：

* 成功调用 `Script.minimize()` 后
* 脚本由前台进入最小化状态时

返回值为一个函数，用于移除该监听。

```ts
const remove = Script.onMinimize(() => {
  console.log("脚本已最小化")
})

// 取消监听
remove()
```

---

### `Script.onResume(callback: (eventDetails: ResumeEventDetails) => void): () => void`

监听脚本恢复或再次被触发事件。

恢复事件的前提是：

* 脚本实例仍然存活
* 未调用 `Script.exit()`

返回值为一个函数，用于移除监听。

```ts
const remove = Script.onResume(details => {
  console.log("恢复事件:", details)
})
```

---

## ResumeEventDetails 结构说明

```ts
type ResumeEventDetails = {
  resumeFromMinimized: boolean
  widgetParameter: string | null
  controlWidgetParameter: string | null
  queryParameters: Record<string, string> | null
  notificationInfo: NotificationInfo | null
}
```

字段说明：

### `resumeFromMinimized: boolean`

* `true`：脚本是从最小化状态恢复
* `false`：并非从最小化恢复，可能是其他触发方式

---

### `widgetParameter: string | null`

通过点击桌面小组件触发脚本恢复时传入的参数。

---

### `controlWidgetParameter: string | null`

通过点击控制中心小组件触发脚本恢复时传入的参数。

---

### `queryParameters: Record<string, string> | null`

通过 `scripting://run/...` URL Scheme 触发恢复时传入的参数。

---

### `notificationInfo: NotificationInfo | null`

通过点击通知触发恢复时传入的通知信息。

---

## 场景说明

### 带 UI 的脚本

#### 最小化流程

* 脚本在前台运行
* 调用 `Script.minimize()`
* 成功后：

  * 触发 `Script.onMinimize`
  * UI 被收起
  * 脚本实例继续存活

#### 从最小化恢复

* 用户在 App 内点击运行中的脚本入口
* 触发 `Script.onResume`
* `eventDetails.resumeFromMinimized === true`

---

### 脚本处于前台时的外部触发

当脚本仍在前台且实例存活：

* 点击通知
* 通过 widget 触发 run URL Scheme
* 通过 `Script.run()` 调用同一脚本

以上情况都会触发 `Script.onResume`，并携带对应的参数字段。

---

### 不提供 UI 的脚本（后台常驻）

若脚本未调用 `Script.exit()`：

* 即使未呈现 UI
* 通过点击通知或其他方式再次触发脚本
* 将触发已注册的 `Script.onResume`

若脚本调用了 `Script.exit()`：

* 点击通知或再次触发
* 会创建新的脚本实例
* 重新执行入口文件
* 不会触发旧实例的 `onResume`

---

## 使用建议

* 使用 `Script.supportsMinimization()` 判断环境后再提供最小化能力
* 需要维持脚本状态时不要调用 `Script.exit()`
* 使用 `Script.onResume()` 统一处理恢复、自 widget、通知或 URL 触发的逻辑
* 若希望避免并发实例，应使用 `run_single` 或 `singleMode: true`

以上机制可用于构建具备长生命周期、可收起 UI、支持多种触发来源的脚本运行模型。
