import { Button, List, Section, Text, useState } from "scripting"
import { CodePreview } from "../../ui_example"

export function RefresableListExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [data, setData] = useState(generateRandomList)

  function generateRandomList() {
    const data: number[] = []
    const count = Math.ceil(Math.random() * 100 + 10)

    for (let i = 0; i < count; i++) {
      const num = Math.ceil(Math.random() * 1000)
      data.push(num)
    }

    return data
  }

  async function refresh() {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setData(generateRandomList())
        resolve()
      }, 1000 * 2)
    })
  }


  return <List
    navigationTitle={"Refreshable List"}
    refreshable={refresh}
    toolbar={{
      topBarTrailing: <Button
        title={"Code"}
        buttonStyle={'borderedProminent'}
        controlSize={'small'}
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
    }}
  >
    <Section header={
      <Text textCase={null}>Pull down to refresh</Text>
    }>
      {data.map(item =>
        <Text>Number: {item}</Text>
      )}
    </Section>
  </List>
}

const code = `function RefreshableListView() {
  const [data, setData] = useState(generateRandomList)

  function generateRandomList() {
    const data: number[] = []
    const count = Math.ceil(Math.random() * 100 + 10)

    for (let i = 0; i < count; i++) {
      const num = Math.ceil(Math.random() * 1000)
      data.push(num)
    }

    return data
  }

  async function refresh() {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setData(generateRandomList())
        resolve()
      }, 1000 * 2)
    })
  }


  return <List
    refreshable={refresh}
  >
    <Section header={
      <Text textCase={null}>Pull down to refresh</Text>
    }>
      {data.map(item =>
        <Text>Number: {item}</Text>
      )}
    </Section>
  </List>
}`