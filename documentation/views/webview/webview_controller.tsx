import { Button, HStack, Text, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function WebViewControllerExample() {
  const [logs, setLogs] = useState<{
    content: string
    error: boolean
  }[]>([])

  function addLog(content: string, error = false) {
    setLogs(logs => [...logs, { content, error }])
  }

  async function run() {
    setLogs([])
    const controller = new WebViewController()

    addLog("WebViewController created.")
    addLog("Start loading...")

    if (await controller.loadURL("https://github.com")) {
      addLog("Website is loaded.")
      addLog("Calling controller.evaluateJavaScript...")
      const title = await controller.evaluateJavaScript<string | null>("document.title")

      if (title != null) {
        addLog(`Title: ${title}`)
      } else {
        addLog("Failed to get the title.", true)
      }
    } else {
      addLog("Failed to load the website.", true)
    }

    controller.dispose()
    addLog("The controller is disposed.")
  }

  return <UIExample
    title={"WebView controller"}
    code={code}
  >
    <VStack
      frame={{
        maxWidth: "infinity"
      }}
      alignment={"leading"}
    >
      <Text font={"headline"}>This example will follow these steps:</Text>
      <VStack
        padding={{
          leading: 16
        }}
        spacing={16}
        foregroundStyle={"secondaryLabel"}
        alignment={"leading"}
      >
        <Text>Create a WebViewController instane</Text>
        <Text>Load https://github.com</Text>
        <Text>Call evaluateJavaScript and get the title of the website</Text>
      </VStack>
      <HStack
        alignment={"center"}
        frame={{
          maxWidth: "infinity"
        }}
      >
        <Button
          title={"Run"}
          action={run}
        />
      </HStack>

      <VStack
        alignment={"leading"}
        spacing={8}
      >
        {logs.map(log =>
          <Text
            font={"caption"}
            monospaced
            padding={{
              leading: 16
            }}
            foregroundStyle={log.error ? "systemRed" : "systemGreen"}
          >{log.content}</Text>
        )}
      </VStack>
    </VStack>
  </UIExample>
}

const code = `const controller = new WebViewController()
if (await controller.loadURL("https://github.com")) {
  const title = await controller.evaluateJavaScript("document.title")

  if (typeof title === "string") {
    // process the title
  }
} else {
  // loaded failure
}

controller.dispose()
`