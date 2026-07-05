import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  ProgressView,
  Spacer,
  Text,
  VStack,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { deleteSecret, listSecrets, Repo, SecretMeta } from '../api/github'
import { SecretEditor } from './SecretEditor'

export function SecretsView({ repo }: { repo: Repo }) {
  const [secrets, setSecrets] = useState<SecretMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setSecrets(await listSecrets(repo.owner, repo.name))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openEditor = async (existingName?: string) => {
    await Navigation.present({ element: <SecretEditor repo={repo} existingName={existingName} /> })
    load()
  }

  const handleDelete = async (name: string) => {
    const ok = await Dialog.confirm({
      title: i18n.delete,
      message: i18n.deleteConfirm(name)
    })
    if (!ok) return
    try {
      await deleteSecret(repo.owner, repo.name, name)
      load()
    } catch (e) {
      Dialog.alert({
        title: i18n.error,
        message: e instanceof Error ? e.message : String(e)
      })
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return iso
    }
  }

  return (
    <List
      navigationTitle={repo.fullName}
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: [
          loading ? (
            <ProgressView />
          ) : (
            <Button action={() => openEditor()}>
              <Image systemName="plus" />
            </Button>
          )
        ]
      }}
    >
      {error ? (
        <Text foregroundStyle="systemRed" font="footnote">
          {error}
        </Text>
      ) : null}
      {secrets.length === 0 && !loading ? (
        <VStack spacing={6} padding={30} frame={{ maxWidth: 'infinity' }}>
          <Image systemName="key" font={34} foregroundStyle="secondaryLabel" />
          <Text foregroundStyle="secondaryLabel">{i18n.noSecrets}</Text>
        </VStack>
      ) : (
        secrets.map((secret) => (
          <Button
            key={secret.name}
            action={() => openEditor(secret.name)}
            trailingSwipeActions={{
              actions: [
                <Button
                  title={i18n.delete}
                  role="destructive"
                  action={() => handleDelete(secret.name)}
                />
              ]
            }}
          >
            <HStack>
              <VStack alignment="leading" spacing={2}>
                <Text foregroundStyle="label">{secret.name}</Text>
                <Text font="caption" foregroundStyle="secondaryLabel">
                  {i18n.updatedAt(formatDate(secret.updatedAt))}
                </Text>
              </VStack>
              <Spacer />
              <Image systemName="pencil" foregroundStyle="tertiaryLabel" />
            </HStack>
          </Button>
        ))
      )}
    </List>
  )
}
