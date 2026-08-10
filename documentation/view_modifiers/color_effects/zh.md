# 颜色与滤镜效果

一组调整视图渲染颜色的 modifier,对应 SwiftUI 的颜色/滤镜修饰符。

## Modifier 列表

### `brightness?: number`
提高(或降低)视图亮度。通常取值 `-1` 到 `1`;`0` 表示不变。

### `contrast?: number`
调整对比度与颜色分离度。`1` 不变,`0` 全灰,负值反相。

### `saturation?: number`
调整饱和度。`1` 不变,`0` 灰度,大于 `1` 增强饱和。

### `grayscale?: number`
应用灰度效果。`0` 不变,`1` 完全灰度。

### `colorInvert` —— 使用 `colorConvert?: boolean`
反转视图颜色。(以现有的 `colorConvert` modifier 暴露。)

### `luminanceToAlpha?: boolean`
把视图变成一个遮罩,其不透明度由内容亮度推导。设为 `true` 启用。

### `colorMultiply?: Color`
将视图颜色与给定颜色相乘。

### `blendMode?: BlendMode`
设置视图与其后方内容合成时的混合模式。取值:`normal`、`multiply`、`screen`、`overlay`、`darken`、`lighten`、`colorDodge`、`colorBurn`、`softLight`、`hardLight`、`difference`、`exclusion`、`hue`、`saturation`、`color`、`luminosity`、`sourceAtop`、`destinationOver`、`destinationOut`、`plusDarker`、`plusLighter`。

## 示例

```tsx
<Image
  systemName="photo"
  saturation={0.3}
  contrast={1.2}
  brightness={0.05}
/>

<Image systemName="star.fill" colorMultiply="orange" />

<Text blendMode="multiply">Blended</Text>
```
