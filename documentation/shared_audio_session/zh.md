通过 `SharedAudioSession`，你可以在脚本中方便地管理和操作共享音频会话（audio session）。音频会话充当脚本、Scripting 应用、操作系统和底层音频硬件之间的中介，允许你有效地配置和控制音频的行为。

---

## 功能简介

- 获取和设置音频会话的类别（category）、模式（mode）和选项（options）。
- 配置音频输入和输出的首选采样率（sample rate）。
- 处理音频中断事件。
- 查询设备所支持的类别和模式。
- 根据具体的应用场景（如视频录制、语音聊天、后台播放等）来定制音频行为。

---

## 方法和属性

### 1. **会话类别与选项**

#### `category`
获取当前音频会话的类别（Category）。

```typescript
const category = await SharedAudioSession.category
console.log(category) // 示例输出：'playback'
```

#### `categoryOptions`
获取当前音频会话类别的选项（Options）。

```typescript
const options = await SharedAudioSession.categoryOptions
console.log(options) // 示例输出：['mixWithOthers', 'allowAirPlay']
```

#### `setCategory(category: AudioSessionCategory, options: AudioSessionCategoryOptions[])`
设置音频会话的类别并指定其选项。

```typescript
await SharedAudioSession.setCategory('playback', ['mixWithOthers'])
```

---

### 2. **会话模式**

#### `mode`
获取当前音频会话模式（Mode）。

```typescript
const mode = await SharedAudioSession.mode
console.log(mode) // 示例输出：'videoChat'
```

#### `setMode(mode: AudioSessionMode)`
设置音频会话模式。

```typescript
await SharedAudioSession.setMode('voiceChat')
```

---

### 3. **采样率 (Sample Rate)**

#### `preferredSampleRate`
获取当前首选采样率（单位为 Hz）。

```typescript
const sampleRate = await SharedAudioSession.preferredSampleRate
console.log(sampleRate) // 示例输出：44100
```

#### `setPreferredSampleRate(sampleRate: number)`
设置音频输入和输出的首选采样率。

```typescript
await SharedAudioSession.setPreferredSampleRate(48000)
```

---

### 4. **音频中断处理**

#### `addInterruptionListener(listener: AudioSessionInterruptionListener)`
监听音频中断事件。

```typescript
SharedAudioSession.addInterruptionListener((type) => {
  if (type === 'began') {
    console.log('音频中断开始')
  } else if (type === 'ended') {
    console.log('音频中断结束')
  }
})
```

#### `removeInterruptionListener(listener: AudioSessionInterruptionListener)`
移除音频中断监听器。

```typescript
SharedAudioSession.removeInterruptionListener(myListener)
```

---

### 5. **设备功能查询**

#### `availableCategories`
获取设备上可用的音频会话类别列表。

```typescript
const categories = await SharedAudioSession.availableCategories
console.log(categories) // 示例输出：['playback', 'record', 'soloAmbient']
```

#### `availableModes`
获取设备上可用的音频会话模式列表。

```typescript
const modes = await SharedAudioSession.availableModes
console.log(modes) // 示例输出：['default', 'videoChat', 'voiceChat']
```

---

### 6. **其他属性**

#### `isOtherAudioPlaying`
检查设备上是否有其他音频正在播放。

```typescript
const isPlaying = await SharedAudioSession.isOtherAudioPlaying
console.log(isPlaying) // 示例输出：true
```

#### `secondaryAudioShouldBeSilencedHint`
检查次要音频是否应该被静音。

```typescript
const shouldSilence = await SharedAudioSession.secondaryAudioShouldBeSilencedHint
console.log(shouldSilence) // 示例输出：false
```

#### `allowHapticsAndSystemSoundsDuringRecording`
检查录音期间是否允许触觉反馈和系统声音。

```typescript
const allowHaptics = await SharedAudioSession.allowHapticsAndSystemSoundsDuringRecording
console.log(allowHaptics) // 示例输出：true
```

#### `prefersNoInterruptionsFromSystemAlerts`
检查音频会话是否偏好不被系统警报打断。

```typescript
const prefersNoInterruptions = await SharedAudioSession.prefersNoInterruptionsFromSystemAlerts
console.log(prefersNoInterruptions) // 示例输出：false
```

---

### 7. **会话激活**

#### `setActive(active: boolean, options?: AudioSessionSetActiveOptions[])`
激活或停用共享音频会话，可指定激活选项。

```typescript
await SharedAudioSession.setActive(
  true,
  ['notifyOthersOnDeactivation']
)
```

---

### 8. **系统设置**

#### `setAllowHapticsAndSystemSoundsDuringRecording(value: boolean)`
启用或禁用在录音期间允许触觉反馈和系统声音。

```typescript
await SharedAudioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)
```

#### `setPrefersNoInterruptionsFromSystemAlerts(value: boolean)`
设置是否偏好不被系统警报打断。

```typescript
await SharedAudioSession.setPrefersNoInterruptionsFromSystemAlerts(true)
```

---

### 9. **音频路由（Audio Routing）**

iOS 把音频输入和输出当作两条独立的路径管理。以下 API 让你列出当前可选的输入端口、强制把
录音输入切到指定端口（通常是 `builtInMic`），或者把输出强制到设备扬声器。这在你希望「设备
内置麦克风录音 + 无线耳机播放」时尤其有用——可以避开蓝牙 HFP 双向链路带来的麦克风音质降级。

> `setPreferredInput` 与 `overrideOutputAudioPort` 必须在会话激活后才能生效，请先调用
> `setActive(true)`。

#### `availableInputs`

返回当前会话允许的输入端口列表。蓝牙、USB、有线耳机麦克风需要在 category options 中允许
对应的传输（例如 `allowBluetoothHFP`）才会出现。

```typescript
const inputs = await SharedAudioSession.availableInputs
for (const port of inputs) {
  console.log(port.portType, port.portName, port.uid)
}
```

#### `currentRoute`

返回当前选中的输入和输出端口。

```typescript
const route = await SharedAudioSession.currentRoute
console.log('input:', route.inputs[0]?.portType)
console.log('output:', route.outputs[0]?.portType)
```

#### `setPreferredInput(input: AudioSessionPort | null)`

指定首选输入端口；传 `null` 清除偏好。参数会先按 `uid` 与 `availableInputs` 精确匹配，再退化
到 `portType` 匹配。会话未激活时会以 `Cannot setPreferredInput before setActive(true).` 报错。

```typescript
await SharedAudioSession.setActive(true)
const inputs = await SharedAudioSession.availableInputs
const builtIn = inputs.find(p => p.portType === 'builtInMic')
if (builtIn) {
  await SharedAudioSession.setPreferredInput(builtIn)
}
```

#### `overrideOutputAudioPort(port: 'speaker' | 'none')`

把输出强制到设备扬声器，或者取消强制。与输入选择互不干扰。

```typescript
await SharedAudioSession.overrideOutputAudioPort('speaker')
// 之后
await SharedAudioSession.overrideOutputAudioPort('none')
```

#### `setPrefersBuiltInMicWhenAvailable(enabled: boolean)`

打开一个进程内开关：开启后，SDK 会监听音频路由变化，每当 `builtInMic` 可用时自动把输入切回
内置麦克风——即使期间插入了蓝牙耳机、USB 麦克风或有线耳机麦克风。输出路由不被改动，因此
你可以保持「内置麦录入、无线耳机（A2DP）播放」的分离 I/O。

开关**不会持久化**到下次启动，但在宿主进程存活期间会影响所有运行中的脚本。如果某个脚本
之后又主动调用 `setPreferredInput`（reason 为 `override`），开关不会再把它改回 `builtInMic`。

启用开关时会**立即尝试应用一次**，不需要等待下一次路由变化。

```typescript
await SharedAudioSession.setActive(true)
await SharedAudioSession.setPrefersBuiltInMicWhenAvailable(true)

// 查询当前状态
const enabled = await SharedAudioSession.prefersBuiltInMicWhenAvailable
```

#### 路由变化事件

```typescript
SharedAudioSession.addRouteChangeListener((reason, current) => {
  console.log('route changed:', reason)
  console.log('inputs now:', current.inputs.map(p => p.portType))
})
```

`reason` 取值之一：`'newDeviceAvailable' | 'oldDeviceUnavailable' | 'categoryChange' | 'override' | 'wakeFromSleep' | 'noSuitableRouteForCategory' | 'routeConfigurationChange' | 'unknown'`。

---

### 10. **系统输出音量**

#### `outputVolume: number`

获取当前系统输出音量（范围为 0 到 1）。

#### outputVolume 监听事件

类型类型

```ts
type AudioSessionOutputVolumeListener = (newValue: number, oldValue: number) => void
```

##### `addOutputVolumeListener(listener: AudioSessionOutputVolumeListener): void`

添加系统输出音量监听器。

##### `removeOutputVolumeListener(listener: AudioSessionOutputVolumeListener): void`

移除系统输出音量监听器。

---

## 枚举（Enumerations）

### **AudioSessionSetActiveOptions**
定义激活选项：
- `'notifyOthersOnDeactivation'`

### **AudioSessionCategory**
定义音频会话的类别：
- `'ambient'`
- `'multiRoute'`
- `'playAndRecord'`
- `'playback'`
- `'record'`
- `'soloAmbient'`

### **AudioSessionCategoryOptions**
定义类别的可选行为：
- `'mixWithOthers'`
- `'duckOthers'`
- `'interruptSpokenAudioAndMixWithOthers'`
- `'allowBluetooth'`
- `'allowBluetoothA2DP'`
- `'allowAirPlay'`
- `'defaultToSpeaker'`
- `'overrideMutedMicrophoneInterruption'`

### **AudioSessionMode**
指定会话模式：
- `'default'`
- `'gameChat'`
- `'measurement'`
- `'moviePlayback'`
- `'spokenAudio'`
- `'videoChat'`
- `'videoRecording'`
- `'voiceChat'`
- `'voicePrompt'`

### **AudioSessionInterruptionType**
指定中断类型：
- `'began'`
- `'ended'`
- `'unknown'`

---

通过此接口，你可以在 Scripting 应用中对音频会话进行深度管理，非常适合构建对音频依赖较高的脚本，如音乐播放器和视频会议工具等。