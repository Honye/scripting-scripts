import { Button, Form, NavigationStack, Section, SecureField, TextField, useState } from 'scripting'
import { DefaultOAuthApp, StorageKey } from '../constants'
import { authorize, revoke } from '../oauth'
import { OAuth } from '../types'

interface FormData {
  clientID: string
  clientSecret: string
  accessToken?: string
}

export function Authorization() {
  const { clientID, clientSecret, accessToken } = Storage.get<OAuth>(StorageKey.OAuth) || {
    clientID: DefaultOAuthApp.clientID,
    clientSecret: DefaultOAuthApp.clientSecret
  }
  const [formData, setFormData] = useState<FormData>({ clientID, clientSecret, accessToken })

  const onFieldChange = (key: keyof FormData) => (value: string) => {
    setFormData({ ...formData, [key]: value })
  }

  const handleAuthorize = async () => {
    const credential = await authorize()
    if (credential?.oauthToken) {
      setFormData({ ...formData, accessToken: credential.oauthToken })
    }
  }

  const handleRevoke = () => {
    setFormData({ ...formData, accessToken: undefined })
    revoke()
  }

  return (
    <NavigationStack>
      <Form
        navigationTitle='Authorization'
      >
        <Section title='Client ID'>
          <TextField
            title='Client ID'
            value={formData.clientID}
            onChanged={onFieldChange('clientID')}
          />
        </Section>
        <Section title='Client Secret'>
          <SecureField
            title='Client Secret'
            value={formData.clientSecret}
            onChanged={onFieldChange('clientSecret')}
          />
        </Section>
        <Button
          title={formData.accessToken ? 'Revoke' : 'Authorize'}
          role={formData.accessToken ? 'destructive' : undefined}
          action={formData.accessToken ? handleRevoke : handleAuthorize}
        />
      </Form>
    </NavigationStack>
  )
}
