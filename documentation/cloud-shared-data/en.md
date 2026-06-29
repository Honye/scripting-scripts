The `CloudSharedData` class lets your script read and write an iCloud-backed shared data store and collaborate on it with other users — for example a baby-growth log that the whole family maintains together through the same script.

Data is stored in CloudKit (the owner's private iCloud database) and synced across participants. It requires the user to be signed in to iCloud and a **Pro** subscription, and the script must declare the `cloudSharedData` permission.

---

## Who creates a store

A store is identified by a **UUID**. Scripts are pure consumers — they cannot create or list stores. Instead:

* Create a store in **Settings → iCloud Shared Data** (or ask the assistant to create one). You get a store **UUID**.
* Paste that UUID into your script: `new CloudSharedData(uuid)`.
* To collaborate, share the store (from the management page or via `share()` / `presentShareSheet()` below) and have others accept. Once accepted, they paste the **same** UUID into the same script.

Isolation works by consent, not structure:

* **Per script/skill** — the first time a given script or skill touches a store, the user is asked to grant access for that script + store. Denying makes all calls for that store fail. Grants can be revoked in Settings → iCloud Shared Data.
* **Across users** — handled by CloudKit and Apple ID. A user can only access a store that was explicitly shared with them and that they accepted.

---

## Creating an instance

```ts
// The UUID comes from Settings → iCloud Shared Data, or from a share you accepted.
const store = new CloudSharedData("3F2504E0-4F89-41D3-9A0C-0305E82C3301")
```

---

## Directory semantics (entries)

Use key/value entries when multiple people append or edit independent records — concurrent appends never conflict.

```ts
// Owner or any participant
await store.put("2026-06-20", { height: 75, weight: 9.2 })

const entry = await store.get("2026-06-20")
// entry?.value -> { height: 75, weight: 9.2 }

const all = await store.entries()
// [{ key: "2026-06-20", value: {...}, hasBlob: false }, ...]

await store.remove("2026-06-20")
```

Attach a binary blob to an entry:

```ts
const photo = Data.fromJPEG(image, 0.8)!
await store.put("first-smile", { note: "🙂" }, photo)
const e = await store.get("first-smile")
// e?.blob -> Data | null
```

Same key written again overwrites it (last write wins). Editing the *same* entry concurrently resolves last-writer-wins; appending or removing *different* keys never conflicts.

---

## Single-file semantics

When the whole store is one document, use the file APIs (independent of entries):

```ts
await store.writeFile(Data.fromString(JSON.stringify(state))!)
const data = await store.readFile()
```

Concurrent writes to the file are last-writer-wins.

---

## Sharing

```ts
// Get a link to invite collaborators (works in every host, including widgets):
const info = await store.share({ permission: "readWrite" })
// info.url -> send it via Messages, etc.

// Or present the native invite sheet (main app, Share / Translation UI extensions):
await store.presentShareSheet({ permission: "readWrite" })

// Inspect participants / permission:
const current = await store.shareInfo()

// Stop sharing (owner only):
await store.stopSharing()
```

In the native sheet the user can choose between "only invited people" and "anyone with the link", and read-only vs read-write.

---

## Staying in sync

```ts
// Pull-based: cheaply check whether anything changed, then re-read.
if (await store.refresh()) {
  const all = await store.entries()
}

// Push-based: get notified when others change the store.
const unsubscribe = store.onChange(async () => {
  const all = await store.entries()
  // update your UI
})
// Call unsubscribe() when you no longer need updates.
```

---

## Methods

| Method | Description |
| ------ | ----------- |
| `new CloudSharedData(storeId)` | Connect to a store by UUID (created in Settings, or shared with you). |
| `put(key, value, blob?)` | Write/overwrite an entry. |
| `get(key)` | Read an entry, or `null`. |
| `remove(key)` | Delete an entry. |
| `entries()` | List all entries (blobs not loaded). |
| `writeFile(data)` | Overwrite the store's single-file data. |
| `readFile()` | Read the single-file data, or `null`. |
| `refresh()` | Returns `true` if the store changed since the last call. |
| `onChange(callback)` | Observe remote changes; returns an unsubscribe function. |
| `share(options?)` | Start/fetch sharing; returns share info with a link. |
| `presentShareSheet(options?)` | Present the native invite sheet. |
| `shareInfo()` | Current share info, or `null`. |
| `stopSharing()` | Stop sharing (owner only). |

---

## Notes

* Requires iCloud sign-in and a Pro subscription; declare the `cloudSharedData` permission in the script.
* Scripts cannot create or list stores — do that in Tools → iCloud Shared Data, or ask the assistant. Scripts consume a store by its UUID.
* Joining a shared store: when someone shares a store with you, tap their share link to open Scripting. It shows the store and an Accept button; after accepting, the store appears in Tools → iCloud Shared Data, where you can copy its ID and paste it into a script.
* The data API (read/write/share-link) works in the app and extensions; the native invite sheet only where a presentation context exists (app, Share / Translation UI extensions).
* Always call the function returned by `onChange` when you are done observing.
