import { HStack, LazyVStack, ScrollView, Section, Spacer, Text, useMemo } from "scripting"
import { UIExample } from "../../ui_example"

export function LazyVStackExample() {
  const groups = useMemo(() => {
    const groups: {
      name: string
      items: number[]
    }[] = []

    for (let i = 1; i < 10; i++) {
      const list: {
        name: string
        items: number[]
      } = {
        name: "Group " + i,
        items: []
      }

      for (let j = 0; j < 10; j++) {
        list.items.push(i * 10 + j)
      }

      groups.push(list)
    }

    return groups
  }, [])

  return <UIExample
    title={"LazyVStack"}
    code={`<ScrollView>
  <LazyVStack
    alignment={"leading"}
    spacing={10}
    pinnedViews={"sectionHeaders"}
  >
    {groups.map(group =>
      <Section
        header={
          <HStack
            background={"purple"}
          >
            <Text>{group.name}</Text>
            <Spacer />
          </HStack>
        }
      >
        {group.items.map(item =>
          <Text>Row {item}</Text>
        )}
      </Section>
    )}
  </LazyVStack>
</ScrollView>`}
  >
    <ScrollView>
      <LazyVStack
        alignment={"leading"}
        spacing={10}
        pinnedViews={"sectionHeaders"}
      >
        {groups.map(group =>
          <Section
            header={
              <HStack
                background={"purple"}
              >
                <Text>{group.name}</Text>
                <Spacer />
              </HStack>
            }
          >
            {group.items.map(item =>
              <Text>Row {item}</Text>
            )}
          </Section>
        )}
      </LazyVStack>
    </ScrollView>
  </UIExample>
}