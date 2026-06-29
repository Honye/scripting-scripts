import { Button, Form, Image, Label, LabeledContent, Menu, Navigation, NavigationStack, Script, Section, Text } from "scripting"

function Example() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <Form
      navigationTitle={"LabeledContent"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        cancellationAction: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <Section
        header={<Text>value shorthand</Text>}
      >
        {/* A `value` string renders as the trailing content. */}
        <LabeledContent title={"Version"} value={"1.0.0"} />
        <LabeledContent title={"Build"} value={"24"} />
      </Section>

      <Section
        header={<Text>custom content</Text>}
      >
        {/* Provide `children` instead of `value` for a custom trailing view. */}
        <LabeledContent title={"Status"}>
          <Image
            systemName={"checkmark.seal.fill"}
            foregroundStyle={"systemGreen"}
          />
        </LabeledContent>
      </Section>

      <Section
        header={<Text>custom label</Text>}
      >
        {/* Provide a `label` view instead of a `title` string. */}
        <LabeledContent
          label={
            <Label
              title={"Battery"}
              systemImage={"battery.100"}
            />
          }
          value={"100%"}
        />
      </Section>

      <Section
        header={<Text>menuOrder modifier</Text>}
        footer={<Text>menuOrder controls the order of items within a Menu or menu-style Picker.</Text>}
      >
        <Menu
          title={"Fixed order"}
          menuOrder={"fixed"}
        >
          <Button title={"First"} action={() => { }} />
          <Button title={"Second"} action={() => { }} />
          <Button title={"Third"} action={() => { }} />
        </Menu>
      </Section>
    </Form>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()
