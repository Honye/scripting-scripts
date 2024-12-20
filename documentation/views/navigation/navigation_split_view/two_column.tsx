import { List, NavigationSplitView, Text, useState } from "scripting"
import { companyA } from "../../list/represent_data_hierarchy_in_sections"
import { PersonDetailView } from "../../list/use_list_for_navigations"
import { Person, PersonRowView } from "../../list/display_data_inside_a_row"

export function TwoColumnSplitViewExample() {
  const [selectedPerson, setSelectedPerson] = useState<Person>()

  return <NavigationSplitView
    sidebar={
      <List>
        {companyA.departments[0].staff.map(person =>
          <PersonRowView
            person={person}
            contentShape={"rect"}
            onTapGesture={() => {
              setSelectedPerson(person)
            }}
          />
        )}
      </List>
    }
  >
    {selectedPerson != null
      ? <PersonDetailView
        person={selectedPerson}
      />
      : <Text>Please select a person.</Text>
    }
  </NavigationSplitView>
}
