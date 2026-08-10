# presentationBackground

Sets the background of the enclosing sheet or popover to a shape style, such as a color or a material. Apply it to the content presented by `sheet`, `popover`, or `fullScreenCover`.

## `presentationBackground?: ShapeStyle | DynamicShapeStyle`

Accepts any shape style — a color, a gradient, or a system material (for example `"regularMaterial"`, `"thinMaterial"`), and a `DynamicShapeStyle` (`{ light, dark }`) to vary by color scheme.

## Example

```tsx
// A translucent material behind the sheet.
<VStack presentationBackground="thinMaterial">
  <Text>Sheet content</Text>
</VStack>

// A solid color.
<VStack presentationBackground="systemBackground">
  <Text>Sheet content</Text>
</VStack>
```
