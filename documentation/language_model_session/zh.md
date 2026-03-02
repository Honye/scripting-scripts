`LanguageModelSession` 是 Scripting 提供的 Apple Intelligence 本地语言模型会话 API，用于调用 iOS Foundation Models 执行文本生成、结构化输出、流式响应等任务。

该 API 封装了系统级语言模型能力，支持：

* 本地 AI 推理（Apple Intelligence）
* JSON Schema 结构化输出
* 流式 token 输出
* 会话级资源管理与预热
* 可控生成参数

`LanguageModelSession` 是全局 API，不需要从 `scripting` 模块导入。

---

## 可用性

```ts
LanguageModelSession.isAvailable
```

表示当前设备是否支持 Foundation Models。

返回值：

```ts
boolean
```

说明：

* 只有支持 Apple Intelligence 的设备才会返回 `true`
* 在调用前建议先检测可用性

示例：

```ts
if (!LanguageModelSession.isAvailable) {
  console.log("当前设备不支持 LanguageModelSession")
}
```

---

## 创建会话

```ts
new LanguageModelSession(options?)
```

参数：

```ts
{
  instructions?: string
}
```

说明：

* 创建一个新的语言模型会话
* `instructions` 用于提供系统级指令，控制模型行为（类似 system prompt）
* 指令在整个 session 生命周期中生效

示例：

```ts
const session = new LanguageModelSession({
  instructions: "你是一个专业的财务助手，输出结果必须准确"
})
```

---

## 属性

## isResponding

```ts
readonly isResponding: boolean
```

说明：

* 表示当前是否正在生成响应
* 可用于 UI 状态控制

---

## 预热模型

```ts
prewarm(promptPrefix?: string): void
```

说明：

* 提前加载模型资源
* 减少首次响应延迟
* 可选择缓存 prompt 前缀

参数：

```ts
promptPrefix?: string
```

示例：

```ts
session.prewarm("你是一个JSON解析助手")
```

适用场景：

* 用户即将发起 AI 请求
* 希望减少首次 token 延迟

---

## 生成响应

```ts
respond<T>(prompt, options?)
```

返回：

```ts
Promise<{
  content: string
  json: T | null
}>
```

说明：

* 执行一次完整生成
* 支持 JSON Schema 结构化输出
* 自动解析 JSON

参数：

```ts
{
  temperature?: number
  maxResponseTokens?: number
  schema?: JSONSchemaObject
}
```

参数说明：

* `temperature`

  * 0.0 ~ 1.0
  * 越高随机性越强
* `maxResponseTokens`

  * 最大生成 token 数
* `schema`

  * 期望输出的 JSON 结构
  * 如果生成内容不是合法 JSON，则 `json` 为 null

---

## 结构化输出示例

```ts
const session = new LanguageModelSession()

const result = await session.respond(
  `解析以下收据：
  停车费
  会展中心
  2026-02-09 12:23:45
  ¥19
  信用卡支付`,
  {
    schema: {
      type: "object",
      description: "JSON结果",
      properties: {
        amount: { type: "number", description: "金额" },
        category: { type: "string", description: "类别" },
        address: { type: "string", description: "地址" },
        isIncome: { type: "boolean", decription: "是否是收入" }
      }
    }
  }
)

console.log(result.content)
console.log(result.json)
```

---

## 流式响应

```ts
streamResponse(prompt, options?)
```

返回：

```ts
Promise<ReadableStream>
```

说明：

* 以流方式生成文本
* 适用于聊天 UI 或逐 token 输出

参数：

```ts
{
  temperature?: number
  maxResponseTokens?: number
}
```

示例：

```ts
const stream = await session.streamResponse(
  "讲一个关于小狗的笑话",
  { temperature: 0.7 }
)

let fullText = ""

for await (const chunk of stream) {
  console.log(chunk)
  fullText = chunk
}
```

---

## 释放资源

```ts
dispose(): void
```

说明：

* 释放语言模型会话资源
* 使用完成后建议调用
* 可减少内存占用

示例：

```ts
session.dispose()
```

---

## 完整示例

```tsx
import { Script } from "scripting"

console.present().then(() => {
  Script.exit()
})

async function run() {

  if (!LanguageModelSession.isAvailable) {
    console.log("当前设备不支持")
    return
  }

  const session = new LanguageModelSession({
    instructions: "你是一个结构化数据解析助手"
  })

  session.prewarm("解析收据")

  const result = await session.respond(
    "解析：停车费 会展中心 ¥19",
    {
      temperature: 0.2,
      schema: {
        type: "object",
        description: "JSON结果",
        properties: {
          amount: { type: "number", description: "金额" },
          category: { type: "string", description: "类别" }
        }
      }
    }
  )

  console.log(result.json)

  const stream = await session.streamResponse(
    "讲一个关于小狗的笑话"
  )

  for await (const text of stream) {
    console.log(text)
  }

  session.dispose()
}

run()
```

---

## 使用建议

* 在需要多次调用时复用同一个 session
* 首次使用前调用 `prewarm` 可降低延迟
* 结构化数据建议使用 `schema` 以提高稳定性
* 长文本输出建议使用 `streamResponse`
* 完成后调用 `dispose` 释放资源
