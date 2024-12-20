import { Button, HStack, Image, TextField, useEffect, useMemo, useState, VStack, WebView } from "scripting"
import { UIExample } from "../../ui_example"

export function EmbedAWebViewExample() {
  const controller = useMemo(() => new WebViewController(), [])
  const [url, setUrl] = useState("")

  return <UIExample
    title={"Embed a WebView"}
    code={code}
  >
    <VStack>
      <HStack>
        <Button action={() => {
          controller.goBack()
        }}>
          <Image
            systemName={"arrow.left"}
          />
        </Button>
        <Button action={() => {
          controller.goForward()
        }}>
          <Image
            systemName={"arrow.right"}
          />
        </Button>
        <Button action={() => {
          controller.reload()
        }}>
          <Image
            systemName={"arrow.clockwise"}
          />
        </Button>
        <TextField
          title={"Website URL"}
          textFieldStyle={"roundedBorder"}
          value={url}
          onChanged={setUrl}
          keyboardType={"URL"}
          textInputAutocapitalization={"never"}
          frame={{
            maxWidth: "infinity"
          }}
        />
        <Button
          action={() => controller.loadURL(url)}
        >
          <Image
            systemName={"arrow.right.circle"}
          />
        </Button>
      </HStack>
      <WebView
        controller={controller}
        frame={{
          height: 400
        }}
      />
    </VStack>
  </UIExample>
}

const code = `function EmbedAWebViewExample() {
  const controller = useMemo(() => new WebViewController(), [])
  const [url, setUrl] = useState("")

  return <VStack>
    <HStack>
      <Button action={() => {
        controller.goBack()
      }}>
        <Image
          systemName={"arrow.left"}
        />
      </Button>
      <Button action={() => {
        controller.goForward()
      }}>
        <Image
          systemName={"arrow.right"}
        />
      </Button>
      <Button action={() => {
        controller.reload()
      }}>
        <Image
          systemName={"arrow.clockwise"}
        />
      </Button>
      <TextField
        title={"Website URL"}
        textFieldStyle={"roundedBorder"}
        value={url}
        onChanged={setUrl}
        keyboardType={"URL"}
        textInputAutocapitalization={"never"}
        frame={{
          maxWidth: "infinity"
        }}
      />
      <Button
        action={() => controller.loadURL(url)}
      >
        <Image
          systemName={"arrow.right.circle"}
        />
      </Button>
    </HStack>
    <WebView
      controller={controller}
      frame={{
        height: 400
      }}
    />
  </VStack>
}`