The `UIImage` class represents an image object that can be loaded, encoded, converted, and displayed.
It supports creating images from file paths, binary data, or Base64 strings and provides multiple format conversion methods (PNG/JPEG).
`UIImage` can be displayed directly in an `Image` component or used with the `Data` class for storage, uploading, or encryption.

---

## Overview

`UIImage` is the core class for handling images in the scripting environment. It is commonly used for:

* Loading images from local files, binary data, Base64 strings or networl URL.
* Accessing image dimensions and scale
* Converting image formats (e.g., PNG, JPEG)
* Generating Base64-encoded strings
* Adjusting rendering and resizing modes
* Flipping or tinting images
* Generating thumbnails
* Displaying dynamic images that switch between light and dark modes

---

## Properties

### `width: number`

The width of the image in pixels.

```ts
const image = UIImage.fromFile("/path/to/image.png")
console.log(image?.width)
```

---

### `height: number`

The height of the image in pixels.

```ts
const image = UIImage.fromFile("/path/to/image.png")
console.log(image?.height)
```

---

### `scale: number`

The scale factor of the image, usually `1` or `2` for Retina displays.

```ts
console.log(image?.scale)
```

---

### `imageOrientation: string`

The orientation of the image. Possible values:

* `"up"`
* `"down"`
* `"left"`
* `"right"`
* `"upMirrored"`
* `"downMirrored"`
* `"leftMirrored"`
* `"rightMirrored"`
* `"unknown"`

---

### `isSymbolImage: boolean`

Indicates whether the image is an SF Symbol image.

```ts
const symbol = UIImage.fromSFSymbol("heart.fill")
console.log(symbol?.isSymbolImage) // true
```

---

### `renderingMode: "automatic" | "alwaysOriginal" | "alwaysTemplate" | "unknown"`

The rendering mode of the image:

* `automatic`: Automatically determined by the system
* `alwaysOriginal`: Display the image in its original color
* `alwaysTemplate`: Render the image as a template (can be tinted)

---

### `resizingMode: "tile" | "stretch" | "unknown"`

The resizing mode of the image:

* `"tile"`: The image is tiled to fill the area
* `"stretch"`: The image is stretched to fit

---

### `capInsets: { top: number, left: number, bottom: number, right: number }`

The cap insets that define the stretchable area of the image.

---

### `flipsForRightToLeftLayoutDirection: boolean`

Indicates whether the image automatically flips in right-to-left (RTL) layout directions.

---

## Instance Methods

### `preparingThumbnail(size: Size): UIImage | null`

Creates a thumbnail with the specified size.

* **Parameters:**

  * `size.width`: Width of the thumbnail
  * `size.height`: Height of the thumbnail

* **Returns:**
  A new `UIImage` instance, or `null` if creation fails.

**Example:**

```ts
const image = UIImage.fromFile("/path/to/photo.jpg")
const thumb = image?.preparingThumbnail({ width: 200, height: 200 })
```

---

### `withBaselineOffset(offset: number): UIImage`

Returns a new image with the specified baseline offset, it is useful for aligning text to the bottom of an image.

```ts
const offset = image?.withBaselineOffset(10)
```

---

### `withHorizontallyFlippedOrientation(): UIImage`

Returns a new image with horizontally flipped orientation.

```ts
const flipped = image?.withHorizontallyFlippedOrientation()
```

---

### `withTintColor(color: string, renderingMode?: "automatic" | "alwaysOriginal" | "alwaysTemplate"): UIImage | null`

Applies a tint color to the image using the specified rendering mode.

* **Parameters:**

  * `color`: The tint color as a string, e.g. `"#ffcc00"` or `"rgb(255,128,0)"`
  * `renderingMode`: The rendering mode to use. Defaults to `"automatic"`

**Example:**

```ts
const symbol = UIImage.fromSFSymbol("star.fill")
const tinted = symbol?.withTintColor("#ffcc00", "alwaysTemplate")
```

---

### `withRenderingMode(renderingMode: "automatic" | "alwaysOriginal" | "alwaysTemplate"): UIImage | null`

Returns a new version of the image using the specified rendering mode.

```ts
const templated = image?.withRenderingMode("alwaysTemplate")
```

---

### `resizableImage(capInsets, resizingMode?): UIImage | null`

Returns a new version of the image with specified cap insets and resizing mode.

* **Parameters:**

  * `capInsets`: `{ top, left, bottom, right }`
  * `resizingMode`: `"tile"` or `"stretch"` (default `"tile"`)

**Example:**

```ts
const resizable = image?.resizableImage(
  { top: 10, left: 10, bottom: 10, right: 10 },
  "stretch"
)
```

---

### `renderedInCircle(radius?: number | null, fitEntireImage?: boolean): UIImage`

Returns a new version of the image rendered as a circle, with optional radius and fit behavior.

* **Parameters:**

  * `radius` (optional): The radius of the circle in points.

    * If not specified:

      * When `fitEntireImage` is `false`, the circle uses the **shortest dimension** of the image.
      * When `fitEntireImage` is `true`, the circle uses the **longest dimension** of the image.
  * `fitEntireImage` (optional): Whether to fit the entire image inside the circle.

    * Default value: `true`.
    * If set to `false`, the image fills the circular area and may be cropped.

* **Returns:**

  * A new `UIImage` instance representing the circular rendering.

**Example 1: Create a default circular avatar**

```ts
const image = UIImage.fromFile("/path/to/avatar.jpg")
const circle = image?.renderedInCircle()
<Image image={circle} />
```

**Example 2: Specify radius and fit entire image**

```ts
const image = UIImage.fromFile("/path/to/photo.png")
const circle = image?.renderedInCircle(60, true)
<Image image={circle} />
```

**Example 3: Fill mode (may crop parts of the image)**

```ts
const image = UIImage.fromFile("/path/to/icon.png")
const circle = image?.renderedInCircle(50, false)
<Image image={circle} />
```

---

### `renderedIn(size: { width: number, height: number }, source?: {  position?: ..., size?: ... }): UIImage | null`

Returns a new version of the image rendered with the specified size and optional source region.

* **Parameters:**

  * `size`: `{ width: number, height: number }` - The size of the rendered image.
  * `source`: `{ position?: { x: number, y: number }, size?: { width: number, height: number } }` - The source region of the image.

* **Returns:**

  * A new `UIImage` instance if rendering succeeds, or `null` if it fails.

**Example 1: Scale entire image into a rectangle**

```ts
const image = UIImage.fromFile("/path/to/photo.jpg")
const rendered = image?.renderedIn({width: 200, height: 200 })
<Image image={rendered} />
```

**Example 2: Crop and render a specific region**

```ts
const image = UIImage.fromFile("/path/to/landscape.jpg")
const cropped = image?.renderedIn({
    width: 150, height: 150 
  },
  position: { x: 100, y: 50 },
  size: { width: 300, height: 300 }
)
<Image image={cropped} />
```

---

### `applySymbolConfiguration(config: UIImageSymbolConfiguration | UIImageSymbolConfiguration[]): UIImage | null`

Returns a new version of the image with the specified **symbol configuration** (`UIImageSymbolConfiguration`).
This method is primarily used to customize the appearance of **SF Symbols** images, including color, weight, size, rendering mode, and palette.

* **Parameters:**

  * `config`: The symbol configuration to apply to the image.

    * Can be a single `UIImageSymbolConfiguration` instance, or
    * An array of configurations, which will be applied sequentially (later configurations may override earlier ones).

* **Returns:**

  * A new `UIImage` instance representing the symbol with applied configuration, or `null` if the operation fails.

**Example 1: Display a symbol in multicolor**

```ts
const image = UIImage.fromFile("/path/to/sf_symbol.png")
const config = UIImageSymbolConfiguration.preferringMulticolor()
const colored = image?.applySymbolConfiguration(config)
<Image image={colored} />
```

**Example 2: Apply both scale and weight configurations**

```ts
const image = UIImage.fromFile("/path/to/sf_symbol.png")
const config = [
  UIImageSymbolConfiguration.scale("large"),
  UIImageSymbolConfiguration.weight("bold")
]
const boldLarge = image?.applySymbolConfiguration(config)
<Image image={boldLarge} />
```

**Example 3: Set hierarchical and palette colors**

```ts
const image = UIImage.fromFile("/path/to/symbol.png")
const config = [
  UIImageSymbolConfiguration.hierarchicalColor(Color.blue()),
  UIImageSymbolConfiguration.paletteColors([Color.red(), Color.orange()])
]
const customized = image?.applySymbolConfiguration(config)
<Image image={customized} />
```

---

## UIImageSymbolConfiguration

`UIImageSymbolConfiguration` is a class used to define appearance configurations for **symbol images (SF Symbols)**.
Instances created with its static methods can be passed to `applySymbolConfiguration()` to modify how the symbol is rendered.

### Available Static Methods

| Method                      | Description                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preferringMonochrome()`    | Prefers monochrome rendering for the symbol.                                                                                                                       |
| `preferringMulticolor()`    | Prefers multicolor rendering for the symbol.                                                                                                                       |
| `scale(value)`              | Sets the scale of the symbol. Possible values: `"default"`, `"large"`, `"medium"`, `"small"`, `"unspecified"`.                                                     |
| `weight(value)`             | Sets the stroke weight of the symbol. Possible values: `"ultraLight"`, `"thin"`, `"light"`, `"regular"`, `"medium"`, `"semibold"`, `"bold"`, `"heavy"`, `"black"`. |
| `pointSize(value)`          | Sets the point size of the symbol.                                                                                                                                 |
| `paletteColors(value)`      | Sets a color palette (array of `Color`) for multicolor or layered symbols.                                                                                         |
| `hierarchicalColor(value)`  | Applies a hierarchical color (used for layered shading effects).                                                                                                   |
| `variableValueMode(value)`  | Sets how variable-value symbols are displayed. Possible values: `"automatic"`, `"color"`, `"draw"`.                                                                |
| `colorRenderingMode(value)` | Sets the color rendering mode. Possible values: `"automatic"`, `"flat"`, `"gradient"`.                                                                             |
| `locale(identifier)`        | Sets the locale for localized symbol variants (e.g., `"en"`, `"zh-Hans"`).                                                                                         |

---

**Example: Combine multiple symbol configurations**

```ts
const config = [
  UIImageSymbolConfiguration.scale("medium"),
  UIImageSymbolConfiguration.weight("semibold"),
  UIImageSymbolConfiguration.preferringMonochrome(),
  UIImageSymbolConfiguration.colorRenderingMode("flat")
]

const image = UIImage.fromFile("/path/to/symbol.png")
const result = image?.applySymbolConfiguration(config)
<Image image={result} />
```

---

### `toJPEGData(compressionQuality?: number): Data | null`

Converts the image to JPEG data.

* **Parameters:**

  * `compressionQuality`: A number between `0` and `1`, default is `1`.
* **Returns:**
  A `Data` instance or `null`.

---

### `toPNGData(): Data | null`

Converts the image to PNG data.
Returns a `Data` instance or `null`.

---

### `toJPEGBase64String(compressionQuality?: number): string | null`

Converts the image to a Base64-encoded JPEG string.

---

### `toPNGBase64String(): string | null`

Converts the image to a Base64-encoded PNG string.

---

## Static Methods

### `UIImage.fromData(data: Data): UIImage | null`

Creates an image from a `Data` instance containing PNG or JPEG data.

---

### `UIImage.fromFile(filePath: string): UIImage | null`

Creates an image from a file path (supports PNG, JPG, JPEG).

---

### `UIImage.fromBase64String(base64String: string): UIImage | null`

Creates an image from a Base64 string.

---

### `UIImage.fromSFSymbol(name: string): UIImage | null`

Creates an image from a system SF Symbol.

**Example:**

```ts
const heart = UIImage.fromSFSymbol("heart.fill")
<Image image={heart} />
```

---

### `UIImage.fromURL(url: string): Promise<UIImage | null>`

Creates an image from a URL.

**Example:**

```ts
const image = await UIImage.fromURL("https://example.com/image.jpg")
<Image image={image} />
```

---

## Using UIImage in the UI

`UIImage` can be displayed directly in the `<Image>` component.

### Component Definition

```ts
declare const Image: FunctionComponent<UIImageProps>
```

---

### Props Definition

```ts
type UIImageProps = {
  image: UIImage | DynamicImageSource<UIImage>
}
```

---

### Dynamic Image Type

```ts
type DynamicImageSource<T> = {
  light: T
  dark: T
}
```

Used for automatically switching images in light and dark mode.

---

### Example: Display a Single Image

```ts
const image = UIImage.fromFile("/path/to/avatar.png")
<Image image={image} />
```

---

### Example: Light and Dark Mode

```ts
const lightImage = UIImage.fromFile("/path/to/light-logo.png")
const darkImage = UIImage.fromFile("/path/to/dark-logo.png")

<Image image={{ light: lightImage, dark: darkImage }} />
```

---

## Common Usage Examples

### 1. Convert Image to Base64

```ts
const image = UIImage.fromFile("/path/to/image.png")
const base64 = image?.toPNGBase64String()
```

---

### 2. Compress and Save as JPEG

```ts
const image = UIImage.fromFile("/path/to/photo.jpg")
const jpegData = image?.toJPEGData(0.6)
if (jpegData) {
  // Save the data to a local file
}
```

---

### 3. Restore Image from Base64 String

```ts
const base64 = "iVBORw0KGgoAAAANSUhEUgAA..."
const image = UIImage.fromBase64String(base64)
<Image image={image} />
```

---

### 4. Convert PNG to JPEG and Upload

```ts
const image = UIImage.fromFile("/path/to/logo.png")
const jpegData = image?.toJPEGData(0.8)
if (jpegData) {
  const response = await fetch("https://example.com/upload", {
    method: "POST",
    body: jpegData.toUint8Array()
  })
}
```

---

### 5. Create and Tint an SF Symbol

```ts
const symbol = UIImage.fromSFSymbol("star.fill")
const colored = symbol?.withTintColor("#ffcc00", "alwaysTemplate")
<Image image={colored} />
```

---

### 6. Generate a Thumbnail

```ts
const image = UIImage.fromFile("/path/to/large.jpg")
const thumb = image?.preparingThumbnail({ width: 120, height: 120 })
<Image image={thumb} />
```

---

## Color Extraction

`UIImage` can read colors directly from its pixels. Every color method returns an `RGBAColor`:

```ts
type RGBAColor = {
  red: number    // 0..1
  green: number  // 0..1
  blue: number   // 0..1
  alpha: number  // 0..1
  hex: string    // "#RRGGBBAA" — usable directly as a Color
}
```

### averageColor()

Returns the average color of the whole image, or `null` if it can't be read.

```ts
const image = UIImage.fromFile("/path/to/photo.jpg")
const avg = image?.averageColor()

// The hex string is a valid Color, so use it directly:
<VStack background={avg?.hex}>...</VStack>
```

### dominantColors(count?)

Returns the most dominant colors, sorted from most to least dominant, each with the fraction of the image it covers. `count` defaults to `5` (clamped to 1–16). The image is downsampled before analysis, so this stays fast even for large images.

```ts
type DominantColor = {
  color: RGBAColor
  fraction: number   // 0..1 — share of the image this color covers
}

const palette = image?.dominantColors(6) ?? []
for (const { color, fraction } of palette) {
  console.log(color.hex, Math.round(fraction * 100) + "%")
}
```

### pixelColor(x, y)

Reads the color of a single pixel, or `null` if the coordinate is out of bounds.

> Coordinates are in **pixels** (`pixels = points × scale`). Images loaded from files, data, or URLs usually have a scale of `1`, so pixels and points match. For `@2x` / `@3x` assets or SF Symbols they differ.

```ts
const color = image?.pixelColor(10, 20)
```

### getPixelData()

Returns the raw RGBA pixel buffer (8 bits per channel, straight alpha, row-major, top-left origin), together with its pixel dimensions. `data` is `width × height × 4` bytes.

```ts
const px = image?.getPixelData()
if (px) {
  const bytes = px.data.toUint8Array()
  // pixel (x, y): bytes[(y * px.width + x) * 4 + 0..3] = R, G, B, A
}
```

---

## Image Transforms

Each transform returns a new `UIImage`; the original is left unchanged.

### croppedTo(rect)

Crops the image to a rectangle in **points** (the same space as `width` / `height`). The rect is clamped to the image bounds; returns `null` if it doesn't overlap the image.

```ts
const topLeft = image?.croppedTo({ x: 0, y: 0, width: 100, height: 100 })
```

### rotated(degrees)

Rotates the image clockwise by `degrees`. The canvas expands to fit the whole rotated image.

```ts
const turned = image?.rotated(90)
```

### blurred(radius)

Returns a Gaussian-blurred copy. A larger `radius` produces a stronger blur.

```ts
const soft = image?.blurred(8)
```

### grayscale()

Returns a grayscale (desaturated) copy.

```ts
const mono = image?.grayscale()
```

---

## Summary

`UIImage` is the core class for image manipulation in the Scripting environment. It provides:

* Loading from files, binary data, or Base64 strings
* Support for SF Symbols
* Access to dimensions, scale, orientation, and rendering information
* Methods for flipping, tinting, and resizing
* PNG/JPEG conversion and Base64 encoding
* Thumbnail generation and customizable rendering modes
* Seamless integration with the `<Image>` component
* Light and dark mode image switching support
