import { Button, Label, Navigation, TabView, Text, useState } from "scripting"
import { UIExample } from "../../../ui_example"

export function TabViewWithBadgeExample() {
  return <UIExample
    title={"TabView with badge"}
    code={code}>
    <Button
      title={"Present example"}
      action={() => {
        Navigation.present({
          element: <TabViewExample />
        })
      }}
    />
  </UIExample>
}

function TabViewExample() {
  const [tabIndex, setTabIndex] = useState(0)

  return <TabView
    tabIndex={tabIndex}
    onTabIndexChanged={setTabIndex}
  >
    <ReceivedView
      tag={0}
      tabItem={
        <Label
          title={"Received"}
          systemImage={"tray.and.arrow.down.fill"}
        />
      }
      badge={2}
    />
    <SendView
      tag={1}
      tabItem={
        <Label
          title={"Send"}
          systemImage={"tray.and.arrow.up.fill"}
        />
      }
    />
    <AccountView
      tag={2}
      badge={"!"}
      tabItem={
        <Label
          title={"Account"}
          systemImage={"person.crop.circle.fill"}
        />
      }
    />
  </TabView>
}

function ReceivedView() {
  return <Text>Received view</Text>
}

function SendView() {
  return <Text>Send view</Text>
}

function AccountView() {
  return <Text>Account view</Text>
}

const code = `function TabViewExample() {
  const [tabIndex, setTabIndex] = useState(0)

  return <TabView
    tabIndex={tabIndex}
    onTabIndexChanged={setTabIndex}
  >
    <ReceivedView
      tag={0}
      tabItem={
        <Label
          title={"Received"}
          systemImage={"tray.and.arrow.down.fill"}
        />
      }
      badge={2}
    />
    <SendView
      tag={1}
      tabItem={
        <Label
          title={"Send"}
          systemImage={"tray.and.arrow.up.fill"}
        />
      }
    />
    <AccountView
      tag={2}
      badge={"!"}
      tabItem={
        <Label
          title={"Account"}
          systemImage={"person.crop.circle.fill"}
        />
      }
    />
  </TabView>
}`