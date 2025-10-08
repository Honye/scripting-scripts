import { Button, HStack, ScrollView } from "scripting"
import { Alphabet } from "../constansts/symbols"
import { getChars } from "../utils"
import { useFontConfig } from "../hooks/useFontConfig"

export function FontSelect() {
  const { config, setFont } = useFontConfig()

  return (
    <ScrollView
      axes='horizontal'
      scrollIndicator='hidden'
    >
      <HStack
        spacing={6}
      >
        {Object.keys(Alphabet).map((name) => (
          <Button
            key={name}
            buttonStyle="plain"
            title={getChars(name.replace(/solid|italic$/i, ''), name)}
            padding={{ horizontal: 6 }}
            frame={{ height: 37 }}
            font={22}
            background={config?.font === name ? 'rgba(255,255,255,0.3)' : 'clear'}
            clipShape={{ type: 'rect', cornerRadius: 8 }}
            action={() => setFont(name)}
          />
        ))}
      </HStack>
    </ScrollView>
  )
}
