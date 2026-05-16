`TranslationUIProvider` allows scripts to take control of the system translation panel’s UI and interaction flow. It enables developers to build fully customized translation interfaces and implement their own default translation logic.

When a host app invokes the translation extension, Scripting executes the `translation_ui_provider.tsx` script. Within this environment, developers can access the source text provided by the host, perform translation logic, construct a custom UI, and present it using `TranslationUIProvider.present(...)`.

This capability is suitable for scenarios such as:

* Customizing the layout and interaction of the translation panel
* Displaying source text, translated results, language selectors, and controls
* Integrating custom translation services or pipelines
* Returning translated text to replace the original content (if allowed by the host)
* Providing a read-only translation interface without modifying the original text

`TranslationUIProvider` does not perform translation itself. It provides a UI container and session control interface. Translation logic must be implemented by the developer within the script, such as calling remote APIs or local processing modules.

---

## Availability

`TranslationUIProvider` requires **iOS 18.4 or later**.

---

## Availability

`TranslationUIProvider` is only available within the Translation UI Provider execution environment and should be used in the `translation_ui_provider.tsx` file.

When the system presents the translation panel, this script acts as the entry point of the session. A typical workflow includes:

1. Read the source text from the host
2. Execute default translation logic
3. Build and present a custom UI
4. Handle user interactions (expand panel, confirm result, finish session)

---

## Execution Model

`TranslationUIProvider` serves two main purposes:

* Providing access to the current translation session context (e.g., source text, replacement capability)
* Controlling the lifecycle and UI of the translation panel

The session is created by the system and host app. Scripting automatically injects the current session into the `TranslationUIProvider` namespace when executing `translation_ui_provider.tsx`.

---

## Session Input

### inputText

```ts
const inputText: string | null
```

Represents the source text provided by the host app.

This is typically the text selected by the user or passed by the host for translation. The value may be `null`, so scripts must handle this case explicitly.

Common usage:

* Display the source text in UI
* Use it as input for translation logic
* Show fallback UI when no text is available

Example:

```ts
const source = TranslationUIProvider.inputText

if (!source) {
  TranslationUIProvider.present(
    <Text>No text available for translation.</Text>
  )
}
```

`inputText` reflects the initial session input and should not be assumed to always exist.

---

### allowsReplacement

```ts
const allowsReplacement: boolean
```

Indicates whether the host app allows replacing the original text with the translated result.

If `true`, scripts can return a translation via `finish(translatedText)`. If `false`, translations can only be displayed, not applied.

Typical usage:

* Conditionally show “Replace” or “Use Translation” actions
* Adjust UI behavior based on capability

Example:

```ts
const canReplace = TranslationUIProvider.allowsReplacement
```

When replacement is not allowed, the UI should avoid presenting misleading actions.

---

## Panel Control

### present(node)

```ts
function present(node: VirtualNode): void
```

Displays the scripted UI in the translation panel.

This is the primary entry point for rendering UI. Developers should construct a `VirtualNode` and pass it to `present(...)`.

Example:

```tsx
import { Text, VStack } from "scripting"

TranslationUIProvider.present(
  <VStack spacing={12}>
    <Text>Custom Translation Panel</Text>
    <Text>{TranslationUIProvider.inputText ?? "No input text"}</Text>
  </VStack>
)
```

It is recommended to encapsulate the UI into a component:

```tsx
function TranslationView() {
  const source = TranslationUIProvider.inputText

  return <VStack spacing={12}>
    <Text>Original</Text>
    <Text>{source ?? "No input text"}</Text>
  </VStack>
}

TranslationUIProvider.present(<TranslationView />)
```

`present(...)` only renders the UI. It does not end the session or return results.

---

### expandSheet()

```ts
function expandSheet(): void
```

Requests the system to expand the translation panel.

This is useful when:

* Displaying long content
* Showing multiple translation results
* Providing advanced controls

Example:

```ts
TranslationUIProvider.expandSheet()
```

This is a request, not a guarantee. The system decides how to handle it.

---

### finish(translation?)

```ts
function finish(translation?: string | null): void
```

Ends the current translation session and optionally returns a translated result.

Two common patterns:

Close without replacement:

```ts
TranslationUIProvider.finish()
```

Close and return translation:

```ts
TranslationUIProvider.finish("Hello world")
```

Typical usage:

```ts
if (TranslationUIProvider.allowsReplacement) {
  TranslationUIProvider.finish(translatedText)
} else {
  TranslationUIProvider.finish()
}
```

Notes:

* Calling `finish(...)` ends the session immediately
* Passing a string attempts to return it to the host
* Passing `null` or omitting closes without replacement
* Final behavior depends on host capabilities

---

## Recommended Development Pattern

A typical structure in `translation_ui_provider.tsx`:

1. Read `inputText`
2. Handle empty input
3. Execute translation logic
4. Build UI with source and translated text
5. Let user confirm or cancel
6. Call `finish(...)` accordingly

---

## Example: Minimal Translation Panel

```tsx
import { Button, Text, VStack } from "scripting"

function TranslationView() {
  const source = TranslationUIProvider.inputText

  return <VStack spacing={12} padding={16}>
    <Text>Original Text</Text>
    <Text>{source ?? "No text available"}</Text>

    <Button
      title="Close"
      action={() => {
        TranslationUIProvider.finish()
      }}
    />
  </VStack>
}

TranslationUIProvider.present(<TranslationView />)
```

---

## Example: With Translation Result and Replacement

```tsx
import { Button, HStack, Text, VStack, useMemo } from "scripting"

function TranslationView() {
  const source = TranslationUIProvider.inputText
  const canReplace = TranslationUIProvider.allowsReplacement

  const translatedText = useMemo(() => {
    if (!source) return ""
    return `[Translated] ${source}`
  }, [source])

  if (!source) {
    return <VStack spacing={12} padding={16}>
      <Text>No text available for translation.</Text>
      <Button
        title="Close"
        action={() => {
          TranslationUIProvider.finish()
        }}
      />
    </VStack>
  }

  return <VStack spacing={16} padding={16}>
    <Text>Original</Text>
    <Text>{source}</Text>

    <Text>Translation</Text>
    <Text>{translatedText}</Text>

    <HStack spacing={12}>
      <Button
        title="Close"
        action={() => {
          TranslationUIProvider.finish()
        }}
      />

      {canReplace ? (
        <Button
          title="Use Translation"
          action={() => {
            TranslationUIProvider.finish(translatedText)
          }}
        />
      ) : null}
    </HStack>
  </VStack>
}

TranslationUIProvider.present(<TranslationView />)
```

---

## Example: Expanding the Panel

```tsx
import { Button, Text, VStack } from "scripting"

function TranslationView() {
  return <VStack spacing={12} padding={16}>
    <Text>{TranslationUIProvider.inputText ?? "No input text"}</Text>

    <Button
      title="Expand"
      action={() => {
        TranslationUIProvider.expandSheet()
      }}
    />

    <Button
      title="Close"
      action={() => {
        TranslationUIProvider.finish()
      }}
    />
  </VStack>
}

TranslationUIProvider.present(<TranslationView />)
```

---

## Lifecycle Notes

* `TranslationUIProvider` is scoped to the current translation session
* It is only valid during execution of `translation_ui_provider.tsx`
* `finish(...)` terminates the session
* After finishing, no further UI updates should be performed
* `present(...)` is typically called once to render the main UI

---

## Relationship with Translation Logic

`TranslationUIProvider` handles UI and session control, not translation.

Developers are responsible for implementing translation logic, such as:

* Calling remote APIs
* Using local models
* Providing multiple candidate results
* Applying domain-specific processing

Recommended separation:

* `TranslationUIProvider`: UI + session control
* Translation logic: data processing
* Components: UI structure

---

## Best Practices

* Always handle `inputText === null`
* Respect `allowsReplacement` when designing actions
* Call `finish(...)` only after user confirmation
* Use `expandSheet()` only when necessary
* Keep translation logic and UI modular
