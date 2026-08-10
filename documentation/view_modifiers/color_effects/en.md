# Color & Filter Effects

A set of modifiers that adjust the rendered colors of a view, mirroring the SwiftUI color/filter modifiers.

## Modifiers

### `brightness?: number`
Brightens (or darkens) the view. Typically between `-1` and `1`; `0` leaves the view unchanged.

### `contrast?: number`
Adjusts contrast and color separation. `1` is unchanged, `0` renders fully gray, negative values invert.

### `saturation?: number`
Adjusts color saturation. `1` is unchanged, `0` is grayscale, values above `1` boost saturation.

### `grayscale?: number`
Applies a grayscale effect. `0` is unchanged, `1` is fully grayscale.

### `colorInvert` — use `colorConvert?: boolean`
Inverts the colors of the view. (Exposed as the existing `colorConvert` modifier.)

### `luminanceToAlpha?: boolean`
Turns the view into a mask whose opacity is derived from the luminance of its content. Set `true` to enable.

### `colorMultiply?: Color`
Multiplies the view's colors by the given color.

### `blendMode?: BlendMode`
Sets the blend mode used to composite the view with the content behind it. One of: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `colorDodge`, `colorBurn`, `softLight`, `hardLight`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `sourceAtop`, `destinationOver`, `destinationOut`, `plusDarker`, `plusLighter`.

## Example

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
