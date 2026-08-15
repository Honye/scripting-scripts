`Archive` 类用于处理 ZIP 和 7z 归档文件。
ZIP 使用可修改的 `Archive` 实例；7z 方法支持 AES-256 加密、进度和取消。

---

## 概述

`Archive` 提供了灵活的接口来管理压缩包内容，包括：

* 打开已有归档或创建新归档；
* 添加文件、目录或自定义数据；
* 支持异步与同步两种操作模式；
* 提取文件内容到内存或磁盘；
* 删除归档中的条目；
* 支持自定义压缩算法（如 `deflate`）；
* 可通过 `entries()` 获取归档中的所有条目信息。
* 创建、列出和解压 AES-256 加密的 7z 归档。

---

## 静态方法

### `static openForMode(path: string, accessMode: "create" | "update" | "read", options?: { pathEncoding?: Encoding }): Archive`

打开 ZIP 归档文件。返回实例上的方法仅适用于 ZIP。

**参数：**

| 参数名                    | 类型                   | 说明                                                       |
| ---------------------- | -------------------- | -------------------------------------------------------- |
| `path`                 | `string`             | 要打开的归档文件路径。                                              |
| `accessMode`           | `"create" \| "update" \| "read"` | 访问模式：`"create"` 新建 ZIP，`"read"` 只读打开，`"update"` 打开并修改。 |
| `options.pathEncoding` | `Encoding`           | 可选，指定归档中文件路径的编码方式，默认为 `"utf-8"`。                         |

**返回值：**
返回一个 `Archive` 对象。

**示例：**

```ts
const archive = Archive.openForMode("/tmp/example.zip", "update")
```

---

### `static create7z(options: SevenZipCreateOptions): SevenZipTask`

创建 AES-256 加密的 7z 归档。目标文件必须不存在；文件内容始终加密，文件名和归档元数据默认也会加密。

| 选项 | 类型 | 说明 |
| ---- | ---- | ---- |
| `sources` | `Array<string \| { path: string; archivePath?: string }>` | 源文件或非空目录；`archivePath` 可指定归档内路径。 |
| `destinationPath` | `string` | 新 `.7z` 文件的路径。 |
| `password` | `string` | 必填的非空加密密码。 |
| `encryptHeader` | `boolean` | 是否加密文件名和归档元数据，默认 `true`。 |
| `compressionLevel` | `3` | 可选；当前版本支持压缩级别 3。 |
| `solid` | `false` | 可选；当前版本创建非 solid 归档。 |

```ts
const task = Archive.create7z({
  sources: [
    "/tmp/report.pdf",
    { path: "/tmp/photos", archivePath: "attachments/photos" }
  ],
  destinationPath: "/tmp/backup.7z",
  password: "a-strong-password"
})

task.onProgress = progress => {
  console.log(`${Math.round(progress.fractionCompleted * 100)}% ${progress.path}`)
}

const result = await task.result
console.log(result.destinationPath, result.outputBytes)
```

暂不支持空源目录和符号链接。

---

### `static list7z(options: SevenZipListOptions): Promise<ArchiveEntry[]>`

列出 7z 归档中的条目。归档 header 已加密时必须提供密码。

```ts
const entries = await Archive.list7z({
  sourcePath: "/tmp/backup.7z",
  password: "a-strong-password"
})

for (const entry of entries) {
  console.log(entry.path, entry.uncompressedSize, entry.isEncrypted)
}
```

---

### `static extract7z(options: SevenZipExtractOptions): SevenZipTask`

将 7z 归档解压到新目录。不安全的条目路径和超过限制的归档会被拒绝，且不会覆盖已有目标。

| 选项 | 类型 | 说明 |
| ---- | ---- | ---- |
| `sourcePath` | `string` | 源 `.7z` 文件路径。 |
| `destinationPath` | `string` | 新目标目录路径。 |
| `password` | `string` | 加密归档的密码。 |
| `overwrite` | `"error"` | 可选；当前版本会在目标已存在时失败。 |
| `maxEntries` | `number` | 可选的最大条目数。 |
| `maxEntryUncompressedBytes` | `number` | 可选的单个条目最大解压大小。 |
| `maxUncompressedBytes` | `number` | 可选的总解压大小上限。 |
| `maxExpansionRatio` | `number` | 可选的解压后大小与归档大小比率上限。 |

```ts
const task = Archive.extract7z({
  sourcePath: "/tmp/backup.7z",
  destinationPath: "/tmp/restored",
  password: "a-strong-password"
})

try {
  const result = await task.result
  console.log(`已解压 ${result.entryCount} 个条目`)
} catch (error) {
  if (error.name === "ArchiveError") {
    console.log(error.code, error.message)
  }
}
```

---

## SevenZipTask 类型

`create7z()` 和 `extract7z()` 返回可报告进度和取消的任务对象。

| 成员 | 类型 | 说明 |
| ---- | ---- | ---- |
| `status` | `"pending" \| "running" \| "completed" \| "failed" \| "cancelled"` | 当前任务状态。 |
| `progress` | `SevenZipProgress` | 最近一次操作、路径和 `fractionCompleted` 进度。 |
| `onProgress` | `((progress: SevenZipProgress) => void) \| null` | 进度变化时调用。 |
| `result` | `Promise<SevenZipResult>` | 操作成功时 resolve；失败时以 `ArchiveError` reject。 |
| `cancel()` | `void` | 请求取消，可重复调用。 |
| `dispose()` | `void` | 移除回调并取消未完成的工作。 |

`ArchiveError.code` 可能为 `invalidArguments`、`permissionDenied`、`sourceNotFound`、`destinationExists`、`invalidPasswordOrCorruptArchive`、`unsafeEntryPath`、`unsupportedEntryType`、`archiveLimitExceeded`、`cancelled`、`outOfSpace`、`ioError` 或 `internalError`。

---

## 属性

### `path: string`

归档文件的路径。

**示例：**

```ts
console.log(archive.path)
```

---

### `data: Data | null`

归档的二进制数据内容（如果以内存方式打开）。

---

## 实例方法

### `entries(pathEncoding?: Encoding): ArchiveEntry[]`

获取归档中所有条目的信息。

**参数：**
`pathEncoding` 可选，指定路径的编码方式，默认为 `"utf-8"`。

**返回值：**
返回一个 `ArchiveEntry` 对象的数组，包含所有条目的信息。

---

### `getEntryPaths(encoding?: Encoding): string[]`

获取归档中所有条目的路径。

**参数：**
`encoding` 可选，指定路径的编码方式，默认为 `"utf-8"`。

**返回值：**
返回一个字符串数组，包含所有条目的路径。

---

### `getEntry(path: string): ArchiveEntry | null`

获取归档中指定路径的条目。

**参数：**
`path` 要获取的条目的路径。

**返回值：**
返回一个 `ArchiveEntry` 对象，或 `null` 如果条目不存在。

---

### `contains(path: string): boolean`

判断归档中是否包含指定路径的条目。

**参数：**

`path` 要判断的条目的路径。

**返回值：**
`true` 表示存在，`false` 表示不存在。

**示例：**

```ts
if (archive.contains("README.md")) {
  console.log("Archive contains README.md")
}
```

---

### `addEntry(path: string, toPath: string, options?: { compressionMethod?: "deflate" | "none"; bufferSize?: number }): Promise<void>`

向归档中添加一个现有文件（异步）。

**参数：**

| 参数名                         | 类型                     | 说明                      |
| --------------------------- | ---------------------- | ----------------------- |
| `path`                      | `string`               | 源文件路径。                  |
| `toPath`                    | `string`               | 添加到归档中的目标路径。            |
| `options.compressionMethod` | `"deflate"` | `"none"` | 压缩方式，默认为 `"none"`。      |
| `options.bufferSize`        | `number`               | 缓冲区大小，默认为 `16*1024` 字节。 |

**示例：**

```ts
await archive.addEntry("/tmp/input.txt", "docs/input.txt", {
  compressionMethod: "deflate"
})
```

---

### `addEntrySync(path: string, toPath: string, options?)`

同步版本，与 `addEntry()` 功能相同。
若添加失败会抛出异常。

---

### `addFileEntry(path: string, uncompressedSize: number, provider: (offset: number, length: number) => Data, options?): Promise<void>`

通过数据提供函数添加文件到归档（异步）。

**参数：**

| 参数名                         | 类型                                         | 说明                           |
| --------------------------- | ------------------------------------------ | ---------------------------- |
| `path`                      | `string`                                   | 要添加的归档路径（文件名）。               |
| `uncompressedSize`          | `number`                                   | 文件未压缩时的大小。                   |
| `provider`                  | `(offset: number, length: number) => Data` | 用于提供文件数据的函数，会被多次调用直到读取完所有数据。 |
| `options.modificationDate`  | `Date`                                     | 修改时间（可选）。                    |
| `options.compressionMethod` | `"deflate"` | `"none"`                     | 压缩方式（默认 `"none"`）。           |
| `options.bufferSize`        | `number`                                   | 缓冲区大小，默认 `16*1024` 字节。       |

**示例：**

```ts
const data = Data.fromRawString("abcdefg".repeat(100))
await archive.addFileEntry("fromMemory.txt", data.count, (offset, length) => {
  return data.slice(offset, offset + length)
})
```

---

### `addFileEntrySync(...)`

同步版本，与上方异步方法功能一致。

---

### `addDirectoryEntry(path: string, options?): Promise<void>`

向归档中添加一个目录。

**参数：**

| 参数名                         | 类型                     | 说明                   |
| --------------------------- | ---------------------- | -------------------- |
| `path`                      | `string`               | 要添加的目录路径。            |
| `options.modificationDate`  | `Date`                 | 修改日期（可选）。            |
| `options.compressionMethod` | `"deflate"` | `"none"` | 压缩方式（默认 `"none"`）。   |
| `options.bufferSize`        | `number`               | 缓冲区大小（默认 `16*1024`）。 |

**示例：**

```ts
await archive.addDirectoryEntry("images/")
```

---

### `addDirectoryEntrySync(...)`

同步版本，与 `addDirectoryEntry()` 功能相同。

---

### `removeEntry(path: string, options?): Promise<void>`

从归档中删除指定路径的条目（异步）。

**参数：**

| 参数名                  | 类型       | 说明                   |
| -------------------- | -------- | -------------------- |
| `path`               | `string` | 要删除的条目路径。            |
| `options.bufferSize` | `number` | 缓冲区大小（默认 `16*1024`）。 |

**示例：**

```ts
await archive.removeEntry("old/file.txt")
```

---

### `removeEntrySync(...)`

同步版本，与 `removeEntry()` 功能相同。

---

### `extract(path: string, consumer: (data: Data) => void, options?): Promise<void>`

从归档中提取指定文件，并将其数据通过回调函数分块返回（异步）。

**参数：**

| 参数名                  | 类型                     | 说明                   |
| -------------------- | ---------------------- | -------------------- |
| `path`               | `string`               | 要提取的文件路径。            |
| `consumer`           | `(data: Data) => void` | 数据消费函数，用于处理提取的数据块。   |
| `options.bufferSize` | `number`               | 缓冲区大小（默认 `16*1024`）。 |

**示例：**

```ts
await archive.extract("docs/manual.txt", (chunk) => {
  console.log("Received chunk:", chunk.count)
})
```

---

### `extractSync(...)`

同步版本，与 `extract()` 功能一致。

---

### `extractTo(path: string, to: string, options?): Promise<void>`

将归档中的文件或目录提取到指定磁盘路径（异步）。

**参数：**

| 参数名                                | 类型        | 说明                               |
| ---------------------------------- | --------- | -------------------------------- |
| `path`                             | `string`  | 归档内路径。                           |
| `to`                               | `string`  | 提取到的目标路径。                        |
| `options.bufferSize`               | `number`  | 缓冲区大小（默认 `16*1024`）。             |
| `options.allowUncontainedSymlinks` | `boolean` | 是否允许解压出不在目标目录内的符号链接（默认 `false`）。 |

**示例：**

```ts
await archive.extractTo("docs/", "/tmp/extracted/")
```

---

### `extractToSync(...)`

同步版本，与 `extractTo()` 功能一致。

---

## ArchiveEntry 类型

`ArchiveEntry` 表示归档中的一个条目（文件、目录或符号链接）。

| 属性                 | 类型                                     | 说明                  |
| ------------------ | -------------------------------------- | ------------------- |
| `path`             | `string`                               | 条目的路径。              |
| `type`             | `"file"` | `"directory"` | `"symlink"` | 条目类型。               |
| `isCompressed`     | `boolean`                              | 是否为压缩状态。            |
| `compressedSize`   | `number`                               | 压缩后的大小（字节）。         |
| `uncompressedSize` | `number`                               | 原始未压缩大小（字节）。        |
| `isEncrypted`      | `boolean \| undefined`                  | 条目内容是否加密；由 `list7z()` 返回的条目提供。 |
| `fileAttributes`   | `{ posixPermissions?: number; modificationDate?: Date }`                             | 文件属性信息（时间戳、类型、大小等）。 |

**示例：**

```ts
for (const entry of archive.entries()) {
  console.log(`[${entry.type}] ${entry.path} (${entry.uncompressedSize} bytes)`)
}
```

---

## 综合示例

### 创建新压缩包并添加文件

```ts
const archive = Archive.openForMode("/tmp/example.zip", "update")

await archive.addEntry(
  "/tmp/hello.txt",
  "docs/hello.txt",
  { compressionMethod: "deflate" }
)

await archive.addDirectoryEntry("images/")
await archive.addEntry("/tmp/logo.png", "images/logo.png")

console.log("Archive entries:", archive.entries().length)
```

### 提取文件到本地目录

```ts
const archive = Archive.openForMode("/tmp/example.zip", "read")
await archive.extractTo("docs/hello.txt", "/tmp/unpacked/hello.txt")
```
