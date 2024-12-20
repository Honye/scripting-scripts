import { APIExample } from "../../api_example"

export function AlertExample() {
  return <APIExample
    title={"Present an alert view"}
    code={`await Dialog.alert({
  message: "This is message",
  title: "Alert",
})
console.log("Alert dismissed")`}
    run={async () => {
      await Dialog.alert({
        message: "This is message",
        title: "Alert",
      })
      console.log("Alert dismissed")
    }}
  />
}