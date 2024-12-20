The `FileManager` class in the Scripting app provides an interface to interact with the iOS filesystem. It includes methods for managing files and directories, checking iCloud status, reading/writing file contents, and working with compressed files. Below is a detailed guide on how to use each feature.

---

### Table of Contents
1. **Basic Information**
2. **iCloud Access**
3. **File and Directory Paths**
4. **Directory and File Operations**
5. **Reading and Writing Files**
6. **File Information**
7. **File Manipulation**
8. **Compression (Zip and Unzip)**

---

#### Basic Information
The `FileManager` class uses several type definitions:
- **Encoding**: Determines the encoding format for file reading/writing. Options include `'utf-8'`, `'ascii'`, and `'latin1'`.
- **FileStat**: Holds metadata about files, such as creation and modification dates, type, and size.

#### iCloud Access
To check for iCloud features and manage files stored in iCloud, use the following:

- **`isiCloudEnabled`**: `boolean`
  - Indicates if iCloud features are enabled. Ensure iCloud is authorized before accessing iCloud-specific paths.
  - **Usage**:
    ```ts
    if (FileManager.isiCloudEnabled) {
      // iCloud is enabled
    }
    ```

- **`iCloudDocumentsDirectory`**: `string`
  - Path to the iCloud Documents directory. **Requires** iCloud to be enabled.
  - **Usage**:
    ```ts
    const path = FileManager.iCloudDocumentsDirectory
    ```

- **`isFileStoredIniCloud(filePath: string)`**: `boolean`
  - Checks if a file is set to be stored in iCloud.
  - **Usage**:
    ```ts
    const isStored = FileManager.isFileStoredIniCloud('/path/to/file')
    ```

- **`isiCloudFileDownloaded(filePath: string)`**: `boolean`
  - Checks if an iCloud file has been downloaded locally.
  - **Usage**:
    ```ts
    const isDownloaded = FileManager.isiCloudFileDownloaded('/path/to/file')
    ```

- **`downloadFileFromiCloud(filePath: string)`**: `Promise<boolean>`
  - Downloads an iCloud file.
  - **Usage**:
    ```ts
    const success = await FileManager.downloadFileFromiCloud('/path/to/file')
    ```

#### File and Directory Paths

- **`appGroupDocumentsDirectory`**: `string`
  - Path to the App Group Documents directory. Files here are accessible within Widgets but not via the Files app.

- **`documentsDirectory`**: `string`
  - Path to the general Documents directory, accessible via the Files app.

- **`temporaryDirectory`**: `string`
  - Path to the temporary directory for storing transient data.

---

#### Directory and File Operations

- **`createDirectory(path: string, recursive?: boolean)`**: `Promise<void>`
  - Creates a directory at the specified path. If `recursive` is `true`, creates parent directories if they don’t exist.
  - **Usage**:
    ```ts
    await FileManager.createDirectory('/path/to/newDir', true)
    ```

- **`createLink(path: string, target: string)`**: `Promise<void>`
  - Creates a symbolic link from `path` to `target`.
  - **Usage**:
    ```ts
    await FileManager.createLink('/path/to/link', '/target/path')
    ```

#### Reading and Writing Files

- **`readAsString(path: string, encoding?: Encoding)`**: `Promise<string>`
  - Reads file contents as a string with optional encoding.
  - **Usage**:
    ```ts
    const content = await FileManager.readAsString('/path/to/file', 'utf-8')
    ```

- **`readAsBytes(path: string)`**: `Promise<Uint8Array>`
  - Reads file contents as a `Uint8Array`.
  - **Usage**:
    ```ts
    const bytes = await FileManager.readAsBytes('/path/to/file')
    ```

- **`readAsData(path: string)`**: `Promise<Data>`
  - Reads file contents as a `Data` object.
  
- **`writeAsString(path: string, contents: string, encoding?: Encoding)`**: `Promise<void>`
  - Writes a string to a file with optional encoding.
  - **Usage**:
    ```ts
    await FileManager.writeAsString('/path/to/file', 'Hello World', 'utf-8')
    ```

- **`writeAsBytes(path: string, data: Uint8Array)`**: `Promise<void>`
  - Writes a `Uint8Array` to a file.

- **`writeAsData(path: string, data: Data)`**: `Promise<void>`
  - Writes `Data` to a file.

#### File Information

- **`stat(path: string)`**: `Promise<FileStat>`
  - Gets metadata for a file or directory.
  - **Usage**:
    ```ts
    const stat = await FileManager.stat('/path/to/file')
    console.log(stat.size)
    ```

#### File Manipulation

- **`rename(path: string, newPath: string)`**: `Promise<void>`
  - Moves or renames a file or directory.
  - **Usage**:
    ```ts
    await FileManager.rename('/old/path', '/new/path')
    ```

- **`remove(path: string)`**: `Promise<void>`
  - Deletes a file or directory (including contents if a directory).
  - **Usage**:
    ```ts
    await FileManager.remove('/path/to/file')
    ```

#### Compression (Zip and Unzip)

- **`zip(srcPath: string, destPath: string, shouldKeepParent?: boolean)`**: `Promise<void>`
  - Zips files or directories to a specified destination. `shouldKeepParent` determines if the top-level directory is preserved.
  - **Usage**:
    ```ts
    await FileManager.zip('/path/to/folder', '/path/to/folder.zip', true)
    ```

- **`unzip(srcPath: string, destPath: string)`**: `Promise<void>`
  - Unzips contents from a zip file.
  - **Usage**:
    ```ts
    await FileManager.unzip('/path/to/file.zip', '/path/to/extracted')
    ```

---

This `FileManager` API enables robust file and directory management with iCloud and local support. Make sure to handle asynchronous operations carefully to ensure smooth functionality.
