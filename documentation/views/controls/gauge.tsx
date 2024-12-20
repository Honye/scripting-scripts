import { Gauge, ScrollView, Text, VStack } from "scripting"
import { UIExample } from "../../ui_example"
import { UIExampleSection } from "../../ui_example_section"

export function GaugeExample() {

  return <ScrollView>
    <UIExample
      title={"Gauge"}
      code={`// accessoryCircular
<Gauge
  value={0.4}
  label={<Text>0 100</Text>}
  currentValueLabel={<Text>40%</Text>}
  gaugeStyle={"accessoryCircular"}
  tint={"systemGreen"}
/>

// accessoryCircularCapacity
<Gauge
  value={0.4}
  label={<Text>Battery Level</Text>}
  currentValueLabel={<Text>40%</Text>}
  gaugeStyle={"accessoryCircularCapacity"}
/>

// linearCapacity
<Gauge
  value={0.4}
  label={<Text>Battery Level</Text>}
  currentValueLabel={<Text>40%</Text>}
  gaugeStyle={"linearCapacity"}
/>

// accessoryLinear
<Gauge
  value={0.4}
  label={<Text>Battery Level</Text>}
  currentValueLabel={<Text>40%</Text>}
  gaugeStyle={"accessoryLinear"}
/>

// accessoryLinearCapacity
<Gauge
  value={0.4}
  label={<Text>Battery Level</Text>}
  currentValueLabel={<Text>40%</Text>}
  gaugeStyle={"accessoryLinearCapacity"}
/>`}
    >
      <VStack>
        <UIExampleSection
          title={"accessoryCircular"}
        >
          <Gauge
            value={0.4}
            label={<Text>0 100</Text>}
            currentValueLabel={<Text>40%</Text>}
            gaugeStyle={"accessoryCircular"}
            tint={"systemGreen"}
          />
        </UIExampleSection>

        <UIExampleSection
          title={"accessoryCircularCapacity"}
        >
          <Gauge
            value={0.4}
            label={<Text>Battery Level</Text>}
            currentValueLabel={<Text>40%</Text>}
            gaugeStyle={"accessoryCircularCapacity"}
          />
        </UIExampleSection>

        <UIExampleSection
          title={"linearCapacity"}
        >
          <Gauge
            value={0.4}
            label={<Text>Battery Level</Text>}
            currentValueLabel={<Text>40%</Text>}
            gaugeStyle={"linearCapacity"}
          />
        </UIExampleSection>

        <UIExampleSection
          title={"accessoryLinear"}
        >
          <Gauge
            value={0.4}
            label={<Text>Battery Level</Text>}
            currentValueLabel={<Text>40%</Text>}
            gaugeStyle={"accessoryLinear"}
          />
        </UIExampleSection>
        <UIExampleSection
          title={"accessoryLinearCapacity"}
        >
          <Gauge
            value={0.4}
            label={<Text>Battery Level</Text>}
            currentValueLabel={<Text>40%</Text>}
            gaugeStyle={"accessoryLinearCapacity"}
          />
        </UIExampleSection>
      </VStack>
    </UIExample>
  </ScrollView>
}