import {
  Button, CaptureVideoPreviewView, HStack, Menu, Navigation, NavigationStack,
  Picker, Script, Spacer, Text, Toolbar, ToolbarItem,
  useEffect, useMemo, useObservable, VStack
} from "scripting"

const STAB_MODES = ["off", "standard", "cinematic", "cinematicExtended", "auto"] as const
type StabMode = typeof STAB_MODES[number]

const POI_PRESETS: { label: string; point: { x: number; y: number } }[] = [
  { label: "Center", point: { x: 0.5, y: 0.5 } },
  { label: "Top-L", point: { x: 0.2, y: 0.2 } },
  { label: "Top-R", point: { x: 0.8, y: 0.2 } },
  { label: "Bot-L", point: { x: 0.2, y: 0.8 } },
  { label: "Bot-R", point: { x: 0.8, y: 0.8 } },
]

function View() {
  const dismiss = Navigation.useDismiss()

  const isRunning = useObservable(false)
  const interruption = useObservable("—")
  const lastPOI = useObservable("—")
  const activeStabilization = useObservable("off")
  const recording = useObservable(false)
  const paused = useObservable(false)
  const progress = useObservable("—")
  const recordedFile = useObservable("")
  const stabMode = useObservable<StabMode>("auto")

  // 录制进度计时器句柄(稳定引用,跨 render 不重建)。
  const timer = useMemo<{ id: number | null }>(() => ({ id: null }), [])

  const { session, camera, movieOutput } = useMemo(() => {
    const camera = AVCaptureDevice.default("video")!
    const session = new AVCaptureSession()
    const input = new AVCaptureDeviceInput(camera)
    const movieOutput = new AVCaptureMovieFileOutput()

    session.configure(() => {
      session.sessionPreset = "high"
      if (session.canAddInput(input)) session.addInput(input)
      if (session.canAddOutput(movieOutput)) session.addOutput(movieOutput)
    })

    return { session, camera, movieOutput }
  }, [])

  // 中断监听
  useEffect(() => {
    session.addInterruptionListener((event, reason) => {
      if (event === "began") {
        interruption.setValue(`began · ${reason || "unknown"}`)
      } else {
        interruption.setValue("ended")
      }
    })
  }, [])

  // 启动 session + 初始稳定化
  useEffect(() => {
    async function start() {
      try {
        await session.startRunning()
        isRunning.setValue(true)
        // session.addOutput 之后 movieOutput 才有 video connection
        movieOutput.setVideoStabilizationMode(stabMode.value)
        activeStabilization.setValue(movieOutput.videoStabilizationMode)
        // 新增 API:可录制 codec 列表 + connections
        console.log("availableVideoCodecTypes:", movieOutput.availableVideoCodecTypes.join(", "))
        console.log("movieOutput connections:", movieOutput.connections.length)
      } catch (e) {
        await Dialog.alert({ message: `Failed to start: ${String(e)}` })
        dismiss()
      }
    }
    start()
    return () => {
      stopProgressTimer()
      session.stopRunning().finally(() => session.dispose())
    }
  }, [])

  function applyPOI(p: { x: number; y: number }) {
    let did = false
    if (camera.isFocusPointOfInterestSupported) {
      camera.setFocusPointOfInterest(p)
      camera.setFocusMode("autoFocus")
      did = true
    }
    if (camera.isExposurePointOfInterestSupported) {
      camera.setExposurePointOfInterest(p)
      camera.setExposureMode("continuousAutoExposure")
      did = true
    }
    lastPOI.setValue(
      did
        ? `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`
        : "device does not support POI"
    )
  }

  function chooseStabilization(mode: StabMode) {
    stabMode.setValue(mode)
    const ok = movieOutput.setVideoStabilizationMode(mode)
    if (!ok) {
      lastPOI.setValue("setVideoStabilizationMode → false (no video connection?)")
      return
    }
    // active 在 startRunning 后由系统决定; 这里多读几次让 UI 反映现实
    activeStabilization.setValue(movieOutput.videoStabilizationMode)
  }

  function stopProgressTimer() {
    if (timer.id != null) {
      clearTimeout(timer.id)
      timer.id = null
    }
  }

  // 自递归 setTimeout(脚本环境只保证 setTimeout/clearTimeout)。每 0.5s 读一次
  // 新增的录制进度 API:recordedDuration / recordedFileSize / isRecordingPaused。
  function tickProgress() {
    const secs = movieOutput.recordedDuration.toFixed(1)
    const kb = (movieOutput.recordedFileSize / 1024).toFixed(0)
    progress.setValue(`${secs}s · ${kb} KB${movieOutput.isRecordingPaused ? " · paused" : ""}`)
    if (recording.value) {
      timer.id = setTimeout(tickProgress, 500)
    }
  }

  async function toggleRecording() {
    if (recording.value) {
      await movieOutput.stopRecording()
      return
    }
    try {
      const path = `${FileManager.documentsDirectory}/session_control_clip.mov`
      try { FileManager.removeSync(path) } catch { }
      recording.setValue(true)
      paused.setValue(false)
      timer.id = setTimeout(tickProgress, 500)
      const finalPath = await movieOutput.startRecording(path)
      recordedFile.setValue(finalPath)
      // 录制结束后 active 可能与录制中不同, 再读一次
      activeStabilization.setValue(movieOutput.videoStabilizationMode)
    } catch (e) {
      await Dialog.alert({ message: `Recording failed: ${String(e)}` })
    } finally {
      stopProgressTimer()
      recording.setValue(false)
      paused.setValue(false)
    }
  }

  // 新增 API:暂停 / 恢复当前录制(iOS 18+;更早系统是 no-op)。
  function togglePause() {
    if (!recording.value) return
    if (movieOutput.isRecordingPaused) {
      movieOutput.resumeRecording()
    } else {
      movieOutput.pauseRecording()
    }
    paused.setValue(movieOutput.isRecordingPaused)
  }

  return (
    <NavigationStack>
      <VStack
        navigationTitle="PR A · session control"
        toolbar={
          <Toolbar>
            <ToolbarItem placement="topBarTrailing">
              <Button title="Done" systemImage="xmark" action={dismiss} />
            </ToolbarItem>
          </Toolbar>
        }
      >
        <CaptureVideoPreviewView
          session={session}
          videoDevice={camera}
          videoGravity="resizeAspectFill"
          frame={{ height: 360 }}
          cornerRadius={12}
          masksToBounds
        />

        <VStack alignment="leading" spacing={4} padding={8}>
          <Text font="caption">Status</Text>
          <Text font="footnote">
            running: {String(isRunning.value)} · stabilization (active): {activeStabilization.value}
          </Text>
          <Text font="footnote">interruption: {interruption.value}</Text>
          <Text font="footnote">last POI: {lastPOI.value}</Text>
          <Text font="footnote">recording progress: {progress.value}</Text>
          {recordedFile.value ? (
            <Text font="footnote" foregroundStyle="secondaryLabel">
              saved → {recordedFile.value}
            </Text>
          ) : null}
        </VStack>

        <VStack alignment="leading" spacing={4} padding={8}>
          <Text font="caption">Tap-to-focus presets</Text>
          <HStack spacing={6}>
            {POI_PRESETS.map(p => (
              <Button
                key={p.label}
                title={p.label}
                action={() => applyPOI(p.point)}
              />
            ))}
          </HStack>
        </VStack>

        <HStack padding={8}>
          <Text font="caption">Stabilization</Text>
          <Spacer />
          <Menu title={stabMode.value}>
            <Picker
              title="Stabilization"
              value={stabMode.value}
              onChanged={(v: string) => chooseStabilization(v as StabMode)}
            >
              {STAB_MODES.map(m => (
                <Text key={m} tag={m}>{m}</Text>
              ))}
            </Picker>
          </Menu>
        </HStack>

        <HStack padding={8}>
          <Button
            title={recording.value ? "Stop recording" : "Start recording"}
            action={toggleRecording}
          />
          <Button
            title={paused.value ? "Resume" : "Pause"}
            action={togglePause}
            disabled={!recording.value}
          />
          <Spacer />
          <Text font="footnote" foregroundStyle="secondaryLabel">
            Tip: ⌘+H (simulator: Hardware → Home) triggers a background interruption.
          </Text>
        </HStack>
      </VStack>
    </NavigationStack>
  )
}

async function run() {
  await Navigation.present({ element: <View /> })
  Script.exit()
}

run()
