The `AudioRecorder` class allows you to record audio data to a file. It provides functionalities to start, stop, pause, and manage audio recordings, with configurable settings for audio quality, sample rate, format, and more.

## Features
- Record audio from the system’s active input device.
- Record for a specified duration or until manually stopped.
- Pause and resume recordings.
- Delete recorded audio files.

## Usage

### Setup SharedAudioSesion
Before create an AudioRecorder instance, we need to setup the `SharedAudioSession`, the audio session is hardware-related and should be properly activated.

```ts
await SharedAudioSession.setActive(true)
await SharedAudioSession.setCategory(
  "playAndRecord",
  ["defaultToSpeaker"]
)
```

### Creating an AudioRecorder Instance
To create an audio recorder, use the `create` method:

```ts
async function createRecorder() {
  try {
    const filePath = Path.join(
      FileManager.documentsDirectory,
      "recording.m4a"
    )
    const recorder = await AudioRecorder.create(filePath, {
      format: "MPEG4AAC",
      sampleRate: 44100,
      numberOfChannels: 2,
      encoderAudioQuality: AVAudioQuality.high
    })
    return recorder
  } catch (error) {
    console.error("Failed to create recorder: ", error)
  }
}
```

### Recording Audio
You can start recording using the `record()` method:

```ts
async function startRecording() {
  const recorder = await createRecorder()
  if (recorder) {
    const success = recorder.record()
    console.log("Recording started: ", success)
  }
}
```

You can also provide options to control when to start recording and for how long:

```ts
function startSynchronizedRecording(recorderOne, recorderTwo) {
  let timeOffset = recorderOne.deviceCurrentTime + 0.01
  
  // Synchronize the recording time of both recorders.
  recorderOne.record({ atTime: timeOffset })
  recorderTwo.record({ atTime: timeOffset })
}
```

### Pausing and Stopping the Recording
To pause a recording:

```ts
function pauseRecording(recorder) {
  recorder.pause()
  console.log("Recording paused.")
}
```

To stop a recording:

```ts
function stopRecording(recorder) {
  recorder.stop()
  console.log("Recording stopped.")
}
```

### Deleting a Recording
To delete the recorded file:

```ts
function deleteRecording(recorder) {
  const success = recorder.deleteRecording()
  console.log("Recording deleted: ", success)
}
```

### Disposing of the Recorder
You should call `dispose()` when the recorder is no longer needed to free up resources:

```ts
function disposeRecorder(recorder) {
  recorder.dispose()
  console.log("Recorder disposed.")
}
```

### Event Handling
You can use the `onFinish` and `onError` callbacks to handle recording completion and errors:

```ts
async function setupRecorder() {
  const recorder = await createRecorder()
  if (recorder) {
    recorder.onFinish = (success) => {
      console.log("Recording finished successfully: ", success)
    }

    recorder.onError = (message) => {
      console.error("Recording error: ", message)
    }
  }
}
```

### Level Metering (VU meter / volume bar)

`AudioRecorder` can report the average and peak power of the input signal in
dBFS while recording, without exposing raw PCM samples. This is enough to
drive a VU meter or trigger logic on loudness.

Enable metering when creating the recorder, or by setting `meteringEnabled`
before calling `record()`:

```ts
const recorder = await AudioRecorder.create(filePath, {
  format: "MPEG4AAC",
  sampleRate: 44100,
  numberOfChannels: 1,
  meteringEnabled: true,
  // Optional: how often onLevelUpdate fires while recording.
  // In milliseconds, clamped to [16, 1000]. Default 50.
  levelUpdateInterval: 50,
})

recorder.onLevelUpdate = (level) => {
  // level.averagePower / level.peakPower are in dBFS, roughly [-160, 0].
  // Map to a 0..1 bar with something like:
  const norm = Math.max(0, (level.averagePower + 60) / 60)
  console.log(`avg=${level.averagePower.toFixed(1)} dB peak=${level.peakPower.toFixed(1)} dB`)
}

recorder.record()
```

You can also poll the meter manually instead of using the callback:

```ts
recorder.meteringEnabled = true
recorder.record()

setInterval(() => {
  recorder.updateMeters()
  const avg = recorder.averagePower(0)
  const peak = recorder.peakPower(0)
  console.log(`channel 0 → avg=${avg} peak=${peak}`)
}, 100)
```

The level timer stops automatically on `pause()` / `stop()` / `dispose()`
and resumes on the next `record()` while `onLevelUpdate` is set.

> If you need raw PCM samples, real-time waveform data, or pitch
> detection, use the `AudioCapture` class instead.
> `AudioRecorder` is optimized for writing encoded audio files
> (m4a / aac / flac / opus / mp3 / wav).

## API Reference

### `AudioRecorder.create(filePath, settings?)`
Creates an `AudioRecorder` instance with specified settings.
- **filePath** (string): The file system location to record to.
- **settings** (optional object): The audio settings for the recording:
  - **format** (AudioFormat): The format of the audio data. Options: "LinearPCM", "MPEG4AAC", "AppleLossless", "AppleIMA4", "iLBC", "ULaw".
  - **sampleRate** (number): The sample rate in hertz (8000 to 192000).
  - **numberOfChannels** (number): The number of channels (1 to 64).
  - **encoderAudioQuality** (AVAudioQuality): The quality of the audio encoding (from `AVAudioQuality.min` to `AVAudioQuality.max`).

Returns: A `Promise` that resolves with an `AudioRecorder` instance.

### `AudioRecorder.isRecording`
A  boolean indicating whether the recorder is recording.

### `AudioRecorder.currentTime`
The time, in seconds, since the beginning of the recording.

### `AudioRecorder.deviceCurrentTime`
The current time of the host audio device, in seconds.

### `AudioRecorder.record(options?)`
Starts recording audio.
- **options** (optional object): Recording options:
  - **atTime** (number): The time at which to start recording, relative to `deviceCurrentTime`.
  - **duration** (number): The duration of the recording, in seconds.

Returns: A boolean indicating whether recording started successfully.

### `AudioRecorder.pause()`
Pauses the current recording.

### `AudioRecorder.stop()`
Stops recording and closes the audio file.

### `AudioRecorder.deleteRecording()`
Deletes the recorded audio file.

Returns: A boolean indicating whether the deletion was successful.

### `AudioRecorder.dispose()`
Releases resources used by the recorder.

### `AudioRecorder.onFinish`
Callback function invoked when the recording finishes.
- **success** (boolean): Indicates whether the recording finished successfully.

### `AudioRecorder.onError`
Callback function invoked when an encoding error occurs.
- **message** (string): Describes the error.

### `AudioRecorder.meteringEnabled`
Whether level metering is enabled. Toggle before `record()` (or pass
`meteringEnabled: true` to `create`) so that `averagePower`, `peakPower`,
and `onLevelUpdate` report values.

### `AudioRecorder.levelUpdateInterval`
Sampling interval in milliseconds used by `onLevelUpdate`. Clamped to
`[16, 1000]`. Default `50`.

### `AudioRecorder.updateMeters()`
Refreshes the meter values. Call before reading `averagePower` /
`peakPower` if you do not use `onLevelUpdate`.

### `AudioRecorder.averagePower(channel?)`
Returns the average power for the given channel in dBFS, range roughly
`[-160, 0]`. Returns `0` when metering is disabled or the recorder is not
running.
- **channel** (number, optional): Zero-based channel index. Defaults to `0`.

### `AudioRecorder.peakPower(channel?)`
Returns the peak hold power for the given channel in dBFS.

### `AudioRecorder.onLevelUpdate`
Callback invoked while recording at `levelUpdateInterval` cadence when
`meteringEnabled` is `true`.
- **level.averagePower** (number): Average power in dBFS, averaged across channels.
- **level.peakPower** (number): Peak power in dBFS, averaged across channels.
- **level.channels** (`{ average; peak }[]`): Per-channel values.
- **level.timestamp** (number): `deviceCurrentTime` when the sample was taken, in seconds.

## Example Usage
```ts
import { Path } from 'scripting'

async function run() {

  await SharedAudioSession.setActive(true)
  await SharedAudioSession.setCategory(
    "playAndRecord",
    ["defaultToSpeaker"]
  )

  try {
    const filePath = Path.join(
      FileManager.documentsDirectory,
      "recording.m4a"
    )
    const recorder = await AudioRecorder.create(filePath, {
      format: "MPEG4AAC",
      sampleRate: 48000,
      numberOfChannels: 2,
      encoderAudioQuality: AVAudioQuality.high
    })

    recorder.onFinish = (success) => console.log("Recording finished successfully: ", success)
    recorder.onError = (message) => console.error("Recording error: ", message)

    recorder.record()
    setTimeout(() => {
      recorder.stop()
    }, 5000) // Stop recording after 5 seconds
  } catch (error) {
    console.error("Error: ", String(error))
  }
}

run()
```

Use the `AudioRecorder` class to easily manage audio recording operations in your scripts, providing flexibility and control over the audio recording process.

