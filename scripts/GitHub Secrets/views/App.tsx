import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  Spacer,
  Text,
  VStack,
  useEffect,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { hasToken } from '../storage'
import { Repo } from '../api/github'
import { getSavedRepos, removeRepo } from '../store'
import { TokenView } from './TokenView'
import { SecretsView } from './SecretsView'
import { SharedSecretsView } from './SharedSecretsView'
import { AddRepoView } from './AddRepoView'

export function App() {
  const [tokenSet, setTokenSet] = useState(hasToken())
  const [repos, setRepos] = useState<Repo[]>(getSavedRepos())

  const refresh = () => {
    setTokenSet(hasToken())
    setRepos(getSavedRepos())
  }

  useEffect(() => {
    refresh()
  }, [])

  const openToken = async () => {
    await Navigation.present({ element: <TokenView /> })
    refresh()
  }

  const openAdd = async () => {
    await Navigation.present({
      element: <AddRepoView onChanged={() => setRepos(getSavedRepos())} />
    })
    refresh()
  }

  const openSharedSecrets = async () => {
    await Navigation.present({ element: <SharedSecretsView /> })
  }

  const handleRemove = (id: number) => {
    setRepos(removeRepo(id))
  }

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.appTitle}
        toolbar={{
          topBarTrailing: [
            <Button action={openToken}>
              <Image systemName="key.fill" />
            </Button>
          ],
          bottomBar: [
            <Button action={openSharedSecrets} disabled={!tokenSet}>
              <HStack spacing={4}>
                <Image systemName="key.horizontal.fill" />
                <Text>{i18n.sharedSecrets}</Text>
              </HStack>
            </Button>,
            <Spacer />,
            <Button action={openAdd} disabled={!tokenSet}>
              <Image systemName="plus" />
            </Button>
          ]
        }}
      >
        {!tokenSet ? (
          <VStack spacing={10} padding={40} frame={{ maxWidth: 'infinity' }}>
            <Image
              systemName="key.slash"
              font={40}
              foregroundStyle="secondaryLabel"
            />
            <Text font="headline">{i18n.noToken}</Text>
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {i18n.setTokenFirst}
            </Text>
            <Button title={i18n.token} action={openToken} />
          </VStack>
        ) : repos.length === 0 ? (
          <VStack spacing={10} padding={40} frame={{ maxWidth: 'infinity' }}>
            <Image
              systemName="tray"
              font={40}
              foregroundStyle="secondaryLabel"
            />
            <Text font="headline">{i18n.emptyRepoList}</Text>
            <Text font="footnote" foregroundStyle="secondaryLabel">
              {i18n.addRepoHint}
            </Text>
            <Button title={i18n.addRepo} action={openAdd} />
          </VStack>
        ) : (
          repos.map((repo) => (
            <NavigationLink
              key={String(repo.id)}
              destination={<SecretsView repo={repo} />}
            >
              <HStack
                trailingSwipeActions={{
                  actions: [
                    <Button
                      title={i18n.removeRepo}
                      role="destructive"
                      action={() => handleRemove(repo.id)}
                    />
                  ]
                }}
              >
                <Image
                  systemName={repo.private ? 'lock.fill' : 'book.closed'}
                  foregroundStyle="secondaryLabel"
                />
                <Text>{repo.fullName}</Text>
              </HStack>
            </NavigationLink>
          ))
        )}
      </List>
    </NavigationStack>
  )
}
