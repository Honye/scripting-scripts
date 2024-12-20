import { VStack, Text, Divider, VirtualNode } from "scripting"

export function UIExampleSection({
  title, children,
}: {
  title: string
  children: VirtualNode
}) {
  return <VStack
    padding
    background={'tertiarySystemBackground'}
    clipShape={{
      type: 'rect',
      cornerRadius: 16,
    }}
  >
    <Text>{title}</Text>
    <Divider />
    {children}
  </VStack>
}