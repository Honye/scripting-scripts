import { Button, Divider, Image, ImageRenderer, Text, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function ImageRendererExample() {
  const [generatedImage, setGeneratedImage] = useState<UIImage>()

  async function generate() {
    const image = await ImageRenderer.toUIImage(
      <RenderView />,
    )
    setGeneratedImage(image)
  }

  return <UIExample
    title={"ImageRender"}
    code={`import { Button, Divider, Image, ImageRenderer, Text, useState, VStack } from "scripting"
function RenderView() {
  return <VStack>
    <Text
      foregroundStyle={"systemIndigo"}
    >Hello World!</Text>
    <Image
      systemName={"globe"}
      resizable
      scaleToFit
      frame={{
        width: 50,
        height: 50,
      }}
      foregroundStyle={"systemBlue"}
    />
  </VStack>
}
  
function View() {
  const [generatedImage, setGeneratedImage] = useState<UIImage>()

  async function generate() {
    const image = await ImageRenderer.toUIImage(
      <RenderView />,
    )
    setGeneratedImage(image)
  }
      
  return <VStack>
    <RenderView />
    <Divider />
    <Text>Generated image: </Text>
    {generatedImage
      ? <Image
        image={generatedImage}
        imageScale={"medium"}
        border={{
          style: "orange",
          width: 2
        }}
      />
      : null}
    <Divider />
    <Button
      title={"Generate image"}
      action={generate}
    />
  </VStack>
}`}
  >
    <VStack>
      <RenderView />
      <Divider />
      <Text>Generated image: </Text>
      {generatedImage
        ? <Image
          image={generatedImage}
          imageScale={"medium"}
          border={{
            style: "orange",
            width: 2
          }}
        />
        : null}
      <Divider />
      <Button
        title={"Generate image"}
        action={generate}
      />
    </VStack>
  </UIExample>
}

function RenderView() {
  return <VStack>
    <Text
      foregroundStyle={"systemIndigo"}
    >Hello World!</Text>
    <Image
      systemName={"globe"}
      resizable
      scaleToFit
      frame={{
        width: 50,
        height: 50,
      }}
      foregroundStyle={"systemBlue"}
    />
  </VStack>
}