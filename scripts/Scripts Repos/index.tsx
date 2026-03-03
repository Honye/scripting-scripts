import {
  Button,
  ColorStringRGBA,
  Group,
  HStack,
  Image,
  LazyVGrid,
  Link,
  List,
  Navigation,
  NavigationLink,
  NavigationStack,
  ProgressView,
  RoundedRectangle,
  Script,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useEffect,
  useState
} from 'scripting'
import { DB, initPromise, Repo, RepoScript } from './db'
import { fetchScriptDirs, getToken, parseRepoInput, setToken } from './github'

/** Detail view: shows scripts under a repo as grid */
function RepoDetailView({ repoData }: { repoData: Repo }) {
  const [scripts, setScripts] = useState<RepoScript[]>([])
  const [loading, setLoading] = useState(false)

  const loadScripts = async () => {
    await initPromise
    const list = await DB.getScripts(repoData.id)
    setScripts(list || [])
  }

  const refreshScripts = async () => {
    setLoading(true)
    try {
      const dirs = await fetchScriptDirs(repoData.owner, repoData.repo)
      await DB.saveScripts(repoData.id, dirs)
      await loadScripts()
    } catch (e) {
      console.error(e)
      Dialog.alert({
        title: '获取失败',
        message: `${e}`
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScripts().then(() => refreshScripts())
  }, [])

  const columns = [
    { size: { type: 'flexible' as const }, spacing: 12 },
    { size: { type: 'flexible' as const }, spacing: 12 },
    { size: { type: 'flexible' as const }, spacing: 12 }
  ]

  return (
    <ScrollView
      navigationTitle={`${repoData.owner}/${repoData.repo}`}
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: [
          loading ? (
            <ProgressView />
          ) : (
            <Button action={refreshScripts}>
              <Image systemName="arrow.clockwise" />
            </Button>
          )
        ]
      }}
    >
      {scripts.length === 0 ? (
        loading ? (
          <VStack frame={{ maxWidth: 'infinity' }} padding={40}>
            <ProgressView />
          </VStack>
        ) : (
          <VStack frame={{ maxWidth: 'infinity' }} padding={40}>
            <Text foregroundStyle="secondaryLabel">
              点击右上角刷新按钮获取脚本目录
            </Text>
          </VStack>
        )
      ) : (
        <LazyVGrid columns={columns} padding={16} spacing={12}>
          {scripts.map((item) => {
            const zipUrl = `https://www.imarkr.com/api/github/download/${repoData.owner}/${repoData.repo}/scripts/${encodeURIComponent(item.name)}.zip`
            const scheme = `scripting://import_scripts?urls=${encodeURIComponent(JSON.stringify([zipUrl]))}`
            return (
              <Link key={String(item.id)} url={scheme}>
                <VStack
                  alignment="leading"
                  frame={{ maxWidth: 'infinity', minHeight: 50 }}
                  padding={12}
                  background={
                    <RoundedRectangle
                      fill={
                        (item.color ||
                          'rgba(108, 108, 112, 1.00)') as ColorStringRGBA
                      }
                      cornerRadius={14}
                    />
                  }
                >
                  <Image
                    systemName={item.icon || 'applescript.fill'}
                    foregroundStyle="rgba(255, 255, 255, 0.9)"
                    font={22}
                    frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                  />
                  <Spacer />
                  <Text
                    font="caption"
                    fontWeight="semibold"
                    foregroundStyle="white"
                    lineLimit={2}
                    multilineTextAlignment="leading"
                    frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                  >
                    {item.name}
                  </Text>
                </VStack>
              </Link>
            )
          })}
        </LazyVGrid>
      )}
    </ScrollView>
  )
}

/** Main app view */
function App() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [adding, setAdding] = useState(false)

  const loadRepos = async () => {
    await initPromise
    const list = await DB.getRepos()
    setRepos(list || [])
  }

  useEffect(() => {
    loadRepos()
  }, [])

  const handleAdd = async () => {
    const input = await Dialog.prompt({
      title: '添加仓库',
      message: '请输入 GitHub 仓库地址',
      placeholder: 'username/repo 或 https://github.com/user/repo'
    })
    if (!input) return

    const parsed = parseRepoInput(input)
    if (!parsed) {
      Dialog.alert({
        title: '格式错误',
        message: '请输入正确的 GitHub 仓库地址\n支持 username/repo 或完整 URL'
      })
      return
    }

    setAdding(true)
    try {
      const repoId = await DB.addRepo(parsed.owner, parsed.repo)
      // Fetch scripts on add
      const dirs = await fetchScriptDirs(parsed.owner, parsed.repo)
      await DB.saveScripts(repoId, dirs)
      await loadRepos()
    } catch (e) {
      console.error(e)
      Dialog.alert({
        title: '添加失败',
        message: `${e}`
      })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (repo: Repo) => {
    await DB.removeRepo(repo.id)
    await loadRepos()
  }

  const handleSetToken = async () => {
    const token = await Dialog.prompt({
      title: 'GitHub Token',
      message: '配置 Personal Access Token 可避免 API 请求限制',
      placeholder: 'ghp_xxxxxxxxxxxx',
      defaultValue: getToken()
    })
    if (token === null || token === undefined) return
    setToken(token)
  }

  return (
    <NavigationStack>
      <List
        navigationTitle="Scripts Repos"
        toolbar={{
          topBarTrailing: [
            <Button action={handleSetToken}>
              <Image systemName="gearshape" />
            </Button>
          ],
          bottomBar: [
            <Spacer />,
            adding ? (
              <ProgressView />
            ) : (
              <Button action={handleAdd}>
                <Image systemName="plus" />
              </Button>
            )
          ]
        }}
      >
        {repos.length === 0 && !adding ? (
          <HStack frame={{ maxWidth: 'infinity' }}>
            <Spacer />
            <VStack spacing={8}>
              <Text font="title3" foregroundStyle="secondaryLabel">
                暂无订阅
              </Text>
              <Text font="footnote" foregroundStyle="tertiaryLabel">
                点击下方 + 添加 GitHub 仓库
              </Text>
            </VStack>
            <Spacer />
          </HStack>
        ) : (
          repos.map((item) => (
            <NavigationLink
              key={String(item.id)}
              destination={<RepoDetailView repoData={item} />}
            >
              <HStack
                contextMenu={{
                  menuItems: (
                    <Group>
                      <Button
                        systemImage="trash"
                        title="删除"
                        role="destructive"
                        action={() => handleRemove(item)}
                      />
                    </Group>
                  )
                }}
                trailingSwipeActions={{
                  actions: [
                    <Button
                      title="删除"
                      role="destructive"
                      action={() => handleRemove(item)}
                    />
                  ]
                }}
              >
                <Image
                  systemName="chevron.left.forwardslash.chevron.right"
                  foregroundStyle="systemIndigo"
                  font={18}
                />
                <Text font="body">
                  {item.owner}/{item.repo}
                </Text>
              </HStack>
            </NavigationLink>
          ))
        )}
      </List>
    </NavigationStack>
  )
}

Navigation.present({ element: <App /> })
  .catch((err) => console.error(err))
  .finally(() => Script.exit())
