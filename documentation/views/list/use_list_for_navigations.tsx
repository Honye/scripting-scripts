import { Button, DisclosureGroup, HStack, Label, List, NavigationLink, Text, useState, VStack } from "scripting"
import { CodePreview } from "../../ui_example"
import { companyA } from "./represent_data_hierarchy_in_sections"
import { Person, PersonRowView } from "./display_data_inside_a_row"

export function UseListForNavigationsExample() {
  const [codeVisible, setCodeVisible] = useState(false)

  return <List
    navigationTitle={"Staff Directory"}
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
            code={`function PersonDetailView({
  person
}: {
  person: Person
}) {

  return <VStack>
    <Text
      font={"title"}
      foregroundStyle={"label"}
    >{person.name}</Text>
    <HStack
      foregroundStyle={"secondaryLabel"}
    >
      <Label
        title={person.name}
        systemImage={person.phoneNumber}
      />
    </HStack>
  </VStack>
}

function ListView() {
  return <List>
    {company.departments.map(department =>
      <DisclosureGroup
        title={department.name}
      >
        {department.staff.map(person =>
          <NavigationLink
            destination={
              <PersonDetailView
                person={person}
              />
            }
          >
            <PersonRowView
              person={person}
            />
          </NavigationLink>
        )}
      </DisclosureGroup>
    )}
  </List>
}
`}
            dismiss={() => setCodeVisible(false)}
          />
        }}
      />
    }}
  >
    {companyA.departments.map(department =>
      <DisclosureGroup
        title={department.name}
      >
        {department.staff.map(person =>
          <NavigationLink
            destination={
              <PersonDetailView
                person={person}
              />
            }
          >
            <PersonRowView
              person={person}
            />
          </NavigationLink>
        )}
      </DisclosureGroup>
    )}
  </List >
}

export function PersonDetailView({
  person
}: {
  person: Person
}) {

  return <VStack>
    <Text
      font={"title"}
      foregroundStyle={"label"}
    >{person.name}</Text>
    <HStack
      foregroundStyle={"secondaryLabel"}
    >
      <Label
        title={person.phoneNumber}
        systemImage={"phone"}
      />
    </HStack>
  </VStack>
}