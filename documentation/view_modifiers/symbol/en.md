These modifiers allow you to customize how **SF Symbols** are displayed and animated inside views, particularly with the `Image` component.

---

## `symbolRenderingMode`

Sets the **rendering mode** for symbol images within the view.

### Type

```ts
symbolRenderingMode?: SymbolRenderingMode
```

### Options (`SymbolRenderingMode`)

* `"monochrome"` – A single-color version using the foreground style
* `"hierarchical"` – Multiple layers with different opacities for depth (good for semantic coloring)
* `"multicolor"` – Uses the symbol's built-in colors
* `"palette"` – Allows layered tinting (like using multiple `foregroundStyle` layers)

### Example

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

### Explanation:

* `symbolRenderingMode="palette"` tells the system to render the symbol in **multiple layered styles**.
* `foregroundStyle` now uses an object with `primary`, `secondary`, and optionally `tertiary` layers to color those symbol layers individually.

> This matches SwiftUI's behavior with `.symbolRenderingMode(.palette)` and `.foregroundStyle(primary, secondary, tertiary)`.

---

## `symbolVariant`

Displays the symbol with a particular **visual variant**.

### Type

```ts
symbolVariant?: SymbolVariants
```

### Options (`SymbolVariants`)

* `"none"` – Default symbol with no variant
* `"circle"` – Encapsulated in a circle
* `"square"` – Encapsulated in a square
* `"rectangle"` – Encapsulated in a rectangle
* `"fill"` – Filled symbol
* `"slash"` – Adds a slash over the symbol (often used to indicate "off" states)

### Example

```tsx
<Image
  systemName="wifi"
  symbolVariant="slash"
/>
```

---

## `symbolEffect`

Applies a **symbol animation effect** to the view. This can include transitions (appear/disappear), scale, bounce, rotation, breathing, pulsing, and wiggle effects. You can also bind the effect to a value so it animates when the value changes.

### Type

```ts
symbolEffect?: SymbolEffect
```

There are two forms of usage:

---

### 1. **Simple effects** (transition, scale, etc.)

You can directly assign a symbol effect name:

#### Examples

```tsx
<Image
  systemName="heart"
  symbolEffect="appear"
/>

<Image
  systemName="checkmark"
  symbolEffect="scaleByLayer"
/>
```

---

### 2. **Value-bound discrete effects**

These effects animate when the associated value changes.

#### Type

```ts
symbolEffect?: {
  effect: DiscreteSymbolEffect
  value: string | number | boolean
  options?: SymbolEffectOptions
}
```

#### Example

```tsx
<Image
  systemName="star.fill"
  symbolEffect={{
    effect: "bounce",
    value: isFavorited
  }}
/>
```

In this example, each time `isFavorited` changes, the bounce animation is triggered.

---

### 3. **Trigger effects** (`isActive`, mirrors SwiftUI `symbolEffect(_:options:isActive:)`)

In SwiftUI's trigger form, the **steady state is `isActive = false`** (symbol visible). Flipping `isActive` plays the effect's animation; the direction depends on the effect:

| Effect | `isActive=false` (steady) | `isActive=true` (effect engaged) |
|--------|---------------------------|----------------------------------|
| `appear` | invisible | visible (appears) |
| `disappear` | visible | invisible (disappears) |
| `scale` | base size | scaled |
| **`drawOn`** | **visible** (drawn) | **invisible** (draw-off animation plays) |
| **`drawOff`** | **invisible** | **visible** (draw-on animation plays) |

Note that `drawOn` / `drawOff` describe the **animation style** (stroke-by-stroke drawing) — not the final state. `.drawOn` behaves like `.disappear` with a draw-style animation; `.drawOff` behaves like `.appear` with a draw-style animation.

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

> `drawOn` / `drawOff` are SF Symbols 7 effects (iOS 26+). On earlier iOS the bridge silently passes content through unchanged.

---

### 4. **Animation options** (`SymbolEffectOptions`)

Attach `options` to either the value-bound or the trigger form. **Note:** SwiftUI treats trigger-form transitions like `drawOn` / `drawOff` / `appear` / `disappear` as single-shot — `repeat` is honored most reliably on value-bound effects (`pulse`, `bounce`, etc.).

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
  /** Animation speed multiplier. `2` = twice as fast. */
  speed?: number
  /** Force a one-shot. Mutually exclusive with `repeat` — if both are set, `nonRepeating` wins and a warning is logged. */
  nonRepeating?: boolean
  /**
   * Repetition policy:
   *  - `"continuous"`: loop forever (iOS 18+; on iOS 17 falls back to `.repeating`)
   *  - `{ count, delay? }`: periodic — `count` cycles with optional `delay` (seconds) between them (iOS 18+)
   *  - `{ delay }`: periodic with delay only (iOS 18+)
   */
  repeat?:
    | "continuous"
    | { count: number; delay?: number }
    | { delay: number; count?: number }
}
```

---

## Available Discrete Effects (`DiscreteSymbolEffect`)

Use these with the value-bound form — animation replays whenever `value` changes.

| Category          | Effects                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bounce**        | `bounce`, `bounceByLayer`, `bounceDown`, `bounceUp`, `bounceWholeSymbol`                                                                                                              |
| **Breathe**       | `breathe`, `breatheByLayer`, `breathePlain`, `breathePulse`, `breatheWholeSymbol`                                                                                                     |
| **Pulse**         | `pulse`, `pulseByLayer`, `pulseWholeSymbol`                                                                                                                                           |
| **Rotate**        | `rotate`, `rotateByLayer`, `rotateClockwise`, `rotateCounterClockwise`, `rotateWholeSymbol`                                                                                           |
| **VariableColor** | `variableColor`, `variableColorCumulative`, `variableColorDimInactiveLayers`, `variableColorHideInactiveLayers`, `variableColorIterative`                                             |
| **Wiggle**        | `wiggle`, `wiggleByLayer`, `wiggleWholeSymbol`, `wiggleLeft`, `wiggleRight`, `wiggleUp`, `wiggleDown`, `wiggleForward`, `wiggleBackward`, `wiggleClockwise`, `wiggleCounterClockwise` |

## Available Trigger Effects (`TriggerSymbolEffect`)

Use these with the `isActive` form. `drawOn` / `drawOff` are iOS 26+; the rest are iOS 17+.

| Category                              | Effects                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Appear**                            | `appear`, `appearByLayer`, `appearUp`, `appearDown`, `appearWholeSymbol`                         |
| **Disappear**                         | `disappear`, `disappearByLayer`, `disappearUp`, `disappearDown`, `disappearWholeSymbol`          |
| **Scale**                             | `scale`, `scaleByLayer`, `scaleUp`, `scaleDown`, `scaleWholeSymbol`                              |
| **DrawOn** *(iOS 26+ / SF Symbols 7)* | `drawOn`, `drawOnByLayer`, `drawOnWholeSymbol`, `drawOnIndividually`                             |
| **DrawOff** *(iOS 26+ / SF Symbols 7)* | `drawOff`, `drawOffByLayer`, `drawOffWholeSymbol`, `drawOffIndividually`                         |

---

## Full Example

```tsx
<Image
  systemName="bell.fill"
  symbolRenderingMode="hierarchical"
  symbolVariant="circle"
  symbolEffect={{
    effect: "breathePulse",
    value: isNotified
  }}
  foregroundStyle="indigo"
/>
```

This image uses:

* a hierarchical rendering mode
* a circular variant around the symbol
* a pulsing animation bound to `isNotified` state

---

## Summary

| Modifier              | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `symbolRenderingMode` | Sets how SF Symbols are rendered (monochrome, multicolor, etc.)         |
| `symbolVariant`       | Applies a visual variant like `fill`, `circle`, or `slash`              |
| `symbolEffect`        | Adds visual animation effects; can be static or bound to a state change |
