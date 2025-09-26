import { Button, Form, NavigationStack, Section, SecureField, Text, TextField, useState } from 'scripting'
import { DefaultOAuthApp, StorageKey } from '../constants'
import { authorize, revoke } from '../oauth'
import { OAuth } from '../types'

interface FormData {
  clientID: string
  clientSecret: string
  accessToken?: string
}

export function Authorization() {
  const [accessToken, setAccessToken] = useState(Storage.get<string>(StorageKey.AccessToken) || '')
  const [formData, setFormData] = useState<FormData>(Storage.get<OAuth>(StorageKey.OAuth) || {
    clientID: DefaultOAuthApp.clientID,
    clientSecret: DefaultOAuthApp.clientSecret
  })

  const saveAccessToken = (value: string) => {
    Storage.set(StorageKey.AccessToken, value)
    setAccessToken(value)
  }

  const onFieldChange = (key: keyof FormData) => (value: string) => {
    setFormData({ ...formData, [key]: value })
    Storage.set<OAuth>(StorageKey.OAuth, {
      ...formData,
      [key]: value
    })
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
        navigationBarTitleDisplayMode='inline'
        navigationTitle='Authorization'
      >
        <Section
          header={
            <Text>Personal access token</Text>
          }
          footer={
            <Text
              attributedString='A personal access token is a more secure method. If this field is filled in, it will be used with priority. You can go to <https://github.com/settings/personal-access-tokens/new> to create and copy the token.'
            />
          }
        >
          <SecureField
            title='Personal access token'
            value={accessToken}
            onChanged={saveAccessToken}
          />
        </Section>
        <Section
          header={
            <Text>OAuth App</Text>
          }
          footer={
            <Text>For your information security, do not share the Client Secret with others.</Text>
          }
        >
          <TextField
            title='Client ID'
            value={formData.clientID}
            onChanged={onFieldChange('clientID')}
          />
          <SecureField
            title='Client Secret'
            value={formData.clientSecret}
            onChanged={onFieldChange('clientSecret')}
          />
        </Section>
        <Button
          disabled={!(formData.clientID && formData.clientSecret)}
          title={formData.accessToken ? 'Revoke' : 'Authorize'}
          role={formData.accessToken ? 'destructive' : undefined}
          action={formData.accessToken ? handleRevoke : handleAuthorize}
        />
      </Form>
    </NavigationStack>
  )
}
