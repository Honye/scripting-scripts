import { Color, LazyVGrid, RoundedRectangle, ScrollView, Text, useMemo, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function LazyVGridExample() {
  const colors = useMemo(() => {
    const colors: {
      name: string
      value: Color
    }[] = []

    const numToHex = (n: number) => {
      return n === 0 ? '00' : n.toString(16)
    }

    for (let r = 0x00; r <= 0xff; r += 0x11) {
      for (let g = 0x00; g <= 0xff; g += 0x11) {
        for (let b = 0x00; b <= 0xff; b += 0x11) {
          const name = `${numToHex(r)}${numToHex(g)}${numToHex(b)}`
          const value: Color = `#${name}`
          colors.push({
            name,
            value
          })
        }
      }
    }

    return colors
  }, [])

  return <UIExample
    title={"LazyVGrid"}
    code={`function LazyVGridView() {
  const colors = useMemo(() => {
    const colors: {
      name: string
      value: Color
    }[] = []

    const numToHex = (n: number) => {
      return n === 0 ? '00' : n.toString(16)
    }

    for (let r = 0x00; r <= 0xff; r += 0x11) {
      for (let g = 0x00; g <= 0xff; g += 0x11) {
        for (let b = 0x00; b <= 0xff; b += 0x11) {
          const name = \`\${numToHex(r)}\${numToHex(g)}\${numToHex(b)}\`
          const value: Color = \`#\${name}\`
          colors.push({
            name,
            value
          })
        }
      }
    }

    return colors
  }, [])  

  return <ScrollView>
    <LazyVGrid
      spacing={2}
      columns={[
        { size: 100 },
        { size: 100 },
        { size: 100 },
        { size: 100 },
      ]}
    >
      {colors.map((color) =>
        <VStack>
          <Text>
            {color.name}
          </Text>
          <RoundedRectangle
            fill={color.value}
            cornerRadius={4}
            frame={{
              width: 50,
              height: 50
            }}
          />
        </VStack>
      )}
    </LazyVGrid>
  </ScrollView>
}`}
  >
    <ScrollView>
      <LazyVGrid
        spacing={2}
        columns={[
          { size: 100 },
          { size: 100 },
          { size: 100 },
          { size: 100 },
        ]}
      >
        {colors.map((color) =>
          <VStack>
            <Text>
              {color.name}
            </Text>
            <RoundedRectangle
              fill={color.value}
              cornerRadius={4}
              frame={{
                width: 50,
                height: 50
              }}
            />
          </VStack>
        )}
      </LazyVGrid>
    </ScrollView>
  </UIExample>
}