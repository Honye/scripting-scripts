# truncationMode

设置文本过长放不下时如何截断。需配合 `lineLimit` 使用,文本才会真正被裁剪。

## `truncationMode?: TruncationMode`

`TruncationMode` 取值:
- `head` —— 省略开头(`…text`)。
- `middle` —— 省略中间(`te…xt`)。
- `tail` —— 省略结尾(`text…`),默认值。

## 示例

```tsx
<Text lineLimit={1} truncationMode="middle">
  A very long string that will not fit on one line
</Text>
```
