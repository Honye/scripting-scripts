import { Button, List, Picker, Section, Text, Toggle } from 'scripting'
import { perform } from '../components'
import { clearSearches, removeHistory, setPreferences, useLibrary } from '../store'

export function SettingsView() {
  const state = useLibrary()
  return (
    <List navigationTitle="设置" listStyle="insetGroup">
      <Section header={<Text>内置播放</Text>}>
        <Picker title="默认倍速" value={state.preferences.rate} onChanged={(rate: number) => perform(() => setPreferences({ ...state.preferences, rate }))}>
          {[0.75, 1, 1.25, 1.5, 2].map(rate => <Text key={rate} tag={rate}>{rate}×</Text>)}
        </Picker>
        <Toggle title="自动播放下一集" value={state.preferences.autoNext} onChanged={autoNext => perform(() => setPreferences({ ...state.preferences, autoNext }))} />
      </Section>
      <Section header={<Text>本地记录</Text>} footer={<Text>记录保存在当前脚本的私有存储中。</Text>}>
        <Button title="清空搜索记录" role="destructive" disabled={!state.recentSearches.length} action={() => perform(async () => {
          if (await Dialog.confirm('清空最近搜索记录？')) clearSearches()
        })} />
        <Button title="清空观看历史" role="destructive" disabled={!state.history.length} action={() => perform(async () => {
          if (await Dialog.confirm('清空全部观看历史？追剧单会保留。')) removeHistory()
        })} />
      </Section>
      <Section header={<Text>关于红果鉴</Text>}>
        <Text>版本 1.1.0 · Scripting</Text>
        <Text>参考 guoapp 的红果站源，目录、搜索与详情在设备端请求。</Text>
        <Text>采用 App 取流、网页媒体数据和备用 API 依次回退；播放失败先切换备用线路，再重新取流，最多自动恢复三次。</Text>
        <Text>视频使用原生播放器；加密分集先在设备上缓冲并准备。所有播放进度保存在本地。</Text>
        <Text>首版接入红果真人剧、漫剧和 AI 剧。其他站源、离线下载与跨设备同步尚未接入。</Text>
      </Section>
    </List>
  )
}
