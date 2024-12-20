import { Button, HStack, Label, List, Text, useState, VStack } from "scripting"
import { CodePreview } from "../../ui_example"

export type Person = {
  name: string
  phoneNumber: string
}

export function PersonRowView({
  person
}: {
  person: Person
}) {
  return <VStack
    alignment={"leading"}
    spacing={3}
  >
    <Text
      foregroundStyle={"label"}
      font={"headline"}
    >{person.name}</Text>
    <HStack
      spacing={3}
      foregroundStyle={"secondaryLabel"}
      font={"subheadline"}
    >
      <Label
        title={person.phoneNumber}
        systemImage={"phone"}
      />
    </HStack>
  </VStack>
}

export function DisplayDataInsideARowExample() {
  const [codeVisible, setCodeVisible] = useState(false)

  const staff: Person[] = [
    {
      name: "Juan Chavez",
      phoneNumber: "(408) 555-4301",
    },
    {
      name: "Mei Chen",
      phoneNumber: "(919) 555-2481"
    }
  ]

  return <List
    navigationTitle={"Display data inside a row"}
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
  >
    {staff.map(person =>
      <PersonRowView
        person={person}
      />
    )}
  </List>
}

const code = `type Person = {
  name: string
  phoneNumber: string
}

function PersonRowView({
  person
}: {
  person: Person
}) {
  return <VStack
    alignment={"leading"}
    spacing={3}
  >
    <Text
      foregroundStyle={"label"}
      font={"headline"}
    >{person.name}</Text>
    <HStack
      spacing={3}
      foregroundStyle={"secondaryLabel"}
      font={"subheadline"}
    >
      <Label
        title={person.phoneNumber}
        systemImage={"phone"}
      />
    </HStack>
  </VStack>
}

function ListView() {
  const staff: Person[] = [
    {
      name: "Juan Chavez",
      phoneNumber: "(408) 555-4301",
    },
    {
      name: "Mei Chen",
      phoneNumber: "(919) 555-2481"
    }
  ]

  return <List>
    {staff.map(person =>
      <PersonRowView
        person={person}
      />
    )}
  </List>
}
`