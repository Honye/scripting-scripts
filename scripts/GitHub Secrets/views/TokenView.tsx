import {
  Button,
  Form,
  Link,
  Navigation,
  NavigationStack,
  Section,
  SecureField,
  Text,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { getToken, setToken } from '../storage'

export function TokenView() {
  const dismiss = Navigation.useDismiss()
  const [token, setTokenValue] = useState(getToken())

  const save = () => {
    setToken(token)
    dismiss()
  }

  const clear = () => {
    setTokenValue('')
    setToken('')
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle={i18n.token}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />],
          topBarTrailing: [<Button title={i18n.save} action={save} />]
        }}
      >
        <Section
          header={<Text>{i18n.tokenSectionHeader}</Text>}
          footer={<Text>{i18n.tokenFooter}</Text>}
        >
          <SecureField
            title={i18n.tokenFieldTitle}
            prompt="github_pat_… / ghp_…"
            value={token}
            onChanged={setTokenValue}
          />
        </Section>
        <Section>
          <Link url="https://github.com/settings/personal-access-tokens/new">
            <Text>{i18n.createTokenLink}</Text>
          </Link>
          {token ? (
            <Button title={i18n.clear} role="destructive" action={clear} />
          ) : null}
        </Section>
      </Form>
    </NavigationStack>
  )
}
