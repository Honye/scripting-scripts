# scenePadding

Adds padding to the specified edges using the amount of space the system considers appropriate for the current scene (for example, aligning content with system UI margins).

## `scenePadding?: true | EdgeSet`

- Pass `true` to apply scene padding to **all** edges.
- Pass an `EdgeSet` (`"all"`, `"horizontal"`, `"vertical"`, `"top"`, `"bottom"`, `"leading"`, `"trailing"`, or an array of edges) to choose which edges.

## Example

```tsx
<Text scenePadding={true}>All edges</Text>

<VStack scenePadding="horizontal">
  <Text>Horizontally scene-padded</Text>
</VStack>

<Text scenePadding={["top", "bottom"]}>Top & bottom</Text>
```
