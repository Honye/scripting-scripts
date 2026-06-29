The `DocumentInteraction` interface presents the system **"Open in…"** menu (and the fuller options menu) for a file, letting the user pick an app to open or copy the file with.

> **There is no "open in default app" on iOS.** iOS has no concept of a default app per file type, and no public API to open a file directly in its associated app. Presenting this menu and letting the user choose is the only supported way to hand a file to another app.

## API

```ts
namespace DocumentInteraction {
  // "Open in…" menu — only the apps that can open/copy the file.
  function openInMenu(filePath: string): Promise<string | null>

  // Full options menu — Open in… plus Copy / Print / Save to Files / Markup, etc.
  function optionsMenu(filePath: string): Promise<string | null>
}
```

Both resolve to the **bundle identifier** of the app the file was sent to, or `null` if the user dismissed the menu without choosing an app (for `optionsMenu`, `null` also covers performing a non-open action such as Copy).

- `openInMenu` **rejects** if the file does not exist, or if no app is available to open it.
- `optionsMenu` **rejects** if the file does not exist.

On iPad the menu is shown as a popover anchored to the center of the current page.

## Example

```tsx
const path = FileManager.documentsDirectory + "/report.pdf"

try {
  const app = await DocumentInteraction.openInMenu(path)
  if (app != null) {
    console.log("Opened in:", app) // e.g. "com.apple.mobilenotes"
  } else {
    console.log("User dismissed the menu.")
  }
} catch (e) {
  // File missing, or no app can open this file type.
  console.error(e)
}
```

## Notes

- `filePath` must be the absolute path of an existing file.
- For files obtained from a document picker (security-scoped), make sure your script holds access to the file before presenting the menu.
- The file's display name comes from its file name; the file type is inferred from its extension.
