`Spotlight` lets scripts add their own resources to the system Spotlight index. When the user taps one of those results, Scripting runs the same script's `spotlight.tsx` file.

Spotlight indexing requires Scripting PRO.

## Index Items

```ts
await Spotlight.index({
  id: "note-42",
  title: "Project Notes",
  contentDescription: "Open the project note from Spotlight.",
  keywords: ["notes", "project"],
  parameters: {
    noteID: "42",
    source: "spotlight"
  }
})
```

`id` is local to the current script. Calling `Spotlight.index` again with the same `id` updates the existing item.

```ts
await Spotlight.indexItems([
  {
    id: "task-1",
    title: "Follow up"
  },
  {
    id: "task-2",
    title: "Send invoice",
    parameters: { invoiceID: "2026-001" }
  }
])
```

## Item Fields

Only `id` and `title` are required. Apart from the two Scripting-only fields below, every field maps 1:1 to a property of Apple's [`CSSearchableItemAttributeSet`](https://developer.apple.com/documentation/corespotlight/cssearchableitemattributeset) and is grouped here the same way Apple documents them.

**Scripting-only**

- `id` *(required)* — Script-local identifier, unique within the current script. Returned as `Spotlight.current.id` when the result is tapped.
- `parameters` — Arbitrary JSON delivered to `spotlight.tsx` as `Spotlight.current.parameters`. This is not a Spotlight metadata field; it is how you pass context to your tap handler.

**General**

- `title` *(required)* — Primary title shown in the result.
- `displayName` — Display name; falls back to `title` when omitted.
- `alternateNames` — Other names the item can also be found by.
- `contentType` — Uniform Type Identifier (`UTType`) used to pick the result icon, e.g. `"public.image"`, `"com.adobe.pdf"`, `"public.movie"`, `"public.folder"`. Defaults to plain text.
- `contentURL` — URL of the underlying content; use a `file://` URL for local content.
- `thumbnailData` — Thumbnail image bytes. Takes priority over `thumbnailURL`.
- `thumbnailURL` — Local file URL string pointing to a thumbnail image.
- `keywords` — Extra terms the item should match against.
- `rankingHint` — Higher numbers rank the item higher among results.
- `supportsNavigation` — Marks the item as navigable; pair with `latitude` / `longitude`.
- `supportsPhoneCall` — Marks the item as callable; pair with `phoneNumbers`.

**Documents**

- `contentDescription` — Longer description shown under the title.
- `subject` — Subject of the content.
- `kind` — Human-readable kind, e.g. `"Note"`, `"Invoice"`.
- `creator` — Entity that created the content.
- `pageCount` — Number of pages.
- `fileSize` — Content size in bytes.

**Messaging**

- `textContent` — Full searchable body text; improves recall for free-text queries.
- `authorNames` — Author display names.
- `emailAddresses` — Associated email addresses.
- `phoneNumbers` — Associated phone numbers.

**Media**

- `comment` — Free-form comment.
- `contentCreationDate` — Creation date. Defaults to the first index time when omitted.
- `contentModificationDate` — Modification date. Defaults to the last index time when omitted.
- `lastUsedDate` — When the item was last used.

**Events**

- `startDate` / `endDate` — For event-like items.
- `dueDate` / `completionDate` — For task-like items.
- `allDay` — Whether the event spans the whole day.

**Places**

- `latitude` / `longitude` / `altitude` — Coordinates, in degrees / degrees / meters.
- `namedLocation` — Human-readable place name.
- `city` / `stateOrProvince` / `country` / `postalCode` / `fullyFormattedAddress` — Address components.

**Item-level**

- `expirationDate` — When Spotlight should drop the item from the index. Omit it to keep the item indexed until you delete it explicitly.

Notes:

- **Dates** (`contentCreationDate`, `lastUsedDate`, `startDate`, `expirationDate`, ...) accept a `Date`, an ISO-8601 string, or a numeric timestamp in seconds.
- **Thumbnails**: `thumbnailData` wins over `thumbnailURL` when both are set.

A full example touching every group:

```ts
await Spotlight.index({
  id: "doc-7",
  parameters: { reportID: "q3" },

  // General
  title: "Q3 Report",
  displayName: "Q3 Report",
  alternateNames: ["Quarterly Report"],
  contentType: "com.adobe.pdf",
  contentURL: "file:///path/to/report.pdf",
  thumbnailData: Data.fromFile("/path/to/thumb.png") ?? undefined,
  thumbnailURL: "/path/to/thumb.png",
  keywords: ["report", "finance"],
  rankingHint: 10,
  supportsNavigation: false,
  supportsPhoneCall: false,

  // Documents
  contentDescription: "Quarterly financials.",
  subject: "Finance",
  kind: "Report",
  creator: "Finance Team",
  pageCount: 12,
  fileSize: 204800,

  // Messaging
  textContent: "Full searchable body text...",
  authorNames: ["Jane Doe"],
  emailAddresses: ["jane@example.com"],
  phoneNumbers: ["+1-555-0100"],

  // Media
  comment: "Reviewed",
  contentCreationDate: new Date(),
  contentModificationDate: new Date(),
  lastUsedDate: Date.now(),

  // Events
  startDate: "2026-07-01T00:00:00Z",
  endDate: "2026-09-30T00:00:00Z",
  dueDate: new Date(),
  completionDate: new Date(),
  allDay: false,

  // Places
  latitude: 37.3349,
  longitude: -122.009,
  altitude: 30,
  namedLocation: "Apple Park",
  city: "Cupertino",
  stateOrProvince: "CA",
  country: "USA",
  postalCode: "95014",
  fullyFormattedAddress: "1 Apple Park Way, Cupertino, CA 95014",

  // Item-level
  expirationDate: new Date(),
})
```

## Search Reliability

How well an item surfaces is decided by the system, not by Scripting. A few things help:

- **Put every searchable term in `keywords` as a separate entry.** Spotlight matches whole words and word *prefixes*, not arbitrary substrings — searching `"part"` will match `"partner"` but searching `"art"` will not match it. For dictionary-style data, add each spelling, inflection, and alternate form as its own keyword (e.g. `["run", "runs", "running", "ran"]`).
- **Keep `title` short and exact.** It is the strongest matching field; put the canonical term there and push variants into `keywords` / `alternateNames`.
- **Use `rankingHint`** (higher = earlier) to bias ranking *among your own items*.
- **`textContent`** improves recall for longer free-text queries (definitions, body text).

Limitations to be aware of:

- Spotlight does not do substring/fuzzy matching, so mid-word or partial queries may not match. Add explicit prefixes as keywords if you need them.
- Apple's built-in results (Dictionary, Contacts, etc.) are privileged system data sources and are ranked separately. Custom items generally cannot outrank them for short, common words, no matter how they are tagged.

## Large Indexes

`indexItems` accepts large arrays and submits them to the system in batches; you can index several thousand items per script. `await` the call — it resolves once the work is handed to Spotlight, and awaiting is the recommended way to know indexing finished and to catch errors. Updating an existing `id` overwrites the previous item, so re-indexing is safe to call repeatedly.

## Handle Taps

Create a `spotlight.tsx` file in the script project:

```ts
const item = Spotlight.current

if (item) {
  console.log(item.id)
  console.log(JSON.stringify(item.parameters))
}
```

`Spotlight.current` is `null` in other script environments. It is available when `spotlight.tsx` is launched from a Spotlight result.

Spotlight tap parameters are not exposed through `Script.queryParameters`.

## Manage Items

```ts
const items = await Spotlight.getItems()

await Spotlight.delete("note-42")
await Spotlight.deleteItems(["task-1", "task-2"])
await Spotlight.deleteAll()
```

Users can also manage indexed items from Tools > Spotlight, including deleting entries whose script or `spotlight.tsx` file no longer exists.
