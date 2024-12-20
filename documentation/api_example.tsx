import { Button, Divider, Group, HStack, Image, Markdown, Spacer, Text, useState, VStack } from "scripting"

type LogCallback = (message: string, error?: boolean) => void
type RunCallback = (log: LogCallback) => void

export function APIExample({
  title, subtitle, code, run
}: {
  title: string
  subtitle?: string
  code: string
  run?: RunCallback
}) {
  const [logs, setLogs] = useState<{
    message: string
    error: boolean
  }[]>([])

  function log(message: string, error = false) {
    console.log("log:", message)
    setLogs(logs => [...logs, {
      message,
      error,
    }])
  }

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
      alignment={"leading"}
    >
      <HStack>
        <Text
          font={'headline'}
        >{title}</Text>
        <Spacer />
        {run != null
          ? <Button
            action={async () => {
              setLogs([])
              try {
                await Promise.resolve(run(log))
              } catch (e) {
                log(String(e), true)
                console.error(String(e))
              }
            }}
          >
            <Image systemName={"play.fill"} />
          </Button>
          : null}
      </HStack>
      {subtitle
        ? <VStack
          frame={{
            maxWidth: "infinity"
          }}
          alignment={"leading"}
        >
          <Divider />
          <Text
            foregroundStyle={"secondaryLabel"}
            padding={{ vertical: 8 }}
          >{subtitle}</Text>
        </VStack>
        : null
      }
      <Markdown
        border={{
          style: "separator",
          width: 0.33
        }}
        content={`\`\`\`tsx
${code}
\`\`\``}
      />
      {logs.length > 0 ? <Divider /> : null}
      {logs.length > 0
        ? <VStack
          alignment={"leading"}
          spacing={8}
        >{logs.map(log =>
          <Text
            foregroundStyle={log.error ? "systemRed" : "systemGreen"}
            monospaced
            padding={{
              leading: 16
            }}
          >{log.message}</Text>
        )}</VStack>
        : null
      }
    </VStack>
  </Group>
}