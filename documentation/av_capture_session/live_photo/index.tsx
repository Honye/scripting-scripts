import {
  Button, CaptureVideoPreviewView, HStack, Image,
  Navigation, NavigationStack, Script, Spacer, Text, Toolbar, ToolbarItem,
  useEffect, useMemo, useObservable, VStack
} from "scripting"

type Shot = {
  index: number
  image: UIImage
  photoSize: string
  /** native 写盘的原始 still bytes(HEIC/JPEG),含 Live Photo asset identifier */
  photoURL?: string
  movieURL?: string
  movieSize?: number
  ms: number
  isDeferredProxy: boolean
}

function View() {
  const dismiss = Navigation.useDismiss()
  const isRunning = useObservable(false)
  const shots = useObservable<Shot[]>([])
  const captureCount = useObservable(0)
  const lastError = useObservable("")
  const livePhotoSupp = useObservable(false)
  const livePhotoEn = useObservable(false)

  const { session, camera, photoOutput } = useMemo(() => {
    const camera = AVCaptureDevice.default("video")!
    const session = new AVCaptureSession()
    const input = new AVCaptureDeviceInput(camera)
    const photoOutput = new AVCapturePhotoOutput()

    session.configure(() => {
      session.sessionPreset = "photo"
      if (session.canAddInput(input)) session.addInput(input)
      if (session.canAddOutput(photoOutput)) session.addOutput(photoOutput)
    })

    // 必须在 addOutput 之后查 supported,在那之前 photoOutput 没绑 session 时 supported=false。
    return { session, camera, photoOutput }
  }, [])

  useEffect(() => {
    async function start() {
      try {
        await session.startRunning()
        isRunning.setValue(true)

        // Live Photo 必须开启 enabled 之后才会真正生效。
        photoOutput.isLivePhotoCaptureEnabled = true
        // 读回真实值: 不支持的设备 setter 会被 clamp 回 false。
        livePhotoSupp.setValue(photoOutput.isLivePhotoCaptureSupported)
        livePhotoEn.setValue(photoOutput.isLivePhotoCaptureEnabled)

        console.log("[startRunning]", {
          preset: session.sessionPreset,
          liveSupp: photoOutput.isLivePhotoCaptureSupported,
          liveEn:   photoOutput.isLivePhotoCaptureEnabled,
        })
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

  async function takeLivePhoto() {
    const idx = captureCount.value + 1
    captureCount.setValue(idx)
    const ts = Date.now()
    // 同时让 native 写盘 still + .mov。两份文件共享 Apple Maker Note 里的
    // Live Photo asset identifier, Photos.saveLivePhoto 才能 pair 上。
    const photoFile = `${FileManager.documentsDirectory}/live_${idx}_${ts}.heic`
    const movieFile = `${FileManager.documentsDirectory}/live_${idx}_${ts}.mov`
    const start = Date.now()
    try {
      const result = await photoOutput.capturePhoto({
        codec: "hevc",
        photoFile,
        livePhotoMovieFile: movieFile,
        livePhotoVideoCodec: "hevc",
      })
      const ms = Date.now() - start

      // 读 movie 文件大小供 UI 显示
      let movieSize: number | undefined
      if (result.livePhotoMovieFileURL) {
        try {
          const stat = await FileManager.stat(result.livePhotoMovieFileURL)
          movieSize = stat.size
        } catch { /* ignore */ }
      }

      shots.setValue([{
        index: idx,
        image: result.image,
        photoSize: `${result.image.width}×${result.image.height}`,
        photoURL: result.photoFileURL,
        movieURL: result.livePhotoMovieFileURL,
        movieSize,
        ms,
        isDeferredProxy: result.isDeferredProxy,
      }, ...shots.value].slice(0, 6))
      lastError.setValue("")
    } catch (e) {
      lastError.setValue(String(e))
    }
  }

  /** 不开 Live Photo,验证退化路径:resolve 不应包含 livePhotoMovieFileURL */
  async function takeRegular() {
    const idx = captureCount.value + 1
    captureCount.setValue(idx)
    const start = Date.now()
    try {
      const result = await photoOutput.capturePhoto({ codec: "hevc" })
      shots.setValue([{
        index: idx,
        image: result.image,
        photoSize: `${result.image.width}×${result.image.height}`,
        movieURL: result.livePhotoMovieFileURL,  // 应为 undefined
        ms: Date.now() - start,
        isDeferredProxy: result.isDeferredProxy,
      }, ...shots.value].slice(0, 6))
      lastError.setValue("")
    } catch (e) {
      lastError.setValue(String(e))
    }
  }

  /**
   * 把最新一张 Live Photo 配对存进系统照片库。
   * 关键: `imagePath` 必须用 native 写盘的 `result.photoFileURL`(原始 HEIC,
   * 含 Apple Maker Note 里的 Live Photo asset identifier),用 toJPEGData 重编码
   * 出来的 JPEG 会丢这个 identifier, Photos.saveLivePhoto 报 PHPhotosError 3302。
   * `shouldMoveFile: true` 会把磁盘上两个文件 move 进 Photos,本地副本就消失了。
   */
  async function saveLast() {
    const last = shots.value[0]
    if (!last) {
      lastError.setValue("Capture a Live Photo first")
      return
    }
    if (!last.photoURL || !last.movieURL) {
      lastError.setValue("Last capture missing photoURL or movieURL (was it a Regular shot?)")
      return
    }
    try {
      await Photos.saveLivePhoto({
        imagePath: last.photoURL,
        videoPath: last.movieURL,
        shouldMoveFile: true,
      })
      lastError.setValue(`Saved Live Photo #${last.index} to Photos library`)
    } catch (e) {
      lastError.setValue(`Save failed: ${String(e)}`)
      console.error(e)
    }
  }

  /** 故意关掉 enabled 再调 Live Photo,期望 promise reject */
  async function probeReject() {
    photoOutput.isLivePhotoCaptureEnabled = false
    livePhotoEn.setValue(photoOutput.isLivePhotoCaptureEnabled)
    try {
      await photoOutput.capturePhoto({
        livePhotoMovieFile: `${FileManager.documentsDirectory}/should_reject.mov`,
      })
      lastError.setValue("Unexpected: did not reject")
    } catch (e) {
      lastError.setValue(`OK (rejected): ${String(e)}`)
    } finally {
      // 恢复 enabled 方便继续测
      photoOutput.isLivePhotoCaptureEnabled = true
      livePhotoEn.setValue(photoOutput.isLivePhotoCaptureEnabled)
    }
  }

  return (
    <NavigationStack>
      <VStack
        navigationTitle="Live Photo capture"
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
          <Text font="caption">Status</Text>
          <Text font="footnote">
            running: {String(isRunning.value)} · liveSupp: {String(livePhotoSupp.value)} · liveEn: {String(livePhotoEn.value)}
          </Text>
          {lastError.value ? (
            <Text font="footnote" foregroundStyle="red">
              {lastError.value}
            </Text>
          ) : null}
        </VStack>

        <HStack padding={8} spacing={10}>
          <Button title="Live Photo" action={takeLivePhoto} />
          <Button title="Regular" action={takeRegular} />
          <Button title="Save last" action={saveLast} />
          <Button title="Probe reject" action={probeReject} />
          <Spacer />
          <Text font="footnote" foregroundStyle="secondaryLabel">
            shots: {captureCount.value}
          </Text>
        </HStack>

        {shots.value[0] ? (
          <Image
            image={shots.value[0].image}
            resizable
            scaleToFit
            frame={{ height: 140 }}
          />
        ) : null}

        <VStack alignment="leading" spacing={2} padding={8}>
          <Text font="caption">Recent captures (newest first)</Text>
          {shots.value.map(s => (
            <Text key={s.index} font="footnote">
              #{s.index} · {s.ms}ms · {s.photoSize}
              {s.isDeferredProxy ? " · proxy" : ""}
              {s.movieURL
                ? ` · mov ${s.movieSize ? Math.round(s.movieSize / 1024) + "KB" : "?"}`
                : " · no .mov"}
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
