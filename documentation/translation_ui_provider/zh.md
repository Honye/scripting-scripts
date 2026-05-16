`TranslationUIProvider` 用于接管系统翻译面板的界面展示与交互流程，让脚本自定义翻译 UI，并实现自己的默认翻译逻辑。

当宿主应用触发翻译扩展时，Scripting 会进入 `translation_ui_provider.tsx` 脚本运行环境。开发者可以在该文件中读取宿主传入的原始文本、根据需要执行翻译逻辑、构建自定义界面，并通过 `TranslationUIProvider.present(...)` 将界面呈现到当前翻译面板中。

该能力适用于以下场景：

* 自定义翻译面板的界面结构与交互方式
* 在面板中展示原文、候选译文、语言切换、操作按钮等内容
* 接入自定义翻译服务或自定义翻译流程
* 在宿主允许的前提下，将译文回写替换原始文本
* 在不替换原文的情况下，仅作为查看或辅助翻译界面使用

`TranslationUIProvider` 本身不负责具体的翻译实现。它提供的是一个翻译 UI 容器与会话控制接口。真正的翻译逻辑可以由开发者在脚本中自行实现，例如调用网络接口、本地模型能力，或其他已封装的翻译模块。

---

## 适用版本

`TranslationUIProvider` 需要 **iOS 18.4 及以上版本**。

---

## 可用环境

`TranslationUIProvider` 仅在翻译 UI Provider 对应的运行环境中可用，开发者应在 `translation_ui_provider.tsx` 文件中使用该 API。

系统唤起翻译面板后，该脚本会作为当前翻译会话的入口执行。通常开发流程如下：

1. 读取宿主提供的原始文本
2. 根据原始文本执行默认翻译逻辑
3. 构建并展示自定义翻译界面
4. 根据用户操作决定是否扩展面板、是否结束会话、是否将译文返回给宿主

---

## 工作机制

`TranslationUIProvider` 的核心作用可以概括为两部分：

一部分是“读取当前翻译会话上下文”，例如读取宿主传入的原始文本、判断当前是否允许替换原文。

另一部分是“控制当前翻译面板”，例如展示自定义 UI、请求系统展开面板、结束当前会话并返回译文。

脚本通常不需要主动创建会话对象。当前翻译会话由系统和宿主应用发起，Scripting 在运行 `translation_ui_provider.tsx` 时自动将当前会话能力注入到 `TranslationUIProvider` 命名空间中。

---

## 会话输入

### inputText

```ts
const inputText: string | null
```

表示宿主应用当前传入的原始文本。

这通常是用户在宿主应用中选中的文本，或者宿主应用希望交给翻译面板处理的文本内容。该值可能为 `null`，因此脚本在使用前应进行空值判断。

常见用途包括：

* 在界面中展示待翻译原文
* 作为默认翻译逻辑的输入
* 当无可用文本时展示提示信息或禁用翻译操作

示例：

```ts
const source = TranslationUIProvider.inputText

if (!source) {
  TranslationUIProvider.present(
    <Text>No text available for translation.</Text>
  )
}
```

需要注意的是，`inputText` 只表示当前会话启动时宿主提供的文本内容。脚本不应假设该值一定存在，也不应假设它始终可以被回写替换。

---

### allowsReplacement

```ts
const allowsReplacement: boolean
```

表示宿主应用是否允许将译文替换回原始文本位置。

该值用于告知脚本当前会话是否具备“回写替换”能力。若为 `true`，开发者可以在用户确认后调用 `finish(translatedText)`，将译文作为结果返回给宿主；若为 `false`，即使脚本生成了译文，也通常只能用于展示，不能作为替换结果提交。

这个属性应被用于控制界面行为，例如：

* 是否显示“替换原文”按钮
* 是否允许最终确认提交
* 是否仅提供“复制”或“关闭”之类的非替换操作

示例：

```ts
const canReplace = TranslationUIProvider.allowsReplacement
```

典型处理方式是，在 `allowsReplacement` 为 `false` 时，仍然可以展示翻译结果，但应避免向用户呈现会造成误解的“替换”语义按钮。

---

## 面板控制

### present(node)

```ts
function present(node: VirtualNode): void
```

用于将自定义脚本界面呈现到当前翻译面板中。

这是 `TranslationUIProvider` 最核心的方法。开发者应构建一个 `VirtualNode` 作为翻译面板的根界面，并通过该方法显示出来。一般来说，`translation_ui_provider.tsx` 的主要职责就是创建并展示这个 UI。

示例：

```tsx
import { Text, VStack } from "scripting"

TranslationUIProvider.present(
  <VStack spacing={12}>
    <Text>Custom Translation Panel</Text>
    <Text>{TranslationUIProvider.inputText ?? "No input text"}</Text>
  </VStack>
)
```

通常建议将整个翻译面板的 UI 组织为一个独立的函数组件，再传给 `present(...)`，这样更便于维护和扩展。

例如：

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

`present(...)` 只负责显示脚本 UI，不会自动结束会话，也不会自动将译文返回给宿主。界面中的具体交互流程，仍需要开发者在脚本中自行实现。

---

### expandSheet()

```ts
function expandSheet(): void
```

请求系统将当前翻译面板展开。

翻译面板在系统中可能以较紧凑的状态出现。调用 `expandSheet()` 可以向系统表达“当前 UI 需要更大展示空间”的意图，例如在以下情况中会比较合适：

* 需要展示较长原文和较长译文
* 需要展示多段候选结果
* 需要展示更多操作控件或设置项
* 用户主动点击“展开”或“查看更多”

示例：

```ts
TranslationUIProvider.expandSheet()
```

需要注意，这个方法是对系统的一次请求，具体是否展开以及如何展开，仍由系统决定。脚本应将其理解为“请求更大的面板展示空间”，而不是保证立即进入某种固定尺寸。

---

### finish(translation?)

```ts
function finish(translation?: string | null): void
```

结束当前翻译会话，并可选择将译文返回给宿主应用。

这是翻译面板流程的结束点。调用后，当前会话会关闭。

它有两种典型使用方式。

第一种是不返回译文，仅关闭面板：

```ts
TranslationUIProvider.finish()
```

这种方式适用于：

* 用户取消操作
* 当前仅做浏览，不做替换
* 当前宿主不允许回写替换
* 翻译失败后直接关闭

第二种是返回译文并结束会话：

```ts
TranslationUIProvider.finish("Hello world")
```

这种方式通常用于用户确认使用某个译文作为最终结果时。只有在宿主允许替换的情况下，这样的结果才有实际意义。因此在调用前，通常应结合 `allowsReplacement` 做判断。

示例：

```ts
if (TranslationUIProvider.allowsReplacement) {
  TranslationUIProvider.finish(translatedText)
} else {
  TranslationUIProvider.finish()
}
```

需要注意以下几点：

* `finish(...)` 调用后，会话即结束，通常不应继续更新当前 UI
* 传入字符串表示希望将该字符串作为翻译结果返回给宿主
* 传入 `null` 或省略参数表示仅关闭会话，不执行替换
* 是否真正替换原文，最终取决于宿主和系统当前会话能力，而不是脚本单方面决定

---

## 推荐的开发模式

在 `translation_ui_provider.tsx` 中，推荐采用“初始化数据 + 展示界面 + 用户确认后结束会话”的结构。

典型流程如下：

1. 读取 `TranslationUIProvider.inputText`
2. 如果没有原始文本，展示不可操作状态
3. 如果有原始文本，执行默认翻译逻辑
4. 将原文、译文、操作按钮等显示在 UI 中
5. 用户确认后，根据 `allowsReplacement` 决定是否调用 `finish(translatedText)`
6. 若用户取消，则调用 `finish()` 或 `finish(null)`

---

## 示例：最小可用翻译面板

下面示例展示一个最基础的翻译面板，它读取原文并展示简单 UI。

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

这个示例没有实际执行翻译逻辑，但完整体现了 `present(...)` 与 `finish()` 的基本配合方式。

---

## 示例：带默认翻译结果与替换提交

下面示例演示一个更接近真实使用方式的结构。这里用一个模拟译文代替真实翻译服务。

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

这个示例说明了几个关键点：

* 原文来自 `inputText`
* UI 是否显示“提交替换”操作，取决于 `allowsReplacement`
* 真正结束会话时通过 `finish(...)` 统一处理
* 若宿主不允许替换，则不应将“提交译文”作为主要交互出口

---

## 示例：请求展开面板

当内容较多时，可以在合适时机请求系统展开面板。

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

该方法适合在用户明确需要查看更多内容时调用，也可以在面板初始化后根据布局需要主动调用，但通常更推荐在明确交互触发时使用，以避免不必要的系统干预请求。

---

## 生命周期说明

`TranslationUIProvider` 代表的是“当前翻译会话”的上下文，而不是一个可长期持有的全局对象。开发时应注意以下几点：

* 该命名空间只在当前翻译 UI Provider 运行期间有效
* `inputText` 和 `allowsReplacement` 反映的是当前会话启动时的上下文状态
* 调用 `finish(...)` 后当前会话结束，不应继续依赖该会话更新界面或提交结果
* `present(...)` 用于展示当前会话的 UI，一般在脚本入口阶段调用一次主界面即可

从设计上看，`TranslationUIProvider` 更适合作为当前会话的控制入口，而不是应用级状态容器。

---

## 与自定义翻译逻辑的关系

`TranslationUIProvider` 解决的是“如何展示和控制翻译面板”，而不是“如何翻译”。

开发者可以自由决定默认翻译逻辑，例如：

* 调用远程翻译 API
* 使用本地模型进行翻译
* 根据输入语言自动选择不同翻译器
* 先生成多个候选结果，再让用户选择
* 根据领域词典或上下文对结果做后处理

推荐的职责划分是：

* `TranslationUIProvider`：负责当前翻译面板的 UI 展示与会话结束
* 自定义翻译模块：负责产生译文结果
* 组件层：负责把原文、译文、状态、按钮等组织为可交互界面

这种拆分方式有利于后续扩展，例如加入语言检测、术语表、历史记录、候选切换等能力。

---

## 使用建议

在实现翻译面板时，建议遵循以下原则：

### 对 `inputText` 做空值处理

宿主未提供文本时，`inputText` 可能为 `null`。界面应给出清晰的不可用提示，而不是假设始终存在原文。

### 将“展示结果”和“提交替换”区分开

并不是所有会话都允许替换原文。即使已经成功生成译文，也应根据 `allowsReplacement` 决定是否允许提交。

### 在结束前完成所有必要确认

调用 `finish(...)` 即表示当前会话结束，因此在调用前应确保用户已经完成选择或确认。

### 谨慎使用 `expandSheet()`

该方法适合用于确实需要更大展示空间的界面，不应无条件频繁调用。

### 将翻译逻辑与 UI 分层

不要把所有逻辑都堆叠在入口文件中。实际项目中更推荐将翻译请求、状态管理、结果展示拆分成更清晰的模块和组件。

