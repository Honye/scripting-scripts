The `AudioCapture` class taps the microphone via `AVAudioEngine` and
streams real-time signals to your script: raw PCM frames, RMS / peak
levels, and YIN-based pitch estimates. It is the right tool for
tuners, real-time waveform views, level-triggered logic, and custom
DSP. It can optionally write the captured audio to a WAV file.

> Choosing between `AudioRecorder` and `AudioCapture`:
> - **`AudioRecorder`** writes encoded files (m4a / aac / flac / mp3 / opus)
>   and only exposes power meters via `onLevelUpdate`. Pick it for the
>   final-quality recording use case.
> - **`AudioCapture`** exposes the raw waveform plus pitch and level
>   callbacks. Pick it for analysis-driven scripts. It can also save a
>   wav file via `saveTo`, which makes it a superset for *uncompressed*
>   recording.
> - Don't run both at the same time — they would compete for the same
>   audio input bus.

## Features

- Real-time **PCM buffer** callback (`Float32Array` or `Int16Array`).
- Real-time **pitch detection** via YIN with note name and cents offset.
- Real-time **RMS / peak level** callback at a configurable rate.
- Optional **WAV file** output (32-bit float, hardware sample rate).

## Usage

### Setup the audio session

`AudioCapture` shares the system audio session with the rest of the app.
Activate it once before creating the capture instance:

```ts
await SharedAudioSession.setActive(true)
await SharedAudioSession.setCategory(
  "playAndRecord",
  ["defaultToSpeaker"]
)
```

### Create an AudioCapture instance

`create` requests microphone permission and resolves with the instance.
It rejects if permission is denied.

```ts
const capture = await AudioCapture.create({
  // Hardware decides the actual values; these are hints.
  sampleRate: 44100,
  channels: 1,
  bufferSize: 1024,
  format: "float32",
  // Optional: also write captured audio to a wav file
  // saveTo: Path.join(FileManager.documentsDirectory, "capture.wav"),
})
```

### Listen to PCM buffers

```ts
capture.onBuffer = (frame) => {
  // frame.samples is a Float32Array (or Int16Array) of length frames * channels.
  // Channels are interleaved: [L, R, L, R, ...] for stereo.
  console.log(
    `pcm frames=${frame.frames} ch=${frame.channels} ` +
    `sr=${frame.sampleRate} avg=${frame.level.averagePower.toFixed(1)} dB`
  )
}

// Default 0 = follow the hardware tap rate (~43 Hz at 1024 frames / 44.1 kHz).
// Set a positive value to throttle; e.g. 30 = at most 30 buffers per second.
capture.bufferEmitRate = 0
```

### Pitch detection (tuner)

```ts
capture.pitchConfig = {
  minFrequency: 80,    // ignore anything below 80 Hz (low rumble)
  maxFrequency: 1200,  // ignore anything above 1200 Hz
  threshold: 0.15,     // YIN aperiodicity threshold; lower is stricter
  emitRate: 30,        // 30 Hz = one estimate every 33 ms
}

capture.onPitch = (frame) => {
  if (frame.frequency === 0) {
    // Unvoiced frame (silence / noise / chord).
    return
  }
  console.log(
    `${frame.note} ${frame.cents.toFixed(0)}¢  ` +
    `${frame.frequency.toFixed(2)} Hz (conf ${frame.confidence.toFixed(2)})`
  )
}
```

### Lightweight level meter

If you only need a VU meter, prefer `onLevel` over `onBuffer` — it does
not allocate a typed array per frame.

```ts
capture.levelEmitRate = 30
capture.onLevel = (level) => {
  const norm = Math.max(0, (level.averagePower + 60) / 60)
  // norm is roughly in [0, 1]; pipe it into your UI bar.
}
```

### Start, stop, dispose

```ts
const ok = capture.start()
if (!ok) {
  console.error("AudioCapture failed to start")
}

// later ...
capture.stop()
capture.dispose()
```

`stop()` halts the engine and closes the wav file (if any). `dispose()`
also tears down the JS callbacks; call it once you no longer need the
instance to free resources promptly.

### Error handling

```ts
capture.onError = (message) => {
  console.error("AudioCapture error:", message)
}
```

## API Reference

### `AudioCapture.create(config?)`

Requests microphone permission and constructs an instance.
- **config.sampleRate** (number, optional): Hint for the desired sample
  rate. The hardware decides the actual value, exposed via `sampleRate`.
  Default `44100`.
- **config.channels** (`1 | 2`, optional): Channel count hint. Default `1`.
- **config.bufferSize** (number, optional): Frames per tap. Range
  `[256, 8192]`. Default `1024`.
- **config.format** (`"float32" | "int16"`, optional): Sample format for
  `onBuffer.samples`. Default `"float32"`.
- **config.saveTo** (string, optional): If set, captured audio is
  written to this path as a 32-bit float WAV file.

Returns a `Promise<AudioCapture>`.

### `AudioCapture.isRunning`
Whether the engine is running.

### `AudioCapture.sampleRate`
Hardware sample rate after `start()`.

### `AudioCapture.channels`
Hardware channel count after `start()`.

### `AudioCapture.start()`
Starts the engine. Returns `false` on failure (no input available,
session conflict, etc. — `onError` will also fire).

### `AudioCapture.stop()`
Stops the engine and closes the wav file (if any).

### `AudioCapture.dispose()`
Releases the engine, all callbacks, and the wav file.

### `AudioCapture.onBuffer`
PCM buffer callback. Each invocation receives a fresh typed array; safe
to retain.

### `AudioCapture.bufferEmitRate`
Buffers per second for `onBuffer`. `0` = follow the hardware tap rate.

### `AudioCapture.onPitch`
YIN-based pitch estimate callback. `frequency === 0` indicates an
unvoiced frame.

### `AudioCapture.pitchConfig`
Pitch detector parameters: `minFrequency`, `maxFrequency`, `threshold`,
`emitRate`.

### `AudioCapture.onLevel`
RMS / peak level callback (no PCM payload). Cheaper than `onBuffer`.

### `AudioCapture.levelEmitRate`
Levels per second for `onLevel`. Default `30`.

### `AudioCapture.onError`
Error callback. Fires on engine startup failure or runtime issues.

## Example: simple tuner

```ts
import { Path } from 'scripting'

async function run() {
  await SharedAudioSession.setActive(true)
  await SharedAudioSession.setCategory("playAndRecord", ["defaultToSpeaker"])

  const capture = await AudioCapture.create({
    sampleRate: 44100,
    channels: 1,
    format: "float32",
  })

  capture.pitchConfig = {
    minFrequency: 70,
    maxFrequency: 1200,
    threshold: 0.15,
    emitRate: 30,
  }

  capture.onPitch = (frame) => {
    if (frame.frequency > 0 && frame.confidence > 0.7) {
      console.log(
        `${frame.note}  ${frame.cents.toFixed(0)} cents  ` +
        `${frame.frequency.toFixed(2)} Hz`
      )
    }
  }

  capture.onError = (msg) => console.error(msg)

  if (!capture.start()) {
    console.error("Failed to start")
    return
  }

  // Run for 30 seconds, then dispose.
  setTimeout(() => {
    capture.stop()
    capture.dispose()
  }, 30_000)
}

run()
```
