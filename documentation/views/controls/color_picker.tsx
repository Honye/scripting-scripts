import { Color, ColorPicker, Text, useState } from "scripting"
import { UIExample } from "../../ui_example"

export function ColorPickerExample() {
  const [value, setValue] = useState<Color>('blue')

  return <UIExample
    title={"Color Picker"}
    code={`// Color picker with title
<ColorPicker
  value={value}
  onChanged={setValue}
  title="Pick a color"
/>

// Color Picker with custom label
<ColorPicker
  value={value}
  onChanged={setValue}
>
  <Text>Current color: {value}</Text>
</ColorPicker>`}
  >
    <ColorPicker
      value={value}
      onChanged={setValue}
    >
      <Text>Current color: {value}</Text>
    </ColorPicker>
  </UIExample>
}