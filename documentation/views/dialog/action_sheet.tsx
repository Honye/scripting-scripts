import { APIExample } from "../../api_example"

export function ActionSheetExample() {
  return <APIExample
    title={"Present an action sheet view"}
    code={`const selectedIndex = await Dialog.actionSheet({
  title: "Are you sure to delete this script?",
  message: "This operation cannot be undone.",
  cancelButton: true,
  actions: [
    {
      label: "Delete",
      destructive: true,
    }
  ]
})

if (selectedIndex === 0) {
  Dialog.alert({
    message: "The script has been deleted."
  })
}`}
    run={async () => {
      const selectedIndex = await Dialog.actionSheet({
        title: "Are you sure to delete this script?",
        message: "This operation cannot be undone.",
        cancelButton: true,
        actions: [
          {
            label: "Delete",
            destructive: true,
          }
        ]
      })

      if (selectedIndex === 0) {
        Dialog.alert({
          message: "The script is deleted."
        })
      }
    }}
  />
}