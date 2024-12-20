import { Button, Group, Menu, ScrollView, Text, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function MenuExample() {

  return <ScrollView
    navigationTitle={"Menu"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <VStack
    >
      <UIExample
        title={"Menu"}
        code={`<Menu
  title={"Open Menu"}
>
  <Button
    title="Rename"
    action={() => console.log("Rename")}
  />
  <Button
    title="Delete"
    role={"destructive"}
    action={() => console.log("Delete")}
  />
  <Menu title="Copy">
    <Button
      title="Copy"
      action={() => console.log("Copy")}
    />
    <Button
      title="Copy Formated"
      action={() => console.log("Copy fomatted")}
    />
  </Menu>
</Menu>`}
      >
        <Menu
          title={"Open Menu"}
        >
          <Button
            title="Rename"
            action={() => console.log("Rename")}
          />
          <Button
            title="Delete"
            role={"destructive"}
            action={() => console.log("Delete")}
          />
          <Menu title="Copy">
            <Button
              title="Copy"
              action={() => console.log("Copy")}
            />
            <Button
              title="Copy Formated"
              action={() => console.log("Copy fomatted")}
            />
          </Menu>
        </Menu>
      </UIExample>

      <UIExample
        title={"Context Menu"}
        code={`<Text
  foregroundStyle={"link"}
  contextMenu={{
    menuItems: <Group>
      <Button
        title="Add"
        action={() => {
          // Add
        }}
      />
      <Button
        title="Delete"
        role="destructive"
        action={() => {
          // Delete
        }}
      />
    </Group>
  }}
>Long Press to open context menu</Text>`}
      >
        <Text
          foregroundStyle={"link"}
          contextMenu={{
            menuItems: <Group>
              <Button
                title="Add"
                action={() => {
                  // Add
                }}
              />
              <Button
                title="Delete"
                role="destructive"
                action={() => {
                  // Delete
                }}
              />
            </Group>
          }}
        >Long Press to open context menu</Text>
      </UIExample>
    </VStack>
  </ScrollView>
}