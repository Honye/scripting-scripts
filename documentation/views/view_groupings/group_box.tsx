import { Button, GroupBox, Label, ScrollView, Text, Toggle, useState, VStack } from "scripting"
import { CodePreview } from "../../ui_example"

export function GroupBoxExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [userAgreed, setUserAgreed] = useState(false)
  const agreementText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

  return <VStack
    navigationTitle={"GroupBox"}
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
      />,
    }}
  >
    <GroupBox
      label={
        <Label
          title={"End-User Agreement"}
          systemImage={"building.columns"}
        />
      }
    >
      <ScrollView
        frame={{
          height: 100,
        }}
      >
        <Text>{agreementText}</Text>
      </ScrollView>
      <Toggle
        value={userAgreed}
        onChanged={setUserAgreed}
      >
        <Text>I agree to the above terms</Text>
      </Toggle>
    </GroupBox>
  </VStack>
}

const code = `<GroupBox
  label={
    <Label
      title={"End-User Agreement"}
      systemImage={"building.columns"}
    />
  }
>
  <ScrollView
    frame={{
      height: 100,
    }}
  >
    <Text>{agreementText}</Text>
  </ScrollView>
  <Toggle
    value={userAgreed}
    onChanged={setUserAgreed}
  >
    <Text>I agree to the above terms</Text>
  </Toggle>
</GroupBox>`