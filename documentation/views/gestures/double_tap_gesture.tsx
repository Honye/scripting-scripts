import { useState, Color, Image } from "scripting"
import { UIExample } from "../../ui_example"

export function DoubleTapGestureExample() {
  const [color, setColor] = useState<Color>("gray")
  const colors: Color[] = ["systemBlue", "systemRed", "systemOrange", "systemYellow", "systemPurple"]

  return <UIExample
    title={"Double tap to toggle the color"}
    code={`function DoubleTapGestureExample() {
  const [color, setColor] = useState<Color>("gray")
  const colors: Color[] = ["systemBlue", "systemRed", "systemOrange", "systemYellow", "systemPurple"]

  return <Image
    systemName={"heart.fill"}
    resizable
    frame={{
      width: 100,
      height: 100,
    }}
    foregroundStyle={color}
    onTapGesture={{
      count: 2,
      perform: () => {
        const index = Math.floor(Math.random() * colors.length)
        setColor(colors[index])
      }
    }}
  />
}`}
  >
    <Image
      systemName={"heart.fill"}
      resizable
      frame={{
        width: 100,
        height: 100,
      }}
      foregroundStyle={color}
      onTapGesture={{
        count: 2,
        perform: () => {
          const index = Math.floor(Math.random() * colors.length)
          setColor(colors[index])
        }
      }}
    />
  </UIExample>
}