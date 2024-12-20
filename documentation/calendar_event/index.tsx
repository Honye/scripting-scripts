import { Button, Markdown, Navigation, NavigationStack, Path, ProgressView, Script, ScrollView, useEffect, useState, VStack } from "scripting"
import { APIExample } from "../api_example"

export function CalendarEventExample() {
  const [content, setContent] = useState<string>()

  useEffect(() => {
    (async () => {
      try {
        const content = await FileManager.readAsString(
          Path.join(
            Script.directory,
            "calendar_event/README.md"
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
    navigationTitle={"CalendarEvent"}
    toolbar={{
      topBarTrailing: <Button
        title={"Example"}
        action={() => {
          Navigation.present({
            element: <Example />,
            modalPresentationStyle: "pageSheet"
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
      navigationTitle={"CalendarEvent"}
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
          title={"CalendarEvent.getAll"}
          subtitle={"To identify events that occur within a given date range and calendars."}
          code={`const events = await CalendarEvent.getAll(
  new Date("2024-10-01"),
  new Date("2024-11-30")
)
console.log("All events: \n" + events.map(event => event.title).join("\n"))`}
          run={async log => {
            const events = await CalendarEvent.getAll(
              new Date("2024-10-01"),
              new Date("2024-11-30")
            )
            log("All events: \n" + events.map(event => event.title).join("\n"))
          }}
        />

        <APIExample
          title={"CalendarEvent.presentCreateView"}
          subtitle={""}
          code={`const event = await CalendarEvent.presentCreateView()
console.log("Created event: " + (event?.title ?? "None"))`}
          run={async log => {
            const event = await CalendarEvent.presentCreateView()
            log("Created event: " + (event?.title ?? "None"))
          }}
        />

        <APIExample
          title={"CalendarEvent.presentEditView"}
          subtitle={""}
          code={`const currentDate = new Date()
const events = await CalendarEvent.getAll(
  new Date(Date.now() - 1000 * 60 * 60 * 24),
  currentDate
)

const action = await events[0]?.presentEditView()
console.log("Action:" + action)`}
          run={async log => {
            const currentDate = new Date()
            const events = await CalendarEvent.getAll(
              new Date(Date.now() - 1000 * 60 * 60 * 24),
              currentDate
            )
            
            const action = await events[0]?.presentEditView()
            log("Action:" + action)
          }}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}