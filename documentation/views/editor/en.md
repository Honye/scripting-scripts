A powerful code editor that can be controlled programmatically or embedded into a user interface. It supports syntax highlighting, read/write access, and flexible presentation using the `EditorController` class and the `Editor` component.

---

## EditorController

### Overview

`EditorController` is used to manage an instance of the editor. It allows you to configure the editor content, track changes, present the UI, and release resources.

### Constructor

Creates a new editor controller instance.

**Parameters**:

* `content` (optional): The initial text content displayed in the editor.
* `ext` (optional): The file extension used to determine syntax highlighting. Supported values include `tsx`, `ts`, `js`, `jsx`, `txt`, `md`, `css`, `html`, and `json`.
* `readOnly` (optional): If `true`, the editor is set to read-only mode. Defaults to `false`.

---

### Properties

#### `ext`

A read-only string indicating the file extension type provided during initialization. It determines the language syntax used in the editor.

#### `content`

A string representing the current content of the editor. You can assign a new value to update the editor programmatically.

#### `onContentChanged`

An optional callback function that will be triggered when the content is changed by the user. This callback is **not called immediately**, but approximately 100 milliseconds after editing occurs. This allows for debounced content tracking or autosave behavior.

---

### Methods

#### `present(options?)`

Displays the editor modally.

**Parameters**:

* `navigationTitle` (optional): Set the navigation title of the editor.
* `scriptName` (optional): A custom script name that overrides the default `Script.name` while the editor is running. Defaults to `"Temporary Script"`.
* `fullscreen` (optional): A boolean value that determines whether the editor should be presented in fullscreen mode. Defaults to `false`.

**Returns**: A Promise that resolves when the editor is dismissed.

#### `dismiss()`

Dismisses the currently presented editor view. This does **not** dispose of the controller instance, so you can call `present()` again later.

**Returns**: A Promise that resolves when dismissal is complete.

#### Navigation

* `scrollToLine(line)`: Scroll so the given **1-based** line is centered and place the cursor there.
* `scrollToPosition(position)`: Scroll so the given character offset is centered and place the cursor there.
* `scrollSelectionIntoView()`: Scroll so the current selection is visible.

#### Selection & text

* `getSelectedText(): Promise<string>`: Get the currently selected text (empty string when there is no selection). The promise **rejects** if the editor is not presented (timeout) or has been disposed.
* `setSelection(start, end)`: Select the range `[start, end)` and scroll it into view.
* `replaceSelection(text)`: Replace the current selection with `text`. When there is no selection, the text is inserted at the cursor.
* `selectAll()`: Select all text.

#### Search

* `searchText(query, options?): Promise<EditorTextRange[]>`: Search the whole document and return all matched ranges (`{ start, end, line }`). `options` supports `caseSensitive`, `regexp`, and `wholeWord`. The matching runs inside the editor, so you don't have to compute offsets yourself.

Scripting does not impose a built-in search UI — combine `searchText` (or your own matching over `content`) with `setSelection` to highlight a match and `replaceSelection` to replace it, so you can build a search & replace experience that fits your script.

#### Editing

* `undo()` / `redo()`: Undo or redo the last change.
* `toggleLineComment()` / `toggleBlockComment()`: Toggle line or block comments around the current selection.

#### `dispose()`

Releases the resources held by the editor controller. This must be called when the controller is no longer needed to avoid memory leaks. Once disposed, the controller cannot be used again.

---

## Editor Component

The `Editor` component is a React-style view that renders the editor inline within your UI. It is typically used in conjunction with an `EditorController` instance.

**Props**:

* `controller`: An `EditorController` instance that manages the editor's content and behavior.
* `scriptName` (optional): Overrides the default script name for the embedded editor session.
* `showAccessoryView` (optional): Whether to show the accessory view when the keyboard is visible. This is useful for showing buttons like "Move Left", "Move Right", "Delete", "Dissmiss Keyboard", etc. Defaults to `false`. It is recommended to set this to `true` when the editor is fully visible on the screen, such as when the editor is the only view in the screen.

---

### Example Usage

```tsx
function MyEditor() {
  const controller = useMemo(() => {
    return new EditorController({
      content: `const text = "Hello, World!"`,
      ext: "ts",
      readOnly: false,
    })
  }, [])
  
  useEffect(() => {
    return () => {
      controller.dispose()
    }
  }, [controller])

  return (
    <Editor
      controller={controller}
      scriptName="My Script"
      showAccessoryView
    />
  )
}
```

---

### Example: a custom search & replace bar (`index.tsx`)

This example builds its own search UI on top of the interaction APIs: `searchText` finds the
matches, `setSelection` highlights the current one, and `replaceSelection` replaces it.

```tsx
import { useEffect, useMemo, useState } from "scripting"

function EditorWithSearch() {
  const controller = useMemo(() => new EditorController({
    ext: "ts",
    content: [
      `const greeting = "hello"`,
      `console.log(greeting)`,
      `console.log(greeting.toUpperCase())`,
    ].join("\n"),
  }), [])

  const [query, setQuery] = useState("")
  const [replacement, setReplacement] = useState("")
  const [matches, setMatches] = useState<EditorTextRange[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => () => controller.dispose(), [controller])

  async function runSearch() {
    const result = await controller.searchText(query, { caseSensitive: false })
    setMatches(result)
    setIndex(0)
    if (result.length > 0) {
      const m = result[0]
      controller.setSelection(m.start, m.end)
    }
  }

  function goTo(next: number) {
    if (matches.length === 0) return
    const i = (next + matches.length) % matches.length
    setIndex(i)
    controller.setSelection(matches[i].start, matches[i].end)
  }

  function replaceCurrent() {
    if (matches.length === 0) return
    // The current match is already selected, so just replace the selection,
    // then re-run the search since offsets shifted.
    controller.replaceSelection(replacement)
    runSearch()
  }

  return (
    <VStack>
      <HStack>
        <TextField title="Find" value={query} onChanged={setQuery} />
        <Button title="Search" action={runSearch} />
      </HStack>
      <HStack>
        <TextField title="Replace" value={replacement} onChanged={setReplacement} />
        <Button title="Replace" action={replaceCurrent} />
      </HStack>
      <HStack>
        <Text>{matches.length > 0 ? `${index + 1} / ${matches.length}` : "No matches"}</Text>
        <Button title="Prev" action={() => goTo(index - 1)} />
        <Button title="Next" action={() => goTo(index + 1)} />
      </HStack>
      <Editor controller={controller} showAccessoryView />
    </VStack>
  )
}
```