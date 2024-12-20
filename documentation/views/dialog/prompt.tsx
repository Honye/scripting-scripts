import { APIExample } from "../../api_example"

export function PromptExample() {
  return <APIExample
    title={"Present a prompt view"}
    code={`const result = await Dialog.prompt({
  title: "Rename script",
  placeholder: "Enter script name",
})

Dialog.alert({
  message: result == null
    ? "You cancel the prompt"
    : "The new script name is: " + result
})`}
    run={async () => {
      const result = await Dialog.prompt({
        title: "Rename script",
        placeholder: "Enter script name",
      })

      Dialog.alert({
        message: result == null
          ? "You cancel the prompt"
          : "The new script name is: " + result
      })
    }}
  />
}