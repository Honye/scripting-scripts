import {
  Button, CaptureVideoPreviewView, HStack, Navigation,
  NavigationStack, Path, Script, Spacer, Text, Toolbar, ToolbarItem,
  ToolbarItemGroup, useEffect, useMemo, useObservable, VStack
} from "scripting"

function View() {
  const dismiss = Navigation.useDismiss()
  const lastResult = useObservable("")
  const isRunning = useObservable(false)
  const torchOn = useObservable(false)
  const supportsControls = useObservable(false)

  // 一次性建好 session + 输入 + 输出。useMemo 保证 hot reload 时不重复创建。
  const { session, camera, photoOutput, metaOutput } = useMemo(() => {
    const camera = AVCaptureDevice.default("video")!
    const session = new AVCaptureSession()
    const input = new AVCaptureDeviceInput(camera)
    const photoOutput = new AVCapturePhotoOutput()
    const metaOutput = new AVCaptureMetadataOutput()

    session.configure(() => {
      session.sessionPreset = "high"
      if (session.canAddInput(input)) session.addInput(input)
      if (session.canAddOutput(photoOutput)) session.addOutput(photoOutput)
      if (session.canAddOutput(metaOutput)) session.addOutput(metaOutput)
    })

    metaOutput.metadataObjectTypes = ["qr", "code128", "ean13"]
    metaOutput.setMetadataObjectsListener(objects => {
      for (const o of objects) {
        if (o.stringValue) {
          lastResult.setValue(`${o.type}: ${o.stringValue}`)
          break
        }
      }
    })

    return { session, camera, photoOutput, metaOutput }
  }, [])

  useEffect(() => {
    let interaction: AVCaptureEventInteraction | null = null

    async function start() {
      // startRunning 自带权限申请,拒绝时会 reject
      try {
        await session.startRunning()
        isRunning.setValue(true)
      } catch (e) {
        await Dialog.alert({ message: `Failed: ${String(e)}` })
        dismiss()
        return
      }

      // iPhone 16 Camera Control: 系统缩放滑块 + 自定义曝光滑块 + 硬件按键拍照
      if (session.supportsControls) {
        supportsControls.setValue(true)
        const zoom = new AVCaptureSystemZoomSlider(camera)
        const ev = new AVCaptureSlider("EV", "sun.max", {
          range: [-2, 2],
          step: 0.33,
          defaultValue: 0,
          localizedValueFormat: "%.1f",
        })
        ev.setActionHandler(value => {
          camera.setExposureTargetBias(value).catch(console.error)
        })
        session.configure(() => {
          if (session.canAddControl(zoom)) session.addControl(zoom)
          if (session.canAddControl(ev)) session.addControl(ev)
        })

        interaction = new AVCaptureEventInteraction((phase, kind) => {
          if (phase === "ended" && kind === "primary") {
            takePhoto()
          }
        })
        interaction.attach()
      }
    }

    start()

    return () => {
      interaction?.detach()
      metaOutput.setMetadataObjectsListener(null)
      session.stopRunning().finally(() => session.dispose())
    }
  }, [])

  async function takePhoto() {
    try {
      const result = await photoOutput.capturePhoto({ codec: "hevc" })
      await Dialog.alert({
        title: "Captured",
        message: `Photo size: ${result.image.width} × ${result.image.height}`,
      })
    } catch (e) {
      console.error("capturePhoto failed:", e)
    }
  }

  function toggleTorch() {
    if (!camera.hasTorch) return
    const next = torchOn.value ? "off" : "on"
    camera.setTorchMode(next)
    torchOn.setValue(next === "on")
  }

  return (
    <NavigationStack>
      <VStack
        navigationTitle="AVCaptureSession Demo"
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
          frame={{ height: 480 }}
          cornerRadius={12}
          masksToBounds
        />
        <Text>Last scan: {lastResult.value || "—"}</Text>
        <Text font="footnote" foregroundStyle="secondaryLabel">
          Camera Control: {supportsControls.value ? "supported" : "not available on this device"}
        </Text>
        <HStack spacing={12}>
          <Button title="Photo" action={takePhoto} />
          <Button
            title={torchOn.value ? "Torch off" : "Torch on"}
            action={toggleTorch}
            disabled={!camera.hasTorch}
          />
          <Spacer />
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