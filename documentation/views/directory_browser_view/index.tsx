import { DirectoryBrowserView, Navigation, NavigationStack, Script } from "scripting"

function Example() {
  return <NavigationStack>
    <DirectoryBrowserView
      title="Script Directory"
      directoryPath={Script.directoryPath}
      onFilesChanged={() => console.log("Files changed")}
    />
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
