import { List, NavigationSplitView, NavigationSplitViewVisibility, Text, useState } from "scripting"
import { Person, PersonRowView } from "../../list/display_data_inside_a_row"
import { companyA } from "../../list/represent_data_hierarchy_in_sections"
import { PersonDetailView } from "../../list/use_list_for_navigations"

export function ControlColumnVisibilityExample() {
  const [columnVisibility, setColumnVisibility] = useState<NavigationSplitViewVisibility>("detailOnly")
  const [selectedPerson, setSelectedPerson] = useState<Person>()

  return <NavigationSplitView
    columnVisibility={{
      value: columnVisibility,
      onChanged: (value) => {
        console.log("columnVisibility changed to", value)
        setColumnVisibility(value)
      },
    }}
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