import { APIExample } from "../api_example"

export function OpenURLInSystemDefaultBrowserExample() {
  return <APIExample
    title={"Open URL in system default browser"}
    code={`Safari.openURL("https://github.com")`}
    run={() => {
      Safari.openURL("https://github.com")
    }}
  />
}