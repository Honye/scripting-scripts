import { useState, List, ContentUnavailableView, Button, Text } from "scripting"
import { CodePreview } from "../../ui_example"

export function ContentUnavailableViewExample() {
  const [list, setList] = useState<string[]>([])
  const [codeVisible, setCodeVisible] = useState(false)

  return <List
    overlay={
      list.length ? undefined
        : <ContentUnavailableView
          title="No data"
          systemImage="tray.fill"
        />
    }
    toolbar={{
      topBarTrailing: <Button
        title={"Code"}
        buttonStyle={'borderedProminent'}
        controlSize={'small'}
        action={() => {
          setCodeVisible(true)
        }}
        popover={{
          isPresented: codeVisible,
          onChanged: setCodeVisible,
          content: <CodePreview
            code={`function View({
    messages
  }: {
    messages: string[]
  }) {
  
  return <List
    overlay={
      messages.length > 0
        ? undefined
        : <ContentUnavailableView
          title="No Message"
          systemImage="tray.fill"
        />
    }
  >
    {messages.map(message =>
      <Text>{message}</Text>
    )}
  </List>
}`}
            dismiss={() => setCodeVisible(false)}
          />
        }}
      />,
      bottomBar: [
        <Button
          title="Add"
          action={() => {
            setList(list => {
              let newList = [
                (Math.random() * 1000 | 0).toString(),

                ...list
              ]
              return newList
            })
          }}
        />,
        <Button
          title="Clear"
          action={() => {
            setList([])
          }}
        />
      ]
    }}
  >
    {list.map(name => <Text>{name}</Text>)}
  </List>
}