import { List, NavigationSplitView, Section, Text, useState } from "scripting"
import { Company } from "../../list/represent_data_hierarchy_in_sections"
import { Person, PersonRowView } from "../../list/display_data_inside_a_row"
import { PersonDetailView } from "../../list/use_list_for_navigations"

export function ThreeColumnSplitViewExample() {
  const [selectedCompany, setSelectedCompany] = useState<Company>()
  const [selectedPerson, setSelectedPerson] = useState<Person>()

  return <NavigationSplitView
    sidebar={
      <List>
        {companies.map(company =>
          <Text
            onTapGesture={() => {
              setSelectedCompany(company)
            }}
          >{company.name}</Text>
        )}
      </List>
    }
    content={
      selectedCompany != null
        ? <List>
          {selectedCompany.departments.map(department =>
            <Section
              header={<Text>{department.name}</Text>}
            >
              {department.staff.map(person =>
                <PersonRowView
                  person={person}
                  contentShape={"rect"}
                  onTapGesture={() => {
                    setSelectedPerson(person)
                  }}
                />
              )}
            </Section>
          )}
        </List>
        : <Text>Select a company</Text>
    }
  >
    {selectedPerson != null
      ? <PersonDetailView
        person={selectedPerson}
      /> :
      <Text>Select a person</Text>}
  </NavigationSplitView>
}

const companies: Company[] = [
  {
    name: "Company A",
    departments: [
      {
        name: "Sales",
        staff: [
          {
            name: "Juan Chavez",
            phoneNumber: "(408) 555-4301",
          },
          {
            name: "Mei Chen",
            phoneNumber: "(919) 555-2481",
          }
        ]
      },
      {
        name: "Engineering",
        staff: [
          {
            name: "Bill James",
            phoneNumber: "(408) 555-4450"
          },
          {
            name: "Anne Johnson",
            phoneNumber: "(417) 555-9311"
          }
        ]
      }
    ]
  },
  {
    name: "Company B",
    departments: [
      {
        name: "Human resources",
        staff: [
          {
            name: "Lily",
            phoneNumber: "(111) 555-5552"
          },
          {
            name: "Ross",
            phoneNumber: "(222) 666-8888"
          }
        ]
      },
      {
        name: "Sales",
        staff: [
          {
            name: "John",
            phoneNumber: "(1) 888-4444"
          }
        ]
      }
    ]
  }
]