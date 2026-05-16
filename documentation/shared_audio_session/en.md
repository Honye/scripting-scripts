The `SharedAudioSession` interface provides a convenient way to manage and interact with the shared audio session in your script. The audio session acts as an intermediary between your script, the Scripting app, the operating system, and the underlying audio hardware, enabling you to configure and control audio behavior effectively.

## Features

- Retrieve and set audio session categories, modes, and options.
- Configure the preferred sample rate for audio input and output.
- Handle audio interruptions.
- Query device capabilities for supported categories and modes.
- Tailor audio behaviors for specific app use cases, such as video recording, voice chat, or background playback.

---

## Methods and Properties

### 1. **Session Category and Options**

#### `category`
Get the current audio session category.

```typescript
const category = await SharedAudioSession.category
console.log(category) // Example: 'playback'
```

#### `categoryOptions`
Retrieve the current audio session category options.

```typescript
const options = await SharedAudioSession.categoryOptions
console.log(options) // Example: ['mixWithOthers', 'allowAirPlay']
```

#### `setCategory(category: AudioSessionCategory, options: AudioSessionCategoryOptions[])`
Set the audio session category with specific options.

```typescript
await SharedAudioSession.setCategory('playback', ['mixWithOthers'])
```

---

### 2. **Session Mode**

#### `mode`
Retrieve the current audio session mode.

```typescript
const mode = await SharedAudioSession.mode
console.log(mode) // Example: 'videoChat'
```

#### `setMode(mode: AudioSessionMode)`
Set the audio session mode.

```typescript
await SharedAudioSession.setMode('voiceChat')
```

---

### 3. **Sample Rate**

#### `preferredSampleRate`
Retrieve the preferred sample rate in hertz.

```typescript
const sampleRate = await SharedAudioSession.preferredSampleRate
console.log(sampleRate) // Example: 44100
```

#### `setPreferredSampleRate(sampleRate: number)`
Set the preferred sample rate for audio input and output.

```typescript
await SharedAudioSession.setPreferredSampleRate(48000)
```

---

### 4. **Interruption Handling**

#### `addInterruptionListener(listener: AudioSessionInterruptionListener)`
Listen for audio interruptions.

```typescript
SharedAudioSession.addInterruptionListener((type) => {
  if (type === 'began') {
    console.log('Audio interruption began')
  } else if (type === 'ended') {
    console.log('Audio interruption ended')
  }
})
```

#### `removeInterruptionListener(listener: AudioSessionInterruptionListener)`
Remove an interruption listener.

```typescript
SharedAudioSession.removeInterruptionListener(myListener)
```

---

### 5. **Device Capabilities**

#### `availableCategories`
Get the list of audio session categories available on the device.

```typescript
const categories = await SharedAudioSession.availableCategories
console.log(categories) // Example: ['playback', 'record', 'soloAmbient']
```

#### `availableModes`
Get the list of audio session modes available on the device.

```typescript
const modes = await SharedAudioSession.availableModes
console.log(modes) // Example: ['default', 'videoChat', 'voiceChat']
```

---

### 6. **Additional Properties**

#### `isOtherAudioPlaying`
Check if other audio is currently playing on the device.

```typescript
const isPlaying = await SharedAudioSession.isOtherAudioPlaying
console.log(isPlaying) // Example: true
```

#### `secondaryAudioShouldBeSilencedHint`
Check if secondary audio should be silenced.

```typescript
const shouldSilence = await SharedAudioSession.secondaryAudioShouldBeSilencedHint
console.log(shouldSilence) // Example: false
```

#### `allowHapticsAndSystemSoundsDuringRecording`
Check if haptics and system sounds are allowed during recording.

```typescript
const allowHaptics = await SharedAudioSession.allowHapticsAndSystemSoundsDuringRecording
console.log(allowHaptics) // Example: true
```

#### `prefersNoInterruptionsFromSystemAlerts`
Check if the session prefers no interruptions from system alerts.

```typescript
const prefersNoInterruptions = await SharedAudioSession.prefersNoInterruptionsFromSystemAlerts
console.log(prefersNoInterruptions) // Example: false
```

---

### 7. **Session Activation**

#### `setActive(active: boolean, options?: AudioSessionSetActiveOptions[])`
Activate or deactivate the shared audio session with optional options.

- `active`: Set to `true` to activate the session, `false` to deactivate it.
- `options`: An array of optional activation options, such as 'interruptSpokenAudioAndMixWithOthers'.

```typescript
await SharedAudioSession.setActive(
  true,
  ['notifyOthersOnDeactivation']
)
```

---

### 8. **System Settings**

#### `setAllowHapticsAndSystemSoundsDuringRecording(value: boolean)`
Enable or disable haptics and system sounds during recording.

```typescript
await SharedAudioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)
```

#### `setPrefersNoInterruptionsFromSystemAlerts(value: boolean)`
Set the preference for no interruptions from system alerts.

```typescript
await SharedAudioSession.setPrefersNoInterruptionsFromSystemAlerts(true)
```

---

### 9. **Audio Routing**

iOS chooses input and output audio routes independently. The APIs below let you list available
input ports, force the recording input to a specific port (typically `builtInMic`), and override
the output to the device speaker — useful when you want to record from the phone microphone while
keeping a Bluetooth headset for playback (avoiding the lower-quality bidirectional Bluetooth HFP
link).

> `setPreferredInput` and `overrideOutputAudioPort` only work after the session is active. Always
> call `setActive(true)` first.

#### `availableInputs`

The list of input ports the system currently exposes for this session. Bluetooth, USB, and headset
microphones only appear when the active category options allow them (e.g. `allowBluetoothHFP`).

```typescript
const inputs = await SharedAudioSession.availableInputs
for (const port of inputs) {
  console.log(port.portType, port.portName, port.uid)
}
```

#### `currentRoute`

The currently selected input and output ports.

```typescript
const route = await SharedAudioSession.currentRoute
console.log('input:', route.inputs[0]?.portType)
console.log('output:', route.outputs[0]?.portType)
```

#### `setPreferredInput(input: AudioSessionPort | null)`

Pick a specific input port. Pass `null` to clear the preference. The argument is matched against
`availableInputs` first by `uid`, then by `portType`. Rejects with `Cannot setPreferredInput before
setActive(true).` if the session is not active.

```typescript
await SharedAudioSession.setActive(true)
const inputs = await SharedAudioSession.availableInputs
const builtIn = inputs.find(p => p.portType === 'builtInMic')
if (builtIn) {
  await SharedAudioSession.setPreferredInput(builtIn)
}
```

#### `overrideOutputAudioPort(port: 'speaker' | 'none')`

Force the output to the device speaker, or remove the override. Independent from input selection.

```typescript
await SharedAudioSession.overrideOutputAudioPort('speaker')
// later
await SharedAudioSession.overrideOutputAudioPort('none')
```

#### `setPrefersBuiltInMicWhenAvailable(enabled: boolean)`

Enable an in-process switch that automatically steers the input back to `builtInMic` whenever it
becomes available, even after a Bluetooth headset, USB mic, or wired headset is plugged in. The
output route is left untouched, which is what enables clean I/O separation: built-in mic for input,
wireless headphones (A2DP) for playback.

The switch is **not persisted** across launches, but it does affect every script running inside the
host app while the host process is alive. Manual `setPreferredInput` calls (route change reason
`override`) are not overwritten by the switch.

Enabling the switch immediately attempts to apply the preference once.

```typescript
await SharedAudioSession.setActive(true)
await SharedAudioSession.setPrefersBuiltInMicWhenAvailable(true)

// Later, query state:
const enabled = await SharedAudioSession.prefersBuiltInMicWhenAvailable
```

#### Route change events

```typescript
SharedAudioSession.addRouteChangeListener((reason, current) => {
  console.log('route changed:', reason)
  console.log('inputs now:', current.inputs.map(p => p.portType))
})
```

`reason` is one of `'newDeviceAvailable' | 'oldDeviceUnavailable' | 'categoryChange' | 'override' | 'wakeFromSleep' | 'noSuitableRouteForCategory' | 'routeConfigurationChange' | 'unknown'`.

---

### 10. **Systemwide Output Volume**

#### `outputVolume: number`

The systemwide output volume. This property is a number between 0 and 1, representing the volume level as a percentage.

#### outputVolume EventListener

Type Definition:

```ts
type AudioSessionOutputVolumeListener = (newValue: number, oldValue: number) => void
```

##### `addOutputVolumeListener(listener: AudioSessionOutputVolumeListener)`

Add an event listener for changes in the systemwide output volume.

```typescript
SharedAudioSession.addOutputVolumeListener((newValue, oldValue) => {
  console.log(`Output volume changed from ${oldValue} to ${newValue}`)
})
```

##### `removeOutputVolumeListener(listener: AudioSessionOutputVolumeListener)`

Remove an event listener for changes in the systemwide output volume.

---

## Enumerations

### **AudioSessionSetActiveOptions**
Optional activation options:
- `'notifyOthersOnDeactivation'`: Notify other audio sessions when deactivating the shared audio session.

### **AudioSessionCategory**
Defines the session's audio category:
- `'ambient'`: Ambient audio, such as background music or ambient sounds.
- `'multiRoute'`: Multi-route audio, such as routing distinct streams of audio data to different output devices at the same time.
- `'playAndRecord'`: Play and record audio, such as voice chat or video conferencing.
- `'playback'`: Playback audio, such as music or sound effects.
- `'record'`: Recording audio, such as voice chat or video conferencing.
- `'soloAmbient'`: Solo ambient audio, such as background music or ambient sounds.

### **AudioSessionCategoryOptions**
Optional behaviors for audio categories:
- `'mixWithOthers'`: Mix with other audio sessions.
- `'duckOthers'`: Duck other audio sessions.
- `'interruptSpokenAudioAndMixWithOthers'`: Interrupt spoken audio and mix with others.
- `'allowBluetooth'`: Allow Bluetooth audio.
- `'allowBluetoothA2DP'`: Allow Bluetooth A2DP audio.
- `'allowAirPlay'`: Allow AirPlay audio.
- `'defaultToSpeaker'`: Default to speaker, even if headphones are connected.
- `'overrideMutedMicrophoneInterruption'`: Override muted microphone interruption.

### **AudioSessionMode**
Specifies the session's mode:
- `'default'`: Default mode.
- `'gameChat'`: Game chat mode.
- `'measurement'`: Measurement mode, such as audio input or output.
- `'moviePlayback'`: Movie playback mode, such as movie content.
- `'spokenAudio'`: Spoken audio mode, such as voice chat.
- `'videoChat'`: Video chat mode, such as video conferencing.
- `'videoRecording'`: Video recording mode, such as video conferencing.
- `'voicePrompt'`: Voice prompt mode, such as text-to-speech.

### **AudioSessionInterruptionType**
Specifies the type of interruption:
- `'began'`
- `'ended'`
- `'unknown'`

---

This interface offers extensive control over audio session management in Scripting, making it suitable for building audio-heavy script like music players and video conferencing tools.