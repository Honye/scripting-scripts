import { QRImage, Text, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function QRImageExample() {
  const url = "https://x.com"

  return <UIExample
    title={"QRImage"}
    code={`<VStack>
  <Text>URL: {url}</Text>
  <QRImage
    data={url}
  />
</VStack>`}
  >
    <VStack>
      <Text>URL: {url}</Text>
      <QRImage
        data={url}
      />
    </VStack>
  </UIExample>
}