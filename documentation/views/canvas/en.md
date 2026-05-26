`Canvas` is a SwiftUI-Canvas-backed view that exposes a Web-Canvas-style 2D drawing
context. The JS-side `CanvasRenderingContext` is a command collector — every method
call or setter records an entry. SwiftUI replays the queue onto a real
`GraphicsContext` every time the view re-evaluates (state / layout changes).

---

## When to use it

- You already know the Web Canvas API and want to bring scripts over with minimal
  rewriting.
- You need imperative drawing (custom charts, sparklines, dashboards, badges,
  signatures, generative art) that doesn't fit neatly into the declarative `Shape` /
  `Rectangle` / `Chart` primitives.
- The drawing depends on data your script computes at render time — not on a 60fps
  animation loop.

For per-frame animation, use `<TimelineCanvas>` instead — it shares the same draw
API but ticks at ~60fps via SwiftUI's `TimelineView`. The closure of `<Canvas>`
runs at React-class frequency (state / layout changes), not per frame.

---

## Basic usage

```tsx
<Canvas
  frame={{ width: 300, height: 200 }}
  draw={(ctx, size) => {
    ctx.fillStyle = "systemBlue"
    ctx.fillRect(0, 0, size.width, size.height)

    ctx.save()
    ctx.translate(size.width / 2, size.height / 2)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 4
    ctx.strokeRect(-40, -40, 80, 80)
    ctx.restore()
  }}
/>
```

### Props

| Prop      | Type                                              | Description                                                                 |
|-----------|---------------------------------------------------|-----------------------------------------------------------------------------|
| `draw`    | `(ctx: CanvasRenderingContext, size) => void`     | Required. Called on every redraw with a fresh ctx and the actual draw size. |
| `opaque`  | `boolean`                                         | Defaults to `true`, matching SwiftUI's default.                             |

There are no `width` / `height` props — use any standard view modifier (`frame`,
`padding`, `aspectRatio`, ...) to size the canvas. The real draw size is provided to
`draw` as its second argument.

The `draw` function must be pure with respect to React state — don't call
`setState` inside it. Any return value is ignored.

---

## Supported API surface

### State stack

`save()` — push the full context state (transform, opacity, clip, style) onto a stack.
`restore()` — pop the top of the stack back into the current context.

### Transforms

| Method                                                 | Notes                                            |
|--------------------------------------------------------|--------------------------------------------------|
| `translate(x, y)`                                      |                                                  |
| `rotate(angle)`                                        | `angle` in radians.                              |
| `scale(x, y)`                                          |                                                  |
| `transform(a, b, c, d, e, f)`                          | Concatenates the matrix onto the current one.    |
| `setTransform(a, b, c, d, e, f)`                       | Replaces the current matrix.                     |
| `resetTransform()`                                     |                                                  |

### Paths

`beginPath`, `closePath`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`,
`arc`, `arcTo`, `rect`, `ellipse`.

`ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise)` renders the
specified partial elliptical arc, with full support for all parameters.

### Drawing

| Method                                  | Notes                                                              |
|-----------------------------------------|--------------------------------------------------------------------|
| `fill(rule?)`                           | `rule` may be `"nonzero"` (default) or `"evenodd"`.                |
| `stroke()`                              | Uses current `strokeStyle` + line settings.                        |
| `fillRect(x, y, w, h)`                  |                                                                    |
| `strokeRect(x, y, w, h)`                |                                                                    |
| `clearRect(x, y, w, h)`                 | Uses `.clear` blend mode; behavior on opaque canvases differs from Web — to reset to a background color, draw with `fillRect`. |
| `clip(rule?)`                           | Adds the current path as a clipping region; subsequent draws are masked. Use `save` / `restore` to remove the clip later. |

### Text

`fillText(text, x, y, maxWidth?)`, `strokeText(text, x, y, maxWidth?)`.

- `font` accepts a number (`14` → `system(size: 14)`), a SwiftUI font name
  (`"caption"`, `"headline"`, ...), or a `{ name, size }` custom font object — same
  shape as the rest of the bridge.
- `textAlign` / `textBaseline` map to a SwiftUI anchor for `context.draw(_:at:anchor:)`.
- `strokeText` falls back to filling with `strokeStyle`. Outline-only
  text rendering is not yet supported.

#### measureText

```tsx
ctx.font = 22
const m = ctx.measureText("Hello")
//   m.width
//   m.actualBoundingBoxAscent / actualBoundingBoxDescent  (glyph bounds from baseline)
//   m.fontBoundingBoxAscent / fontBoundingBoxDescent      (font-design ascent / descent)
```

`measureText` is **synchronous** — it round-trips to the host and returns immediately,
so you can use the result to lay out subsequent draw commands (centering, pill
backgrounds, manual line breaks). It uses the current `ctx.font` value and reports
sizes in the same units as draw coordinates.

The metrics come from UIKit (`NSAttributedString` + `UIFont`). For SwiftUI text-style
fonts (`"headline"`, `"body"`, ...) the measurement uses
`UIFont.preferredFont(forTextStyle:)`, so width respects the user's current Dynamic
Type setting. SwiftUI's own rendering may differ from UIKit by less than a point on
edge-case glyphs.

### Images

```tsx
ctx.drawImage({ systemName: "star.fill" }, 16, 16, 32, 32)
ctx.drawImage({ filePath: "/some/local/path.png" }, 0, 0)
ctx.drawImage({ image: someUIImage }, 0, 0, 80, 80)
```

- Accepts `{ systemName }` for SF Symbols, `{ filePath }` for files on disk, or
  `{ image: UIImage }` for an in-memory `UIImage`.
- The 9-argument form (`sx, sy, sw, sh, dx, dy, dw, dh`) crops the source
  region before drawing it into the destination rect.
- `imageSmoothingEnabled = false` switches to nearest-neighbor interpolation for
  this canvas (useful for pixel art).
- Remote URLs are not supported here — use the `Image` component for async loading.

### Style state

The same setters and getters as Web canvas:

- `fillStyle`, `strokeStyle` — string color (see below), `CanvasGradient`, or
  `CanvasPattern`.
- `lineWidth`, `lineCap`, `lineJoin`, `miterLimit`, `setLineDash([...])` /
  `getLineDash()`, `lineDashOffset`.
- `globalAlpha` — applied as the SwiftUI context opacity.
- `font`, `textAlign`, `textBaseline`.
- `shadowOffsetX`, `shadowOffsetY`, `shadowBlur`, `shadowColor` — drop-shadow
  state applied to subsequent `fill` / `stroke` / `fillText` / `drawImage`.
- `globalCompositeOperation` — blend mode for subsequent draws (see below).
- `imageSmoothingEnabled` — controls bitmap interpolation for `drawImage`.

### Color strings

`fillStyle` / `strokeStyle` color strings go through the same parser as the rest of
the bridge. The following are all valid:

- Named SwiftUI / system colors: `"systemBlue"`, `"systemGray6"`, `"label"`,
  `"secondaryLabel"`, `"accentColor"`.
- Hex: `"#0a84ff"`, `"#fff"`.
- `"rgb(r, g, b)"` / `"rgba(r, g, b, a)"`.
- `"hsl(h, s%, l%)"` / `"hsla(h, s%, l%, a)"` — hue in degrees, saturation /
  lightness with the trailing `%`, alpha 0–1.

### Gradients

```tsx
const g = ctx.createLinearGradient(0, 0, size.width, size.height)
g.addColorStop(0, "systemTeal")
g.addColorStop(1, "systemIndigo")
ctx.fillStyle = g
ctx.fillRect(0, 0, size.width, size.height)
```

`createRadialGradient(x0, y0, r0, x1, y1, r1)` is also available.
`createConicGradient(startAngle, x, y)` (a SwiftUI `AngularGradient`) is available
as well — not in classic Web Canvas but accepted because the mapping is clean.

Gradient end-points are in canvas pixel coordinates, matching Web Canvas behavior.

> **Radial gradient note:** Web's `createRadialGradient` takes two circles (focal
> point + outer circle); SwiftUI only accepts a single center with start / end radii.
> The bridge uses the second circle's center `(x1, y1)` and treats `r0` / `r1` as
> the start / end radii — visually identical when `r0 ≈ 0` (the common case),
> otherwise the focal-point offset is approximated away.

### Patterns

```tsx
const pattern = ctx.createPattern({ systemName: "star.fill" }, "repeat")
ctx.fillStyle = pattern
ctx.fillRect(0, 0, size.width, size.height)
```

`ctx.createPattern(image, repetition)` returns a `CanvasPattern` you can assign to
`fillStyle` or `strokeStyle`. `image` uses the same source forms as `drawImage`.

> **Limitation:** SwiftUI's tiled-image shading tiles in both axes. `"repeat-x"`,
> `"repeat-y"`, and `"no-repeat"` are accepted by the API but currently behave the
> same as `"repeat"`. Use `ctx.clip(...)` to mask the unwanted axis if you need
> single-axis tiling.

### Shadows

```tsx
ctx.shadowColor   = "rgba(0,0,0,0.5)"
ctx.shadowBlur    = 10
ctx.shadowOffsetX = 4
ctx.shadowOffsetY = 6
ctx.fillStyle = "systemBlue"
ctx.fillRect(40, 40, 120, 80)
```

Shadow state applies to subsequent `fill` / `stroke` / `fillText` / `drawImage`
operations. Set `shadowColor` to a transparent color (or set `shadowBlur` and
both offsets back to `0`) to disable. `shadowBlur` follows Web semantics —
it's the Gaussian blur radius, not the standard deviation.

### Blend modes

```tsx
ctx.globalCompositeOperation = "multiply"
```

Supported values: `"source-over"` (default), `"multiply"`, `"screen"`,
`"overlay"`, `"darken"`, `"lighten"`, `"color-dodge"`, `"color-burn"`,
`"hard-light"`, `"soft-light"`, `"difference"`, `"exclusion"`, `"hue"`,
`"saturation"`, `"color"`, `"luminosity"`, `"plus-lighter"`,
`"destination-over"`.

Unsupported values silently fall back to `"source-over"`. Web's full set of
Porter-Duff modes (`"source-in"`, `"destination-in"`, `"xor"`, etc.) doesn't have
a 1:1 SwiftUI mapping and isn't included.

---

## Performance

The `draw` closure is invoked **synchronously from inside SwiftUI's Canvas closure**.
That closure runs at React-class frequency (state / layout changes), not at 60fps —
each invocation costs one JSCore round-trip plus a JSON serialization of the
commands array, which lands in the millisecond range for typical drawings (hundreds
of commands).

Keep the draw body lightweight: avoid heavy computation, large allocations, or
captures of huge objects. Don't issue thousands of `arc` segments where a single
`bezierCurveTo` would do.

---

---

## TimelineCanvas (per-frame animation)

`<Canvas>` re-runs its draw closure only when React re-evaluates the view (state /
layout changes). For `requestAnimationFrame`-style animation — bouncing balls,
particles, sweeping clocks, generative loops — wrap the same drawing API in a
`<TimelineCanvas>` instead. Under the hood it pairs SwiftUI's
`Canvas` with a `TimelineView`, so the draw closure fires on every frame the
scheduler hands out (~60fps by default).

```tsx
import { TimelineCanvas, useRef, useState } from "scripting"

function BouncingBall() {
  const [paused, setPaused] = useState(false)
  const ball = useRef({ x: 30, y: 30, vx: 140, vy: 90, lastT: 0 })

  return <>
    <TimelineCanvas
      frame={{ width: 320, height: 180 }}
      paused={paused}
      draw={(ctx, size, time) => {
        const s = ball.current
        // clamp dt so resuming after pause doesn't fling the ball
        const dt = Math.min(0.05, time - s.lastT)
        s.lastT = time

        s.x += s.vx * dt
        s.y += s.vy * dt
        const r = 18
        if (s.x < r || s.x > size.width - r) s.vx = -s.vx
        if (s.y < r || s.y > size.height - r) s.vy = -s.vy

        ctx.fillStyle = "systemGray6"
        ctx.fillRect(0, 0, size.width, size.height)
        ctx.fillStyle = "systemBlue"
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
        ctx.fill()
      }}
    />
    <Button title={paused ? "Resume" : "Pause"} action={() => setPaused(!paused)} />
  </>
}
```

### Differences from `<Canvas>`

| | `<Canvas>` | `<TimelineCanvas>` |
|---|---|---|
| Closure runs on | state / layout changes | every frame (~60fps default) |
| Third argument | — | `time` in seconds since mount |
| Cost per invocation | once per redraw | once per tick, on the main thread |
| Right for... | charts, data-driven visuals | animation, particles, clocks |

### Props

| Prop | Type | Description |
|---|---|---|
| `draw` | `(ctx, size, time) => void` | Required. `time` is **seconds since the view first appeared**, not a Unix timestamp. |
| `paused` | `boolean` | When `true`, SwiftUI stops the timeline and the last drawn frame stays on screen. Two-way: flipping this from `useState` halts / resumes immediately. |
| `schedule` | `"animation"` \| `"periodic"` \| `{ minimumInterval: number }` | Tick cadence. Defaults to `"animation"` (~60fps). Use `{ minimumInterval: 1/30 }` for ~30fps; `"periodic"` ticks once per second (suitable for clocks). |
| `opaque` | `boolean` | Defaults to `true`. |

### Per-frame state

The `draw` closure is recreated on every React render. For state that must survive
across frames (particle arrays, positions, accumulators), keep it in a `useRef` or
in module scope — exactly like classic Web Canvas + `rAF`:

```tsx
const particles = useRef<{ x: number, y: number }[]>([])
```

Don't store per-frame state in `useState` — that would trigger a React re-render on
every frame, which is wasted work.

### Time semantics

`time` is **relative to view mount**, in seconds. Two implications:

1. After ~hours the value stays in safe Number-precision range, so
   `time * speed % period` doesn't drift.
2. If you remount the component (e.g. via key change), `time` resets to `0`.

### Performance

Each tick costs one JSCore round-trip plus a JSON encode of the commands array.
For typical scenes (a few dozen primitives) this lands in the low-millisecond range
and comfortably hits 60fps. For heavy scenes (hundreds of `arc`s, many gradients,
or `measureText` per frame), watch your FPS readout — if it drops below ~50, drop
to `schedule={{ minimumInterval: 1/30 }}`.

A few rules of thumb:

- Cache anything that doesn't change per frame (gradient objects, colors,
  pre-computed paths).
- Avoid `measureText` inside `draw` if you can; measure once when fonts / strings
  change and reuse the result.
- Multiple `<TimelineCanvas>` in the same screen share the main thread; expect
  each one to take a slice of the frame budget.

SwiftUI pauses the timeline automatically when the view leaves the screen
(`NavigationStack` push, scrolled off-viewport), so you don't need to clean it up
manually — but flipping `paused: true` is the right call when *you* want the
animation halted while the view is still visible.

---

## Not in current version

The following Web-canvas APIs are intentionally deferred — request them on the issue
tracker if you need them earlier:

- `getImageData` / `putImageData` (collector model can't read pixels back).
- `isPointInPath` / `isPointInStroke` (same reason).
- `getTransform` (collector model can't read state back).
- Outline-only `strokeText` — currently falls back to filling with `strokeStyle`.
- Single-axis pattern repetition (`"repeat-x"` / `"repeat-y"` / `"no-repeat"`).
- Porter-Duff `globalCompositeOperation` values without a SwiftUI mapping
  (`"source-in"`, `"destination-in"`, `"xor"`, etc.).
