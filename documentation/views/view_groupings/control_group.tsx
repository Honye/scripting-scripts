import { Button, ControlGroup, ControlGroupStyle, Label, List, Picker, Text, useMemo, useState } from "scripting"
import { CodePreview } from "../../ui_example"

export function ControlGroupExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [style, setStyle] = useState<ControlGroupStyle>("palette")
  const styles = useMemo<ControlGroupStyle[]>(() => [
    'automatic',
    'compactMenu',
    'menu',
    'navigation',
    'palette'
  ], [])

  return <List
    navigationTitle={"ControlGroup"}
    navigationBarTitleDisplayMode={"inline"}
    toolbar={{
      topBarTrailing: [
        <Button
          title={"Code"}
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
        <ControlGroup
          label={
            <Label
              title={"Plus"}
              systemImage={"plus"}
            />
          }
          controlGroupStyle={style}
        >
          <Button
            title={"Edit"}
            systemImage={"pencil"}
            action={() => { }}
          />
          <Button
            title={"Delete"}
            systemImage={"trash"}
            role={"destructive"}
            action={() => { }}
          />
        </ControlGroup>
      ]
    }}
  >
    <Picker
      title={"Control Group Style"}
      value={style}
      onChanged={setStyle as any}
    >
      {styles.map(style =>
        <Text tag={style}>{style}</Text>
      )}
    </Picker>
  </List>
}

const code = `<ControlGroup
  label={
    <Label
      title={"Plus"}
      systemImage={"plus"}
    />
  }
  controlGroupStyle={"palette"}
>
  <Button
    title={"Edit"}
    systemImage={"pencil"}
    action={() => { }}
  />
  <Button
    title={"Delete"}
    systemImage={"trash"}
    role={"destructive"}
    action={() => { }}
  />
</ControlGroup>`