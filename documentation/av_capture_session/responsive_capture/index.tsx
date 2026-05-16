import {
  Button, CaptureVideoPreviewView, HStack,
  Image, Navigation, NavigationStack, Script, Spacer, Text, Toggle,
  Toolbar, ToolbarItem, useEffect, useMemo, useObservable, VStack
} from "scripting"

type CaptureLog = {
  ms: number
  size: string
  isDeferredProxy: boolean
  index: number
}

function View() {
  const dismiss = Navigation.useDismiss()

  const isRunning = useObservable(false)
  const lastImage = useObservable<UIImage | null>(null)
  const log = useObservable<CaptureLog[]>([])
  const captureCount = useObservable(0)

  // 4 个响应性开关 + 一个能 / 不能控制的标记
  const supports = useObservable({
    zsl: false, resp: false, fast: false, defer: false,
  })

  // 用户当前的开关状态(不一定实际生效, 由 *Supported 决定)
  const zsl = useObservable(false)
  const resp = useObservable(false)
  const fast = useObservable(false)
  const defr = useObservable(false)

  const { session, camera, photoOutput } = useMemo(() => {
    const camera = AVCaptureDevice.default("video")!
    const session = new AVCaptureSession()
    const input = new AVCaptureDeviceInput(camera)
    const photoOutput = new AVCapturePhotoOutput()
    photoOutput.maxPhotoQualityPrioritization = "quality"

    session.configure(() => {
      session.sessionPreset = "photo"
      if (session.canAddInput(input)) session.addInput(input)
      if (session.canAddOutput(photoOutput)) session.addOutput(photoOutput)
    })

    return { session, camera, photoOutput }
  }, [])

  // 把 supported + enabled 状态从 native 重新拉一遍, 并 log 一行方便观察状态机。
  // *Supported 不是常量: fastSupp 依赖 respEn=true, 所以切 resp 之后必须重读。
  function syncFromNative(label: string) {
    const snapshot = {
      zslSupp: photoOutput.isZeroShutterLagSupported,
      respSupp: photoOutput.isResponsiveCaptureSupported,
      fastSupp: photoOutput.isFastCapturePrioritizationSupported,
      deferSupp: photoOutput.isAutoDeferredPhotoDeliverySupported,
      zslEn: photoOutput.isZeroShutterLagEnabled,
      respEn: photoOutput.isResponsiveCaptureEnabled,
      fastEn: photoOutput.isFastCapturePrioritizationEnabled,
      deferEn: photoOutput.isAutoDeferredPhotoDeliveryEnabled,
    }
    supports.setValue({
      zsl: snapshot.zslSupp,
      resp: snapshot.respSupp,
      fast: snapshot.fastSupp,
      defer: snapshot.deferSupp,
    })
    zsl.setValue(snapshot.zslEn)
    resp.setValue(snapshot.respEn)
    fast.setValue(snapshot.fastEn)
    defr.setValue(snapshot.deferEn)
    console.log(`[${label}]`, snapshot)
  }

  useEffect(() => {
    async function start() {
      try {
        await session.startRunning()
        isRunning.setValue(true)
        // 启动后 *Supported 才反映真实硬件能力 + active format
        syncFromNative("startRunning")
      } catch (e) {
        await Dialog.alert({ message: `Failed to start: ${String(e)}` })
        dismiss()
      }
    }
    start()
    return () => {
      session.stopRunning().finally(() => session.dispose())
    }
  }, [])

  function flipZSL(v: boolean) {
    photoOutput.isZeroShutterLagEnabled = v
    syncFromNative(`zsl=${v}`)
  }
  function flipResp(v: boolean) {
    // bridge 在 native 兜底:开 resp 不会自动开 fast(需要单独开);
    // 关 resp 时会先关 fast 保持状态一致。
    photoOutput.isResponsiveCaptureEnabled = v
    syncFromNative(`resp=${v}`)
  }
  function flipFast(v: boolean) {
    // 开 fast 时 bridge 自动把 resp 也开起来(fastSupp 依赖 respEn=true);
    // 关 fast 单独关。
    photoOutput.isFastCapturePrioritizationEnabled = v
    syncFromNative(`fast=${v}`)
  }
  function flipDefer(v: boolean) {
    photoOutput.isAutoDeferredPhotoDeliveryEnabled = v
    syncFromNative(`defer=${v}`)
  }

  async function takeShot() {
    const start = Date.now()
    try {
      const result = await photoOutput.capturePhoto({ codec: "hevc" })
      const ms = Date.now() - start
      const idx = captureCount.value + 1
      captureCount.setValue(idx)
      lastImage.setValue(result.image)
      log.setValue([
        {
          index: idx,
          ms,
          size: `${result.image.width}×${result.image.height}`,
          isDeferredProxy: result.isDeferredProxy,
        },
        ...log.value,
      ].slice(0, 8))
    } catch (e) {
      await Dialog.alert({ message: `capturePhoto failed: ${String(e)}` })
    }
  }

  /** 连拍 5 张, 测响应性体感 */
  async function burst5() {
    for (let i = 0; i < 5; i++) {
      // 不 await 确保连发(响应性开启时这是关键体感)
      takeShot()
    }
  }

  return (
    <NavigationStack>
      <VStack
        navigationTitle="Responsive capture"
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
          frame={{ height: 280 }}
          cornerRadius={12}
          masksToBounds
        />

        <VStack alignment="leading" spacing={4} padding={8}>
          <Text font="caption">Capability (read after startRunning)</Text>
          <Text font="footnote">
            zsl: {String(supports.value.zsl)} · resp: {String(supports.value.resp)} · fast: {String(supports.value.fast)} · defer: {String(supports.value.defer)}
          </Text>
        </VStack>

        <VStack alignment="leading" spacing={6} padding={8}>
          <Toggle
            title="Zero Shutter Lag"
            value={zsl.value}
            onChanged={flipZSL}
            disabled={!supports.value.zsl}
          />
          <Toggle
            title="Responsive Capture"
            value={resp.value}
            onChanged={flipResp}
            disabled={!supports.value.resp}
          />
          <Toggle
            title="Fast Capture Prioritization"
            value={fast.value}
            onChanged={flipFast}
            disabled={!supports.value.fast}
          />
          <Toggle
            title="Auto Deferred Photo Delivery"
            value={defr.value}
            onChanged={flipDefer}
            disabled={!supports.value.defer}
          />
        </VStack>

        <HStack padding={8} spacing={12}>
          <Button title="Single shot" action={takeShot} />
          <Button title="Burst × 5" action={burst5} />
          <Spacer />
          <Text font="footnote" foregroundStyle="secondaryLabel">
            shots: {captureCount.value}
          </Text>
        </HStack>

        {lastImage.value ? (
          <Image
            image={lastImage.value}
            resizable
            scaleToFit
            frame={{ height: 120 }}
          />
        ) : null}

        <VStack alignment="leading" spacing={2} padding={8}>
          <Text font="caption">Recent captures (newest first)</Text>
          {log.value.map(entry => (
            <Text key={entry.index} font="footnote">
              #{entry.index} · {entry.ms}ms · {entry.size}{entry.isDeferredProxy ? " · proxy" : ""}
            </Text>
          ))}
        </VStack>
      </VStack>
    </NavigationStack>
  )
}

async function run() {
  await Navigation.present({ element: <View /> })
  Script.exit()
}

run()
