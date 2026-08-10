# presentationSizing

Requests a sizing behavior for the enclosing sheet presentation. Apply it to the root view of a sheet’s
content.

> Requires iOS 18 or later. On earlier versions it has no effect.

## `presentationSizing?: PresentationSizing`

`PresentationSizing` is one of:
- `automatic` — the system chooses a size based on the presentation context.
- `fitted` — the sheet sizes itself to fit its content in both dimensions.
- `page` — a sheet the size of its container, with standard page insets.
- `form` — a size appropriate for forms.

## Example

```tsx
<VStack presentationSizing="form">
  {/* sheet content */}
</VStack>
```
