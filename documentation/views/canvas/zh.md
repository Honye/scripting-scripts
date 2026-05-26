`Canvas` 是基于 SwiftUI Canvas 的视图,对外提供一套与 Web Canvas 2D 一致的命令式 API。
JS 端的 `CanvasRenderingContext` 是**指令收集器**——每次方法调用或属性赋值都会记录一条
命令;SwiftUI 每次重新评估视图(状态 / 布局变化)时,会由 Swift 端把命令队列回放到真实的
`GraphicsContext` 上完成绘制。

---

## 适用场景

- 你已经熟悉 Web Canvas API,希望以最低成本把脚本迁移过来。
- 需要命令式绘图(自定义图表、走势图、徽章、签名、生成式艺术等),用声明式的
  `Shape` / `Rectangle` / `Chart` 不好表达的场景。
- 绘制内容依赖于脚本在 render 时计算出的数据,而**不是** 60fps 的连续动画。

如果需要逐帧动画,请改用 `<TimelineCanvas>` — 同样的 draw API,但通过 SwiftUI
`TimelineView` 按 ~60fps tick。`<Canvas>` 的 closure 触发频率与 React render
同步(state / 布局变化),不是每帧。

---

## 基本用法

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

| 属性     | 类型                                              | 说明                                                              |
|----------|---------------------------------------------------|-------------------------------------------------------------------|
| `draw`   | `(ctx: CanvasRenderingContext, size) => void`     | 必填。每次重绘时被调用,接收新建的 ctx 和实际绘制尺寸。            |
| `opaque` | `boolean`                                         | 默认 `true`,与 SwiftUI 默认值一致。                               |

**没有** `width` / `height` props——请用 `frame` / `padding` / `aspectRatio` 等通用
修饰符来控制尺寸。实际绘制尺寸通过 `draw` 的第二个参数 `size` 传入。

`draw` 必须是对 React state 纯粹的——不要在里面 `setState`。返回值会被忽略。

---

## 支持的 API

### 状态栈

`save()` — 把当前 context 状态(变换、不透明度、裁剪、样式)压入栈。
`restore()` — 把栈顶状态弹出,还原到当前 context。

### 变换

| 方法                                                  | 说明                                  |
|-------------------------------------------------------|---------------------------------------|
| `translate(x, y)`                                     |                                       |
| `rotate(angle)`                                       | `angle` 为弧度。                      |
| `scale(x, y)`                                         |                                       |
| `transform(a, b, c, d, e, f)`                         | 把矩阵叠加到当前变换。                |
| `setTransform(a, b, c, d, e, f)`                      | 替换当前变换。                        |
| `resetTransform()`                                    |                                       |

### 路径

`beginPath`、`closePath`、`moveTo`、`lineTo`、`quadraticCurveTo`、`bezierCurveTo`、
`arc`、`arcTo`、`rect`、`ellipse`。

`ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise)` 完整支持
旋转的部分椭圆弧,所有参数均生效。

### 绘制

| 方法                                  | 说明                                                                                  |
|---------------------------------------|---------------------------------------------------------------------------------------|
| `fill(rule?)`                         | `rule` 可选 `"nonzero"`(默认)或 `"evenodd"`。                                       |
| `stroke()`                            | 使用当前 `strokeStyle` 与各项线条参数。                                               |
| `fillRect(x, y, w, h)`                |                                                                                       |
| `strokeRect(x, y, w, h)`              |                                                                                       |
| `clearRect(x, y, w, h)`               | 用 `.clear` blend mode 实现;opaque 画布上行为可能与 Web 略有不同——需要重置为某背景色时请改用 `fillRect`。 |
| `clip(rule?)`                         | 将当前路径加入裁剪区域;后续绘制都会被裁掉。需要恢复裁剪状态时配合 `save` / `restore` 使用。       |

### 文本

`fillText(text, x, y, maxWidth?)`、`strokeText(text, x, y, maxWidth?)`。

- `font` 支持数字(`14` → `system(size: 14)`)、SwiftUI 字体名(`"caption"`、
  `"headline"` 等)或自定义字体对象 `{ name, size }`——和项目其他地方的 Font 字段一致。
- `textAlign` / `textBaseline` 会映射到 SwiftUI `context.draw(_:at:anchor:)` 的 anchor。
- `strokeText` 当前退化为用 `strokeStyle` 填充。outline-only 描边文本尚未支持。

#### measureText

```tsx
ctx.font = 22
const m = ctx.measureText("Hello")
//   m.width
//   m.actualBoundingBoxAscent / actualBoundingBoxDescent  (字形相对 baseline 的上下边界)
//   m.fontBoundingBoxAscent / fontBoundingBoxDescent      (字体设计 ascent / descent)
```

`measureText` 是**同步**调用——会立刻往返一次 host 拿到结果,可以用来驱动后续绘制
(文字居中、按测量结果绘制背景胶囊、手动断行等)。它使用当前 `ctx.font` 值,返回的
尺寸与绘制坐标同单位。

测量底层走 UIKit (`NSAttributedString` + `UIFont`)。对于 SwiftUI textStyle 字体
名(`"headline"`、`"body"` 等),会用 `UIFont.preferredFont(forTextStyle:)`,因此
width 会跟随用户当前 Dynamic Type 设置。SwiftUI 自身的渲染在边角字形上可能与 UIKit
差异不到 1pt。

### 图片

```tsx
ctx.drawImage({ systemName: "star.fill" }, 16, 16, 32, 32)
ctx.drawImage({ filePath: "/some/local/path.png" }, 0, 0)
ctx.drawImage({ image: someUIImage }, 0, 0, 80, 80)
```

- 接受 `{ systemName }`(SF Symbols)、`{ filePath }`(本地文件路径)或
  `{ image: UIImage }`(内存中的 UIImage)。
- 9 参数形态(`sx, sy, sw, sh, dx, dy, dw, dh`)会先把源矩形裁剪出来再绘制到目标矩形。
- `imageSmoothingEnabled = false` 切换到最近邻插值(适合像素艺术)。
- 远程 URL 暂不支持——异步加载请改用 `Image` 组件。

### 样式属性

与 Web canvas 同名同语义:

- `fillStyle`、`strokeStyle` — 颜色字符串(见下)、`CanvasGradient` 或 `CanvasPattern`。
- `lineWidth`、`lineCap`、`lineJoin`、`miterLimit`、`setLineDash([...])` /
  `getLineDash()`、`lineDashOffset`。
- `globalAlpha` — 映射到 SwiftUI context 的 opacity。
- `font`、`textAlign`、`textBaseline`。
- `shadowOffsetX`、`shadowOffsetY`、`shadowBlur`、`shadowColor` — 阴影状态,
  作用于后续 `fill` / `stroke` / `fillText` / `drawImage`。
- `globalCompositeOperation` — 后续绘制的 blend mode(见下)。
- `imageSmoothingEnabled` — 控制 `drawImage` 的图像插值。

### 颜色字符串

`fillStyle` / `strokeStyle` 中的颜色字符串走的是桥层统一的解析器,以下都合法:

- 系统色名:`"systemBlue"`、`"systemGray6"`、`"label"`、`"secondaryLabel"`、`"accentColor"`。
- Hex:`"#0a84ff"`、`"#fff"`。
- `"rgb(r, g, b)"` / `"rgba(r, g, b, a)"`。
- `"hsl(h, s%, l%)"` / `"hsla(h, s%, l%, a)"` —— hue 是 0-360 的度数,
  saturation / lightness 是 0-100 的百分比(必须带 `%`),alpha 是 0-1。

### 渐变

```tsx
const g = ctx.createLinearGradient(0, 0, size.width, size.height)
g.addColorStop(0, "systemTeal")
g.addColorStop(1, "systemIndigo")
ctx.fillStyle = g
ctx.fillRect(0, 0, size.width, size.height)
```

还可用 `createRadialGradient(x0, y0, r0, x1, y1, r1)`。
`createConicGradient(startAngle, x, y)`(对应 SwiftUI `AngularGradient`)也可用 ——
经典 Web Canvas 没有,但映射干净,顺手暴露。

渐变端点使用 canvas 像素坐标,与 Web Canvas 行为一致。

> **Radial gradient 提示:** Web 的 `createRadialGradient` 需要两个圆(焦点 + 外圆);
> SwiftUI 只接受一个中心 + start/end 半径。桥层使用第二个圆的中心 `(x1, y1)`,
> 把 `r0` / `r1` 作为 start / end 半径。当 `r0 ≈ 0`(常见用法)时视觉一致,
> 否则焦点偏移会被近似掉。

### Pattern 填充

```tsx
const pattern = ctx.createPattern({ systemName: "star.fill" }, "repeat")
ctx.fillStyle = pattern
ctx.fillRect(0, 0, size.width, size.height)
```

`ctx.createPattern(image, repetition)` 返回 `CanvasPattern`,可赋给 `fillStyle` /
`strokeStyle`。`image` 接受跟 `drawImage` 一样的来源形态。

> **限制:** SwiftUI 的 tiledImage shading 只支持双轴重复。`"repeat-x"`、
> `"repeat-y"`、`"no-repeat"` 当前被接受但行为等同 `"repeat"`。如果需要单轴控制,
> 请配合 `ctx.clip(...)` 自行裁剪。

### Shadow

```tsx
ctx.shadowColor   = "rgba(0,0,0,0.5)"
ctx.shadowBlur    = 10
ctx.shadowOffsetX = 4
ctx.shadowOffsetY = 6
ctx.fillStyle = "systemBlue"
ctx.fillRect(40, 40, 120, 80)
```

shadow 状态作用于后续 `fill` / `stroke` / `fillText` / `drawImage`。把
`shadowColor` 设为透明色(或把 `shadowBlur` 和两个 offset 都重置 0)即可关闭。
`shadowBlur` 跟 Web 同义,是 Gaussian blur 半径而非 standard deviation。

### 混合模式

```tsx
ctx.globalCompositeOperation = "multiply"
```

支持的值:`"source-over"`(默认)、`"multiply"`、`"screen"`、`"overlay"`、
`"darken"`、`"lighten"`、`"color-dodge"`、`"color-burn"`、`"hard-light"`、
`"soft-light"`、`"difference"`、`"exclusion"`、`"hue"`、`"saturation"`、
`"color"`、`"luminosity"`、`"plus-lighter"`、`"destination-over"`。

不支持的值会 silently fallback 到 `"source-over"`。Web 的完整 Porter-Duff 子集
(`"source-in"` / `"destination-in"` / `"xor"` 等)在 SwiftUI 没有 1:1 映射,暂不暴露。

---

## 性能

`draw` 闭包是从 SwiftUI Canvas closure **同步**反向调用 JS 的。Canvas closure 触发
频率与 React render 同步(state / layout 变化),并非每帧——每次调用涉及一次 JSCore
往返加 commands 数组的 JSON 序列化,数百条命令在毫秒级完成。

请保持 draw body 轻量:避免重计算、大对象捕获、上千个 `arc` 段(用单条 `bezierCurveTo`
即可代替)。

---

---

## TimelineCanvas(逐帧动画)

`<Canvas>` 的 draw 闭包只在 React 重新评估视图时(state / 布局变化)运行;真正的
`requestAnimationFrame` 式动画(弹球、粒子、扫针表盘、生成式循环)请改用
`<TimelineCanvas>`。内部组合 SwiftUI 的 `Canvas` + `TimelineView`,
draw 闭包按调度器节奏触发(默认 ~60fps)。

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
        // 暂停恢复后 dt 限幅,避免球被甩飞
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

### 与 `<Canvas>` 的区别

| | `<Canvas>` | `<TimelineCanvas>` |
|---|---|---|
| 闭包触发频率 | state / 布局变化 | 每帧(默认 ~60fps) |
| 第三个参数 | — | `time`,自 mount 起的秒数 |
| 单次开销 | 每次重绘一次 | 每帧一次,主线程上 |
| 适用场景 | 图表 / 数据驱动绘图 | 动画 / 粒子 / 时钟 |

### Props

| 属性 | 类型 | 说明 |
|---|---|---|
| `draw` | `(ctx, size, time) => void` | 必填。`time` 是**自视图首次出现起的秒数**,不是 Unix 时间戳。 |
| `paused` | `boolean` | `true` 时 SwiftUI 停止 tick,最后一帧停留。双向:从 `useState` 切回会立即恢复。 |
| `schedule` | `"animation"` \| `"periodic"` \| `{ minimumInterval: number }` | tick 节奏,默认 `"animation"`(~60fps)。`{ minimumInterval: 1/30 }` 约 30fps;`"periodic"` 每秒一次(适合时钟)。 |
| `opaque` | `boolean` | 默认 `true`。 |

### 跨帧状态

`draw` 闭包每次 React render 都会重新创建。需要跨帧保留的状态(粒子数组、位置、累
加器)请放在 `useRef` 或模块顶层 — 跟经典 Web Canvas + `rAF` 的写法一致:

```tsx
const particles = useRef<{ x: number, y: number }[]>([])
```

不要把每帧状态放在 `useState` 里 — 那会触发每帧 React re-render,纯浪费。

### `time` 语义

`time` 是**相对 mount 的秒数**。两个含义:

1. 跑几小时也不会溢出 Number 精度区间,`time * speed % period` 不会漂移。
2. 组件 remount(例如 key 变化)时 `time` 归零。

### 性能

每帧 = 一次 JSCore 往返 + 一次 commands 数组 JSON 编码。典型场景(几十个图元)
落在毫秒级,稳定 60fps 没问题。重场景(几百个 `arc`、多个 gradient、每帧
`measureText`)请盯 FPS 数:跌到 ~50 以下就改 `schedule={{ minimumInterval: 1/30 }}`。

几条经验:

- 不随帧变化的对象(gradient、颜色、预计算路径)做一次缓存就够。
- 尽量别在 `draw` 内调 `measureText` — 字体 / 文字变化时测一次,后续复用结果。
- 同屏多个 `<TimelineCanvas>` 共享主线程;每个会瓜分帧预算。

视图离开屏幕时(`NavigationStack` push / 滑出 viewport)SwiftUI 会自动停 tick,
不需要手动清理。但**主动**暂停时(动画想停但视图还在屏)请用 `paused: true`。

---

## 暂未支持

以下 Web canvas API 已故意延后,若有强需求请反馈:

- `getImageData` / `putImageData`(collector 模式无法读回像素)。
- `isPointInPath` / `isPointInStroke`(同上)。
- `getTransform`(collector 模式无法读回状态)。
- outline-only `strokeText` — 当前退化为用 `strokeStyle` 填充。
- 单轴 pattern 重复模式(`"repeat-x"` / `"repeat-y"` / `"no-repeat"`)。
- 在 SwiftUI 没有干净映射的 Porter-Duff `globalCompositeOperation` 值
  (`"source-in"` / `"destination-in"` / `"xor"` 等)。
