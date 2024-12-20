import { Button, Divider, Group, HStack, Markdown, NavigationStack, ScrollView, Spacer, Text, useState, VirtualNode, VStack } from "scripting"

export function UIExample({
  title, code, children,
}: {
  title: string
  code: string
  children: VirtualNode
}) {
  const [codeVisible, setCodeVisible] = useState(false)

  return <Group
    padding
  >
    <VStack
      padding
      background={'secondarySystemBackground'}
      clipShape={{
        type: 'rect',
        cornerRadius: 16,
      }}
    >
      <HStack>
        <Text
          font={'headline'}
        >{title}</Text>
        <Spacer />
        <Button
          title="Code"
          action={() => {
            setCodeVisible(true)
          }}
          buttonStyle={'borderedProminent'}
          controlSize={'small'}
          popover={{
            isPresented: codeVisible,
            onChanged: setCodeVisible,
            content: <CodePreview
              code={code}
              dismiss={() => setCodeVisible(false)}
            />
          }}
        />
      </HStack>
      <Divider />
      {children}
    </VStack>
  </Group>
}

export function CodePreview({ code, dismiss }: {
  code: string
  dismiss: () => void
}) {

  return <NavigationStack>
    <ScrollView
      navigationTitle={"Code Preview"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <VStack>
        <Markdown
          padding
          content={`
\`\`\`tsx
${code}
\`\`\`
        `}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}