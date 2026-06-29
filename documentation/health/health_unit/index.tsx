import { Button, List, Navigation, NavigationStack, Script, Section, Text, useState } from "scripting"

// Wrap a unit operation as a "safe" call. On incompatible dimensions or an invalid unit
// string, HealthKit used to raise an Objective-C exception that Swift cannot catch, crashing
// the app outright; it now throws a JS error you can handle with try/catch.
function attempt(fn: () => string): string {
  try {
    return fn()
  } catch (e) {
    return `threw → ${String(e)}`
  }
}

function Example() {
  const dismiss = Navigation.useDismiss()
  const [rows, setRows] = useState<{ label: string; value: string }[] | null>(null)

  const runDemo = () => {
    const out: { label: string; value: string }[] = []

    // 1) Build units: basic / prefixed / compound / parsed from a string. All local, no Health authorization needed.
    const kcal = HealthUnit.kilocalorie()
    const kJ = HealthUnit.jouleUnit(HealthMetricPrefix.kilo)
    const mgPerML = HealthUnit.gramUnit(HealthMetricPrefix.milli)
      .divided(HealthUnit.literUnit(HealthMetricPrefix.milli))
    const parsed = HealthUnit.fromString("g/mL")
    out.push({ label: "Units", value: `${kcal.unitString}, ${kJ.unitString}, ${mgPerML.unitString}, ${parsed.unitString}` })

    // 2) Create an energy sample locally and read it back in another compatible unit — a normal conversion.
    const sample = HealthQuantitySample.create({
      type: "activeEnergyBurned",
      startDate: new Date(),
      endDate: new Date(),
      value: 150,
      unit: kcal,
    })
    if (sample != null) {
      out.push({ label: "150 kcal in kJ", value: `${sample.quantityValue(kJ).toFixed(1)} kJ` })
    }

    // 3) Safety: read the energy sample in an incompatible unit (meter) — throws a catchable error instead of crashing.
    if (sample != null) {
      out.push({
        label: "Read energy as meter",
        value: attempt(() => `unexpected: ${sample.quantityValue(HealthUnit.meter())}`),
      })
    }

    // 4) Safety: parse an invalid unit string — throws a catchable error instead of crashing.
    out.push({
      label: "fromString(\"not-a-unit\")",
      value: attempt(() => `unexpected: ${HealthUnit.fromString("not-a-unit").unitString}`),
    })

    // 5) Safety: create a step-count sample with a mismatched unit (kilogram) — throws a catchable error instead of crashing.
    out.push({
      label: "Create stepCount with kg",
      value: attempt(() => {
        const bad = HealthQuantitySample.create({
          type: "stepCount",
          startDate: new Date(),
          endDate: new Date(),
          value: 100,
          unit: HealthUnit.gramUnit(HealthMetricPrefix.kilo),
        })
        return bad == null ? "rejected (null)" : "unexpected: created"
      }),
    })

    setRows(out)
  }

  return <NavigationStack>
    <List
      navigationTitle={"HealthUnit"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        cancellationAction: <Button title={"Done"} action={dismiss} />,
      }}
    >
      <Text font={"footnote"} foregroundStyle={"secondaryLabel"}>
        Build units, convert between compatible units, and see how incompatible units or invalid unit strings now throw a catchable error instead of crashing the app. Runs locally — no Health authorization required.
      </Text>

      <Button title={"Run"} action={runDemo} />

      {rows != null && <Section header={<Text>Results</Text>}>
        {rows.map((row, i) => <Text key={String(i)} font={"footnote"}>
          {`${row.label}: ${row.value}`}
        </Text>)}
      </Section>}
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
