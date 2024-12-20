import { APIExample } from "../api_example"

export function OpenURLinAppBrowserExample() {
  return <APIExample
    title={"Open URL in-app browser"}
    code={`await Safari.present("https://github.com")
console.log("Dismissed")`}
    run={async () => {
      await Safari.present("https://github.com", false)
      console.log("Dismissed")
    }}
  />
}