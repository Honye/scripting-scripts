import { Button, Markdown, Navigation, NavigationStack, Path, ProgressView, Script, ScrollView, useEffect, useState, VStack } from "scripting"
import { APIExample } from "../api_example"

export function CalendarExample() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "calendar/README.md"
          )
        )
        setContent(content)
      } catch (e) {
        Dialog.alert({
          message: "Failed to load document content."
        })
      }
    })()
  }, [])

  return <ScrollView
    navigationTitle={"Calendar"}
    toolbar={{
      topBarTrailing: <Button
        title={"Example"}
        action={() => {
          Navigation.present({
            element: <Example />,
            modalPresentationStyle: "pageSheet",
          })
        }}
      />
    }}
  >
    <VStack
      padding
    >
      {
        content != null
          ? <Markdown
            content={content}
          />
          : <ProgressView
            progressViewStyle={"circular"}
          />
      }
    </VStack>
  </ScrollView>
}

function Example() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle={"Calendar"}
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
          title={"Calendar.presentChooser"}
          subtitle={"Present a calendar chooser view."}
          code={`const result = await Calendar.presentChooser(
  true // allow multiple selection
)
console.log("Selected calendars: \n" + result.map(calendar => calendar.title).join("  \n"))`}
          run={async log => {
            const result = await Calendar.presentChooser(true)
            log("Selected calendars: \n" + result.map(calendar => calendar.title).join("  \n"))
          }}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}