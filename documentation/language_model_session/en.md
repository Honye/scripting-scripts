`LanguageModelSession` provides access to Apple Intelligence local language models through iOS Foundation Models. It allows scripts to perform on-device AI tasks such as text generation, structured JSON output, and streaming responses.

This API encapsulates system-level language model capabilities and supports:

* On-device AI inference (Apple Intelligence)
* JSON Schema structured output
* Streaming token responses
* Session-level resource management
* Controlled generation parameters

`LanguageModelSession` is a global API and does not require importing from the `scripting` module.

---

## Availability

```ts
LanguageModelSession.isAvailable
```

Indicates whether Foundation Models are available on the current device.

Return value:

```ts
boolean
```

Notes:

* Only devices supporting Apple Intelligence will return `true`.
* You should check availability before creating a session.

Example:

```ts
if (!LanguageModelSession.isAvailable) {
  console.log("LanguageModelSession is not available on this device")
}
```

---

## Creating a Session

```ts
new LanguageModelSession(options?)
```

Parameters:

```ts
{
  instructions?: string
}
```

Description:

* Creates a new language model session.
* `instructions` act as system-level guidance controlling model behavior.
* Instructions remain active throughout the session lifecycle.

Example:

```ts
const session = new LanguageModelSession({
  instructions: "You are a professional financial assistant."
})
```

---

## Properties

## isResponding

```ts
readonly isResponding: boolean
```

Description:

* Indicates whether the model is currently generating a response.
* Useful for managing UI state.

---

## Prewarming the Model

```ts
prewarm(promptPrefix?: string): void
```

Description:

* Requests the system to load required model resources in advance.
* Reduces initial response latency.
* Optionally caches a prompt prefix.

Parameters:

```ts
promptPrefix?: string
```

Example:

```ts
session.prewarm("You are a JSON extraction assistant")
```

Recommended use cases:

* Before the user initiates an AI task
* When reducing first-token latency is important

---

## Generating Responses

```ts
respond<T>(prompt, options?)
```

Returns:

```ts
Promise<{
  content: string
  json: T | null
}>
```

Description:

* Produces a complete response.
* Supports structured JSON output via schema validation.
* Automatically attempts JSON parsing.

Parameters:

```ts
{
  temperature?: number
  maxResponseTokens?: number
  schema?: JSONSchemaObject
}
```

Parameter details:

* `temperature`

  * Range: 0.0 ~ 1.0
  * Higher values increase randomness.
* `maxResponseTokens`

  * Maximum number of tokens to generate.
* `schema`

  * Expected JSON structure.
  * If generated content is not valid JSON, `json` will be `null`.

---

## Structured Output Example

```ts
const session = new LanguageModelSession()

const result = await session.respond(
  `Parse the following receipt:
  Parking fee
  Convention Center
  2026-02-09 12:23:45
  ¥19
  Credit card payment`,
  {
    schema: {
      type: "object",
      description: "Receipt JSON",
      properties: {
        amount: { type: "number", description: "Amount" },
        category: { type: "string", description: "Category" },
        address: { type: "string", description: "Address", required: false },
        isIncome: { type: "boolean", decription: "Whether it is an income" }
      }
    }
  }
)

console.log(result.content)
console.log(result.json)
```

---

## Streaming Responses

```ts
streamResponse(prompt, options?)
```

Returns:

```ts
Promise<ReadableStream>
```

Description:

* Produces streaming output.
* Suitable for chat interfaces or incremental display.

Parameters:

```ts
{
  temperature?: number
  maxResponseTokens?: number
}
```

Example:

```ts
const stream = await session.streamResponse(
  "Tell a joke about a dog",
  { temperature: 0.7 }
)

let fullText = ""

for await (const chunk of stream) {
  console.log(chunk)
  fullText = chunk
}
```

---

## Releasing Resources

```ts
dispose(): void
```

Description:

* Releases resources associated with the session.
* Recommended after finishing usage to reduce memory usage.

Example:

```ts
session.dispose()
```

---

## Complete Example

```tsx
import { Script } from "scripting"

console.present().then(() => {
  Script.exit()
})

async function run() {

  if (!LanguageModelSession.isAvailable) {
    console.log("Not supported on this device")
    return
  }

  const session = new LanguageModelSession({
    instructions: "You are a structured data extraction assistant."
  })

  session.prewarm("Parse receipt")

  const result = await session.respond(
    "Parse: Parking fee Convention Center ¥19",
    {
      temperature: 0.2,
      schema: {
        type: "object",
        description: "JSON result",
        properties: {
          amount: { type: "number", description: "Amount" },
          category: { type: "string", description: "Category" }
        }
      }
    }
  )

  console.log(result.json)

  const stream = await session.streamResponse(
    "Tell a joke about a dog"
  )

  for await (const text of stream) {
    console.log(text)
  }

  session.dispose()
}

run()
```

---

## Best Practices

* Reuse a session for multiple requests when possible.
* Call `prewarm` before first use to reduce latency.
* Use `schema` for reliable structured output.
* Use `streamResponse` for long-form or interactive responses.
* Call `dispose` when finished to release resources.
