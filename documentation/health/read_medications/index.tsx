import { Button, List, Navigation, NavigationStack, Script, Section, Text, useState } from "scripting"

// 把一次服药事件格式化成一行可读文本。
function describeDose(dose: HealthMedicationDoseEvent): string {
  const parts: string[] = [dose.logStatus]
  if (dose.doseQuantity != null) {
    parts.push(`${dose.doseQuantity} ${dose.unit.unitString}`)
  }
  parts.push(dose.startDate.toLocaleString())
  return parts.join(" · ")
}

// 服药事件详情页:用某个用药的 identifier 只取它的 dose events,演示两个 API 的串联。
function DoseEventsView({
  medication,
}: {
  medication: HealthUserAnnotatedMedication
}) {
  const dismiss = Navigation.useDismiss()
  const [doses, setDoses] = useState<HealthMedicationDoseEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const end = new Date()
      const start = new Date(end.getTime() - 30 * 86400 * 1000) // 近 30 天
      const result = await Health.queryMedicationDoseEvents({
        startDate: start,
        endDate: end,
        medicationConceptIdentifiers: [medication.medication.identifier],
        sortDescriptors: [{ key: "startDate", order: "reverse" }],
      })
      setDoses(result)
    } catch (e) {
      setError(String(e))
    }
  }

  return <NavigationStack>
    <List
      navigationTitle={medication.nickname ?? medication.medication.displayText}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        cancellationAction: <Button title={"Done"} action={dismiss} />,
        confirmationAction: <Button title={"Load"} action={load} />,
      }}
    >
      {error != null
        ? <Text foregroundStyle={"systemRed"}>{error}</Text>
        : doses == null
          ? <Text foregroundStyle={"secondaryLabel"}>Tap “Load” to read the dose events from the last 30 days.</Text>
          : doses.length === 0
            ? <Text foregroundStyle={"secondaryLabel"}>No dose events found.</Text>
            : <Section header={<Text>{`${doses.length} dose event(s)`}</Text>}>
                {doses.map(dose => <Text key={dose.uuid}>{describeDose(dose)}</Text>)}
              </Section>}
    </List>
  </NavigationStack>
}

function Example() {
  const [medications, setMedications] = useState<HealthUserAnnotatedMedication[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 查询用户在「健康」中跟踪的用药。首次调用会触发 per-object 授权(系统弹「选择药物」)。
  const loadMedications = async () => {
    if (!Health.isHealthDataAvailable) {
      await Dialog.alert({ message: "Health data is not available on this device." })
      return
    }
    setError(null)
    try {
      const result = await Health.queryMedications({ isArchived: false })
      setMedications(result)
    } catch (e) {
      // iOS 26 以下会在这里 reject。
      setError(String(e))
    }
  }

  const openDoses = (medication: HealthUserAnnotatedMedication) => {
    Navigation.present({ element: <DoseEventsView medication={medication} /> })
  }

  return <NavigationStack>
    <List
      navigationTitle={"Medications"}
      navigationBarTitleDisplayMode={"inline"}
    >
      <Text font={"footnote"} foregroundStyle={"secondaryLabel"}>
        Reads the medications tracked in the Health app and their logged doses. Requires iOS 26 and grants access to the medications you choose.
      </Text>

      <Button title={"Load medications"} action={loadMedications} />

      {error != null
        ? <Text foregroundStyle={"systemRed"}>{error}</Text>
        : medications == null
          ? null
          : medications.length === 0
            ? <Text foregroundStyle={"secondaryLabel"}>No medications found.</Text>
            : <Section header={<Text>{`${medications.length} medication(s)`}</Text>}>
                {medications.map(item => <Button
                  key={item.medication.identifier}
                  action={() => openDoses(item)}
                >
                  <Text>{item.nickname ?? item.medication.displayText}</Text>
                  <Text font={"footnote"} foregroundStyle={"secondaryLabel"}>
                    {`${item.medication.generalForm}${item.hasSchedule ? " · scheduled" : ""}`}
                  </Text>
                </Button>)}
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
