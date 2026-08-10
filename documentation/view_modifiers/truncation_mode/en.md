# truncationMode

Sets how text that is too long to fit is truncated within its available space. Pair it with `lineLimit` so the text actually clips.

## `truncationMode?: TruncationMode`

`TruncationMode` is one of:
- `head` — omit the beginning (`…text`).
- `middle` — omit the middle (`te…xt`).
- `tail` — omit the end (`text…`), the default.

## Example

```tsx
<Text lineLimit={1} truncationMode="middle">
  A very long string that will not fit on one line
</Text>
```
