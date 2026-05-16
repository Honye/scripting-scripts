`HeadphoneMotionManager` 命名空间用于从支持空间音频与动态头部追踪的耳机（如 **AirPods Pro**、**AirPods Max**、**AirPods 3**）读取运动数据。

它封装了 Apple 的 `CMHeadphoneMotionManager`，向脚本暴露姿态、旋转速率、用户加速度、重力以及连接/断开事件。

> **需要 Scripting Pro。** 仅支持 iOS 14.0+。*运动与健身* 权限由内部统一处理，脚本无需主动请求授权。

---

## 属性

| 名称 | 类型 | 说明 |
| ---- | ---- | ---- |
| `isAvailable` | `boolean` | 当前是否可用。模拟器或未连接到兼容耳机时返回 `false`。 |
| `isActive` | `boolean` | 是否正在推送运动数据。 |

> 权限由内部统一处理 —— 脚本无需主动查询或请求授权。首次调用 `startDeviceMotionUpdates` 会自动触发系统弹窗；若用户已拒绝，后续调用会带着清晰的错误信息 reject。

---

## 方法

### `startDeviceMotionUpdates(options): Promise<boolean>`

开始接收运动数据。流启动后 resolve `true`。

```ts
startDeviceMotionUpdates(options: {
  onUpdate: (motion: HeadphoneDeviceMotion) => void
  onError?: (error: Error) => void
}): Promise<boolean>
```

| 参数 | 类型 | 是否必填 | 说明 |
| ---- | ---- | ---- | ---- |
| onUpdate | `(motion: HeadphoneDeviceMotion) => void` | 是 | 每条运动样本都会回调。 |
| onError  | `(error: Error) => void` | 否 | 流式推送过程中 CoreMotion 报错时回调。 |

同时只允许一个活动订阅。再次调用 `startDeviceMotionUpdates` 会替换之前的 handler。

### `stopDeviceMotionUpdates(): void`

停止当前的运动数据流。在没有活动流时调用是安全的。

### `addListener(event, listener): void`

订阅耳机连接事件。

```ts
addListener(event: 'connect' | 'disconnect', listener: () => void): void
```

* `connect`：检测到兼容耳机连接时触发。
* `disconnect`：耳机断开时触发。

### `removeListener(event, listener): void`

移除已注册的监听器。需要传入与 `addListener` 调用时相同的函数引用。

---

## 数据类型

```ts
type HeadphoneDeviceMotion = {
  timestamp: number          // 自设备启动以来的秒数，单调递增
  attitude: {
    pitch: number            // 弧度
    roll: number             // 弧度
    yaw: number              // 弧度
    quaternion: { x: number; y: number; z: number; w: number }
  }
  rotationRate: { x: number; y: number; z: number }       // 弧度/秒
  userAcceleration: { x: number; y: number; z: number }   // G
  gravity: { x: number; y: number; z: number }            // G
  sensorLocation: 'default' | 'leftHeadphone' | 'rightHeadphone'
  heading?: number                                        // 角度，范围 [0, 360)
  magneticField?: {
    field: { x: number; y: number; z: number }
    accuracy: 'uncalibrated' | 'low' | 'medium' | 'high'
  }
}
```

---

## 示例

```ts
if (!HeadphoneMotionManager.isAvailable) {
  console.log("当前设备不支持耳机运动数据。")
} else {
  HeadphoneMotionManager.addListener('connect', () => {
    console.log("耳机已连接。")
  })
  HeadphoneMotionManager.addListener('disconnect', () => {
    console.log("耳机已断开。")
  })

  await HeadphoneMotionManager.startDeviceMotionUpdates({
    onUpdate: motion => {
      const yawDeg = motion.attitude.yaw * (180 / Math.PI)
      console.log(`yaw: ${yawDeg.toFixed(1)}°`)
    },
    onError: err => {
      console.error("运动数据错误:", err.message)
    }
  })

  // 结束时调用：
  // HeadphoneMotionManager.stopDeviceMotionUpdates()
}
```

---

## 备注

* `Info.plist` 需声明 `NSMotionUsageDescription`，Scripting 已默认包含。
* 首次调用 `startDeviceMotionUpdates` 时由系统自动弹窗请求 *运动与健身* 权限。若用户拒绝（首次或后续在系统设置中关闭），`startDeviceMotionUpdates` 会带着清晰的错误信息 reject，方便脚本给出友好提示。
