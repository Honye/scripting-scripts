import { Button, Navigation, NavigationStack, Path, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function SpeechRecognitionExample() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle={"SpeechRecognition"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <VStack>
        <APIExample
          title={"SpeechRecognition.supportedLocales"}
          subtitle={"Returns the list of locales that are supported by the speech recognizer."}
          code={`console.log(SpeechRecognition.supportedLocales)`}
          run={log => {
            log(JSON.stringify(SpeechRecognition.supportedLocales, null, 2))
          }}
        />

        <APIExample
          title={"SpeechRecognition.isRecognizing"}
          subtitle={"Returns a boolean that indicates whether the recognizer is running."}
          code={`console.log(SpeechRecognition.isRecognizing)`}
        />

        <APIExample
          title={"SpeechRecognition.start"}
          subtitle={"Start a speech audio buffer recognition request. Return a boolean value that indicates whether the operation was successfully."}
          code={`console.log("Speech recognizing is started, it will stop after 5s.")

if (await SpeechRecognition.start({
  locale: "en-US",
  partialResults: false,
  onResult: result => {
    console.log("Result: " + result.text)
  }
})) {
  setTimeout(async () => {
    if (await SpeechRecognition.stop()) {
      console.log("Stoped")
    } else {
      console.error("Failed to stop recognizing")
    }
  }, 5000)
} else {
  console.error("Failed to start recognizing")
}`}
          run={async log => {
            log("Speech recognizing is started, it will stop after 5s.")

            if (await SpeechRecognition.start({
              locale: "en-US",
              partialResults: false,
              onResult: result => {
                log("Result: " + result.text)
              }
            })) {
              setTimeout(async () => {
                await SpeechRecognition.stop()
                log("Stoped")
              }, 5000)
            } else {
              log("Failed to start recognizing", true)
            }
          }}
        />

        <APIExample
          title={"SpeechRecognition.recognizeFile"}
          subtitle={"Start a request to recognize speech in a recorded audio file."}
          code={`console.log("SpeechRecognition is started, it will stop after 5s.")

const savedPath = Path.join(
  FileManager.temporaryDirectory,
  "tmp_speech.caf"
)

if (await SpeechRecognition.recognizeFile({
  filePath: savedPath,
  partialResults: true,
  onResult: (result) => {
    console.log("Recognized result: " + result.text)
  }
})) {
  console.log("Started recognizing file...")
} else {
  console.error("Failed to start recognizing")
}`}
          run={async log => {
            log("SpeechRecognition is started, it will stop after 5s.")

            let audioFilePathToRecognize = await DocumentPicker.pickFiles({
              types: ["public.audio"]
            })

            if (audioFilePathToRecognize.length === 0) {
              log("Please pick a audio file.")
              return
            }

            if (await SpeechRecognition.recognizeFile({
              filePath: audioFilePathToRecognize[0],
              partialResults: true,
              onResult: (result) => {
                log("Recognized result: " + result.text)
              }
            })) {
              log("Started recognizing file...")
            } else {
              log("Failed to start recognizing", true)
            }
          }}
        />

        <APIExample
          title={"SpeechRecognition.stop"}
          subtitle={"Stop speech recognition request. Return a boolean value that indicates whether the operation was successfully."}
          code={`await SpeechRecognition.stop()`}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}