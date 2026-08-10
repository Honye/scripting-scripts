# coordinateSpace

Assigns a name to the coordinate space of this view. Other code can then report dimensions — such as
gesture locations or `GeometryReader` frames — relative to that named space instead of `local` or `global`.

## `coordinateSpace?: string`

Pass any non-empty name. Reference the same name from a gesture’s `coordinateSpace` option (or a
`GeometryReader` frame) to measure against this view’s space.

## Example

```tsx
<VStack
  coordinateSpace="board"
  onDragGesture={{
    coordinateSpace: "board",
    onChanged: (v) => console.log(v.location),
  }}
>
  {/* Drag locations are reported relative to this VStack. */}
</VStack>
```
