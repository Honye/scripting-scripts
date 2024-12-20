import { useState, SecureField, VStack, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function SecureTextExample() {
  const [password, setPassword] = useState('')

  return <UIExample
    title={"SecureField"}
    code={`function PasswordField() {
  const [password, setPassword] = useState("")

  return <SecureField
    title={"Password"}
    value={password}
    onChanged={setPassword}
    prompt={"Enter password"}
  />
}`}
  >
    <VStack>
      <SecureField
        title={"Password"}
        value={password}
        onChanged={setPassword}
        prompt={"Enter password"}
      />
      <Text>Password: {password}</Text>
    </VStack>
  </UIExample>
}