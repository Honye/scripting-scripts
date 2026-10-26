import { AbortController, Button, HStack, List, NavigationLink, Section, Text, TextField, useEffect, useRef, useState } from 'scripting'
import type { SearchResult } from '../types'
import { hongguo } from '../hongguo'
import { DramaRow, Loading, Notice } from '../components'
import { errorMessage } from '../parse'
import { rememberSearch, useLibrary } from '../store'
import { DetailView } from './Detail'
import { theme } from '../theme'

export function SearchView() {
  const state = useLibrary()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    const request = new AbortController()
    setSuggestions([])
    if (!query.trim() || query.trim() === submitted) return
    const timer = setTimeout(() => {
      hongguo.suggestions(query, request.signal).then(items => {
        if (!request.signal.aborted) setSuggestions(items)
      }).catch(() => {})
    }, 300)
    return () => { clearTimeout(timer); request.abort() }
  }, [query, submitted])

  useEffect(() => () => { controller.current?.abort() }, [])

  function edit(value: string) {
    controller.current?.abort()
    setQuery(value)
    setSubmitted('')
    setResult(null)
    setError('')
    setLoading(false)
  }

  async function search(value: string) {
    const term = value.normalize('NFKC').trim()
    if (!term) return
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setQuery(term)
    setSubmitted(term)
    setSuggestions([])
    setResult(null)
    setError('')
    setLoading(true)
    try {
      const data = await hongguo.search(term, request.signal)
      if (request.signal.aborted) return
      rememberSearch(term)
      setResult(data)
    } catch (error) {
      if (!request.signal.aborted) setError(errorMessage(error))
    } finally {
      if (!request.signal.aborted) setLoading(false)
    }
  }

  return (
    <List navigationTitle="搜索" listStyle="insetGroup">
      <Section>
        <HStack>
          <TextField title="剧名、关键词" value={query} onChanged={edit} onSubmit={() => { void search(query) }}
            submitLabel="search" textInputAutocapitalization="never" autocorrectionDisabled />
          <Button title="搜索" action={() => { void search(query) }} disabled={!query.trim()} />
        </HStack>
      </Section>
      {suggestions.length ? <Section header={<Text>搜索联想</Text>}>
        {suggestions.map(name => <Button key={name} title={name} action={() => { void search(name) }} />)}
      </Section> : null}
      {!query.trim() ? <Section header={<Text>最近搜索</Text>}>
        {state.recentSearches.length ? state.recentSearches.map(name => (
          <Button key={name} title={name} systemImage="clock" action={() => { void search(name) }} />
        )) : <Text foregroundStyle={theme.secondary}>输入剧名，寻找下一部想看的故事。</Text>}
      </Section> : null}
      {loading ? <Section><Loading title="正在搜索红果…" /></Section> : null}
      {error ? <Section><Notice message={error} retry={() => { void search(query) }} /></Section> : null}
      {result ? <Section header={<Text>“{submitted}” · {result.items.length} 部</Text>}>
        {result.warning ? <Text font="caption" foregroundStyle={theme.secondary}>{result.warning}</Text> : null}
        {result.items.map(drama => <NavigationLink key={drama.id} destination={<DetailView initial={drama} />}><DramaRow drama={drama} /></NavigationLink>)}
        {!result.items.length ? <Notice message="没有找到相关剧集，试试其他剧名" /> : null}
      </Section> : null}
    </List>
  )
}
