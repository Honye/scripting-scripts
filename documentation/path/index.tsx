import { Path, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function PathExample() {

  return <ScrollView
    navigationTitle={"Path"}
  >
    <VStack>
      <APIExample
        title={"Path.join"}
        subtitle={"Joins all given path segments together using the platform specific separator as a delimiter, then normalizes the resulting path."}
        code={`Path.join(FileManager.documentsDirectory, "some_dir", "test_file.js")`}
        run={async log => {
          log(Path.join(FileManager.documentsDirectory, "some_dir", "test_file.js"))
        }}
      />
      <APIExample
        title={"Path.normalize"}
        subtitle={"Normalizes the given path, resolving '..' and '.' segments."}
        code={`Path.normalize("/foo/bar//baz/asdf/quux/..")
// Returns: "/foo/bar/baz/asdf"`}
        run={(log) => {
          log(Path.normalize("/foo/bar//baz/asdf/quux/.."))
        }}
      />

      <APIExample
        title={"Path.isAbsolute"}
        subtitle={`The Path.isAbsolute() method determines if path is an absolute path. If the given path is a zero-length string, false will be returned.`}
        code={`Path.isAbsolute("/foo/bar/baz/asdf/quux") // true`}
        run={(log) => {
          log(Path.isAbsolute("/Users/xxx").toString())
        }}
      />

      <APIExample
        title={"Path.dirname"}
        subtitle="The path.dirname() method returns the directory name of a path."
        code={`Path.dirname("/foo/bar/baz/asdf/quux") // Returns: "/foo/bar/baz/asdf"`}
        run={(log) => {
          log(Path.dirname("/foo/bar/baz/asdf/quux"))
        }}
      />

      <APIExample
        title={"Path.basename"}
        subtitle={"The Path.basename() methods returns the last portion of a path, similar to the Unix basename command. Trailing directory separators are ignored, see Path.sep."}
        code={`Path.basename("/foo/bar/baz/asdf/quux")`}
        run={log => {
          log(Path.basename("/foo/bar/baz/asdf/quux"))
        }}
      />

      <APIExample
        title={"Path.extname"}
        subtitle={"The Path.extname() method returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last portion of the path. If there is no . in the last portion of the path, or if the first character of the basename of path (see Path.basename()) is ., then an empty string is returned."}
        code={`Path.extname("/foo/bar.jpeg")`}
        run={log => {
          log(Path.extname("/foo/bar.jpeg"))
        }}
      />

      <APIExample
        title={"Path.parse"}
        subtitle={`The Path.parse() method returns an object whose properties represent significant elements of the path.`}
        code={`Path.parse("/foo/bar/baz/asdf/quux")`}
        run={log => {
          log(JSON.stringify(Path.parse("/foo/bar/baz/asdf/quux"), null, 2))
        }}
      />
    </VStack>
  </ScrollView>
}