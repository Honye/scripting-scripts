import { useState, useMemo, Color, Stepper, Text, VStack, RoundedRectangle, HStack, Spacer } from "scripting"
import { UIExample } from "../../ui_example"

export function StepperExample() {
  const [value, setValue] = useState(0)
  const colors = useMemo<Color[]>(() => ['blue', 'red', 'green', 'purple'], [])
  const color = colors[value]

  function incrementStep() {
    if (value + 1 >= colors.length) {
      setValue(0)
    } else {
      setValue(value + 1)
    }
  }

  function decrementStep() {
    if (value - 1 < 0) {
      setValue(colors.length - 1)
    } else {
      setValue(value - 1)
    }
  }

  return <UIExample
    title={"Stepper"}
    code={`function StepperView() {
  const [value, setValue] = useState(0)
  const colors = useMemo<Color[]>(() => ['blue', 'red', 'green', 'purple'], [])
  const color = colors[value]

  function incrementStep() {
    if (value + 1 >= colors.length) {
      setValue(0)
    } else {
      setValue(value + 1)
    }
  }

  function decrementStep() {
    if (value - 1 < 0) {
      setValue(colors.length - 1)
    } else {
      setValue(value - 1)
    }
  }

  return <Stepper
    onIncrement={incrementStep}
    onDecrement={decrementStep}
    background={color}
  >
    <Text>Value: {value}, Color: {color}</Text>
  </Stepper>
}`}
  >
    <VStack>
      <Stepper
        title={"Stepper"}
        onIncrement={incrementStep}
        onDecrement={decrementStep}
      />
      <HStack>
        <Text>Value: {value}</Text>
        <Spacer />
        <RoundedRectangle
          fill={color}
          cornerRadius={4}
          frame={{
            width: 120,
            height: 30
          }}
        />
      </HStack>
    </VStack>
  </UIExample>
}