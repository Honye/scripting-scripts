import { Button, List, Navigation, NavigationStack, Script, Section, Text } from "scripting"

// 准备一个示例文件,返回其绝对路径。
async function makeSampleFile(): Promise<string> {
  const path = FileManager.documentsDirectory + "/document-interaction-sample.txt"
  await FileManager.writeAsString(path, "Hello from Scripting!\nPick an app to open this file.")
  return path
}

function Example() {
  return <NavigationStack>
    <List
      navigationTitle={"DocumentInteraction"}
      navigationBarTitleDisplayMode={"inline"}
    >
      <Section
        footer={<Text>Presents the system "Open in…" menu so the user can pick an app to open the file with. iOS has no API to open a file directly in its default app.</Text>}
      >
        <Button
          title={"openInMenu"}
          action={async () => {
            try {
              const path = await makeSampleFile()
              const app = await DocumentInteraction.openInMenu(path)
              await Dialog.alert({
                message: app != null ? `Opened in: ${app}` : "Dismissed without choosing an app.",
              })
            } catch (e) {
              await Dialog.alert({ title: "Failed", message: String(e) })
            }
          }}
        />

        <Button
          title={"optionsMenu"}
          action={async () => {
            try {
              const path = await makeSampleFile()
              const app = await DocumentInteraction.optionsMenu(path)
              await Dialog.alert({
                message: app != null ? `Opened in: ${app}` : "Dismissed, or a non-open action was performed.",
              })
            } catch (e) {
              await Dialog.alert({ title: "Failed", message: String(e) })
            }
          }}
        />
      </Section>
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
