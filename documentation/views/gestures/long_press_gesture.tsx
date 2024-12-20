import { useState, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function LongPressGestureExample() {
  const [isPopoverPresented, setIsPopoverPresented] = useState(false)

  return <UIExample
    title={"Long Press Gesture"}
    code={`function LongPressGestureExample() {
  const [isPopoverPresented, setIsPopoverPresented] = useState(false)
  
  return <Text
    onLongPressGesture={() => {
      setIsPopoverPresented(true)
    }}
    popover={{
      isPresented: isPopoverPresented,
      onChanged: setIsPopoverPresented,
      content: <Text
        font={"headline"}
        padding
      >The popover content</Text>
    }}
  >Long press here</Text>
}`}
  >
    <Text
      onLongPressGesture={() => {
        setIsPopoverPresented(true)
      }}
      popover={{
        isPresented: isPopoverPresented,
        onChanged: setIsPopoverPresented,
        content: <Text
          font={"headline"}
          padding
        >The popover content</Text>
      }}
    >Long press here</Text>
  </UIExample>
}