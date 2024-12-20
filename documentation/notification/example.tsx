import { Button, Navigation, NavigationStack, Notification, Script, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function NotificationExample() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle={"Notification"}
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
          title={"Schedule a Notification with actions"}
          code={`Notification.schedule({
  title: "Notification Testing",
  body: "Long Press or Pull Down",
  actions: [
    {
      title: "Widget",
      url: Script.createRunURLScheme(Script.name, {
        doc: "Widget",
      })
    },
    {
      title: "LiveActivity",
      url: Script.createRunURLScheme(Script.name, {
        doc: "LiveActivity",
      })
    }
  ]
})`}
          run={async () => {
            Notification.schedule({
              title: "Notification Testing",
              body: "Long Press or Pull Down",
              actions: [
                {
                  title: "Widget",
                  url: Script.createRunURLScheme(Script.name, {
                    doc: "Widget",
                  })
                },
                {
                  title: "LiveActivity",
                  url: Script.createRunURLScheme(Script.name, {
                    doc: "LiveActivity",
                  })
                }
              ]
            })
          }}
        />

        <APIExample
          title={"Schedule a Notification with Rich Content"}
          code={`Notification.schedule({
  title: "Notification Testing",
  body: "Long Press or Pull Down to show rich content.",
  customUI: true,
  useInfo: {
    title: "AudioRecorder",
    subtitle: "The interface allows you to record audio data to a file. It provides functionalities to start, stop, pause, and manage audio recordings, with configurable settings for audio quality, sample rate, format, and more.",
  }
})`}
          run={async () => {
            Notification.schedule({
              title: "Notification Testing",
              body: "Long Press or Pull Down to show rich content.",
              customUI: true,
              userInfo: {
                title: "AudioRecorder",
                subtitle: "The interface allows you to record audio data to a file. It provides functionalities to start, stop, pause, and manage audio recordings, with configurable settings for audio quality, sample rate, format, and more.",
              }
            })
          }}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}