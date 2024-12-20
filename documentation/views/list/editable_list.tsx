import { Button, Color, EditButton, ForEach, List, Text, useState } from "scripting"
import { CodePreview } from "../../ui_example"

export function EditableListExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [colors, setColors] = useState<Color[]>([
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
  ])

  function onDelete(indices: number[]) {
    setColors(colors.filter((_, index) => !indices.includes(index)))
  }

  function onMove(indices: number[], newOffset: number) {
    const movingItems = indices.map(index => colors[index])
    const newColors = colors.filter((_, index) => !indices.includes(index))
    newColors.splice(newOffset, 0, ...movingItems)
    setColors(newColors)
  }

  return <List
    navigationTitle={"Editable List"}
    navigationBarTitleDisplayMode={"inline"}
    toolbar={{
      topBarTrailing: [
        <EditButton />,
        <Button
          title={"Code"}
          action={() => setCodeVisible(true)}
          popover={{
            isPresented: codeVisible,
            onChanged: setCodeVisible,
            content: <CodePreview
              code={code}
              dismiss={() => setCodeVisible(false)}
            />
          }}
        />,
      ]
    }}
  >
    <ForEach
      count={colors.length}
      itemBuilder={index =>
        <Text
          key={colors[index]} // Must provide a unique key!!!
        >{colors[index]}</Text>
      }
      onDelete={onDelete}
      onMove={onMove}
    />
  </List>
}

const code = `function EditableListView() {
  const [colors, setColors] = useState<Color[]>([
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
  ])

  function onDelete(indices: number[]) {
    setColors(colors.filter((_, index) => !indices.includes(index)))
  }

  function onMove(indices: number[], newOffset: number) {
    const movingItems = indices.map(index => colors[index])
    const newColors = colors.filter((_, index) => !indices.includes(index))
    newColors.splice(newOffset, 0, ...movingItems)
    setColors(newColors)
  }

  return <List
    toolbar={{
      topBarTrailing: <EditButton />,
    }}
  >
    <ForEach
      count={colors.length}
      itemBuilder={index =>
        <Text
          key={colors[index]} // Must provide a unique key!!!
        >{colors[index]}</Text>
      }
      onDelete={onDelete}
      onMove={onMove}
    />
  </List>
}`