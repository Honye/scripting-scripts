import {
  Button,
  Form,
  Navigation,
  NavigationStack,
  ProgressView,
  Section,
  Text,
  TextField,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { isValidSecretName, putSecret, Repo } from '../api/github'

interface Props {
  repo: Repo
  existingName?: string
}

export function SecretEditor({ repo, existingName }: Props) {
  const dismiss = Navigation.useDismiss()
  const editing = !!existingName
  const [name, setName] = useState(existingName ?? '')
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave =
    !saving && value.length > 0 && (editing || isValidSecretName(name))

  const save = async () => {
    setSaving(true)
    try {
      await putSecret(repo.owner, repo.name, name, value)
      dismiss()
    } catch (e) {
      setSaving(false)
      Dialog.alert({
        title: i18n.error,
        message: e instanceof Error ? e.message : String(e)
      })
    }
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle={editing ? i18n.editSecret : i18n.newSecret}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [
            <Button title={i18n.cancel} action={() => dismiss()} />
          ],
          topBarTrailing: [
            saving ? (
              <ProgressView />
            ) : (
              <Button title={i18n.save} action={save} disabled={!canSave} />
            )
          ]
        }}
      >
        <Section footer={editing ? undefined : <Text>{i18n.nameHint}</Text>}>
          <TextField
            title={i18n.secretName}
            prompt={i18n.secretNamePlaceholder}
            value={name}
            onChanged={setName}
            disabled={editing}
            textInputAutocapitalization="never"
            autocorrectionDisabled={true}
          />
        </Section>
        <Section
          header={<Text>{i18n.secretValue}</Text>}
          footer={<Text>{i18n.overwriteNote}</Text>}
        >
          <TextField
            title={i18n.secretValue}
            prompt={i18n.secretValuePlaceholder}
            value={value}
            onChanged={setValue}
            axis="vertical"
            textInputAutocapitalization="never"
            autocorrectionDisabled={true}
          />
        </Section>
      </Form>
    </NavigationStack>
  )
}
