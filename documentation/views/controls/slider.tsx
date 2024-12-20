import { useState, Slider, Text, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function SliderExample() {
  const [value, setValue] = useState(15)

  return <UIExample
    title={"Slider"}
    code={`function SliderView() {
  const [value, setValue] = useState(15)
  
  return <Slider
    min={0}
    max={100}
    value={value}
    onChanged={setValue}
    minValueLabel={<Text>0</Text>}
    maxValueLabel={<Text>100</Text>}
  />  
}`}
  >
    <VStack>
      <Slider
        min={0}
        max={100}
        value={value}
        onChanged={setValue}
        label={<Text>{value}</Text>}
        minValueLabel={<Text>0</Text>}
        maxValueLabel={<Text>100</Text>}
      />
      <Text>Current value: {value}</Text>
    </VStack>
  </UIExample>
}