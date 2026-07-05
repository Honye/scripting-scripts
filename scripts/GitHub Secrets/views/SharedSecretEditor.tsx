import {
  Button,
  Form,
  HStack,
  Image,
  Navigation,
  NavigationStack,
  ProgressView,
  Section,
  Spacer,
  Text,
  TextField,
  VStack,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { isValidSecretName, Repo, syncSecret } from '../api/github'
import {
  getSavedRepos,
  removeSharedSecret,
  SharedSecret,
  upsertSharedSecret
} from '../store'

interface SyncResult {
  id: number
  fullName: string
  pending: boolean
  ok?: boolean
  error?: string
}

export function SharedSecretEditor({ existing }: { existing?: SharedSecret }) {
  const dismiss = Navigation.useDismiss()
  const editing = !!existing

  const [id] = useState(existing?.id ?? UUID.string())
  const [name, setName] = useState(existing?.name ?? '')
  const [value, setValue] = useState(existing?.value ?? '')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number[]>(
    existing?.repos.map((r) => r.id) ?? []
  )
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<SyncResult[]>([])

  // Selectable repos: the curated list plus any already attached to this secret.
  const [repoPool] = useState<Repo[]>(() => {
    const map = new Map<number, Repo>()
    for (const r of getSavedRepos()) map.set(r.id, r)
    for (const r of existing?.repos ?? []) if (!map.has(r.id)) map.set(r.id, r)
    return Array.from(map.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    )
  })

  const toggle = (repoId: number) => {
    setSelected((prev) =>
      prev.includes(repoId)
        ? prev.filter((x) => x !== repoId)
        : [...prev, repoId]
    )
  }

  const selectedRepos = () => repoPool.filter((r) => selected.includes(r.id))

  const persist = (extra?: Partial<SharedSecret>): SharedSecret => {
    const secret: SharedSecret = {
      id,
      name: name.trim(),
      value,
      repos: selectedRepos(),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: existing?.lastSyncedAt,
      lastSync: existing?.lastSync,
      ...extra
    }
    upsertSharedSecret(secret)
    return secret
  }

  const canSave = isValidSecretName(name)
  const canSync =
    !running && value.length > 0 && canSave && selected.length > 0

  const handleSave = () => {
    persist()
    dismiss()
  }

  const handleDelete = async () => {
    const ok = await Dialog.confirm({
      title: i18n.delete,
      message: i18n.deleteConfirm(name || i18n.newSharedSecret)
    })
    if (!ok) return
    removeSharedSecret(id)
    dismiss()
  }

  const handleSync = async () => {
    const targets = selectedRepos()
    setRunning(true)
    setResults(
      targets.map((r) => ({ id: r.id, fullName: r.fullName, pending: true }))
    )
    persist()
    const outcome = await syncSecret(
      targets,
      name.trim(),
      value,
      (repo, ok, error) => {
        setResults((prev) =>
          prev.map((x) =>
            x.id === repo.id ? { ...x, ok, error, pending: false } : x
          )
        )
      }
    )
    persist({
      lastSyncedAt: new Date().toISOString(),
      lastSync: outcome.map((o) => ({
        repoId: o.repo.id,
        ok: o.ok,
        error: o.error
      }))
    })
    setRunning(false)
  }

  const filtered = query.trim()
    ? repoPool.filter((r) =>
        r.fullName.toLowerCase().includes(query.trim().toLowerCase())
      )
    : repoPool

  return (
    <NavigationStack>
      <Form
        navigationTitle={editing ? i18n.editSharedSecret : i18n.newSharedSecret}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [
            <Button title={i18n.cancel} action={() => dismiss()} />
          ],
          topBarTrailing: [
            <Button title={i18n.save} action={handleSave} disabled={!canSave} />
          ]
        }}
      >
        <Section
          header={<Text>{i18n.secretName}</Text>}
          footer={<Text>{i18n.nameHint}</Text>}
        >
          <TextField
            title={i18n.secretName}
            prompt={i18n.secretNamePlaceholder}
            value={name}
            onChanged={setName}
            textInputAutocapitalization="never"
            autocorrectionDisabled={true}
          />
        </Section>

        <Section
          header={<Text>{i18n.secretValue}</Text>}
          footer={<Text>{i18n.valueStoredNote}</Text>}
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

        <Section
          header={
            <HStack>
              <Text>{i18n.targetRepos}</Text>
              <Spacer />
              <Text foregroundStyle="secondaryLabel">
                {i18n.selectedCount(selected.length)}
              </Text>
            </HStack>
          }
        >
          {repoPool.length === 0 ? (
            <Text foregroundStyle="secondaryLabel">{i18n.noRepos}</Text>
          ) : (
            <>
              <TextField
                title={i18n.searchRepos}
                prompt={i18n.searchRepos}
                value={query}
                onChanged={setQuery}
                textInputAutocapitalization="never"
                autocorrectionDisabled={true}
              />
              {filtered.map((repo) => {
                const isSelected = selected.includes(repo.id)
                return (
                  <Button key={String(repo.id)} action={() => toggle(repo.id)}>
                    <HStack>
                      <Image
                        systemName={
                          isSelected ? 'checkmark.circle.fill' : 'circle'
                        }
                        foregroundStyle={
                          isSelected ? 'systemBlue' : 'secondaryLabel'
                        }
                      />
                      <Text foregroundStyle="label">{repo.fullName}</Text>
                      <Spacer />
                    </HStack>
                  </Button>
                )
              })}
            </>
          )}
        </Section>

        <Section>
          <Button action={handleSync} disabled={!canSync}>
            <HStack>
              <Spacer />
              {running ? (
                <ProgressView />
              ) : (
                <HStack spacing={6}>
                  <Image systemName="arrow.trianglehead.2.clockwise.rotate.90" />
                  <Text fontWeight="semibold">{i18n.syncNow}</Text>
                </HStack>
              )}
              <Spacer />
            </HStack>
          </Button>
        </Section>

        {results.length > 0 ? (
          <Section header={<Text>{i18n.syncResults}</Text>}>
            {results.map((res) => (
              <HStack key={String(res.id)}>
                {res.pending ? (
                  <ProgressView />
                ) : (
                  <Image
                    systemName={
                      res.ok ? 'checkmark.circle.fill' : 'xmark.octagon.fill'
                    }
                    foregroundStyle={res.ok ? 'systemGreen' : 'systemRed'}
                  />
                )}
                <VStack alignment="leading" spacing={2}>
                  <Text>{res.fullName}</Text>
                  {res.error ? (
                    <Text font="caption" foregroundStyle="systemRed">
                      {res.error}
                    </Text>
                  ) : null}
                </VStack>
                <Spacer />
              </HStack>
            ))}
          </Section>
        ) : null}

        {editing ? (
          <Section>
            <Button
              title={i18n.delete}
              role="destructive"
              action={handleDelete}
            />
          </Section>
        ) : null}
      </Form>
    </NavigationStack>
  )
}
