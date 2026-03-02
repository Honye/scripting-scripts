import {
  Button,
  fetch,
  HStack,
  List,
  Navigation,
  NavigationStack,
  Path,
  Script,
  Section,
  Text,
  SecureField,
  Toggle,
  Widget,
  useEffect,
  useState
} from 'scripting'

const root = Path.join(FileManager.appGroupDocumentsDirectory, Script.name)
const prefPath = Path.join(root, 'preference.json')

interface PackageOption {
  ELEM_TYPE: string
  FEE_POLICY_ID: string
  FEE_POLICY_NAME: string
}

function App() {
  const [authorization, setAuthorization] = useState<string>('')
  const [packages, setPackages] = useState<string[]>([])
  const [flowOptions, setFlowOptions] = useState<PackageOption[]>([])
  const [voiceOptions, setVoiceOptions] = useState<PackageOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load Initial Prefs
  useEffect(() => {
    if (FileManager.existsSync(prefPath)) {
      try {
        const pref = JSON.parse(FileManager.readAsStringSync(prefPath) || '{}')
        if (pref.authorization) setAuthorization(pref.authorization)
        if (pref.packages) setPackages(pref.packages)
      } catch (e) {
        console.error('Failed to parse preference', e)
      }
    }
    setLoaded(true)
  }, [])

  // Persist Prefs
  useEffect(() => {
    if (!loaded) return
    if (!FileManager.existsSync(root)) {
      FileManager.createDirectorySync(root, true)
    }
    FileManager.writeAsStringSync(
      prefPath,
      JSON.stringify({ authorization, packages })
    )
    Widget.reloadAll()
  }, [authorization, packages, loaded])

  // Fetch Packages Options
  useEffect(() => {
    if (!authorization) return
    setLoading(true)

    const hbHeaders = {
      zx: '12',
      Authorization: authorization,
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f2e) NetType/4G Language/en',
      Accept: '*/*'
    }

    fetch('https://wap.10010hb.net/zinfo/front/user/findLeftPackage', {
      method: 'POST',
      headers: hbHeaders
    })
      .then((r) => {
        return r.json()
      })
      .then((res) => {
        if (res.success && res.data && res.data.addupInfoList) {
          const list: PackageOption[] = res.data.addupInfoList
          setVoiceOptions(list.filter((o) => o.ELEM_TYPE === '1'))
          setFlowOptions(list.filter((o) => o.ELEM_TYPE === '3'))
        }
      })
      .catch((e) => {
        console.error('Failed to fetch packages', e)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [authorization])

  const togglePackage = (id: string, isOn: boolean) => {
    if (isOn) {
      setPackages((prev) => (prev.includes(id) ? prev : [...prev, id]))
    } else {
      setPackages((prev) => prev.filter((p) => p !== id))
    }
  }

  return (
    <NavigationStack>
      <List navigationTitle="湖北联通">
        <Section header={<Text>Authentication</Text>}>
          <HStack>
            <Text>Authorization</Text>
            <SecureField
              title="Input token..."
              value={authorization}
              onChanged={setAuthorization}
            />
          </HStack>
        </Section>

        {authorization ? (
          <Section
            header={<Text>流量套餐</Text>}
            footer={loading ? <Text>加载中...</Text> : undefined}
          >
            {flowOptions.map((opt) => (
              <Toggle
                key={opt.FEE_POLICY_ID}
                title={opt.FEE_POLICY_NAME}
                value={packages.includes(opt.FEE_POLICY_ID)}
                onChanged={(v) => togglePackage(opt.FEE_POLICY_ID, v)}
              />
            ))}
            {flowOptions.length === 0 && !loading && (
              <Text foregroundStyle="secondaryLabel">暂无套餐</Text>
            )}
          </Section>
        ) : null}

        {authorization ? (
          <Section header={<Text>语音套餐</Text>}>
            {voiceOptions.map((opt) => (
              <Toggle
                key={opt.FEE_POLICY_ID}
                title={opt.FEE_POLICY_NAME}
                value={packages.includes(opt.FEE_POLICY_ID)}
                onChanged={(v) => togglePackage(opt.FEE_POLICY_ID, v)}
              />
            ))}
            {voiceOptions.length === 0 && !loading && (
              <Text foregroundStyle="secondaryLabel">暂无套餐</Text>
            )}
          </Section>
        ) : null}

        <Section>
          <Button title="预览小组件" action={() => Widget.preview()} />
        </Section>
      </List>
    </NavigationStack>
  )
}

Navigation.present({ element: <App /> })
  .catch((err) => console.error(err))
  .finally(() => Script.exit())
