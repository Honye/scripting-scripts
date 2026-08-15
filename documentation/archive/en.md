The `Archive` class provides interfaces for working with ZIP and 7z files.
ZIP archives use mutable `Archive` instances. The 7z methods support AES-256 encryption, progress, and cancellation.

---

## Overview

`Archive` enables flexible management of compressed archive contents, including:

* Opening existing archives or creating new ones
* Adding files, directories, or in-memory data
* Extracting entries to memory or disk
* Deleting specific entries
* Listing archive contents
* Supporting multiple compression methods (e.g. `deflate`, `none`)
* Working in either synchronous or asynchronous modes
* Creating, listing, and extracting AES-256 encrypted 7z archives

---

## Static Methods

### `static openForMode(path: string, accessMode: "create" | "update" | "read", options?: { pathEncoding?: Encoding }): Archive`

Opens a ZIP archive file. The returned instance methods apply to ZIP archives only.

**Parameters:**

| Name                   | Type                  | Description                                                                                      |
| ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| `path`                 | `string`              | The file path of the archive.                                                                    |
| `accessMode`           | `"create" \| "update" \| "read"` | The access mode: `"create"` creates a new ZIP archive, `"read"` opens it read-only, and `"update"` opens it for modification. |
| `options.pathEncoding` | `Encoding`            | Optional. The path encoding used inside the archive (default is `"utf-8"`).                      |

**Returns:**
An `Archive` object.

**Example:**

```ts
const archive = Archive.openForMode("/tmp/example.zip", "update")
```

---

### `static create7z(options: SevenZipCreateOptions): SevenZipTask`

Creates a new AES-256 encrypted 7z archive. The destination must not already exist. Content is always encrypted; file names are encrypted by default.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `sources` | `Array<string \| { path: string; archivePath?: string }>` | Source files or non-empty directories. `archivePath` optionally changes the path stored in the archive. |
| `destinationPath` | `string` | Path of the new `.7z` file. |
| `password` | `string` | Required non-empty encryption password. |
| `encryptHeader` | `boolean` | Whether to encrypt file names and archive metadata. Defaults to `true`. |
| `compressionLevel` | `3` | Optional. This version supports compression level 3. |
| `solid` | `false` | Optional. This version creates non-solid archives. |

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

Empty source directories and symbolic links are not supported.

---

### `static list7z(options: SevenZipListOptions): Promise<ArchiveEntry[]>`

Lists the entries in a 7z archive. A password is required when the archive header is encrypted.

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

Extracts a 7z archive into a new directory. Unsafe entry paths and archives that exceed the configured limits are rejected. Existing destinations are not overwritten.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `sourcePath` | `string` | Path of the source `.7z` file. |
| `destinationPath` | `string` | Path of a new destination directory. |
| `password` | `string` | Password for an encrypted archive. |
| `overwrite` | `"error"` | Optional. This version rejects existing destinations. |
| `maxEntries` | `number` | Optional maximum number of entries. |
| `maxEntryUncompressedBytes` | `number` | Optional maximum uncompressed size of one entry. |
| `maxUncompressedBytes` | `number` | Optional maximum total uncompressed size. |
| `maxExpansionRatio` | `number` | Optional maximum uncompressed-to-archive size ratio. |

```ts
const task = Archive.extract7z({
  sourcePath: "/tmp/backup.7z",
  destinationPath: "/tmp/restored",
  password: "a-strong-password"
})

try {
  const result = await task.result
  console.log(`Extracted ${result.entryCount} entries`)
} catch (error) {
  if (error.name === "ArchiveError") {
    console.log(error.code, error.message)
  }
}
```

---

## SevenZipTask Interface

`create7z()` and `extract7z()` return a task that reports progress and can be cancelled.

| Member | Type | Description |
| ------ | ---- | ----------- |
| `status` | `"pending" \| "running" \| "completed" \| "failed" \| "cancelled"` | Current task state. |
| `progress` | `SevenZipProgress` | Latest operation, path, and `fractionCompleted` value. |
| `onProgress` | `((progress: SevenZipProgress) => void) \| null` | Called when progress changes. |
| `result` | `Promise<SevenZipResult>` | Resolves when the operation succeeds, or rejects with `ArchiveError`. |
| `cancel()` | `void` | Requests cancellation. Safe to call more than once. |
| `dispose()` | `void` | Removes callbacks and cancels unfinished work. |

`ArchiveError.code` is one of `invalidArguments`, `permissionDenied`, `sourceNotFound`, `destinationExists`, `invalidPasswordOrCorruptArchive`, `unsafeEntryPath`, `unsupportedEntryType`, `archiveLimitExceeded`, `cancelled`, `outOfSpace`, `ioError`, or `internalError`.

---

## Properties

### `path: string`

The path of the archive file.

**Example:**

```ts
console.log(archive.path)
```

---

### `data: Data | null`

The raw data of the archive (if opened from memory).

---

## Instance Methods

### `entries(pathEncoding?: Encoding): ArchiveEntry[]`

Retrieves the entries in the archive.

**Parameters:**

`pathEncoding`: Optional. The encoding to use for decoding entry paths (default is `"utf-8"`).

**Returns:**
An array of `ArchiveEntry` objects.

---

### `getEntryPaths(encoding?: Encoding): string[]`

Retrieves the paths of all entries in the archive.

**Parameters:**

`encoding`: Optional. The encoding to use for decoding entry paths (default is `"utf-8"`).

**Returns:**
An array of entry paths.

---

### `getEntry(path: string): ArchiveEntry | null`

Retrieves an entry by its path.

**Parameters:**

`path`: The path of the entry to retrieve.

**Returns:**
The `ArchiveEntry` object if found; otherwise, `null`.

---

### `contains(path: string): boolean`

Checks whether the archive contains a specific entry.

**Parameters:**

`path`: The path of the entry to check.

**Returns:**
`true` if the path exists; otherwise, `false`.

**Example:**

```ts
if (archive.contains("README.md")) {
  console.log("Archive contains README.md")
}
```

---

### `addEntry(path: string, toPath: string, options?: { compressionMethod?: "deflate" | "none"; bufferSize?: number }): Promise<void>`

Adds an existing file to the archive (asynchronously).

**Parameters:**

| Name                        | Type                   | Description                                  |
| --------------------------- | ---------------------- | -------------------------------------------- |
| `path`                      | `string`               | The source file path.                        |
| `toPath`                    | `string`               | The destination path inside the archive.     |
| `options.compressionMethod` | `"deflate"` | `"none"` | Compression method (default: `"none"`).      |
| `options.bufferSize`        | `number`               | Buffer size in bytes (default: `16 * 1024`). |

**Example:**

```ts
await archive.addEntry("/tmp/input.txt", "docs/input.txt", {
  compressionMethod: "deflate"
})
```

---

### `addEntrySync(path: string, toPath: string, options?)`

Synchronous version of `addEntry()`.
Throws an error if the entry cannot be added.

---

### `addFileEntry(path: string, uncompressedSize: number, provider: (offset: number, length: number) => Data, options?): Promise<void>`

Adds a file entry to the archive using a data provider function (asynchronous).

**Parameters:**

| Name                        | Type                                       | Description                                   |
| --------------------------- | ------------------------------------------ | --------------------------------------------- |
| `path`                      | `string`                                   | The target file path inside the archive.      |
| `uncompressedSize`          | `number`                                   | The uncompressed file size.                   |
| `provider`                  | `(offset: number, length: number) => Data` | A function that provides file data by chunks. |
| `options.modificationDate`  | `Date`                                     | Optional modification date.                   |
| `options.compressionMethod` | `"deflate"` | `"none"`                     | Compression method (default: `"none"`).       |
| `options.bufferSize`        | `number`                                   | Buffer size in bytes (default: `16 * 1024`).  |

**Example:**

```ts
const data = Data.fromRawString("abcdefg".repeat(100))
await archive.addFileEntry("fromMemory.txt", data.count, (offset, length) => {
  return data.slice(offset, offset + length)
})
```

---

### `addFileEntrySync(...)`

Synchronous version of `addFileEntry()`.

---

### `addDirectoryEntry(path: string, options?): Promise<void>`

Adds a directory entry to the archive.

**Parameters:**

| Name                        | Type                   | Description                             |
| --------------------------- | ---------------------- | --------------------------------------- |
| `path`                      | `string`               | Directory path to add.                  |
| `options.modificationDate`  | `Date`                 | Optional modification date.             |
| `options.compressionMethod` | `"deflate"` | `"none"` | Compression method (default: `"none"`). |
| `options.bufferSize`        | `number`               | Buffer size (default: `16 * 1024`).     |

**Example:**

```ts
await archive.addDirectoryEntry("images/")
```

---

### `addDirectoryEntrySync(...)`

Synchronous version of `addDirectoryEntry()`.

---

### `removeEntry(path: string, options?): Promise<void>`

Removes a specific entry from the archive (asynchronously).

**Parameters:**

| Name                 | Type     | Description                         |
| -------------------- | -------- | ----------------------------------- |
| `path`               | `string` | The path of the entry to remove.    |
| `options.bufferSize` | `number` | Buffer size (default: `16 * 1024`). |

**Example:**

```ts
await archive.removeEntry("old/file.txt")
```

---

### `removeEntrySync(...)`

Synchronous version of `removeEntry()`.

---

### `extract(path: string, consumer: (data: Data) => void, options?): Promise<void>`

Extracts a specific entry from the archive and provides its data in chunks via a consumer callback (asynchronous).

**Parameters:**

| Name                 | Type                   | Description                            |
| -------------------- | ---------------------- | -------------------------------------- |
| `path`               | `string`               | The path of the entry to extract.      |
| `consumer`           | `(data: Data) => void` | A callback to process each data chunk. |
| `options.bufferSize` | `number`               | Buffer size (default: `16 * 1024`).    |

**Example:**

```ts
await archive.extract("docs/manual.txt", (chunk) => {
  console.log("Received chunk:", chunk.count)
})
```

---

### `extractSync(...)`

Synchronous version of `extract()`.

---

### `extractTo(path: string, to: string, options?): Promise<void>`

Extracts an entry or directory from the archive to a specific file system location (asynchronously).

**Parameters:**

| Name                               | Type      | Description                                               |
| ---------------------------------- | --------- | --------------------------------------------------------- |
| `path`                             | `string`  | Path of the entry inside the archive.                     |
| `to`                               | `string`  | Target path to extract to.                                |
| `options.bufferSize`               | `number`  | Buffer size (default: `16 * 1024`).                       |
| `options.allowUncontainedSymlinks` | `boolean` | Whether to allow uncontained symlinks (default: `false`). |

**Example:**

```ts
await archive.extractTo("docs/", "/tmp/extracted/")
```

---

### `extractToSync(...)`

Synchronous version of `extractTo()`.

---

## ArchiveEntry Interface

`ArchiveEntry` represents a single entry (file, directory, or symbolic link) inside an archive.

| Property           | Type                                   | Description                               |
| ------------------ | -------------------------------------- | ----------------------------------------- |
| `path`             | `string`                               | The path of the entry.                    |
| `type`             | `"file"` | `"directory"` | `"symlink"` | The entry type.                           |
| `isCompressed`     | `boolean`                              | Whether the entry is compressed.          |
| `compressedSize`   | `number`                               | Compressed size in bytes.                 |
| `uncompressedSize` | `number`                               | Uncompressed size in bytes.               |
| `isEncrypted`      | `boolean \| undefined`                  | Whether the payload is encrypted. Present for entries returned by `list7z()`. |
| `fileAttributes`   | `{ posixPermissions?: number; modificationDate?: Date }`                             | File attributes. |

**Example:**

```ts
for (const entry of archive.entries()) {
  console.log(`[${entry.type}] ${entry.path} (${entry.uncompressedSize} bytes)`)
}
```

---

## Examples

### Create a new archive and add files

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

---

### Extract a file to disk

```ts
const archive = Archive.openForMode("/tmp/example.zip", "read")
await archive.extractTo("docs/hello.txt", "/tmp/unpacked/hello.txt")
```
