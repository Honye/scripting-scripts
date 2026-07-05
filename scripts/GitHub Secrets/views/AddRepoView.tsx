import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  ProgressView,
  Spacer,
  Text,
  TextField,
  VStack,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { Repo, searchRepos } from '../api/github'
import { addRepo, isSaved } from '../store'

export function AddRepoView({ onChanged }: { onChanged?: () => void }) {
  const dismiss = Navigation.useDismiss()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Repo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [savedIds, setSavedIds] = useState<number[]>([])

  const runSearch = async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      setResults(await searchRepos(q))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const add = (repo: Repo) => {
    addRepo(repo)
    setSavedIds((prev) => (prev.includes(repo.id) ? prev : [...prev, repo.id]))
    onChanged?.()
  }

  const already = (id: number) => savedIds.includes(id) || isSaved(id)

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.addRepo}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [
            <Button title={i18n.done} action={() => dismiss()} />
          ],
          topBarTrailing: loading ? [<ProgressView />] : []
        }}
      >
        <TextField
          title={i18n.searchReposToAdd}
          prompt={i18n.searchPrompt}
          value={query}
          onChanged={setQuery}
          onSubmit={runSearch}
          submitLabel="search"
          textInputAutocapitalization="never"
          autocorrectionDisabled={true}
        />

        {error ? (
          <Text foregroundStyle="systemRed" font="footnote">
            {error}
          </Text>
        ) : null}

        {!loading && searched && !error && results.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">{i18n.noResults}</Text>
        ) : null}

        {results.map((repo) => (
          <HStack key={String(repo.id)}>
            <Image
              systemName={repo.private ? 'lock.fill' : 'book.closed'}
              foregroundStyle="secondaryLabel"
            />
            <VStack alignment="leading" spacing={2}>
              <Text>{repo.fullName}</Text>
            </VStack>
            <Spacer />
            {already(repo.id) ? (
              <Image
                systemName="checkmark.circle.fill"
                foregroundStyle="systemGreen"
              />
            ) : (
              <Button title={i18n.add} action={() => add(repo)} />
            )}
          </HStack>
        ))}
      </List>
    </NavigationStack>
  )
}
