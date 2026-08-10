一个强大的代码编辑器，既可以通过编程方式控制，也可以嵌入自定义视图中展示。编辑器支持语法高亮、读写访问以及完整的生命周期管理，主要通过 `EditorController` 类和 `Editor` 组件来实现。

---

## EditorController

### 概述

`EditorController` 用于管理一个编辑器实例。你可以配置初始内容、监听用户修改、展示或隐藏编辑器，并在不再使用时释放资源。

### 构造函数

用于创建一个新的编辑器控制器实例。

**参数说明**：

* `content`（可选）：编辑器的初始文本内容。
* `ext`（可选）：文件扩展名，用于指定语法高亮语言。支持的类型包括 `tsx`、`ts`、`js`、`jsx`、`txt`、`md`、`css`、`html` 和 `json`。
* `readOnly`（可选）：是否启用只读模式，默认为 `false`。

---

### 属性说明

#### `ext`

只读属性，表示初始化时提供的文件扩展名，用于决定使用哪种语法高亮。

#### `content`

一个字符串，表示当前编辑器的文本内容。可以直接修改该值以更新编辑器内容。

#### `onContentChanged`

可选回调函数，在用户修改内容后大约 **100 毫秒** 被调用。该函数不会在每次输入时立即触发，适合用于防抖、自动保存等逻辑。

---

### 方法说明

#### `present(options?)`

以模态方式展示编辑器。

**参数说明**：

* `navigationTitle`（可选）：设置编辑器的顶部标题。
* `scriptName`（可选）：用于覆盖默认的 `Script.name`，默认为 `"Temporary Script"`。
* `fullscreen`（可选）：是否全屏显示编辑器，默认为 `false`。

**返回值**：返回一个 `Promise`，在编辑器被关闭时完成。

---

#### `dismiss()`

关闭当前展示的编辑器界面。注意，这不会销毁控制器实例，因此可以稍后再次调用 `present()`。

**返回值**：返回一个 `Promise`，在编辑器关闭后完成。

---

#### 导航

* `scrollToLine(line)`：滚动到指定的 **从 1 开始** 的行并居中，同时把光标移到该行。
* `scrollToPosition(position)`：滚动到指定字符偏移并居中，同时把光标移到该处。
* `scrollSelectionIntoView()`：滚动使当前选区可见。

#### 选区与文本

* `getSelectedText(): Promise<string>`：获取当前选中的文本（无选区时为空串）。若编辑器未展示（超时）或已销毁，Promise 会 **reject**。
* `setSelection(start, end)`：选中 `[start, end)` 范围并滚动到可见。
* `replaceSelection(text)`：用 `text` 替换当前选区；无选区时在光标处插入。
* `selectAll()`：全选。

#### 搜索

* `searchText(query, options?): Promise<EditorTextRange[]>`：在全文中查找，返回所有匹配范围（`{ start, end, line }`）。`options` 支持 `caseSensitive`、`regexp`、`wholeWord`。匹配在编辑器内完成，无需自己计算偏移。若编辑器未展示（超时）或已销毁，Promise 会 **reject**。

Scripting 不内置搜索 UI —— 用 `searchText`（或自己在 `content` 上匹配）拿到位置后，配合 `setSelection` 高亮、`replaceSelection` 替换，即可搭出契合脚本需求的搜索/替换体验。

#### 编辑

* `undo()` / `redo()`：撤销 / 重做。
* `toggleLineComment()` / `toggleBlockComment()`：切换行注释 / 块注释。

---

#### `dispose()`

释放控制器占用的资源。**必须在不再使用控制器时调用此方法**，以防止内存泄漏。一旦调用该方法，控制器将无法再次使用。

---

## Editor 组件

`Editor` 是一个 React 风格的组件，用于在 UI 中内联渲染编辑器。通常与 `EditorController` 实例搭配使用。

**属性说明**：

* `controller`：编辑器控制器实例，用于管理内容和状态。
* `scriptName`（可选）：用于指定当前编辑器的脚本名称。
* `showAccessoryView` (可选): 当键盘可见时是否显示附件视图。这对于显示“左移”、“右移”、“删除”、“关闭键盘”等按钮非常有用。默认为 false。当编辑器在屏幕上完全可见时（例如，当编辑器是屏幕上唯一的视图时），建议将其设置为 true。

---

### 示例代码

```tsx
function MyEditor() {
  const controller = useMemo(() => {
    return new EditorController({
      content: `const text = "Hello, World!"`,
      ext: "ts",
      readOnly: false,
    })
  }, [])
  
  useEffect(() => {
    return () => {
      // 组件卸载时释放资源
      controller.dispose()
    }
  }, [controller])

  return (
    <Editor
      controller={controller}
      scriptName="My Script"
      showAccessoryView
    />
  )
}
```

---

### 示例：自定义搜索/替换栏（`index.tsx`）

下面的示例基于交互 API 自建搜索 UI：`searchText` 找出匹配，`setSelection` 高亮当前项，`replaceSelection` 替换。

```tsx
import { useEffect, useMemo, useState } from "scripting"

function EditorWithSearch() {
  const controller = useMemo(() => new EditorController({
    ext: "ts",
    content: [
      `const greeting = "hello"`,
      `console.log(greeting)`,
      `console.log(greeting.toUpperCase())`,
    ].join("\n"),
  }), [])

  const [query, setQuery] = useState("")
  const [replacement, setReplacement] = useState("")
  const [matches, setMatches] = useState<EditorTextRange[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => () => controller.dispose(), [controller])

  async function runSearch() {
    const result = await controller.searchText(query, { caseSensitive: false })
    setMatches(result)
    setIndex(0)
    if (result.length > 0) {
      const m = result[0]
      controller.setSelection(m.start, m.end)
    }
  }

  function goTo(next: number) {
    if (matches.length === 0) return
    const i = (next + matches.length) % matches.length
    setIndex(i)
    controller.setSelection(matches[i].start, matches[i].end)
  }

  function replaceCurrent() {
    if (matches.length === 0) return
    // 当前匹配已被选中，直接替换选区；偏移已变化，替换后重新搜索。
    controller.replaceSelection(replacement)
    runSearch()
  }

  return (
    <VStack>
      <HStack>
        <TextField title="查找" value={query} onChanged={setQuery} />
        <Button title="搜索" action={runSearch} />
      </HStack>
      <HStack>
        <TextField title="替换为" value={replacement} onChanged={setReplacement} />
        <Button title="替换" action={replaceCurrent} />
      </HStack>
      <HStack>
        <Text>{matches.length > 0 ? `${index + 1} / ${matches.length}` : "无匹配"}</Text>
        <Button title="上一个" action={() => goTo(index - 1)} />
        <Button title="下一个" action={() => goTo(index + 1)} />
      </HStack>
      <Editor controller={controller} showAccessoryView />
    </VStack>
  )
}
```