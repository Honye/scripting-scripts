`FlowLayout` is a flow-based layout component that arranges its children horizontally and automatically wraps items to the next line when there is insufficient space. It is ideal for displaying a group of elements with dynamic widths such as tags, buttons, or icon lists.

---

## Import

```ts
import { FlowLayout } from "scripting"
```

---

## Props

### `spacing?: number`

The base spacing between items, applied to **both** the horizontal and vertical axes.

* **Type:** `number`
* **Default:** `8`

Defines the amount of space inserted between child items. Override a single axis with `horizontalSpacing` / `verticalSpacing`.

### `horizontalSpacing?: number`

The horizontal spacing between items within the same row. Overrides `spacing` on the horizontal axis when set.

* **Type:** `number`
* **Default:** falls back to `spacing`

### `verticalSpacing?: number`

The vertical spacing between wrapped rows. Overrides `spacing` on the vertical axis when set.

* **Type:** `number`
* **Default:** falls back to `spacing`

### `children?: VirtualNode | (VirtualNode | undefined | null | (VirtualNode | undefined | null)[])[]`

The child elements to be displayed inside the layout.

* Supports a single node or multiple nodes
* `undefined` and `null` children will be ignored
* Nested arrays are supported (useful when rendering with `.map()`)

---

## Examples

### Basic Usage

```ts
import { FlowLayout, Text } from "scripting"

export default function Example() {
  return (
    <FlowLayout spacing={12}>
      <Text>Tag One</Text>
      <Text>Tag Two</Text>
      <Text>Tag Three</Text>
      <Text>Tag Four</Text>
    </FlowLayout>
  )
}
```

### Rendering from an Array

```ts
const tags = ["Apple", "Orange", "Banana", "Pear", "Grape"]

export default function TagsExample() {
  return (
    <FlowLayout spacing={6}>
      {tags.map(tag => <Text>{tag}</Text>)}
    </FlowLayout>
  )
}
```

### Using Default Spacing

```ts
<FlowLayout>
  <Text>A</Text>
  <Text>B</Text>
  <Text>C</Text>
</FlowLayout>
```

---

## Recommended Use Cases

FlowLayout is suitable for layouts where elements vary in width and should wrap naturally, such as:

* Tag clouds and keyword lists
* Dynamic button groups
* Icon or avatar lists
* Adaptive content containers
