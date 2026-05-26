import { Button, Canvas, HStack, Navigation, NavigationStack, Script, ScrollView, Text, TimelineCanvas, useRef, useState, VStack } from "scripting"

function Example() {
  // Drive a state variable from the screen so the Canvas closure re-runs when you change it.
  // Every re-render replays the commands; nothing animates on its own in Phase 1.
  const [hue, setHue] = useState(0)

  return <NavigationStack>
    <ScrollView>
      <VStack
        navigationTitle={"Canvas"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={28}
        padding
      >

        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          Canvas exposes a Web-Canvas-style 2D context. The `draw` closure is called every time
          SwiftUI re-evaluates the view (state / layout changes). Issue commands on `ctx` —
          `fillRect`, `arc`, `stroke`, etc. — and Swift replays them onto a real SwiftUI
          GraphicsContext.
          {"\n\n"}
          Sizing is controlled by view modifiers (`frame`, `padding`, ...), NOT by canvas props.
          The actual draw size is passed as the second arg to `draw`.
        </Text>

        {/* 1. Basic primitives: fillRect / arc / strokeRect with style strings */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>1. Primitives + colors</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Color strings go through the same parser as the rest of the bridge — `"systemBlue"`,
            hex `"#RRGGBB"`, `"rgba(...)"`, `"accentColor"` are all valid.
          </Text>
          <Canvas
            frame={{ width: 320, height: 160 }}
            draw={(ctx, size) => {
              // Background
              ctx.fillStyle = "systemGray6"
              ctx.fillRect(0, 0, size.width, size.height)

              // Blue square
              ctx.fillStyle = "systemBlue"
              ctx.fillRect(16, 24, 80, 80)

              // Orange stroked square
              ctx.strokeStyle = "systemOrange"
              ctx.lineWidth = 6
              ctx.strokeRect(120, 24, 80, 80)

              // Red filled circle
              ctx.fillStyle = "systemRed"
              ctx.beginPath()
              ctx.arc(264, 64, 36, 0, Math.PI * 2)
              ctx.fill()
            }}
          />
        </VStack>

        {/* 2. save/restore + transforms */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>2. save / restore + transforms</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            `save` pushes the entire context state (transform, opacity, clip, style) onto a stack;
            `restore` pops it. A loop of `save → translate → rotate → fillRect → restore` keeps
            each tick independent.
          </Text>
          <Canvas
            frame={{ width: 320, height: 200 }}
            draw={(ctx, size) => {
              ctx.fillStyle = "systemBackground"
              ctx.fillRect(0, 0, size.width, size.height)

              const cx = size.width / 2
              const cy = size.height / 2
              const tickCount = 12

              ctx.fillStyle = "label"
              for (let i = 0; i < tickCount; i++) {
                ctx.save()
                ctx.translate(cx, cy)
                ctx.rotate((Math.PI * 2 * i) / tickCount)
                ctx.fillRect(-2, -64, 4, 16)
                ctx.restore()
              }

              // Center dot — proves transforms were rolled back.
              ctx.fillStyle = "systemBlue"
              ctx.beginPath()
              ctx.arc(cx, cy, 6, 0, Math.PI * 2)
              ctx.fill()
            }}
          />
        </VStack>

        {/* 3. Linear gradient + drawImage (SF symbol as image source) */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>3. Gradient + drawImage</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            {`\`createLinearGradient(x0, y0, x1, y1)\` returns a \`CanvasGradient\`; add stops and assign
            it to \`fillStyle\`. \`drawImage\` accepts \`{ systemName }\`, \`{ filePath }\` or \`{ image: UIImage }\` —
            the same source forms as the \`Image\` component (Phase 1 supports local sources only).`}
          </Text>
          <Canvas
            frame={{ width: 320, height: 180 }}
            draw={(ctx, size) => {
              const g = ctx.createLinearGradient(0, 0, size.width, size.height)
              g.addColorStop(0, "systemTeal")
              g.addColorStop(1, "systemIndigo")
              ctx.fillStyle = g
              ctx.fillRect(0, 0, size.width, size.height)

              ctx.fillStyle = "white"
              ctx.globalAlpha = 0.9
              ctx.font = 22
              ctx.textAlign = "left"
              ctx.textBaseline = "top"
              ctx.fillText("Linear gradient", 16, 16)

              ctx.globalAlpha = 1
              ctx.drawImage({ systemName: "sparkles" }, size.width - 64, 16, 48, 48)
            }}
          />
        </VStack>

        {/* 4. State-driven redraw */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>4. State-driven redraw</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Tap the button to change a React state. SwiftUI re-evaluates the view, the draw closure
            runs again with the new value, and the canvas redraws.
          </Text>
          <Canvas
            frame={{ width: 320, height: 120 }}
            draw={(ctx, size) => {
              ctx.fillStyle = `hsl(${hue}, 80%, 92%)`
              ctx.fillRect(0, 0, size.width, size.height)

              ctx.fillStyle = `hsl(${hue}, 70%, 45%)`
              ctx.beginPath()
              ctx.arc(size.width / 2, size.height / 2, 36, 0, Math.PI * 2)
              ctx.fill()

              ctx.fillStyle = "label"
              ctx.font = 14
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(`hue: ${hue}°`, size.width / 2, size.height / 2 + 56)
            }}
          />
          <HStack>
            <Button
              title={"Cycle hue"}
              action={() => setHue((hue + 40) % 360)}
              buttonStyle={"borderedProminent"}
              controlSize={"small"}
            />
          </HStack>
        </VStack>

        {/* 5. measureText — synchronously measure text for layout */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>5. measureText</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            `ctx.measureText(text)` returns a `TextMetrics` synchronously — useful for centering,
            drawing a background pill behind a label, or laying out text by hand. Width and
            ascent/descent are reported in the same units as draw coordinates.
          </Text>
          <Canvas
            frame={{ width: 320, height: 140 }}
            draw={(ctx, size) => {
              ctx.fillStyle = "systemGray6"
              ctx.fillRect(0, 0, size.width, size.height)

              const label = "Tap to measure"
              ctx.font = 22

              const m = ctx.measureText(label)
              const padX = 14
              const padY = 8
              const pillW = m.width + padX * 2
              const pillH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + padY * 2
              const cx = size.width / 2
              const cy = size.height / 2

              // Background pill sized to the measured text
              ctx.fillStyle = "systemBlue"
              ctx.beginPath()
              ctx.arc(cx - pillW / 2 + pillH / 2, cy, pillH / 2, Math.PI / 2, -Math.PI / 2)
              ctx.lineTo(cx + pillW / 2 - pillH / 2, cy - pillH / 2)
              ctx.arc(cx + pillW / 2 - pillH / 2, cy, pillH / 2, -Math.PI / 2, Math.PI / 2)
              ctx.lineTo(cx - pillW / 2 + pillH / 2, cy + pillH / 2)
              ctx.fill()

              ctx.fillStyle = "white"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(label, cx, cy)

              ctx.fillStyle = "secondaryLabel"
              ctx.font = 11
              ctx.textBaseline = "bottom"
              ctx.fillText(
                `width=${m.width.toFixed(1)}  ascent=${m.actualBoundingBoxAscent.toFixed(1)}`,
                cx,
                size.height - 8,
              )
            }}
          />
        </VStack>

        {/* 6. shadow */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>6. Shadow</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            `shadowColor / shadowBlur / shadowOffsetX / shadowOffsetY` apply a drop shadow to
            subsequent fills, strokes, text, and images.
          </Text>
          <Canvas
            frame={{ width: 320, height: 160 }}
            draw={(ctx, size) => {
              ctx.fillStyle = "systemBackground"
              ctx.fillRect(0, 0, size.width, size.height)

              ctx.shadowColor = "rgba(0, 0, 0, 0.35)"
              ctx.shadowBlur = 12
              ctx.shadowOffsetX = 4
              ctx.shadowOffsetY = 6

              ctx.fillStyle = "systemBlue"
              ctx.fillRect(24, 24, 100, 80)

              ctx.fillStyle = "systemRed"
              ctx.beginPath()
              ctx.arc(200, 64, 36, 0, Math.PI * 2)
              ctx.fill()

              // Disable shadow for label
              ctx.shadowColor = "rgba(0,0,0,0)"
              ctx.fillStyle = "label"
              ctx.font = 13
              ctx.textAlign = "center"
              ctx.textBaseline = "bottom"
              ctx.fillText("shadow on rect + circle", size.width / 2, size.height - 12)
            }}
          />
        </VStack>

        {/* 7. blend modes */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>7. globalCompositeOperation</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Set `ctx.globalCompositeOperation` to map onto a SwiftUI blend mode for subsequent
            draws. Demo: three overlapping discs in `multiply`.
          </Text>
          <Canvas
            frame={{ width: 320, height: 160 }}
            draw={(ctx, size) => {
              ctx.fillStyle = "white"
              ctx.fillRect(0, 0, size.width, size.height)

              ctx.globalCompositeOperation = "multiply"

              const r = 56
              const cy = size.height / 2
              const offsets = [-44, 0, 44]
              const colors = ["systemRed", "systemGreen", "systemBlue"]
              for (let i = 0; i < 3; i++) {
                ctx.fillStyle = colors[i]
                ctx.beginPath()
                ctx.arc(size.width / 2 + offsets[i], cy, r, 0, Math.PI * 2)
                ctx.fill()
              }
            }}
          />
        </VStack>

        {/* 8. partial ellipse arc */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>8. Partial ellipse arc</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            `ellipse(x, y, rx, ry, rotation, start, end, ccw)` renders only the requested arc.
            Demo: a tilted half-ellipse stroke + filled wedge.
          </Text>
          <Canvas
            frame={{ width: 320, height: 180 }}
            draw={(ctx, size) => {
              ctx.fillStyle = "systemGray6"
              ctx.fillRect(0, 0, size.width, size.height)

              // Tilted ellipse, top half only (start=0, end=π, ccw=true so we sweep the upper arc).
              ctx.strokeStyle = "systemPurple"
              ctx.lineWidth = 6
              ctx.beginPath()
              ctx.ellipse(
                size.width / 2, size.height / 2,
                100, 50,
                -Math.PI / 6,
                0, Math.PI,
                true,
              )
              ctx.stroke()

              // Filled pie wedge: an arc to a point and back
              ctx.fillStyle = "systemOrange"
              ctx.beginPath()
              ctx.moveTo(size.width / 2, size.height / 2)
              ctx.ellipse(
                size.width / 2, size.height / 2,
                70, 30,
                Math.PI / 8,
                -Math.PI / 6, Math.PI / 3,
                false,
              )
              ctx.closePath()
              ctx.fill()
            }}
          />
        </VStack>

        {/* 9. createPattern */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>9. createPattern</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Tile an image as fill. SwiftUI tiles in both axes — `"repeat-x"` / `"repeat-y"` /
            `"no-repeat"` map to the same behavior as `"repeat"` for now.
          </Text>
          <Canvas
            frame={{ width: 320, height: 160 }}
            draw={(ctx, size) => {
              // SF Symbols are black-on-clear templates — paint a backdrop first so the
              // transparent regions don't show through as the canvas's undefined "opaque" color.
              ctx.fillStyle = "systemGray6"
              ctx.fillRect(0, 0, size.width, size.height)

              const pattern = ctx.createPattern({ systemName: "star.fill" }, "repeat")
              ctx.fillStyle = pattern
              ctx.fillRect(0, 0, size.width, size.height)
            }}
          />
        </VStack>

        {/* 10. createConicGradient */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>10. createConicGradient</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            `createConicGradient(startAngle, x, y)` returns a SwiftUI `AngularGradient` — not in
            classic Web Canvas, but included because the mapping is clean.
          </Text>
          <Canvas
            frame={{ width: 320, height: 200 }}
            draw={(ctx, size) => {
              ctx.fillStyle = "systemBackground"
              ctx.fillRect(0, 0, size.width, size.height)

              const cx = size.width / 2
              const cy = size.height / 2
              const g = ctx.createConicGradient(0, cx, cy)
              g.addColorStop(0, "systemRed")
              g.addColorStop(0.17, "systemOrange")
              g.addColorStop(0.33, "systemYellow")
              g.addColorStop(0.5, "systemGreen")
              g.addColorStop(0.67, "systemTeal")
              g.addColorStop(0.83, "systemBlue")
              g.addColorStop(1, "systemPurple")
              ctx.fillStyle = g
              ctx.beginPath()
              ctx.arc(cx, cy, 84, 0, Math.PI * 2)
              ctx.fill()
            }}
          />
        </VStack>

        {/* 11. imageSmoothingEnabled + source-rect crop */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>11. imageSmoothingEnabled</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Set `ctx.imageSmoothingEnabled = false` for nearest-neighbor scaling (pixel art look).
            The 9-arg `drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` form also crops the
            source rect — works best with sufficiently large image sources (`filePath` /
            in-memory `UIImage`); SF Symbols are tiny so source-crop won't show meaningful
            content for them.
          </Text>
          <Canvas
            frame={{ width: 320, height: 140 }}
            draw={(ctx, size) => {
              ctx.fillStyle = "systemGray6"
              ctx.fillRect(0, 0, size.width, size.height)

              // Left: smooth scaling (default)
              ctx.imageSmoothingEnabled = true
              ctx.drawImage({ systemName: "square.grid.3x3.fill" }, 20, 10, 120, 120)

              // Right: nearest-neighbor
              ctx.imageSmoothingEnabled = false
              ctx.drawImage({ systemName: "square.grid.3x3.fill" }, size.width - 140, 10, 120, 120)

              ctx.imageSmoothingEnabled = true
              ctx.fillStyle = "label"
              ctx.font = 11
              ctx.textAlign = "center"
              ctx.textBaseline = "bottom"
              ctx.fillText("smoothing on", 80, size.height - 4)
              ctx.fillText("smoothing off (pixelated)", size.width - 80, size.height - 4)
            }}
          />
        </VStack>

        {/* 12. TimelineCanvas — per-frame animation via SwiftUI TimelineView */}
        <TimelineCanvasDemo />

        {/* 13. TimelineCanvas — particle system, ~100 particles */}
        <TimelineCanvasParticleDemo />

      </VStack>
    </ScrollView>
  </NavigationStack>
}

function TimelineCanvasDemo() {
  // Pause / resume the timeline. The TimelineCanvas keeps the last frame visible while paused.
  const [paused, setPaused] = useState(false)

  // Bouncing ball — state lives in a ref so it survives across frames.
  // (Don't put per-frame state in useState — that triggers React re-renders unnecessarily.)
  const ball = useRef({ x: 60, y: 60, vx: 140, vy: 90, lastTime: 0 })

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>12. TimelineCanvas — per-frame animation</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      Like Canvas, but driven by SwiftUI's TimelineView. The draw closure receives a third
      argument — `time` in seconds since the view mounted — and fires every frame
      (~60fps by default). Per-frame state goes in `useRef`.
    </Text>
    <TimelineCanvas
      frame={{ width: 320, height: 180 }}
      paused={paused}
      draw={(ctx, size, time) => {
        const s = ball.current
        const dt = Math.min(0.05, time - s.lastTime) // clamp dt to avoid huge jumps on resume
        s.lastTime = time

        s.x += s.vx * dt
        s.y += s.vy * dt

        const r = 18
        if (s.x < r) { s.x = r; s.vx = -s.vx }
        if (s.x > size.width - r) { s.x = size.width - r; s.vx = -s.vx }
        if (s.y < r) { s.y = r; s.vy = -s.vy }
        if (s.y > size.height - r) { s.y = size.height - r; s.vy = -s.vy }

        ctx.fillStyle = "systemGray6"
        ctx.fillRect(0, 0, size.width, size.height)

        ctx.fillStyle = "systemBlue"
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "secondaryLabel"
        ctx.font = 11
        ctx.fillText(`t = ${time.toFixed(2)}s`, 8, 16)
      }}
    />
    <HStack>
      <Button title={paused ? "Resume" : "Pause"} action={() => setPaused(!paused)} />
    </HStack>
  </VStack>
}

function TimelineCanvasParticleDemo() {
  // ~100 particles, each a small circle. Demonstrates that TimelineCanvas can drive
  // hundreds of draw commands per frame; keep an eye on the displayed FPS to spot
  // performance regressions.
  //
  // Tip: each particle's color string is pre-computed once and stored on the
  // particle. Generating `hsla(...)` strings every frame would mean 100×
  // toString + 100× Swift-side color parses per tick — measurable in the
  // sub-millisecond range but enough to push a marginal scene under 60fps.
  type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string }
  const state = useRef<{
    particles: Particle[]
    lastTime: number
    fpsSampleTime: number
    fpsSampleCount: number
    fps: number
  } | null>(null)

  if (state.current == null) {
    const particles: Particle[] = []
    for (let i = 0; i < 100; i++) {
      const hue = Math.floor(Math.random() * 360)
      particles.push({
        x: 160 + (Math.random() - 0.5) * 100,
        y: 90 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        r: 3 + Math.random() * 4,
        color: `hsla(${hue}, 80%, 60%, 0.85)`,
      })
    }
    state.current = { particles, lastTime: 0, fpsSampleTime: 0, fpsSampleCount: 0, fps: 0 }
  }

  return <VStack alignment={"leading"} spacing={8}>
    <Text font={"headline"}>13. TimelineCanvas — particles + FPS readout</Text>
    <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
      100 bouncing particles. The "FPS" overlay is computed from `time` deltas; if you see
      it drop well below 60, your scene is too heavy for per-frame mode — switch to a
      coarser `schedule` like `{"{ minimumInterval: 1/30 }"}`.
    </Text>
    <TimelineCanvas
      frame={{ width: 320, height: 180 }}
      draw={(ctx, size, time) => {
        const s = state.current!
        const dt = Math.min(0.05, s.lastTime === 0 ? 0 : time - s.lastTime)
        s.lastTime = time

        // FPS — update every 0.5s
        s.fpsSampleCount++
        if (time - s.fpsSampleTime > 0.5) {
          s.fps = s.fpsSampleCount / (time - s.fpsSampleTime)
          s.fpsSampleCount = 0
          s.fpsSampleTime = time
        }

        ctx.fillStyle = "systemGray6"
        ctx.fillRect(0, 0, size.width, size.height)

        for (const p of s.particles) {
          p.x += p.vx * dt
          p.y += p.vy * dt
          if (p.x < p.r) { p.x = p.r; p.vx = -p.vx }
          if (p.x > size.width - p.r) { p.x = size.width - p.r; p.vx = -p.vx }
          if (p.y < p.r) { p.y = p.r; p.vy = -p.vy }
          if (p.y > size.height - p.r) { p.y = size.height - p.r; p.vy = -p.vy }

          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = "label"
        ctx.font = 12
        ctx.fillText(`fps ~ ${s.fps.toFixed(0)}`, 8, 18)
      }}
    />
  </VStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
