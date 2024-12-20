import { useState, TextField, VStack, Text } from "scripting"
import { UIExample } from "../../ui_example"

export function TextFieldExample() {
  const [username, setUsername] = useState('')

  return <UIExample
    title={"TextField"}
    code={`function UsernameField() {
  const [username, setUsername] = useState('')

  return <TextField
    title={"Username"}
    value={username}
    onChanged={setUsername}
    prompt={"Enter username"}
  />
}`}
  >
    <VStack>
      <TextField
        title={"Username"}
        value={username}
        onChanged={setUsername}
        prompt={"Enter username"}
      />
      <Text>Username: {username}</Text>
    </VStack>
  </UIExample>
}