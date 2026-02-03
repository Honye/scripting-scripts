import {
  List,
  Section,
  Text,
  Picker,
  useState,
  NavigationLink,
  Button,
  HStack,
  TextField,
  Spacer,
  EnvironmentValuesReader,
  ForEach
} from 'scripting'
import { DB } from '../db'
import { HistoryView } from './HistoryView'

const PLAYBACK_RATES = [
  { value: 0.5, label: '0.5x' },
  { value: 1.0, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x' }
]

interface DataSource {
  id: number
  name: string
  url: string
}

// 添加数据源页面 - 直接操作 DB
function AddDataSourceView() {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  const handleSave = (dismiss: () => void) => {
    if (name.trim() && url.trim()) {
      DB.addDataSource(name.trim(), url.trim())
      dismiss()
    }
  }

  return (
    <EnvironmentValuesReader keys={['dismiss']}>
      {({ dismiss }) => (
        <List
          navigationTitle="添加数据源"
          navigationBarTitleDisplayMode="inline"
        >
          <Section
            footer={
              <Text>eg. https://api.ukuapi.com/api.php/provide/vod/</Text>
            }
          >
            <TextField title="名称" value={name} onChanged={setName} />
            <TextField title="API 地址" value={url} onChanged={setUrl} />
          </Section>
          <Section>
            <Button action={() => handleSave(dismiss)}>
              <Text foregroundStyle="systemTeal">保存</Text>
            </Button>
          </Section>
        </List>
      )}
    </EnvironmentValuesReader>
  )
}

export function SettingsView() {
  const [playbackRate, setPlaybackRate] = useState(() => DB.getPlaybackRate())
  const [dataSources, setDataSources] = useState<DataSource[]>(() =>
    DB.getDataSources()
  )
  const [currentSourceUrl, setCurrentSourceUrl] = useState(() =>
    DB.getCurrentDataSourceUrl()
  )

  // 刷新数据源列表
  const refreshDataSources = () => {
    const sources = DB.getDataSources()
    const currentUrl = DB.getCurrentDataSourceUrl()

    setDataSources(sources)

    // 确保当前选中的数据源在列表中存在
    const isCurrentValid = sources.some((s) => s.url === currentUrl)
    if (isCurrentValid) {
      setCurrentSourceUrl(currentUrl)
    } else if (sources.length > 0) {
      // 如果当前 URL 不在列表中，选择第一个
      setCurrentSourceUrl(sources[0].url)
      DB.setCurrentDataSourceUrl(sources[0].url)
    }
  }

  const handlePlaybackRateChange = (label: string) => {
    const rate = PLAYBACK_RATES.find((r) => r.label === label)
    if (rate) {
      setPlaybackRate(rate.value)
      DB.setPlaybackRate(rate.value)
    }
  }

  const handleSelectSource = (source: DataSource) => {
    setCurrentSourceUrl(source.url)
    DB.setCurrentDataSourceUrl(source.url)
  }

  const handleDeleteSource = (index: number) => {
    const source = dataSources[index]
    DB.deleteDataSource(source.id)
    const updatedSources = dataSources.filter((_, i) => i !== index)
    setDataSources(updatedSources)

    // 如果删除的是当前选中的数据源，切换到第一个
    if (source.url === currentSourceUrl && updatedSources.length > 0) {
      setCurrentSourceUrl(updatedSources[0].url)
      DB.setCurrentDataSourceUrl(updatedSources[0].url)
    }
  }

  const getCurrentSourceName = () => {
    const source = dataSources.find((s) => s.url === currentSourceUrl)
    return source?.name || '未知'
  }

  return (
    <List navigationTitle="设置" onAppear={refreshDataSources}>
      <Section
        header={<Text>数据源</Text>}
        footer={<Text>切换数据源后返回首页刷新即可</Text>}
      >
        <Text foregroundStyle="secondaryLabel">
          当前: {getCurrentSourceName()}
        </Text>

        <ForEach
          count={dataSources.length}
          itemBuilder={(index: number) => {
            const source = dataSources[index]
            return (
              <HStack
                key={source.url}
                contentShape="rect"
                onTapGesture={() => handleSelectSource(source)}
              >
                <Text
                  foregroundStyle={
                    currentSourceUrl === source.url ? 'systemTeal' : 'label'
                  }
                >
                  {source.name}
                </Text>
                <Spacer />
                {currentSourceUrl === source.url && (
                  <Text foregroundStyle="systemTeal">✓</Text>
                )}
              </HStack>
            )
          }}
          onDelete={
            dataSources.length > 1
              ? (indices: number[]) => {
                  indices.forEach((index: number) => handleDeleteSource(index))
                }
              : undefined
          }
        />

        <NavigationLink destination={<AddDataSourceView />}>
          <Text foregroundStyle="systemTeal">+ 添加数据源</Text>
        </NavigationLink>
      </Section>

      <Section header={<Text>播放</Text>}>
        <Picker
          title="默认播放速度"
          value={
            PLAYBACK_RATES.find((r) => r.value === playbackRate)?.label || '1x'
          }
          onChanged={handlePlaybackRateChange}
        >
          {PLAYBACK_RATES.map((rate) => (
            <Text key={rate.label} tag={rate.label}>
              {rate.label}
            </Text>
          ))}
        </Picker>
      </Section>

      <Section header={<Text>历史</Text>}>
        <NavigationLink destination={<HistoryView />}>
          <Text>播放记录</Text>
        </NavigationLink>
      </Section>
    </List>
  )
}
