import { ProgressView, Text, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"
import { UIExampleSection } from "../../ui_example_section"

export function ProgressViewExample() {
  const [timerFrom] = useState(() => Date.now())
  const timerTo = timerFrom + 1000 * 60

  return <UIExample
    title={"ProgressView"}
    code={`// circular
<ProgressView
  progressViewStyle={'circular'}
/>

// linear
<ProgressView
  progressViewStyle={'linear'}
  total={100}
  value={50}
  label={<Text>Progress 50%</Text>}
  currentValueLabel={<Text>50</Text>}
/>

// TimerInterval
<ProgressView
  progressViewStyle={'linear'}
  timerFrom={timerFrom}
  timerTo={timerTo}
  countsDown={false}
  label={<Text>Workout</Text>}
/>
`}
  >
    <VStack spacing={16}>
      <UIExampleSection
        title={'circular'}
      >
        <ProgressView
          progressViewStyle={'circular'}
        />
      </UIExampleSection>

      <UIExampleSection
        title={'linear'}
      >
        <ProgressView
          progressViewStyle={'linear'}
          total={100}
          value={50}
          label={<Text>Progress 50%</Text>}
          currentValueLabel={<Text>50</Text>}
        />
      </UIExampleSection>

      <UIExampleSection
        title={'TimerInterval'}
      >
        <ProgressView
          progressViewStyle={'linear'}
          timerFrom={timerFrom}
          timerTo={timerTo}
          countsDown={false}
          label={<Text>Workout</Text>}
        />
      </UIExampleSection>
    </VStack>
  </UIExample>
}