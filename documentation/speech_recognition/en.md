The `SpeechRecognition` interface provides a high-level API for performing speech recognition. It supports real-time speech recognition and recognition of audio files, offering flexibility in a variety of use cases.

---

## Features Overview

- **Real-Time Recognition:** Transcribe live audio from the microphone.
- **File-Based Recognition:** Analyze and transcribe recorded audio files.
- **Multi-Language Support:** Specify the recognition locale for different languages.
- **Intermediate Results:** Access partial and final results for progressive transcription.
- **Custom Callbacks:** Handle transcription results and sound level changes with event listeners.

---

## Type Definitions

### `RecognitionTaskHint`
Hints for the type of task for which speech recognition is used:
- `'confirmation'`: For commands like "yes," "no," or "maybe."
- `'dictation'`: For tasks similar to keyboard dictation.
- `'search'`: For identifying search terms.
- `'unspecified'`: For general-purpose speech recognition.

---

### `SpeechRecognitionResult`
Represents the result of speech recognition:
- `isFinal`: Indicates if the transcription is complete and final.
- `text`: Convenience alias for `bestTranscription.formattedString`, kept for backward compatibility.
- `bestTranscription`: The transcription with the highest confidence level (`SpeechTranscription`).
- `transcriptions`: Alternative transcriptions of the audio, sorted in descending order of confidence (`SpeechTranscription[]`).
- `metadata`: Aggregate speech metrics. Only available on final results (iOS 14.5+) (`SpeechRecognitionMetadata`).

---

### `SpeechTranscription`
A transcription of recognized speech:
- `formattedString`: The entire transcription formatted into a single, user-displayable string.
- `segments`: The individual word/utterance segments that compose this transcription (`SpeechTranscriptionSegment[]`).

> Speaking rate and average pause duration are reported on `SpeechRecognitionResult.metadata` instead, and only on final results.

---

### `SpeechTranscriptionSegment`
A single segment within a transcription, typically corresponding to a word:
- `substring`: The text content of this segment.
- `substringRange`: The UTF-16 character range of `substring` within the parent transcription's `formattedString` (`{ location: number, length: number }`).
- `timestamp`: The seconds offset, relative to the audio start, at which this segment was spoken.
- `duration`: The duration in seconds of this segment within the audio.
- `confidence`: Confidence in the accuracy of this segment, in `[0.0, 1.0]`. Only meaningful on final results; partial results typically report `0`.
- `alternativeSubstrings`: Alternative substrings the recognizer also considered for this segment.

---

### `SpeechRecognitionMetadata`
Aggregate speech metrics for a final recognition result:
- `speakingRate`: Speaking rate in words per minute.
- `averagePauseDuration`: Average pause duration in seconds between words.
- `speechStartTimestamp`: Seconds offset within the audio at which the user started speaking.
- `speechDuration`: Duration in seconds of the spoken speech.

---

## Static Properties

### Supported Locales
- `supportedLocales`: Returns a list of locales supported by the speech recognizer, such as `"en-US"`, `"fr-FR"`, or `"zh-CN"`.

### Recognition State
- `isRecognizing`: Indicates whether a recognition request is currently active.

---

## Methods

### Start Real-Time Recognition
`start(options: object): Promise<boolean>`  
Starts speech recognition from the device microphone.

#### Options
- `locale`: Locale string for the desired language (optional).
- `partialResults`: Return intermediate results (default: `true`).
- `addsPunctuation`: Automatically add punctuation to results (default: `false`).
- `requestOnDeviceRecognition`: Keep audio data on the device (default: `false`).
- `taskHint`: Specify the recognition task type (`'confirmation'`, `'dictation'`, `'search'`, `'unspecified'`).
- `useDefaultAudioSessionSettings`: Use default audio session settings (default: `true`).
- `preferredInput`: Preferred audio input port. `'auto'` (default) lets the system choose;
  `'builtInMic'` forces the device's built-in microphone even when a Bluetooth headset is
  connected — useful for keeping wireless headphones for playback while recording from the
  built-in mic for better audio quality. Falls back silently to the system default when
  `builtInMic` is not available on the device.
- `onResult`: Callback for recognition results (`SpeechRecognitionResult`).
- `onSoundLevelChanged`: Callback for sound level changes (optional).

#### Example
```ts
await SpeechRecognition.start({
  locale: "en-US",
  partialResults: true,
  addsPunctuation: true,
  onResult: (result) => {
    console.log("Transcription:", result.text)
  },
  onSoundLevelChanged: (level) => {
    console.log("Sound Level:", level)
  }
})
```

---

### Recognize Speech in Audio Files
`recognizeFile(options: object): Promise<boolean>`  
Starts recognition for a recorded audio file.

#### Options
- `filePath`: Path to the audio file.
- `locale`: Locale string for the desired language (optional).
- `partialResults`: Return intermediate results (default: `false`).
- `addsPunctuation`: Automatically add punctuation to results (default: `false`).
- `requestOnDeviceRecognition`: Keep audio data on the device (default: `false`).
- `taskHint`: Specify the recognition task type (`'confirmation'`, `'dictation'`, `'search'`, `'unspecified'`).
- `onResult`: Callback for recognition results (`SpeechRecognitionResult`).

#### Example
```ts
await SpeechRecognition.recognizeFile({
  filePath: FileManager.join(FileManager.documentDirectory, "example.wav"),
  locale: "en-US",
  addsPunctuation: true,
  onResult: (result) => {
    console.log("File Transcription:", result.text)
  }
})
```

---

### Stop Recognition
`stop(): Promise<void>`  
Stops an active speech recognition session.

#### Example
```ts
await SpeechRecognition.stop()
```

---

## Examples

### Real-Time Recognition with Progress Updates
```ts
await SpeechRecognition.start({
  locale: "en-US",
  onResult: (result) => {
    console.log(result.isFinal ? "Final Result:" : "Partial Result:", result.text)
  },
  onSoundLevelChanged: (level) => {
    console.log("Sound Level:", level)
  }
})
```

### Recognize Audio File
```ts
await SpeechRecognition.recognizeFile({
  filePath: FileManager.join(FileManager.documentDirectory, "audio.m4a"),
  partialResults: false,
  onResult: (result) => {
    console.log("File recognition completed. Transcription:", result.text)
  }
})
```

### Inspect Word-Level Timing and Alternatives
```ts
await SpeechRecognition.recognizeFile({
  filePath: FileManager.join(FileManager.documentDirectory, "audio.m4a"),
  partialResults: false,
  onResult: (result) => {
    if (!result.isFinal) return

    for (const segment of result.bestTranscription.segments) {
      console.log(
        `[${segment.timestamp.toFixed(2)}s + ${segment.duration.toFixed(2)}s] `
          + `${segment.substring} (confidence ${segment.confidence.toFixed(2)})`
      )
      if (segment.alternativeSubstrings.length > 0) {
        console.log("  alternatives:", segment.alternativeSubstrings.join(", "))
      }
    }

    if (result.metadata) {
      console.log("Speaking rate (wpm):", result.metadata.speakingRate)
      console.log("Speech duration (s):", result.metadata.speechDuration)
    }

    if (result.transcriptions.length > 1) {
      console.log("Alternative transcriptions:")
      for (const t of result.transcriptions.slice(1)) {
        console.log(" -", t.formattedString)
      }
    }
  }
})
```

---

### Stop Active Recognition
```ts
if (await SpeechRecognition.start({
  // ...
})) {
  // Stop after 10 seconds.
  setTimeout(() => {
    await SpeechRecognition.stop()
  }, 10 * 1000)
}

```

---

## Notes

- Ensure the necessary microphone or file access permissions are granted before using this API.
- Use `supportedLocales` to determine available languages for recognition.
- For optimal performance, use audio files in formats supported by iOS (e.g., `.wav`, `.m4a`).