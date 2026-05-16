The `QRCode` module provides functionality for **parsing**, **generating**, and **scanning** QR codes. Scripts can use this module to decode QR codes from images, generate QR code images from text, or open the system scanning interface to scan a QR code.

This module is suitable for the following scenarios:

* Parsing QR code content from a local image file
* Parsing QR codes from a `UIImage` object
* Generating a QR code image from text
* Opening the scanning interface to scan a QR code

All methods are **asynchronous APIs** and return a `Promise`.

---

# API

## parse

Parse a QR code from an image file at the specified path.

```ts
function parse(filePath: string): Promise<string | null>
```

This method reads the image file at the specified path and attempts to recognize the QR code contained in the image.

If a QR code is successfully decoded, the text content embedded in the QR code is returned. If no QR code is detected or parsing fails, the method returns `null`.

### Example

```ts
const result = await QRCode.parse('path/to/file')

if (result != null) {
  console.log(result)
}
```

---

# parseImage

Parse a QR code from a `UIImage` object.

```ts
function parseImage(image: UIImage): Promise<string | null>
```

This method parses a QR code directly from an in-memory image object without requiring the image to be saved to a file first.

### Example

```ts
const image = await Image.fromFile('/path/to/qrcode.png')

const result = await QRCode.parseImage(image)

if (result != null) {
  console.log(result)
}
```

---

# generate

Generate a QR code image from text.

```ts
function generate(text: string): Promise<UIImage | null>
```

This method encodes the specified text into a QR code and returns the generated QR code image.

### Example

```ts
const image = await QRCode.generate('https://example.com')

if (image != null) {
  console.log(image)
}
```

---

# scan

Open the scanning interface and scan a QR code.

```ts
function scan(): Promise<string | null>
```

This method opens the QR code scanning interface and uses the device camera to scan a QR code.

When the scan succeeds, the text content embedded in the QR code is returned.

If the user cancels the scan or no QR code is recognized, the method returns `null`.

### Example

```ts
const result = await QRCode.scan()

if (result != null) {
  console.log(result)
}
```
