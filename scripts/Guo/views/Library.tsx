import { Button, HStack, List, Menu, NavigationLink, Picker, Section, Text, TextField, useState } from 'scripting'
import type { WatchStatus } from '../types'
import { DramaRow, Notice, perform } from '../components'
import { removeHistory, setFollow, statusNames, timeLabel, useLibrary } from '../store'
import { DetailView } from './Detail'

export function LibraryView() {
  const state = useLibrary()
  const [mode, setMode] = useState('follows')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const matches = (title: string) => title.toLowerCase().includes(query.trim().toLowerCase())
  const follows = state.follows.filter(item => (filter === 'all' || item.status === filter) && matches(item.drama.title))
  const history = state.history.filter(item => matches(item.drama.title))

  return (
    <List navigationTitle="我的剧场" listStyle="insetGroup">
      <Section>
        <Picker title="记录" value={mode} onChanged={setMode} pickerStyle="segmented">
          <Text tag="follows">追剧</Text><Text tag="history">历史</Text>
        </Picker>
        <TextField title="搜索记录" value={query} onChanged={setQuery} />
        {mode === 'follows' ? <Picker title="状态" value={filter} onChanged={setFilter}>
          <Text tag="all">全部</Text>
          {Object.entries(statusNames).map(([value, title]) => <Text key={value} tag={value}>{title}</Text>)}
        </Picker> : null}
      </Section>
      {mode === 'follows' ? <Section header={<Text>{follows.length} 部追剧</Text>}>
        {follows.map(entry => (
          <HStack key={entry.drama.id} trailingSwipeActions={{ actions: [
            <Button title="移除" role="destructive" action={() => perform(() => setFollow(entry.drama, null))} />
          ] }}>
            <NavigationLink destination={<DetailView initial={entry.drama} />}><DramaRow drama={entry.drama} subtitle={statusNames[entry.status]} /></NavigationLink>
            <Menu title="追剧状态" systemImage="ellipsis.circle" labelStyle="iconOnly">
              {Object.entries(statusNames).map(([value, title]) => <Button key={value} title={title} action={() => perform(() => setFollow(entry.drama, value as WatchStatus))} />)}
            </Menu>
          </HStack>
        ))}
        {!follows.length ? <Notice message={query || filter !== 'all' ? '没有匹配的追剧记录' : '在剧集详情中点「追剧」，把故事留在这里'} /> : null}
      </Section> : <Section header={<Text>最近观看 · {history.length} 部</Text>}>
        {history.map(entry => <NavigationLink key={entry.drama.id}
          destination={<DetailView initial={entry.drama} />}
          trailingSwipeActions={{ actions: [<Button title="删除" role="destructive" action={() => perform(() => removeHistory(entry.drama.id))} />] }}>
          <DramaRow drama={entry.drama} subtitle={`第 ${entry.episodeNumber} 集 · ${timeLabel(entry.position)}${entry.duration ? ' / ' + timeLabel(entry.duration) : ''}`} />
        </NavigationLink>)}
        {!history.length ? <Notice message={query ? '没有匹配的观看记录' : '内置播放器会自动保存分集与实际播放进度'} /> : null}
      </Section>}
    </List>
  )
}
