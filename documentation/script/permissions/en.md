Scripting can require **per-script permission** for sensitive device capabilities. When the user enables **Require Per-Script Permission** in Settings, each script must be individually granted access to capabilities such as Calendar, Reminders, Contacts, Location, Photos, HomeKit, Health, the clipboard, and the file system — even if the app itself already has the corresponding system permission.

By default a capability is requested the first time the script calls the matching API. `Script.requestAccess` lets a script request several capabilities up front, so the user grants them all at once instead of being prompted one by one.

---

## `ScriptingApi`

Identifiers for the capabilities that can be granted per script:

```ts
type ScriptingApi =
  | "calendar"
  | "reminders"
  | "alarms"
  | "contacts"
  | "location"
  | "homeKit"
  | "photos"
  | "health"
  | "clipboard"
  | "fileSystem"
```

---

## `Script.requestAccess(apis: ScriptingApi[]): Promise<ScriptingApi[]>`

Requests per-script access to one or more capabilities and resolves with the capabilities that are granted.

- `apis` is required and must be a non-empty array. The promise rejects if it is empty or contains an unknown identifier.
- Prompts for the requested capabilities that have not been decided yet for this script, remembers the choices, and enforces them when the corresponding API is later used.
- Capabilities already allowed or denied are not asked again. If every requested capability is already decided, no prompt is shown.
- In environments without a presenting UI (Widget, Keyboard, Notification, or Share extensions), no prompt is shown.
- The prompt lets the user set each capability individually, or use **Allow All** / **Deny All**.
- It does **not** perform a Scripting PRO check. Capabilities that require PRO (such as `alarms`, `health`, `homeKit`) are still enforced when the corresponding API is actually called.

```ts
const granted = await Script.requestAccess(["calendar", "reminders"])

if (granted.includes("calendar")) {
  // The Calendar API can now be used without a first-use prompt.
}
```

---

## Declaring required permissions

You can declare the capabilities a script needs by long-pressing the script and choosing **Required Permissions**. Declared capabilities are requested automatically the first time the script is run from the app.
