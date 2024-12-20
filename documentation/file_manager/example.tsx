import { ScrollView, VStack, Path, NavigationStack, Button, Navigation } from "scripting"
import { APIExample } from "../api_example"

export function FileManagerExample() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle={"FileManager"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <VStack>
        <APIExample
          title={"FileManager.isiCloudEnabled"}
          subtitle={"Wether the iCloud is enabled. If you are not logged into iCloud, or have not authorized the Scripting app to use iCloud features, this method will return false."}
          code={`console.log("iCloud enabled: " + FileManager.isiCloudEnabled)`}
          run={(log) => {
            log("iCloud enabled: " + FileManager.isiCloudEnabled)
          }}
        />

        <APIExample
          title={"FileManager.isFileStoredIniCloud"}
          subtitle={"Returns a boolean value indicating whether the file is targeted for storage in iCloud."}
          code={`if (FileManager.isiCloudEnabled) {
  const path = Path.join(
    FileManager.iCloudDocumentsDirectory,
    "Scripting Documentation/index.tsx"
  )
  const result = FileManager.isFileStoredIniCloud(path)
  console.log(\`File "\${path}" is stored in iCloud: \${result}\`)
} else {
  console.log("iCloud is not available.")
}`}
          run={async (log) => {
            if (FileManager.isiCloudEnabled) {
              const path = Path.join(
                FileManager.iCloudDocumentsDirectory,
                "Scripting Documentation/index.tsx"
              )
              const result = FileManager.isFileStoredIniCloud(path)
              log(`File "${path}" is stored in iCloud: ${result}`)
            } else {
              log("iCloud is not available.")
            }
          }}
        />

        <APIExample
          title={"FileManager.iCloudDocumentsDirectory"}
          subtitle={"Returns the path to iCloud's Documents directory, if iCloud is disabled, this method would throw an error, you should use isiCloudEnabled to check it."}
          code={`try {
  const directory = FileManager.iCloudDocumentsDirectory
  console.log("iCloud documents directory: " + directory)
} catch (e) {
  console.error(String(e))
}`}
          run={async (log) => {
            try {
              const directory = FileManager.iCloudDocumentsDirectory
              log("iCloud documents directory: " + directory)
            } catch (e) {
              log(String(e), true)
            }
          }}
        />

        <APIExample
          title={"FileManager.isiCloudFileDownloaded"}
          subtitle={"Returns a boolean value indicating whether the file is downloaded from iCloud."}
          code={`if (FileManager.isiCloudEnabled) {
  const path = Path.join(
    FileManager.iCloudDocumentsDirectory,
    "Scripting Documentation/index.tsx"
  )
  const result = FileManager.isiCloudFileDownloaded(path)
  console.log(\`File "\${path}" is downloaded: \${result}\`)
} else {
  console.log("iCloud is not available.")
}`}
          run={async (log) => {
            if (FileManager.isiCloudEnabled) {
              const path = Path.join(
                FileManager.iCloudDocumentsDirectory,
                "Scripting Documentation/index.tsx"
              )
              const result = FileManager.isiCloudFileDownloaded(path)
              log(`File "${path}" is downloaded: ${result}`)
            } else {
              log("iCloud is not available.")
            }
          }}
        />

        <APIExample
          title={"FileManager.downloadFileFromiCloud"}
          subtitle={"Download a iCloud file."}
          code={`const path = Path.join(
  FileManager.iCloudDocumentsDirectory,
  "Scripting Documentation/index.tsx"
)

if (await FileManager.isiCloudFileDownloaded(path)) {
  console.log("The file has been downloaded")
} else {
  if (await FileManager.downloadFileFromiCloud(path)) {
    console.log("Download completed")
  } else {
    console.log("Failed to download from iCloud")
  }
}`}
          run={async (log) => {
            const path = Path.join(
              FileManager.iCloudDocumentsDirectory,
              "Scripting Documentation/index.tsx"
            )

            if (FileManager.isiCloudFileDownloaded(path)) {
              log("The file has been downloaded")
            } else {
              if (await FileManager.downloadFileFromiCloud(path)) {
                log("Download completed")
              } else {
                log("Failed to download from iCloud", true)
              }
            }
          }}
        />

        <APIExample
          title={"FileManager.appGroupDocumentsDirectory"}
          subtitle={"Returns the path to shared App Group Documents directory. Files stored in this directory will not appear in the Files app, but the script running in Widget can access these files."}
          code={`console.log(FileManager.appGroupDocumentsDirectory)`}
          run={async (log) => {
            log(FileManager.appGroupDocumentsDirectory)
          }}
        />

        <APIExample
          title={"FileManager.documentsDirectory"}
          subtitle={"Returns the path to Documents directory, documents stored in ths directory can be accessed using Files app, the script running in Widget cannot access these files."}
          code={`console.log(FileManager.documentsDirectory)`}
          run={async (log) => {
            log(FileManager.documentsDirectory)
          }}
        />

        <APIExample
          title={"FileManager.temporaryDirectory"}
          subtitle={"Returns the path to the temporary directory."}
          code={`console.log(FileManager.temporaryDirectory)`}
          run={async (log) => {
            log(FileManager.temporaryDirectory)
          }}
        />

        <APIExample
          title={"FileManager.exists"}
          subtitle={"Returns a boolean value that indicates whether a file or directory exists at a specified path."}
          code={`console.log(\`Check file exists: \${await FileManager.exists(path)}\`)`}
          run={async (log) => {
            const path = Path.join(
              FileManager.iCloudDocumentsDirectory,
              "Scripting Documentation/index.tsx"
            )

            log(`Check file exists: ${await FileManager.exists(path)}`)
          }}
        />

        <APIExample
          title={"FileManager.createDirectory"}
          subtitle={"Creates a directory at the specified path string."}
          code={`const directory = Path.join(
  FileManager.temporaryDirectory,
  "my_tmp_dir"
)

if (await FileManager.exists(directory)) {
  console.log("Directory already exists")
} else {
  try {
    await FileManager.createDirectory(directory, true)
    console.log("Direcotry create successfully")
  } catch (e) {
    console.log(String(e), true)
  }
}`}
          run={async (log) => {
            const directory = Path.join(
              FileManager.temporaryDirectory,
              "my_tmp_dir"
            )

            if (await FileManager.exists(directory)) {
              log("Directory already exists")
            } else {
              try {
                await FileManager.createDirectory(directory, true)
                log("Direcotry create successfully")
              } catch (e) {
                log(String(e), true)
              }
            }
          }}
        />

        <APIExample
          title={"FileManager.createLink"}
          subtitle={"Creates a symbolic link at the specified path that points to an item at the given path."}
          code={`FileManager.createLink(path, newPath)`}
        />

        <APIExample
          title={"FileManager.writeAsString"}
          subtitle={"Writes a string to a file."}
          code={`const filePath = Path.join(
  FileManager.temporaryDirectory,
  "my_tmp_dir",
  "test.txt"
)

try {
  await FileManager.writeAsString(filePath, "Hello Scripting!")
  console.log("File created")
} catch (e) {
  console.log(String(e))
}`}
          run={async (log) => {
            const filePath = Path.join(
              FileManager.temporaryDirectory,
              "my_tmp_dir",
              "test.txt"
            )

            try {
              await FileManager.writeAsString(filePath, "Hello Scripting!")
              log("File created")
            } catch (e) {
              log(String(e), true)
            }
          }}
        />

        <APIExample
          title={"FileManager.isDirectory"}
          subtitle={"Whether path refers to a directory."}
          code={`const isDirecotry = await FileManager.isDirectory(somePath)`}
        />

        <APIExample
          title={"FileManager.isFile"}
          subtitle={"Whether path refers to a file."}
          code={`const isFile = await FileManager.isFile(somePath)`}
        />

        <APIExample
          title={"FileManager.copyFile"}
          subtitle={"Copies the item at the specified path to a new location synchronously."}
          code={`try {
  await FileManager.copyFile(
    oldFileOrDirectory,
    newFileOrDirectory
  )
  console.log("Copy successfully")
} catch (e) {
  console.error("Failed to copy", e)
}`}
        />

        <APIExample
          title={"FileManager.readDirectory"}
          subtitle={"Performs a shallow search of the specified directory and returns the paths of any contained items. Optionally recurses into sub-directories."}
          code={`const contents = await FileManager.readDirectory(
  FileManager.temporaryDirectory
)
console.log(contents)
`}
          run={async (log) => {
            const contents = await FileManager.readDirectory(
              FileManager.temporaryDirectory
            )
            log(JSON.stringify(contents, null, 2))
          }}
        />

        <APIExample
          title={"FileManager.stat"}
          subtitle={"If path is a symbolic link then it is resolved and results for the resulting file are returned."}
          code={`try {
  const stat = FileManager.stat(
    Path.join(FileManager.temporaryDirectory, "my_tmp_dir/test.txt")
  )
  console.log(stat)
} catch (e) {
  console.error("Failed to read stat of file")
}`}
          run={async (log) => {
            try {
              const stat = await FileManager.stat(
                Path.join(FileManager.temporaryDirectory, "my_tmp_dir/test.txt")
              )
              log(JSON.stringify(stat, null, 2))
            } catch (e) {
              log("Failed to read stat of file", true)
            }
          }}
        />

        <APIExample
          title={"FileManager.rename"}
          subtitle={"Moves the file or directory at the specified path to a new location synchronously."}
          code={`FileManager.rename(oldFilePath, newFilePath)`}
        />

        <APIExample
          title={"FileManager.remove"}
          subtitle={"Removes the file or directory at the specified path."}
          code={`const filePath = Path.join(
  FileManager.temporaryDirectory,
  "my_tmp_dir/test.txt"
)

if (await FileManager.exists(filePath)) {
  try {
    await FileManager.remove(filePath)
    console.log("File remove successfully")
  } catch (e) {
    console.error(String(e))
  }
} else {
  console.error("File not exists")
}`}
          run={async (log) => {
            const filePath = Path.join(
              FileManager.temporaryDirectory,
              "my_tmp_dir/test.txt"
            )

            if (await FileManager.exists(filePath)) {
              try {
                await FileManager.remove(filePath)
                log("File remove successfully")
              } catch (e) {
                log(String(e), true)
              }
            } else {
              log("File not exists", true)
            }
          }}
        />

        <APIExample
          title={"FileManager.zip"}
          subtitle={"Zips the file or directory contents at the specified srcPath to the destPath. shouldKeepParent indicates that the directory name of a source item should be used as root element within the archive. Defaults to true."}
          code={`const docsDir = FileManager.documentsDirectory

// zip a single file
await FileManager.zip(
  docsDir + '/test.txt',
  docsDir + '/test.zip',
)

// zip a directory
await FileManager.zip(
  docsDir + '/MyScript',
  docsDir + '/MyScript.zip'
)`}
        />

        <APIExample
          title={"FileManager.unzip"}
          subtitle={"Unzips the contents at the specified srcPath to the destPath."}
          code={`await FileManager.unzip(
  Path.join(FileManager.temporaryDirectory, 'MyScript.zip'),
  await FileManager.documentsDirectory()
)`}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}