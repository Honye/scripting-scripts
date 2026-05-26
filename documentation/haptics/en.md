`Haptics` exposes Core Haptics for scripts that need custom tactile patterns beyond the lightweight `HapticFeedback` helpers.

Use `Haptics.transient()` or `Haptics.continuous()` for simple one-shot effects. Use `HapticEngine`, `HapticPattern`, `HapticEvent`, and parameter objects when you need precise timing, envelopes, dynamic parameters, AHAP data, or reusable pattern players.

```ts
await Haptics.transient(1.0, 0.7)
await Haptics.continuous(0.4, 0.6, 0.35)
```

## Pattern Playback

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

Creates a Core Haptics engine. Omit `audioSession` for the default engine, pass `null` to let Core Haptics create its own audio session, or pass `SharedAudioSession` to share the app audio session.

#### Static Capabilities

```ts
HapticEngine.supportsHaptics
HapticEngine.supportsAudio
Haptics.supportsHaptics
Haptics.supportsAudio
```

#### Properties

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

#### Methods

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

Synchronous methods throw JavaScript `Error` objects when Core Haptics reports a failure. Promise methods reject with `Error`.

## Events and Parameters

```ts
new HapticEventParameter(parameterID, value)
new HapticDynamicParameter(parameterID, value, relativeTime)
new HapticParameterCurveControlPoint(relativeTime, value)
new HapticParameterCurve(parameterID, controlPoints, relativeTime)
new HapticEvent(eventType, parameters, relativeTime, duration?)
new HapticPattern(events, parametersOrCurves?)
```

Common event types:

- `"hapticTransient"`
- `"hapticContinuous"`
- `"audioContinuous"`
- `"audioCustom"`

Common event parameters:

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

`HapticPattern.fromDictionary(dictionary)` accepts an AHAP-style dictionary, and `pattern.exportDictionary()` returns a dictionary representation of a pattern.
