# presentationBackground

把所在 sheet 或 popover 的背景设为某个 shape style(如颜色或材质)。应用在 `sheet`、`popover`、`fullScreenCover` 所呈现的内容上。

## `presentationBackground?: ShapeStyle | DynamicShapeStyle`

接受任意 shape style —— 颜色、渐变,或系统材质(如 `"regularMaterial"`、`"thinMaterial"`),以及 `DynamicShapeStyle`(`{ light, dark }`)按明暗模式区分。

## 示例

```tsx
// sheet 后方使用半透明材质。
<VStack presentationBackground="thinMaterial">
  <Text>Sheet content</Text>
</VStack>

// 纯色背景。
<VStack presentationBackground="systemBackground">
  <Text>Sheet content</Text>
</VStack>
```
