import { Button, Text, useState } from "scripting"
import { UIExample } from "../../ui_example"

export function PopoverExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <UIExample
    title={"Showing a popover"}
    code={`<Button
  title={"Present"}
  action={() => {
    setIsPresented(true)
  }}
  popover={{
    isPresented: isPresented,
    onChanged: setIsPresented,
    content: <Text padding>Popover content</Text>,
    arrowEdge: "top", // Only has effect on iPadOS and macOS
  }}
/>`}
  >
    <Button
      title={"Show Popover"}
      action={() => {
        setIsPresented(true)
      }}
      popover={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        content: <Text padding>Popover content</Text>,
        arrowEdge: "top", // iPadOS, macOS
      }}
    />
  </UIExample>
}