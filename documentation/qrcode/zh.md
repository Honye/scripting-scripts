`QRCode` 模块提供二维码解析、生成以及扫码功能。脚本可以通过该模块解析二维码图片、生成二维码图像，或打开系统扫码界面进行扫描。

该模块适用于以下场景：

* 从本地图片文件中解析二维码内容
* 从 `UIImage` 对象解析二维码
* 根据文本生成二维码图片
* 打开扫码界面扫描二维码

所有方法均为 **异步 API**，返回 `Promise`。

---

# API

## parse

解析指定路径的二维码图片文件。

```ts
function parse(filePath: string): Promise<string | null>
```

该方法会读取指定路径的图片文件，并尝试识别其中的二维码内容。

如果成功解析二维码，则返回二维码中的文本内容；如果未识别到二维码或解析失败，则返回 `null`。

### 示例

```ts
const result = await QRCode.parse('path/to/file')

if (result != null) {
  console.log(result)
}
```

---

# parseImage

解析 `UIImage` 对象中的二维码。

```ts
function parseImage(image: UIImage): Promise<string | null>
```

该方法用于直接从内存中的图片对象解析二维码，而不需要先保存为文件。

### 示例

```ts
const image = await Image.fromFile('/path/to/qrcode.png')

const result = await QRCode.parseImage(image)

if (result != null) {
  console.log(result)
}
```

---

# generate

根据文本生成二维码图片。

```ts
function generate(text: string): Promise<UIImage | null>
```

该方法会将指定文本编码为二维码，并返回对应的二维码图片。

### 示例

```ts
const image = await QRCode.generate('https://example.com')

if (image != null) {
  console.log(image)
}
```

---

# scan

打开扫码页面并扫描二维码。

```ts
function scan(): Promise<string | null>
```

该方法会打开二维码扫描界面，并使用设备摄像头扫描二维码。

当用户扫描成功后，返回二维码中的文本内容。

如果用户取消扫描或未识别到二维码，则返回 `null`。

### 示例

```ts
const result = await QRCode.scan()

if (result != null) {
  console.log(result)
}
```
