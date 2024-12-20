import { Font, ForEach, ScrollView, Text, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function IteratingExample() {
  const namedFonts: Font[] = [
    "largeTitle",
    "title",
    "headline",
    "body",
    "caption"
  ]

  return <ScrollView>
    <UIExample
      title={"ForEach"}
      code={`const namedFonts: Font[] = [
  "largeTitle",
  "title",
  "headline",
  "body",
  "caption"
]
        
<ForEach
  count={namedFonts.length}
  itemBuilder={index => {
    const namedFont = namedFonts[index]
    return <Text
      key={namedFont}
      font={namedFont}
    >{namedFont}</Text>
  }}
/>`}
    >
      <ForEach
        count={namedFonts.length}
        itemBuilder={index => {
          const namedFont = namedFonts[index]
          return <Text
            key={namedFont}
            font={namedFont}
          >{namedFont}</Text>
        }}
      />
    </UIExample>

    <UIExample
      title={"Iterating in code block"}
      code={`<VStack>
  {namedFonts.map(namedFont =>
    <Text
      font={namedFont}
    >{namedFont}</Text>
  )}
</VStack>`}
    >
      <VStack>
        {namedFonts.map(namedFont =>
          <Text
            font={namedFont}
          >{namedFont}</Text>
        )}
      </VStack>
    </UIExample>
  </ScrollView>
}