该接口可用于执行语音识别，包括实时语音识别和音频文件的识别，能适应多种使用场景的需求。

---

## 功能概览

- **实时识别**：从麦克风捕获实时音频并转录为文本。
- **文件识别**：分析和转录已录制的音频文件。
- **多语言支持**：指定识别的语言区域，用于识别不同语言。
- **中间结果**：获取渐进式的转录结果，包括部分结果和最终结果。
- **自定义回调**：通过事件监听器处理转录结果和音量变化等。

---

## 类型定义

### `RecognitionTaskHint`
用于指定语音识别任务的类型提示：
- `'confirmation'`：适合诸如“yes”，“no”或“maybe”之类的指令。
- `'dictation'`：类似键盘输入的语音听写。
- `'search'`：识别搜索关键词。
- `'unspecified'`：通用的语音识别。

---

### `SpeechRecognitionResult`
表示语音识别的结果：
- `isFinal`: 表示该转录结果是否完整且最终。
- `text`: `bestTranscription.formattedString` 的便捷别名，为兼容旧代码而保留。
- `bestTranscription`: 置信度最高的转录（类型为 `SpeechTranscription`）。
- `transcriptions`: 该段音频的所有候选转录，按置信度从高到低排序（类型为 `SpeechTranscription[]`）。
- `metadata`: 整段语音的汇总指标。仅在最终结果中提供（iOS 14.5+），类型为 `SpeechRecognitionMetadata`。

---

### `SpeechTranscription`
一段识别后的转录：
- `formattedString`: 整段转录拼接为单一、可直接展示的字符串。
- `segments`: 组成该转录的逐词/逐句片段（类型为 `SpeechTranscriptionSegment[]`）。

> 说话速度（speakingRate）和平均停顿（averagePauseDuration）改由 `SpeechRecognitionResult.metadata` 提供，且仅在最终结果中可用。

---

### `SpeechTranscriptionSegment`
转录中的单个片段，通常对应一个词：
- `substring`: 该片段的文本内容。
- `substringRange`: `substring` 在父转录 `formattedString` 中的 UTF-16 字符范围（`{ location: number, length: number }`）。
- `timestamp`: 该片段在音频中开始时间的秒数偏移（相对音频起点）。
- `duration`: 该片段在音频中持续的秒数。
- `confidence`: 该片段识别结果的置信度，范围 `[0.0, 1.0]`。仅最终结果有意义，中间结果通常为 `0`。
- `alternativeSubstrings`: 识别器为该片段考虑过的备选词。

---

### `SpeechRecognitionMetadata`
最终识别结果的汇总语音指标：
- `speakingRate`: 说话速度（每分钟词数）。
- `averagePauseDuration`: 词间平均停顿时长（秒）。
- `speechStartTimestamp`: 用户开始说话在音频中的秒数偏移。
- `speechDuration`: 实际说话内容的总时长（秒）。

---

## 静态属性

### 支持的语言区域
- `supportedLocales`: 返回该语音识别器支持的语言区域列表，如 `"en-US"`、`"fr-FR"` 或 `"zh-CN"` 等。

### 识别状态
- `isRecognizing`: 指示当前是否有识别请求在进行中。

---

## 方法

### 开始实时识别
**`start(options: object): Promise<boolean>`**  
从设备麦克风开始进行语音识别。

#### Options 参数
- `locale`: 识别所用的语言区域字符串（可选）。
- `partialResults`: 是否返回中间结果（默认为 `true`）。
- `addsPunctuation`: 是否自动添加标点符号（默认为 `false`）。
- `requestOnDeviceRecognition`: 是否将音频数据留在本地进行识别（默认为 `false`）。
- `taskHint`: 指定识别任务类型（`'confirmation'`, `'dictation'`, `'search'`, `'unspecified'`）。
- `useDefaultAudioSessionSettings`: 是否使用默认的音频会话设置（默认为 `true`）。
- `preferredInput`: 首选输入端口。`'auto'`（默认）让系统自动选择；`'builtInMic'` 强制使用
  设备内置麦克风——即便此时连接了蓝牙耳机也不走耳机麦。配合默认音频会话设置，可以做到
  「无线耳机播放 + 内置麦克风录音」的分离 I/O，避开蓝牙 HFP 链路对麦克风音质的降级。
  当设备没有 `builtInMic` 可用时，会静默退回到系统默认输入。
- `onResult`: 用于处理识别结果的回调函数（参数类型为 `SpeechRecognitionResult`）。
- `onSoundLevelChanged`: 音量变化时触发的回调函数（可选）。

#### 使用示例
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

### 识别音频文件
**`recognizeFile(options: object): Promise<boolean>`**  
对已录制的音频文件进行识别。

#### Options 参数
- `filePath`: 音频文件的路径。
- `locale`: 识别所用的语言区域字符串（可选）。
- `partialResults`: 是否返回中间结果（默认为 `false`）。
- `addsPunctuation`: 是否自动添加标点符号（默认为 `false`）。
- `requestOnDeviceRecognition`: 是否将音频数据留在本地进行识别（默认为 `false`）。
- `taskHint`: 指定识别任务类型（`'confirmation'`, `'dictation'`, `'search'`, `'unspecified'`）。
- `onResult`: 用于处理识别结果的回调函数（参数类型为 `SpeechRecognitionResult`）。

#### 使用示例
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

### 停止识别
**`stop(): Promise<void>`**  
停止当前正在进行的语音识别。

#### 使用示例
```ts
await SpeechRecognition.stop()
```

---

## 示例

### 实时识别并查看进度
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

### 识别音频文件
```ts
await SpeechRecognition.recognizeFile({
  filePath: FileManager.join(FileManager.documentDirectory, "audio.m4a"),
  partialResults: false,
  onResult: (result) => {
    console.log("File recognition completed. Transcription:", result.text)
  }
})
```

### 查看逐词时间戳与候选词
```ts
await SpeechRecognition.recognizeFile({
  filePath: FileManager.join(FileManager.documentDirectory, "audio.m4a"),
  partialResults: false,
  onResult: (result) => {
    if (!result.isFinal) return

    for (const segment of result.bestTranscription.segments) {
      console.log(
        `[${segment.timestamp.toFixed(2)}s + ${segment.duration.toFixed(2)}s] `
          + `${segment.substring}（置信度 ${segment.confidence.toFixed(2)}）`
      )
      if (segment.alternativeSubstrings.length > 0) {
        console.log("  备选：", segment.alternativeSubstrings.join("、"))
      }
    }

    if (result.metadata) {
      console.log("说话速度（每分钟词数）：", result.metadata.speakingRate)
      console.log("说话总时长（秒）：", result.metadata.speechDuration)
    }

    if (result.transcriptions.length > 1) {
      console.log("候选转录：")
      for (const t of result.transcriptions.slice(1)) {
        console.log(" -", t.formattedString)
      }
    }
  }
})
```

---

### 停止正在进行的识别
```ts
if (await SpeechRecognition.start({
  // ...
})) {
  // 10 秒后停止识别
  setTimeout(() => {
    await SpeechRecognition.stop()
  }, 10 * 1000)
}
```

---

## 注意事项

- 在使用该 API 前，请先确保已获取必要的麦克风或文件访问权限。
- 可以使用 `supportedLocales` 来确定可用于识别的语言。
- 为了获得最佳效果，请使用 iOS 支持的音频格式（例如 `.wav`, `.m4a`）作为输入。