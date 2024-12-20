import { Button, Text, useState, } from "scripting"
import { UIExample } from "../../ui_example"

export function PresentAlertExample() {
  const [isPresented, setIsPresented] = useState(false)

  return <UIExample
    title={"Present a alert view"}
    code={`<Button
  title={"Present"}
  action={() => setIsPresented(true)}
  alert={{
    isPresented: isPresented,
    onChanged: setIsPresented,
    actions: <Button
      title={"OK"}
      action={() => { }}
    />,
    title: "Alert",
    message: <Text>Everything is OK</Text>
  }}
/>`}
  >
    <Button
      title={"Present"}
      action={() => setIsPresented(true)}
      alert={{
        isPresented: isPresented,
        onChanged: setIsPresented,
        actions: <Button
          title={"OK"}
          action={() => { }}
        />,
        title: "Alert",
        message: <Text>Everything is OK</Text>
      }}
    />
  </UIExample>
}