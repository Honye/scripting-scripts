`Haptics` 为脚本暴露 Core Haptics，用于创建比 `HapticFeedback` 快捷方法更精细的自定义触觉 pattern。

简单的一次性效果可以用 `Haptics.transient()` 或 `Haptics.continuous()`。如果需要精确时间线、包络、动态参数、AHAP 数据或可复用 player，则使用 `HapticEngine`、`HapticPattern`、`HapticEvent` 和参数对象。

```ts
await Haptics.transient(1.0, 0.7)
await Haptics.continuous(0.4, 0.6, 0.35)
```

## 播放 Pattern

```ts
const engine = new HapticEngine()

const pattern = new HapticPattern([
  new HapticEvent("hapticTransient", [
    new HapticEventParameter("hapticIntensity", 1.0),
    new HapticEventParameter("hapticSharpness", 0.8),
  ], 0),
  new HapticEvent("hapticContinuous", [
    new HapticEventParameter("hapticIntensity", 0.45),
    new HapticEventParameter("hapticSharpness", 0.25),
  ], 0.08, 0.35),
])

engine.start()
const player = engine.makePlayer(pattern)
player.start()
```

## Engine

#### `new HapticEngine(audioSession?)`

创建 Core Haptics engine。不传参数时使用默认 engine；传 `null` 时让 Core Haptics 自行创建 audio session；传 `SharedAudioSession` 时共享 app 的 audio session。

#### 能力检测

```ts
HapticEngine.supportsHaptics
HapticEngine.supportsAudio
Haptics.supportsHaptics
Haptics.supportsAudio
```

#### 属性

```ts
engine.currentTime
engine.isRunning
engine.playsHapticsOnly
engine.playsAudioOnly
engine.isMutedForAudio
engine.isMutedForHaptics
engine.autoShutdownEnabled
engine.onStopped = reason => {}
engine.onReset = () => {}
```

#### 方法

```ts
engine.start()
await engine.startAsync()
await engine.stop()
engine.makePlayer(pattern)
engine.makeAdvancedPlayer(pattern)
engine.playPatternFromFile(filePath)
engine.playPatternFromData(data)
engine.registerAudioResource(filePath, options?)
engine.unregisterAudioResource(resourceID)
engine.dispose()
```

同步方法在 Core Haptics 报错时会抛出 JavaScript `Error`。Promise 方法会 reject `Error`。

## Events 和 Parameters

```ts
new HapticEventParameter(parameterID, value)
new HapticDynamicParameter(parameterID, value, relativeTime)
new HapticParameterCurveControlPoint(relativeTime, value)
new HapticParameterCurve(parameterID, controlPoints, relativeTime)
new HapticEvent(eventType, parameters, relativeTime, duration?)
new HapticPattern(events, parametersOrCurves?)
```

常用 event type：

- `"hapticTransient"`
- `"hapticContinuous"`
- `"audioContinuous"`
- `"audioCustom"`

常用 event parameter：

- `"hapticIntensity"`
- `"hapticSharpness"`
- `"attackTime"`
- `"decayTime"`
- `"releaseTime"`
- `"sustained"`

## AHAP Data

```ts
const data = FileManager.readAsData("/path/to/pattern.ahap")
const pattern = HapticPattern.fromData(data)

const engine = new HapticEngine()
engine.start()
engine.playPatternFromData(data)
```

`HapticPattern.fromDictionary(dictionary)` 接受 AHAP 风格的 dictionary，`pattern.exportDictionary()` 会返回 pattern 的 dictionary 表示。
