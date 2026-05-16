AssistantTool 支持可交互 UI 工具：工具可以渲染自定义界面，引导用户完成交互后再返回结构化结果给 Assistant。

这种模式适用于无法仅通过纯文本稳定完成的场景，例如多选确认、分步填写、可视化预览等。

---

## 1. `assistant_tool.json` 配置

要启用可交互 UI：

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

### 关键字段

* `supportsUIRender: true`
  表示该工具会通过 `AssistantTool.registerUIView(...)` 提供 UI 渲染函数。

* `keepRenderingAfterComplete`
  控制调用 `response(...)` 返回结果后，UI 是否继续保留。

---

## 2. 注册 API

可交互 UI 工具通过函数组件注册：

```ts
AssistantTool.registerUIView<P>(view)
```

`view` 的参数：

```ts
type UIProps<P> = {
  params: P
  response: (result: AssistantToolResponseResult) => void
  isAutoApprove: boolean
  scriptEditorProvider?: ScriptEditorProvider
}
```

组件应同步返回 `VirtualNode`。

---

## 3. 通过 UI 返回结果

用户交互完成后调用 `response(result)`：

```ts
type AssistantToolResponseResult = {
  success: boolean
  output: {
    userParts?: AssistantToolOutputPart[]
    assistantParts?: AssistantToolOutputPart[]
  }
}
```

说明：

* `response` 只能生效一次，后续调用会被忽略。
* `userParts` 用于展示给用户。
* `assistantParts` 回传给 Assistant 继续推理。

---

## 4. 交互过程中的状态管理

UI 工具可使用以下状态 API 按工具调用维度存储状态：

```ts
AssistantTool.getState(key)
AssistantTool.setState(key, value)
AssistantTool.removeState(key)
AssistantTool.clearState()
```

状态要求可 JSON 序列化，并会跟随工具调用历史持久化。

常见用途：

* 已选项
* 当前步骤索引
* 临时表单值
* 阶段性进度标记

---

## 5. 与批准流程的关系

当同时设置 `requireApproval: true` 和 `supportsUIRender: true` 时：

1. 先走批准请求流程
2. 用户批准后才调用 UI 渲染器
3. 用户拒绝时不会调用渲染器

这样可以在保留安全控制的前提下，提供更丰富的交互。

---

## 6. Auto-Approve 场景

`UIProps` 会提供 `isAutoApprove`。

当工具在某些条件下可以安全跳过交互时，可直接返回默认结果：

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

## 7. 最小示例

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

## 8. UI 工具测试

`registerUIView` 会返回 UI 测试函数：

```ts
const testUI = AssistantTool.registerUIView(ToolView)

testUI(params, {
  isAutoApprove: false,
  initialState: { selected: "staging" },
  screenshot: true
})
```

测试模式下：

* 工具 UI 会渲染在预览面板中
* 点击关闭会返回“用户取消”结果
* 支持可选截图

---

## 9. 实践建议

* UI 是嵌入在工具容器中的，建议保持紧凑。
* 优先使用卡片式布局，避免大面积滚动容器。
* `assistantParts` 建议保持稳定结构，便于 Assistant 解析。
* `userParts` 用于用户可读摘要。
* 仅持久化必要状态，避免冗余。
* 渲染函数中避免执行重副作用逻辑。
