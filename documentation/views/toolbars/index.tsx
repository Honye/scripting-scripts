import { Button, ControlGroup, HStack, Spacer, TextField, useState, VStack } from "scripting"
import { CodePreview } from "../../ui_example"

export function ToolbarExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [text, setText] = useState("")

  return <VStack
    toolbar={{
      topBarTrailing: [
        <Button
          title={"Select"}
          action={() => { }}
        />,
        <ControlGroup
          label={
            <Button
              title={"Add"}
              systemImage={"plus"}
              action={() => { }}
            />
          }
          controlGroupStyle={"palette"}
        >
          <Button
            title={"New"}
            systemImage={"plus"}
            action={() => { }}
          />
          <Button
            title={"Import"}
            systemImage={"square.and.arrow.down"}
            action={() => { }}
          />
        </ControlGroup>
      ],
      bottomBar: [
        <Button
          title={"New Sub Category"}
          action={() => { }}
        />,
        <Button
          title={"Add category"}
          action={() => { }}
        />
      ],
      keyboard: <HStack
        padding
      >
        <Spacer />
        <Button
          title={"Done"}
          action={() => { }}
        />
      </HStack>
    }}
    padding
  >
    <Button
      padding
      title={"Code"}
      action={() => setCodeVisible(true)}
      controlSize={"small"}
      buttonStyle={"borderedProminent"}
      popover={{
        isPresented: codeVisible,
        onChanged: setCodeVisible,
        content: <CodePreview
          code={code}
          dismiss={() => setCodeVisible(false)}
        />
      }}
    />

    <TextField
      title={"TextField"}
      value={text}
      onChanged={setText}
      textFieldStyle={"roundedBorder"}
      prompt={"Focus to show the keyboard toolbar"}
    />
  </VStack>
}

const code = `<VStack
  toolbar={{
    topBarTrailing: [
      <Button
        title={"Select"}
        action={() => { }}
      />,
      <ControlGroup
        label={
          <Button
            title={"Add"}
            systemImage={"plus"}
            action={() => { }}
          />
        }
        controlGroupStyle={"palette"}
      >
        <Button
          title={"New"}
          systemImage={"plus"}
          action={() => { }}
        />
        <Button
          title={"Import"}
          systemImage={"square.and.arrow.down"}
          action={() => { }}
        />
      </ControlGroup>
    ],
    bottomBar: [
      <Button
        title={"New Sub Category"}
        action={() => { }}
      />,
      <Button
        title={"Add category"}
        action={() => { }}
      />
    ],
    keyboard: <HStack
      padding
    >
      <Spacer />
      <Button
        title={"Done"}
        action={() => { }}
      />
    </HStack>
  }}
></VStack>`