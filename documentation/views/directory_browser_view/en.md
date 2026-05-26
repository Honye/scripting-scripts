`DirectoryBrowserView` displays the contents of a local directory and provides built-in file management actions.

It can preview text files in the editor, preview binary files with Quick Look, import files, export files, rename items, delete items, and navigate into subdirectories.

## Props

```ts
type DirectoryBrowserViewProps = {
  title: string
  directoryPath?: string | null
  onFilesChanged?: () => void
}
```

| Property | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title displayed in the navigation bar. |
| `directoryPath` | `string \| null` | The directory to browse. If omitted, the view shows an empty folder. |
| `onFilesChanged` | `() => void` | Called after importing, renaming, deleting, or saving a file. |

## Example

```tsx
<NavigationStack>
  <DirectoryBrowserView
    title="Workspace"
    directoryPath={Script.directoryPath}
    onFilesChanged={() => console.log("Files changed")}
  />
</NavigationStack>
```

## Notes

* Place this view inside `NavigationStack` so subdirectory navigation works naturally.
* The view creates the target directory if it does not already exist.
* Text files open in the editor and can be saved back to disk.
* Non-text files open with Quick Look.
* `onFilesChanged` is useful when you need to refresh dependent state after file operations.
