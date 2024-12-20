import { Button, useState } from "scripting"
import { UIExample } from "../../ui_example"

export function PresentConfirmationDialogExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <UIExample
    title={"Present a confirmation dialog"}
    code={`<Button
  title={"Present"}
  action={() => {
    setIsPresented(true)
  }}
  confirmationDialog={{
    isPresented,
    onChanged: setIsPresented,
    title: "Do you want to delete this image?",
    actions: <Button
      title={"Delete"}
      role={"destructive"}
      action={() => {
        Dialog.alert({
          message: "The image has been deleted."
        })
      }}
    />
  }}
/>`}
  >
    <Button
      title={"Present"}
      action={() => {
        setIsPresented(true)
      }}
      confirmationDialog={{
        isPresented,
        onChanged: setIsPresented,
        title: "Do you want to delete this image?",
        actions: <Button
          title={"Delete"}
          role={"destructive"}
          action={() => {
            Dialog.alert({
              message: "The image has been deleted."
            })
          }}
        />
      }}
    />
  </UIExample>
}