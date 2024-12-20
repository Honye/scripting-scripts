import { Picker, PickerStyle, ScrollView, Text, useMemo, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"
import { UIExampleSection } from "../../ui_example_section"

export function PickerExample() {
  const [value, setValue] = useState<number>(0)
  const options = useMemo<PickerStyle[]>(() => [
    'automatic',
    'inline',
    'menu',
    'navigationLink',
    'palette',
    'segmented',
    'wheel'
  ], [])
  const users = useMemo<string[]>(() => [
    "Jobs", "Elon", "Zack", "Joe"
  ], [])

  return <ScrollView>
    <UIExample
      title={"Picker"}
      code={`function PickerView() {
  const [value, setValue] = useState(0)
  const users = useMemo<string[]>(() => [
    "Jobs", "Elon", "Zack", "Joe"
  ], [])

  return <Picker
    title="MyPicker"
    value={value}
    onChanged={setValue}
    pickerStyle="wheel"
  >
    {users.map((user, index) =>
      <Text tag={index}>
      {user}
      </Text>
    )}
  </Picker>
}`}
    >
      <VStack spacing={16}>
        {options.map((style) => <UIExampleSection
          title={"Picker: " + style}
        >
          <Picker
            title={"Picker: " + style}
            pickerStyle={style}
            value={value}
            onChanged={setValue}
          >
            {users.map((user, index) =>
              <Text
                tag={index}
              >{user}</Text>
            )}
          </Picker>
        </UIExampleSection>
        )}
      </VStack>
    </UIExample>
  </ScrollView>
}