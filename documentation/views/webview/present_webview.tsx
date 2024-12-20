import { Button } from "scripting"
import { UIExample } from "../../ui_example"

export function PresentWebViewExample() {

  function run() {
    const controller = new WebViewController()
    controller.loadURL("https://github.com")

    controller.present({
      fullscreen: true,
      navigationTitle: "Github"
    }).then(() => {
      console.log("WebView is dismissed")
      controller.dispose()
    })
  }

  return <UIExample
    title={"Present a WebView as a independent page"}
    code={code}
  >
    <Button
      title={"Present"}
      action={run}
    />
  </UIExample>
}

const code = `const controller = new WebViewController()
controller.loadURL("https://github.com")

controller.present(
  true // present the WebView in fullscreen
).then(() => {
  console.log("WebView is dismissed")
  controller.dispose()
})`