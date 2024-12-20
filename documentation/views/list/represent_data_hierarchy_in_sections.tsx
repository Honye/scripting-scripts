import { Button, List, Section, Text, useState } from "scripting"
import { Person, PersonRowView } from "./display_data_inside_a_row"
import { CodePreview } from "../../ui_example"

export type Department = {
  name: string
  staff: Person[]
}

export type Company = {
  name: string
  departments: Department[]
}

export const companyA: Company = {
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
}

export function RepresentDataHierarchyInSectionsExample() {
  const [codeVisible, setCodeVisible] = useState(false)

  return <List
    navigationTitle={"Represent data hierarchy in sections"}
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
            code={`type Department = {
  name: string
  staff: Person[]
}

type Company = {
  departments: Department[]
}

const company: Company = {
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
}

function ListView() {
  return <List>
    {company.departments.map(department =>
      <Section
        header={
          <Text>{department.name}</Text>
        }
      >
        {department.staff.map(person =>
          <PersonRowView
            person={person}
          />
        )}
      </Section>
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
      <Section
        header={
          <Text>{department.name}</Text>
        }
      >
        {department.staff.map(person =>
          <PersonRowView
            person={person}
          />
        )}
      </Section>
    )}
  </List>
}