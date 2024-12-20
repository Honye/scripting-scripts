import { Text, useState } from "scripting"
import { UIExample } from "../../ui_example"

export function TapGestureExample() {
  const [firstViewTapped, setFirstViewTapped] = useState(false)

  return <UIExample
    title={"Tap Gesture"}
    code={`function TapGestureExample() {
const [firstViewTapped, setFirstViewTapped] = useState(false)

return <Text
    onTapGesture={() => {
      setFirstViewTapped(true)
    }}
  >
  {firstViewTapped
    ? "Tapped"
    : "Tap on me"}
  </Text>
}`}
  >
    <Text
      onTapGesture={() => {
        setFirstViewTapped(true)
      }}
    >
      {firstViewTapped
        ? "Tapped"
        : "Tap on me"}
    </Text>
  </UIExample>
}