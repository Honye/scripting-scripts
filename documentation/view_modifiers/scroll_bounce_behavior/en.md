# scrollBounceBehavior

Configures the bounce behavior of scrollable views (`ScrollView`, `List`, …) along an axis.

## `scrollBounceBehavior?: ScrollBounceBehavior | { behavior, axes? }`

`ScrollBounceBehavior` is one of:
- `automatic` — the system decides.
- `always` — the view always bounces when it reaches the end of its content.
- `basedOnSize` — the view bounces only when its content is large enough to require scrolling.

Pass a single value to configure the **vertical** axis, or an object to also choose the `axes` (`"vertical"`, `"horizontal"`, or `"all"`; defaults to vertical).

## Example

```tsx
// Disable bounce when content fits.
<ScrollView scrollBounceBehavior="basedOnSize">
  {/* ... */}
</ScrollView>

// Apply to both axes.
<ScrollView scrollBounceBehavior={{ behavior: "always", axes: "all" }}>
  {/* ... */}
</ScrollView>
```
