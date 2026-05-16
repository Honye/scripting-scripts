The `ScrollView` component displays its content within a scrollable region. As the user performs scroll gestures, the visible portion of the content is updated accordingly. You can scroll vertically, horizontally, or in both directions using the `axes` prop.

## Type

```ts
type ScrollViewProps = {
  axes?: AxisSet
  children?: VirtualNode | VirtualNode[] | (VirtualNode | undefined | null)[]
}
```

## Overview

* Scroll direction is controlled by the `axes` property.
* Contents are placed inside children, typically using layouts like `<VStack>` or `<HStack>`.
* Zooming is not supported.

## Default Behavior

* The default scroll axis is **vertical**.
* Scroll indicators are shown based on platform conventions unless configured via modifiers.

## Example

```tsx
<ScrollView>
  <VStack>
    {new Array(100).fill('').map((_, index) => (
      <Text>Row {index}</Text>
    ))}
  </VStack>
</ScrollView>
```

---

## ScrollView Modifiers

You can apply the following view modifiers to configure scroll-related behavior.

---

## `scrollIndicator`

Controls the visibility of scroll indicators.

### Type

```ts
scrollIndicator?: ScrollScrollIndicatorVisibility | {
  visibility: ScrollScrollIndicatorVisibility
  axes: AxisSet
}
```

### `ScrollScrollIndicatorVisibility` options:

* `"automatic"`: Follows platform default behavior.
* `"visible"`: Indicators appear but may auto-hide based on OS behavior.
* `"hidden"`: Hidden unless overridden by system behavior.
* `"never"`: Never show indicators.

### Example

```tsx
<ScrollView scrollIndicator="never">
  <VStack>{/* content */}</VStack>
</ScrollView>
```

With axis-specific visibility:

```tsx
<ScrollView
  scrollIndicator={{
    visibility: "hidden",
    axes: "vertical"
  }}
>
  <VStack>{/* content */}</VStack>
</ScrollView>
```

---

## `scrollDisabled`

Enables or disables scrolling behavior entirely.

### Type

```ts
scrollDisabled?: boolean
```

### Example

```tsx
<ScrollView scrollDisabled>
  <Text>This scroll view is locked.</Text>
</ScrollView>
```

---

## `scrollClipDisabled`

Controls whether the scroll view clips content that extends beyond its bounds.

### Type

```ts
scrollClipDisabled?: boolean
```

### Example

```tsx
<ScrollView scrollClipDisabled>
  {/* Content may overflow scroll bounds visually */}
</ScrollView>
```

---

## `scrollDismissesKeyboard`

Determines how the scroll interaction affects the software keyboard.

### Type

```ts
scrollDismissesKeyboard?: ScrollDismissesKeyboardMode
```

### Options

* `"automatic"`: Default behavior based on context.
* `"immediately"`: Dismiss keyboard as soon as scrolling starts.
* `"interactively"`: Allow user to drag to dismiss keyboard.
* `"never"`: Scrolling will not dismiss the keyboard.

### Example

```tsx
<ScrollView scrollDismissesKeyboard="interactively">
  {/* Content with text input */}
</ScrollView>
```

---

## `defaultScrollAnchor`

Defines which point in the content should be visible initially or stay anchored when content size changes.

### Type

```ts
defaultScrollAnchor?: KeywordPoint | Point
```

### `KeywordPoint` values

* `"top"`, `"bottom"`, `"leading"`, `"trailing"`, `"center"`, `"topLeading"`, `"bottomTrailing"` etc.

### Example

```tsx
<ScrollView defaultScrollAnchor="bottom">
  <VStack>
    {/* New content will appear anchored to the bottom */}
  </VStack>
</ScrollView>
```

---

## `AxisSet`

Defines the scrollable directions for a scroll view.

### Type

```ts
type AxisSet = 'vertical' | 'horizontal' | 'all'
```

### Usage

```tsx
<ScrollView axes="horizontal">
  <HStack>{/* horizontally scrollable content */}</HStack>
</ScrollView>
```

---

## `scrollTargetLayout`

Applies this modifier to layout containers such as LazyHStack, LazyVStack, HStack, or VStack that represent the main repeating content inside a ScrollView.

### Type

```ts
scrollTargetLayout?: boolean
```

### Usage

When set to `true`, this modifier designates the associated layout container as a scroll target region within the `ScrollView`. It allows the scroll behavior system to determine how scrolling should align to elements within the container.

```tsx
<ScrollView axes="horizontal">
  <LazyHStack scrollTargetLayout>
    {items.map(item => <Text>{item.title}</Text>)}
  </LazyHStack>
</ScrollView>
```

---

## `scrollTargetBehavior`

Defines how scrollable views behave when aligning content to scroll targets.

### Type

```ts
scrollTargetBehavior?: ScrollTargetBehavior
```

```ts
type ScrollTargetBehavior =
  | "paging"
  | "viewAligned"
  | "viewAlignedLimitAutomatic"
  | "viewAlignedLimitAlways"
  | "viewAlignedLimitNever"
  | "viewAlignedLimitAlwaysByFew"
  | "viewAlignedLimitAlwaysByOne"
```

#### Description of Variants

* **`"paging"`**: Scrolls one page at a time, aligned to the container’s dimensions.
* **`"viewAligned"`**: Scrolls to align views directly, based on view frames.
* **`"viewAlignedLimitAutomatic"`**: Limits scrolling in compact horizontal size classes, but allows full scrolling otherwise.
* **`"viewAlignedLimitAlways"`**: Always restricts scrolling to a limited number of items.
* **`"viewAlignedLimitNever"`**: Allows unrestricted scrolling without view-based limitations.
* **`"viewAlignedLimitAlwaysByFew"`** *(iOS 18.0+)*: Limits scrolling to a small number of views per gesture, automatically determined.
* **`"viewAlignedLimitAlwaysByOne"`** *(iOS 18.0+)*: Restricts each scroll gesture to advance exactly one view at a time.

### Description

This modifier configures the scroll behavior, such as paging and alignment strategy, for views within a scrollable container.

---

## `scrollPosition`

Two-way binds the **id of the leading visible item** in a `ScrollView` to JS state. Mirrors SwiftUI's `.scrollPosition(id:anchor:)` — no `ScrollViewReader` wrapper required.

### Type

```ts
scrollPosition?:
  | Observable<string>
  | Observable<number>
  | Observable<string | null>
  | Observable<number | null>
  | { value: Observable<string | number | null>; anchor?: KeywordPoint | Point }
  | {
      value: string | number | null
      onChanged: (newValue: string | number | null) => void
      anchor?: KeywordPoint | Point
    }
```

### Setup

1. The container directly under the `ScrollView` (typically `LazyVStack` / `LazyHStack` / `VStack`) needs `scrollTargetLayout`.
2. Each child you want to be a scroll target needs a `key="..."` prop — the bridge maps it to SwiftUI's `.id()`.
3. Bind `scrollPosition` to a state — `Observable` form or `{ value, onChanged }` form.

### Example

```tsx
const [visibleId, setVisibleId] = useState<string | null>(null)

<ScrollView
  scrollPosition={{ value: visibleId, onChanged: setVisibleId, anchor: "top" }}
>
  <LazyVStack scrollTargetLayout>
    {items.map(it => (
      <HStack key={it.id}>{/* row content */}</HStack>
    ))}
  </LazyVStack>
</ScrollView>
```

* `id` may be `string` or `number`. Pick the type when initialising the state and stick with it — the bridge dispatches on the runtime type.
* Setting the state to `null` lets SwiftUI manage the scroll position; setting it to a known id scrolls that item to the anchor.
* `anchor` is a `UnitPoint`: a string keyword (`"top"` / `"center"` / `"leading"` / ...) or `{ x, y }`.

### Pitfalls

* **Forgetting `scrollTargetLayout`.** Without it, SwiftUI doesn't know which subview is the "current" scroll target — the binding silently does nothing.
* **Mixing id types.** A `Observable<number>` won't bind against a child whose `key` was rendered as a string. Keep both sides consistent.
* **Type changes mid-flight.** Initialise the observable with a real value (e.g. `useState<string|null>("first")`) so the bridge can detect the type at modifier time. A purely-`null`-initial observable defaults to the string path.
* **ScrollViewReader vs scrollPosition.** Don't bind both to the same scroll view — the imperative `scrollTo(id:)` and declarative `scrollPosition` will fight each other. Pick one.

---

## `onScrollTargetVisibilityChange`

iOS 18+. Reports the **set of currently-visible scroll target ids** whenever it changes (filtered by `threshold`). Mirrors SwiftUI's `.onScrollTargetVisibilityChange(idType:threshold:_:)`.

### Type

```ts
onScrollTargetVisibilityChange?: {
  idType: "string" | "number"
  threshold?: number   // 0.0 - 1.0, default 0.5
  onChanged: (ids: string[] | number[]) => void
}
```

### Setup

Same as `scrollPosition`:

1. The layout container needs `scrollTargetLayout`.
2. Children must be marked with `key="..."` or `key={123}`.
3. **`idType` must match the runtime type of the keys.** The SwiftUI API is generic, and the bridge has to dispatch statically at modifier-creation time — there's no way to recover the ID type from `[AnyHashable]` at runtime. Use `"string"` for string keys, `"number"` for number keys.

### Example

```tsx
const [visibleIds, setVisibleIds] = useState<string[]>([])

<ScrollView
  onScrollTargetVisibilityChange={{
    idType: "string",
    threshold: 0.5,
    onChanged: (ids) => setVisibleIds(ids as string[]),
  }}
>
  <LazyVStack scrollTargetLayout>
    {items.map(it => <Row key={it.id} />)}
  </LazyVStack>
</ScrollView>
```

### Pitfalls

* **iOS 17 fallback.** On iOS 17 the bridge logs an `API deprecated` warning and skips the modifier — content passes through. Other modifiers are unaffected.
* **`threshold` semantics.** `0.5` = the view must be at least 50% within the viewport to count as visible. `0` = any pixel triggers; `1` = the entire view must be visible.
* **Callback frequency.** During scrolling the callback is invoked on the main thread inline (no throttling). A list with ~30 items where ~5 are visible is fine; for very dense lists with rapid scrolling, keep the callback body cheap.
* **Compatible with `scrollPosition`.** They serve different purposes — `scrollPosition` gives you the leading id, `onScrollTargetVisibilityChange` gives you the entire visible set. Using both on the same scroll view is safe.

---

## `scrollContentBackground`

Specifies the visibility of the background for scrollable views, such as `ScrollView`, within the current view context.

### Type

```ts
scrollContentBackground?: Visibility
```

### Description

This modifier controls whether the default background behind scrollable content (typically a system-provided background) is shown, hidden, or determined automatically based on system behavior.

It is commonly used when customizing the appearance of scrollable views or when layering custom backgrounds behind scroll content.

### Visibility Options

* **`'automatic'`**
  The system decides whether the background should be visible based on the current context and platform conventions.

* **`'hidden'`**
  Hides the scroll view’s default background, allowing custom background layers or transparent effects.

* **`'visible'`**
  Forces the default scroll content background to be shown, even if a custom background is present.

### Example: Hiding Scroll Background

```tsx
<List scrollContentBackground="hidden">
  <Text>No background here</Text>
</List>
```

This example removes the default background from the scroll view, making it fully transparent or allowing underlying views to show through.

---

## Summary

| Modifier / Prop            | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| `axes`                     | Defines scroll direction (`vertical`, `horizontal`, or `all`)              |
| `scrollIndicator`          | Controls scroll indicator visibility and supports axis-specific config      |
| `scrollDisabled`           | Disables scrolling entirely when set to `true`                             |
| `scrollClipDisabled`       | Prevents clipping of content that overflows the scroll bounds              |
| `scrollDismissesKeyboard`  | Configures how scrolling interacts with the software keyboard              |
| `defaultScrollAnchor`      | Sets the initial or persistent scroll anchor point in the content          |
| `scrollTargetLayout`       | Marks a container (like `LazyHStack`) as the scroll target for alignment   |
| `scrollTargetBehavior`     | Determines how content aligns and scrolls within the scroll view           |
| `scrollPosition`           | Two-way binds the leading visible item's id to JS state                    |
| `onScrollTargetVisibilityChange` | iOS 18+, subscribes to the visible id set                            |
| `scrollContentBackground`  | Sets the visibility of the scroll view’s default background                |
