import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  Spacer,
  Text,
  VStack,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { getSharedSecrets, SharedSecret } from '../store'
import { SharedSecretEditor } from './SharedSecretEditor'

export function SharedSecretsView() {
  const dismiss = Navigation.useDismiss()
  const [secrets, setSecrets] = useState<SharedSecret[]>(getSharedSecrets())

  const reload = () => setSecrets(getSharedSecrets())

  const openEditor = async (existing?: SharedSecret) => {
    await Navigation.present({
      element: <SharedSecretEditor existing={existing} />
    })
    reload()
  }

  const formatDate = (iso?: string) => {
    if (!iso) return i18n.neverSynced
    try {
      return i18n.lastSynced(new Date(iso).toLocaleString())
    } catch {
      return i18n.lastSynced(iso)
    }
  }

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.sharedSecrets}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [
            <Button title={i18n.done} action={() => dismiss()} />
          ],
          topBarTrailing: [
            <Button action={() => openEditor()}>
              <Image systemName="plus" />
            </Button>
          ]
        }}
      >
        {secrets.length === 0 ? (
          <VStack spacing={10} padding={40} frame={{ maxWidth: 'infinity' }}>
            <Image
              systemName="key.horizontal"
              font={40}
              foregroundStyle="secondaryLabel"
            />
            <Text font="headline">{i18n.noSharedSecrets}</Text>
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {i18n.sharedSecretsHint}
            </Text>
            <Button title={i18n.newSharedSecret} action={() => openEditor()} />
          </VStack>
        ) : (
          secrets.map((secret) => (
            <Button key={secret.id} action={() => openEditor(secret)}>
              <HStack>
                <Image
                  systemName="key.horizontal.fill"
                  foregroundStyle="systemBlue"
                />
                <VStack alignment="leading" spacing={2}>
                  <Text foregroundStyle="label">{secret.name}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">
                    {i18n.repoCount(secret.repos.length)} ·{' '}
                    {formatDate(secret.lastSyncedAt)}
                  </Text>
                </VStack>
                <Spacer />
                <Image systemName="chevron.right" foregroundStyle="tertiaryLabel" />
              </HStack>
            </Button>
          ))
        )}
      </List>
    </NavigationStack>
  )
}
