# dynamicTypeSize

Overrides the Dynamic Type size for content in a view. Use it to fix a size, or to clamp the user's preferred size within a range.

## `dynamicTypeSize?: DynamicTypeSize | { from?, to? }`

`DynamicTypeSize` is one of: `xSmall`, `small`, `medium`, `large`, `xLarge`, `xxLarge`, `xxxLarge`, `accessibility1`, `accessibility2`, `accessibility3`, `accessibility4`, `accessibility5`.

- Pass a single size to **fix** the Dynamic Type size.
- Pass `{ from, to }` to **clamp** it to a range. Either bound may be omitted for a half-open range.

## Example

```tsx
// Fix the size.
<Text dynamicTypeSize="large">Fixed size</Text>

// Clamp so it never goes below xSmall or above accessibility1.
<VStack dynamicTypeSize={{ from: "xSmall", to: "accessibility1" }}>
  <Text>Clamped subtree</Text>
</VStack>

// Cap the maximum only.
<Text dynamicTypeSize={{ to: "xxLarge" }}>Capped</Text>
```
