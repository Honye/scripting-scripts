import { Button, Editor, HStack, Navigation, NavigationStack, Script, Spacer, Text, TextField, useEffect, useMemo, useState, VStack } from "scripting"

// 这个示例基于 EditorController 的交互 API 自建一个搜索 / 替换栏：
//   - searchText  查找所有匹配（编辑器内完成，返回 { start, end, line }）
//   - setSelection 高亮当前匹配并滚动到可见
//   - replaceSelection 替换当前选中的匹配
//   - scrollToLine 跳转到指定行
// Scripting 不内置搜索 UI，你可以像这样组合出契合脚本的体验。

function Example() {
  const controller = useMemo(() => new EditorController({
    ext: "ts",
    content: [
      `const greeting = "hello"`,
      `console.log(greeting)`,
      `console.log(greeting.toUpperCase())`,
      `console.log(greeting.length)`,
    ].join("\n"),
  }), [])

  const [query, setQuery] = useState("greeting")
  const [replacement, setReplacement] = useState("message")
  const [matches, setMatches] = useState<EditorTextRange[]>([])
  const [index, setIndex] = useState(0)

  // 不再使用时释放编辑器资源。
  useEffect(() => () => controller.dispose(), [controller])

  async function runSearch() {
    const result = await controller.searchText(query, { caseSensitive: false })
    setMatches(result)
    setIndex(0)
    if (result.length > 0) {
      controller.setSelection(result[0].start, result[0].end)
    }
  }

  function goTo(next: number) {
    if (matches.length === 0) {
      return
    }
    const i = (next + matches.length) % matches.length
    setIndex(i)
    controller.setSelection(matches[i].start, matches[i].end)
  }

  async function replaceCurrent() {
    if (matches.length === 0) {
      return
    }
    // 当前匹配已被选中，直接替换选区；替换后偏移变化，重新搜索。
    controller.replaceSelection(replacement)
    await runSearch()
  }

  return <NavigationStack>
    <VStack
      navigationTitle={"Editor Search"}
      navigationBarTitleDisplayMode={"inline"}
      spacing={8}
      padding
    >
      <HStack>
        <TextField title={"Find"} value={query} onChanged={setQuery} />
        <Button title={"Search"} action={runSearch} />
      </HStack>

      <HStack>
        <TextField title={"Replace"} value={replacement} onChanged={setReplacement} />
        <Button title={"Replace"} action={replaceCurrent} />
      </HStack>

      <HStack>
        <Text>{matches.length > 0 ? `${index + 1} / ${matches.length}` : "No matches"}</Text>
        <Spacer />
        <Button title={"Prev"} action={() => goTo(index - 1)} />
        <Button title={"Next"} action={() => goTo(index + 1)} />
        <Button title={"Top"} action={() => controller.scrollToLine(1)} />
      </HStack>

      <Editor controller={controller} showAccessoryView />
    </VStack>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
