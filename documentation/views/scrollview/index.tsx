import { Button, Color, ForEach, HStack, KeywordPoint, Picker, RoundedRectangle, ScrollView, Text, useState, VStack } from "scripting"
import { CodePreview } from "../../ui_example"

export function ScrollViewExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const colors: Color[] = [
    "systemRed",
    "systemOrange",
    "systemYellow",
    "systemGreen",
    "systemBlue",
    "systemPurple",
    "systemIndigo",
    "systemPink",
  ]
  const [scrollAnchor, setScrollAnchor] = useState<KeywordPoint>("bottom")

  return <ScrollView
    defaultScrollAnchor={scrollAnchor}
    navigationTitle={"Scroll View"}
    navigationBarTitleDisplayMode={"inline"}
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
      />
    }}
    key={scrollAnchor}
  >
    <VStack
      spacing={16}
      padding
    >
      <Picker
        title={"Default Scroll Anchor"}
        value={scrollAnchor}
        onChanged={setScrollAnchor as any}
        pickerStyle={"menu"}
      >
        <Text tag={"top"}>Top</Text>
        <Text tag={"center"}>Center</Text>
        <Text tag={"bottom"}>Bottom</Text>
      </Picker>

      <ScrollView
        axes={"horizontal"}
        frame={{
          height: 64
        }}
      >
        <HStack spacing={8}>
          <ForEach
            count={15}
            itemBuilder={index =>
              <RoundedRectangle
                key={index.toString()}
                fill={"systemIndigo"}
                cornerRadius={6}
                frame={{
                  width: 64,
                  height: 64,
                }}
                overlay={
                  <Text>{index}</Text>
                }
              />
            }
          />
        </HStack>
      </ScrollView>

      <ForEach
        count={colors.length}
        itemBuilder={index => {
          const color = colors[index]
          return <RoundedRectangle
            key={color}
            fill={color}
            cornerRadius={16}
            frame={{
              height: 100
            }}
          />
        }}
      />
    </VStack>
  </ScrollView>
}

const code = `const colors: Color[] = [
  "systemRed",
  "systemOrange",
  "systemYellow",
  "systemGreen",
  "systemBlue",
  "systemPurple",
  "systemIndigo",
  "systemPink",
]
const [scrollAnchor, setScrollAnchor] = useState<KeywordPoint>("top")

return <ScrollView
  defaultScrollAnchor={scrollAnchor}
>
  <VStack
    spacing={16}
    padding
  >
    <Picker
      title={"Default Scroll Anchor"}
      value={scrollAnchor}
      onChanged={setScrollAnchor as any}
      pickerStyle={"menu"}
    >
      <Text tag={"top"}>Top</Text>
      <Text tag={"center"}>Center</Text>
      <Text tag={"bottom"}>Bottom</Text>
    </Picker>

    <ScrollView
      axes={"horizontal"}
      frame={{
        height: 64
      }}
    >
      <HStack spacing={8}>
        <ForEach
          count={15}
          itemBuilder={index =>
            <RoundedRectangle
              key={index.toString()}
              fill={"systemIndigo"}
              cornerRadius={6}
              frame={{
                width: 64,
                height: 64,
              }}
            />
          }
        />
      </HStack>
    </ScrollView>

    <ForEach
      count={colors.length}
      itemBuilder={index => {
        const color = colors[index]
        return <RoundedRectangle
          key={color}
          fill={color}
          cornerRadius={16}
          frame={{
            height: 100
          }}
        />
      }}
    />
  </VStack>
</ScrollView>`