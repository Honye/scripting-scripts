这些修饰符用于配置 SF Symbols（系统符号图标）的显示样式和动画效果，常用于 `<Image systemName="...">` 组件。

---

### `symbolRenderingMode`

设置符号图像的 **渲染模式**。

#### 类型

```ts
symbolRenderingMode?: SymbolRenderingMode
```

#### 可选值（SymbolRenderingMode）：

* `"monochrome"`：单色模式，使用当前前景色绘制
* `"hierarchical"`：层次渲染，根据不同图层设置不透明度（适合语义着色）
* `"multicolor"`：使用符号内置颜色
* `"palette"`：分层渲染，可自定义每一层的颜色样式（需搭配 `foregroundStyle`）

#### 示例

```tsx
<Image
  systemName="star.fill"
  symbolRenderingMode="palette"
  foregroundStyle={{
    primary: "red",
    secondary: "orange",
    tertiary: "yellow"
  }}
/>
```

---

### `foregroundStyle`

设置符号或前景元素的颜色样式。

#### 类型

```ts
foregroundStyle?: 
  | ShapeStyle
  | DynamicShapeStyle
  | {
      primary: ShapeStyle | DynamicShapeStyle
      secondary: ShapeStyle | DynamicShapeStyle
      tertiary?: ShapeStyle | DynamicShapeStyle
    }
```

#### 说明：

* 在 `"monochrome"` 模式下使用单个颜色或渐变；
* 在 `"palette"` 模式下使用 `{ primary, secondary, tertiary }` 对象指定多层样式；
* `tertiary` 可选，仅在符号有三层图层时有效。

---

### `symbolVariant`

为符号添加特定的 **视觉变体**。

#### 类型

```ts
symbolVariant?: SymbolVariants
```

#### 可选值（SymbolVariants）：

* `"none"`：无变体，原始符号样式
* `"fill"`：填充样式
* `"circle"`：包裹在圆形轮廓中
* `"square"`：包裹在方形轮廓中
* `"rectangle"`：包裹在矩形轮廓中
* `"slash"`：斜杠样式，表示禁止/关闭等状态

#### 示例

```tsx
<Image
  systemName="wifi"
  symbolVariant="slash"
/>
```

---

### `symbolEffect`

为符号添加 **动画效果**，支持静态应用或绑定数值以触发动画。

#### 类型

```ts
symbolEffect?: SymbolEffect
```

#### 使用方式：

##### 1. 静态符号效果（SymbolEffect 简写字符串）

```tsx
<Image
  systemName="checkmark"
  symbolEffect="scaleUp"
/>
```

##### 2. 动态绑定符号效果（每次值变化时触发动画）

```tsx
<Image
  systemName="heart"
  symbolEffect={{
    effect: "bounce",
    value: isLiked
  }}
/>
```

每次 `isLiked` 状态变化时，图标会执行 bounce 动画。

##### 3. 触发型符号效果（`isActive` 翻转触发，对应 SwiftUI `symbolEffect(_:options:isActive:)`）

在 SwiftUI 的 trigger 形态里，**稳态是 `isActive = false`**（符号可见）。翻转 `isActive` 时播放对应动画，方向因 effect 而异：

| Effect | `isActive=false`（稳态） | `isActive=true`（effect 激活） |
|--------|-------------------------|-------------------------------|
| `appear` | 不可见 | 可见（appear 动画） |
| `disappear` | 可见 | 不可见（disappear 动画） |
| `scale` | 原始尺寸 | 已缩放 |
| **`drawOn`** | **可见**（已 drawn） | **不可见**（draw-off 动画） |
| **`drawOff`** | **不可见** | **可见**（draw-on 动画） |

注意 `drawOn` / `drawOff` 描述的是**动画风格**（笔画式绘制），不是激活后的最终态。`.drawOn` 行为类似 `.disappear`，只是动画用绘制风格；`.drawOff` 行为类似 `.appear`。

```tsx
const [hidden, setHidden] = useState(false)

<Image
  systemName="checkmark.circle"
  symbolEffect={{
    effect: "drawOn",
    isActive: hidden,
  }}
/>

<Button title={hidden ? "Show" : "Hide"} action={() => setHidden(!hidden)} />
```

> `drawOn` / `drawOff` 属于 SF Symbols 7（iOS 26+）。在更低版本上桥层会静默透传，content 不变。

##### 4. 动画选项（`SymbolEffectOptions`，对应 SwiftUI `.speed/.repeat/.nonRepeating`）

`options` 可附加在 dict 形态（value 或 isActive 都可用）。**注意：** SwiftUI 把 trigger 形态的 transition（`drawOn` / `drawOff` / `appear` / `disappear`）当成 single-shot 处理，`repeat` 在 value 形态（`pulse` / `bounce` 等）上最可靠。

```tsx
<Image
  systemName="bell.fill"
  symbolEffect={{
    effect: "pulse",
    value: pulseTick,
    options: {
      speed: 0.7,
      repeat: { count: 3, delay: 0.4 },
    },
  }}
/>
```

```ts
type SymbolEffectOptions = {
  /** 动画速度倍率，2 = 两倍速 */
  speed?: number
  /** 强制只播一次；与 `repeat` 互斥（同时设置时 `nonRepeating` 优先并打 warning） */
  nonRepeating?: boolean
  /**
   * 重复策略：
   *  - `"continuous"`：永久循环（iOS 18+；iOS 17 fallback `.repeating`）
   *  - `{ count, delay? }`：周期性循环 `count` 次，可选间隔 `delay`（秒，iOS 18+）
   *  - `{ delay }`：仅设间隔（iOS 18+）
   */
  repeat?:
    | "continuous"
    | { count: number; delay?: number }
    | { delay: number; count?: number }
}
```

---

### 可用 Symbol 动效分类（DiscreteSymbolEffect）

| 类别                 | 动效关键字                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 弹跳 Bounce          | `bounce`, `bounceByLayer`, `bounceDown`, `bounceUp`, `bounceWholeSymbol`                                                                                                              |
| 呼吸 Breathe         | `breathe`, `breatheByLayer`, `breathePlain`, `breathePulse`, `breatheWholeSymbol`                                                                                                     |
| 脉冲 Pulse           | `pulse`, `pulseByLayer`, `pulseWholeSymbol`                                                                                                                                           |
| 旋转 Rotate          | `rotate`, `rotateByLayer`, `rotateClockwise`, `rotateCounterClockwise`, `rotateWholeSymbol`                                                                                           |
| 颜色变化 VariableColor | `variableColor`, `variableColorIterative`, `variableColorDimInactiveLayers`, `variableColorHideInactiveLayers`, `variableColorCumulative`                                             |
| 摇晃 Wiggle          | `wiggle`, `wiggleLeft`, `wiggleRight`, `wiggleUp`, `wiggleDown`, `wiggleForward`, `wiggleBackward`, `wiggleByLayer`, `wiggleWholeSymbol`, `wiggleClockwise`, `wiggleCounterClockwise` |

### 可用 Trigger 动效分类（TriggerSymbolEffect，搭配 `isActive`）

| 类别                                | 动效关键字                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| 出现 Appear                         | `appear`, `appearByLayer`, `appearUp`, `appearDown`, `appearWholeSymbol`                         |
| 消失 Disappear                      | `disappear`, `disappearByLayer`, `disappearUp`, `disappearDown`, `disappearWholeSymbol`          |
| 缩放 Scale                          | `scale`, `scaleByLayer`, `scaleUp`, `scaleDown`, `scaleWholeSymbol`                              |
| **绘制 DrawOn** *(iOS 26+ / SF 7)* | `drawOn`, `drawOnByLayer`, `drawOnWholeSymbol`, `drawOnIndividually`                             |
| **擦除 DrawOff** *(iOS 26+ / SF 7)* | `drawOff`, `drawOffByLayer`, `drawOffWholeSymbol`, `drawOffIndividually`                         |

---

### 综合示例

```tsx
<Image
  systemName="bell.fill"
  symbolRenderingMode="hierarchical"
  symbolVariant="circle"
  foregroundStyle="indigo"
  symbolEffect={{
    effect: "breathePulse",
    value: isNotified
  }}
/>
```

上述示例中：

* 使用了分层渲染（hierarchical）；
* 添加了圆形变体（circle）；
* 设置了 `indigo` 颜色；
* 每当 `isNotified` 变化时，符号执行 `breathePulse` 动画。

---

## 修饰符汇总表

| 修饰符                   | 说明                        |
| --------------------- | ------------------------- |
| `symbolRenderingMode` | 设置符号图标的渲染模式（单色、多色、层次、调色板） |
| `foregroundStyle`     | 设置符号的颜色风格，可支持多图层配色        |
| `symbolVariant`       | 添加符号样式变体，如填充、圆形、斜杠等       |
| `symbolEffect`        | 添加符号动画，可静态或绑定值驱动          |
