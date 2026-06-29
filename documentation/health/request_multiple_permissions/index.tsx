import { Button, List, Navigation, NavigationStack, Script, Text } from "scripting"

// 同时触发多个需要授权的 Health API,验证它们会合并成一次 HealthKit 授权弹框。
async function requestTogether() {
  if (!Health.isHealthDataAvailable) {
    await Dialog.alert({ message: "Health data is not available on this device." })
    return
  }

  // Fire several permission-requiring queries at the same time. The app
  // collects the pending authorizations within a short window and shows a
  // single HealthKit permission sheet covering all of them.
  const tasks: Record<string, Promise<unknown>> = {
    "Step Count": Health.queryQuantitySamples("stepCount", { limit: 1 }),
    "Heart Rate": Health.queryQuantitySamples("heartRate", { limit: 1 }),
    "Active Energy": Health.queryQuantitySamples("activeEnergyBurned", { limit: 1 }),
    "Sleep Analysis": Health.queryCategorySamples("sleepAnalysis", { limit: 1 }),
    "Workouts": Health.queryWorkouts({ limit: 1 }),
    "Date of Birth": Health.dateOfBirth(),
  }

  const labels = Object.keys(tasks)
  const results = await Promise.allSettled(Object.values(tasks))

  const summary = results.map((result, index) => {
    const label = labels[index]
    if (result.status === "fulfilled") {
      const value = result.value
      const detail = Array.isArray(value) ? `${value.length} item(s)` : "ok"
      return `${label}: ${detail}`
    }
    return `${label}: failed (${result.reason})`
  }).join("\n")

  console.log(summary)
  await Dialog.alert({ title: "Permission results", message: summary })
}

// 逐个 await 调用:每个请求在下一个开始前就完成授权,因此会弹出多个分开的授权弹框,
// 与上面的"合并请求"形成对照。
async function requestSequentially() {
  if (!Health.isHealthDataAvailable) {
    await Dialog.alert({ message: "Health data is not available on this device." })
    return
  }

  try {
    await Health.queryQuantitySamples("stepCount", { limit: 1 })
    await Health.queryCategorySamples("sleepAnalysis", { limit: 1 })
    await Health.queryWorkouts({ limit: 1 })
    await Dialog.alert({ message: "Sequential requests finished." })
  } catch (error) {
    await Dialog.alert({ title: "Failed", message: String(error) })
  }
}

function Example() {
  return <NavigationStack>
    <List
      navigationTitle={"Multiple Permissions"}
      navigationBarTitleDisplayMode={"inline"}
    >
      <Text
        font={"footnote"}
        foregroundStyle={"secondaryLabel"}
      >
        Calling several permission-requiring Health APIs at once merges their authorization into a single HealthKit sheet.
      </Text>

      <Button
        title={"Request multiple permissions together"}
        action={requestTogether}
      />

      <Button
        title={"Request sequentially (separate sheets)"}
        action={requestSequentially}
      />
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
