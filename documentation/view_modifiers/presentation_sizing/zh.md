# presentationSizing

为所在的 sheet 弹层请求一种尺寸行为。应用在 sheet 内容的根视图上。

> 需要 iOS 18 及以上。低版本不生效。

## `presentationSizing?: PresentationSizing`

`PresentationSizing` 取值:
- `automatic` —— 由系统根据弹层上下文自动选择尺寸。
- `fitted` —— 让 sheet 在两个维度上都自适应内容大小。
- `page` —— 与容器同尺寸、带标准页边距的 sheet。
- `form` —— 适合表单的尺寸。

## 示例

```tsx
<VStack presentationSizing="form">
  {/* sheet 内容 */}
</VStack>
```
