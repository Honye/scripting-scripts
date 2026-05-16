AssistantTool supports interactive UI tools that render custom in-tool interfaces and return structured results after user interaction.

This mode is useful when the Assistant needs user decisions that cannot be expressed reliably as plain text, such as option selection, confirmation details, staged forms, or visual previews.

---

## 1. Configuration in `assistant_tool.json`

To enable interactive UI rendering:

```json
{
  "displayName": "Select Options",
  "id": "select_options",
  "description": "Ask user to select one or more options.",
  "icon": "checklist",
  "color": "systemTeal",
  "parameters": [],
  "requireApproval": false,
  "autoApprove": true,
  "scriptEditorOnly": false,
  "supportsUIRender": true,
  "keepRenderingAfterComplete": false
}
```

### Key fields

* `supportsUIRender: true`
  The tool is expected to provide a UI renderer via `AssistantTool.registerUIView(...)`.

* `keepRenderingAfterComplete`
  Controls whether the UI should remain rendered after `response(...)` returns the result.

---

## 2. Registration API

Interactive UI tools register a function component:

```ts
AssistantTool.registerUIView<P>(view)
```

Where `view` receives:

```ts
type UIProps<P> = {
  params: P
  response: (result: AssistantToolResponseResult) => void
  isAutoApprove: boolean
  scriptEditorProvider?: ScriptEditorProvider
}
```

The component should render synchronously and return a `VirtualNode`.

---

## 3. Returning Results from UI

Use `response(result)` when the user completes interaction.

```ts
type AssistantToolResponseResult = {
  success: boolean
  output: {
    userParts?: AssistantToolOutputPart[]
    assistantParts?: AssistantToolOutputPart[]
  }
}
```

Notes:

* `response` can be called only once; later calls are ignored.
* `userParts` are shown to users.
* `assistantParts` are sent back to the Assistant for reasoning.

---

## 4. State Management During UI Interaction

Interactive UI tools can persist state per tool call:

```ts
AssistantTool.getState(key)
AssistantTool.setState(key, value)
AssistantTool.removeState(key)
AssistantTool.clearState()
```

State is JSON-serializable and persisted with tool-call history.

Typical uses:

* selected options
* current step index
* temporary form values
* partial progress flags

---

## 5. Relationship with Approval

If `requireApproval: true` and `supportsUIRender: true`:

1. Approval request flow runs first
2. If approved, UI renderer is invoked
3. If rejected, renderer is not invoked

This keeps sensitive operations controllable while still allowing rich interaction after consent.

---

## 6. Auto-Approve Behavior

`isAutoApprove` is passed to `UIProps`.

Use it when your tool can safely skip interaction in specific cases and return immediately:

```ts
if (isAutoApprove && canUseDefaultResult) {
  response({
    success: true,
    output: {
      userParts: [{ type: "text", text: "Default option selected." }],
      assistantParts: [{ type: "text", text: "Used default selection in auto-approve mode." }]
    }
  })
}
```

---

## 7. Minimal Example

```ts
type Params = { title: string; options: string[] }

function ToolView({ params, response }: AssistantTool.UIProps<Params>) {
  const [selected, setSelected] = useState<string | null>(
    AssistantTool.getState<string>("selected")
  )

  const choose = (value: string) => {
    setSelected(value)
    AssistantTool.setState("selected", value)
  }

  return (
    <VStack spacing={8}>
      <Text>{params.title}</Text>
      {params.options.map(option => (
        <Button
          title={selected === option ? `✓ ${option}` : option}
          action={() => choose(option)}
        />
      ))}
      <Button
        title="Confirm"
        action={() => {
          response({
            success: true,
            output: {
              userParts: [{ type: "text", text: `Selected: ${selected ?? "none"}` }],
              assistantParts: [{ type: "text", text: JSON.stringify({ selected }) }]
            }
          })
        }}
      />
    </VStack>
  )
}

AssistantTool.registerUIView(ToolView)
```

---

## 8. Testing UI Tools

`registerUIView` returns a UI test function:

```ts
const testUI = AssistantTool.registerUIView(ToolView)

testUI(params, {
  isAutoApprove: false,
  initialState: { selected: "staging" },
  screenshot: true
})
```

In test mode:

* UI is rendered in a preview panel
* close action returns a cancellation result
* optional screenshot capture is supported

---

## 9. Recommended Practices

* Keep UI compact; it is embedded inside the tool container.
* Prefer card-style layouts over large scrolling containers.
* Return concise `assistantParts` with stable structure.
* Use `userParts` for user-facing summaries.
* Persist only state needed to restore interaction.
* Avoid heavy side effects inside render functions.
