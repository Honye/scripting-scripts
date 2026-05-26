import {
  Button,
  List,
  Navigation,
  NavigationStack,
  Script,
  Section,
  Text,
  useEffect,
  useState,
  VStack,
} from "scripting"

let activeEngine: HapticEngine | null = null

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds)
  })
}

function logHeader(title: string) {
  console.clear()
  console.present()
  console.log(`Haptics demo: ${title}`)
}

async function runDemo(
  title: string,
  body: () => void | Promise<void>,
  setStatus: (status: string) => void
) {
  logHeader(title)
  setStatus(`Running: ${title}`)
  try {
    await body()
    setStatus(`Done: ${title}`)
    console.log("Done")
  } catch (error) {
    const message = String(error)
    setStatus(`Failed: ${title}`)
    console.error(message)
    await Dialog.alert({
      title,
      message,
    })
  }
}

function disposeActiveEngine() {
  if (!activeEngine) {
    return
  }
  try {
    activeEngine.dispose()
  } catch (error) {
    console.error("dispose failed", String(error))
  }
  activeEngine = null
}

function useEngine(audioSession?: typeof SharedAudioSession | null): HapticEngine {
  disposeActiveEngine()
  const engine = new HapticEngine(audioSession)
  engine.onStopped = reason => {
    console.log("engine.onStopped", reason)
  }
  engine.onReset = () => {
    console.log("engine.onReset")
  }
  activeEngine = engine
  return engine
}

function makePulsePattern(): HapticPattern {
  return new HapticPattern([
    new HapticEvent("hapticTransient", [
      new HapticEventParameter("hapticIntensity", 1),
      new HapticEventParameter("hapticSharpness", 0.85),
    ], 0),
    new HapticEvent("hapticTransient", [
      new HapticEventParameter("hapticIntensity", 0.6),
      new HapticEventParameter("hapticSharpness", 0.4),
    ], 0.16),
    new HapticEvent("hapticContinuous", [
      new HapticEventParameter("hapticIntensity", 0.35),
      new HapticEventParameter("hapticSharpness", 0.25),
      new HapticEventParameter("attackTime", 0.02),
      new HapticEventParameter("releaseTime", 0.12),
    ], 0.32, 0.45),
  ])
}

function makeDynamicPattern(): HapticPattern {
  return new HapticPattern([
    new HapticEvent("hapticContinuous", [
      new HapticEventParameter("hapticIntensity", 0.35),
      new HapticEventParameter("hapticSharpness", 0.25),
    ], 0, 1.1),
  ], [
    new HapticDynamicParameter("hapticIntensityControl", 0.8, 0.2),
    new HapticParameterCurve("hapticSharpnessControl", [
      new HapticParameterCurveControlPoint(0, 0.1),
      new HapticParameterCurveControlPoint(0.35, 1),
      new HapticParameterCurveControlPoint(0.9, 0.2),
    ], 0),
  ])
}

function makeAHAPData(): Data {
  const exported = makePulsePattern().exportDictionary()
  const data = Data.fromRawString(JSON.stringify(exported))
  if (!data) {
    throw new Error("Failed to create AHAP Data.")
  }
  return data
}

function Example() {
  const dismiss = Navigation.useDismiss()
  const [status, setStatus] = useState("Ready")

  useEffect(() => {
    return () => {
      disposeActiveEngine()
    }
  }, [])

  return <NavigationStack>
    <List
      navigationTitle={"Haptics"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        cancellationAction: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <Section header={<Text>Status</Text>}>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>supportsHaptics</Text>
          <Text font={"caption"}>{String(Haptics.supportsHaptics)}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>supportsAudio</Text>
          <Text font={"caption"}>{String(Haptics.supportsAudio)}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>last run</Text>
          <Text font={"caption"}>{status}</Text>
        </VStack>
      </Section>

      <Section
        header={<Text>Convenience</Text>}
        footer={<Text>These helpers create and reuse an internal engine.</Text>}
      >
        <Button
          title={"Haptics.transient(1, 0.8)"}
          action={() => runDemo("Haptics.transient", async () => {
            await Haptics.transient(1, 0.8)
          }, setStatus)}
        />
        <Button
          title={"Haptics.continuous(0.45, 0.6, 0.25)"}
          action={() => runDemo("Haptics.continuous", async () => {
            await Haptics.continuous(0.45, 0.6, 0.25)
          }, setStatus)}
        />
      </Section>

      <Section
        header={<Text>Engine</Text>}
        footer={<Text>Tests the constructors, capability properties, start, stop, and dispose.</Text>}
      >
        <Button
          title={"new HapticEngine() start/stop"}
          action={() => runDemo("HapticEngine default", async () => {
            const engine = useEngine()
            console.log("HapticEngine.supportsHaptics", HapticEngine.supportsHaptics)
            console.log("HapticEngine.supportsAudio", HapticEngine.supportsAudio)
            engine.autoShutdownEnabled = true
            engine.start()
            console.log("isRunning after start", engine.isRunning)
            await engine.stop()
            console.log("isRunning after stop", engine.isRunning)
            disposeActiveEngine()
          }, setStatus)}
        />
        <Button
          title={"new HapticEngine(SharedAudioSession)"}
          action={() => runDemo("HapticEngine SharedAudioSession", async () => {
            const engine = useEngine(SharedAudioSession)
            await engine.startAsync()
            console.log("currentTime", engine.currentTime)
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
        <Button
          title={"new HapticEngine(null)"}
          action={() => runDemo("HapticEngine null audio session", async () => {
            const engine = useEngine(null)
            engine.start()
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
      </Section>

      <Section
        header={<Text>Pattern Player</Text>}
        footer={<Text>Builds events and parameters, then plays them through a reusable player.</Text>}
      >
        <Button
          title={"HapticEvent + HapticPattern + makePlayer"}
          action={() => runDemo("Pattern player", async () => {
            const engine = useEngine()
            const pattern = makePulsePattern()
            console.log("pattern.duration", pattern.duration)
            engine.start()
            const player = engine.makePlayer(pattern)
            player.start(0)
            await wait(1000)
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
        <Button
          title={"sendParameters + scheduleParameterCurve"}
          action={() => runDemo("Dynamic parameters", async () => {
            const engine = useEngine()
            const pattern = makeDynamicPattern()
            engine.start()
            const player = engine.makePlayer(pattern)
            player.start(0)
            player.sendParameters([
              new HapticDynamicParameter("hapticIntensityControl", 1, 0),
              new HapticDynamicParameter("hapticSharpnessControl", 0.8, 0),
            ], 0.18)
            player.scheduleParameterCurve(
              new HapticParameterCurve("hapticIntensityControl", [
                new HapticParameterCurveControlPoint(0, 0.2),
                new HapticParameterCurveControlPoint(0.4, 1),
                new HapticParameterCurveControlPoint(0.8, 0.1),
              ], 0),
              0.25
            )
            await wait(1500)
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
        <Button
          title={"makeAdvancedPlayer pause/resume/seek"}
          action={() => runDemo("Advanced player", async () => {
            const engine = useEngine()
            const pattern = new HapticPattern([
              new HapticEvent("hapticContinuous", [
                new HapticEventParameter("hapticIntensity", 0.5),
                new HapticEventParameter("hapticSharpness", 0.5),
              ], 0, 1.6),
            ])
            engine.start()
            const player = engine.makeAdvancedPlayer(pattern)
            player.completionHandler = error => {
              console.log("advanced completion", error ? String(error) : "ok")
            }
            player.playbackRate = 1
            player.start(0)
            await wait(350)
            player.pause(0)
            console.log("paused")
            await wait(250)
            player.seek(0.5)
            player.resume(0)
            console.log("resumed from offset 0.5")
            await wait(1200)
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
      </Section>

      <Section
        header={<Text>AHAP</Text>}
        footer={<Text>Uses exportDictionary, fromDictionary, fromData, fromFile, and playPatternFromData.</Text>}
      >
        <Button
          title={"exportDictionary + fromDictionary"}
          action={() => runDemo("AHAP dictionary", async () => {
            const engine = useEngine()
            const dictionary = makePulsePattern().exportDictionary()
            console.log(JSON.stringify(dictionary, null, 2))
            const pattern = HapticPattern.fromDictionary(dictionary)
            engine.start()
            engine.makePlayer(pattern).start(0)
            await wait(1000)
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
        <Button
          title={"fromData + playPatternFromData"}
          action={() => runDemo("AHAP Data", async () => {
            const engine = useEngine()
            const data = makeAHAPData()
            const pattern = HapticPattern.fromData(data)
            console.log("data.size", data.size)
            console.log("pattern.duration", pattern.duration)
            engine.start()
            engine.playPatternFromData(data)
            await wait(1000)
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
        <Button
          title={"fromFile"}
          action={() => runDemo("AHAP file", async () => {
            const path = `${FileManager.temporaryDirectory}/haptics-demo.ahap`
            const json = JSON.stringify(makePulsePattern().exportDictionary())
            FileManager.writeAsStringSync(path, json)
            const engine = useEngine()
            const pattern = HapticPattern.fromFile(path)
            console.log("file", path)
            console.log("pattern.duration", pattern.duration)
            engine.start()
            engine.makePlayer(pattern).start(0)
            await wait(1000)
            await engine.stop()
            disposeActiveEngine()
          }, setStatus)}
        />
      </Section>

      <Section
        header={<Text>Error Semantics</Text>}
        footer={<Text>Native throwing APIs should surface as JavaScript errors.</Text>}
      >
        <Button
          title={"Invalid event type throws"}
          action={() => runDemo("Invalid event type", async () => {
            try {
              new HapticEvent("badType" as HapticEventType, [], 0)
              throw new Error("Expected invalid event type to throw.")
            } catch (error) {
              console.log("Caught expected error:", String(error))
              await Dialog.alert({
                title: "Caught expected error",
                message: String(error),
              })
            }
          }, setStatus)}
        />
        <Button
          title={"Negative relativeTime throws"}
          action={() => runDemo("Negative relativeTime", async () => {
            try {
              new HapticDynamicParameter("hapticIntensityControl", 1, -0.1)
              throw new Error("Expected negative relativeTime to throw.")
            } catch (error) {
              console.log("Caught expected error:", String(error))
              await Dialog.alert({
                title: "Caught expected error",
                message: String(error),
              })
            }
          }, setStatus)}
        />
        <Button
          title={"Invalid AHAP Data throws"}
          action={() => runDemo("Invalid AHAP Data", async () => {
            const data = Data.fromRawString("{\"not\":\"ahap\"}")
            if (!data) {
              throw new Error("Failed to create invalid Data.")
            }
            try {
              HapticPattern.fromData(data)
              throw new Error("Expected invalid AHAP data to throw.")
            } catch (error) {
              console.log("Caught expected error:", String(error))
              await Dialog.alert({
                title: "Caught expected error",
                message: String(error),
              })
            }
          }, setStatus)}
        />
      </Section>
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  disposeActiveEngine()
  Script.exit()
}

run()
