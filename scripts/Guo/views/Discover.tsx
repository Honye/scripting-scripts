import { AbortController, Button, HStack, Picker, ScrollView, Spacer, Text, VStack, useEffect, useRef, useState } from 'scripting'
import type { CatalogCursor, Drama } from '../types'
import { hongguo } from '../hongguo'
import { DramaGrid, Loading, Notice } from '../components'
import { errorMessage, mergeDramas } from '../parse'
import { theme } from '../theme'

export function DiscoverView() {
  const [categoryId, setCategoryId] = useState(hongguo.categories[0].id)
  const [items, setItems] = useState<Drama[]>([])
  const [cursor, setCursor] = useState<CatalogCursor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [revision, setRevision] = useState(0)
  const controller = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const previousCategory = useRef(categoryId)
  const failedCursor = useRef<CatalogCursor | null>(null)
  const category = hongguo.categories.find(item => item.id === categoryId)!

  async function load(next: CatalogCursor | null) {
    if (busy.current) return
    busy.current = true
    const request = new AbortController()
    controller.current = request
    setLoading(true)
    setError('')
    try {
      const page = await hongguo.catalog(category, next, request.signal)
      if (request.signal.aborted) return
      setItems(old => next ? mergeDramas(old, page.items) : page.items)
      setCursor(page.next)
      setWarning(page.warning || (next?.transport === 'web' ? '当前显示网页目录' : ''))
    } catch (error) {
      if (!request.signal.aborted) {
        failedCursor.current = next
        setError(errorMessage(error))
      }
    } finally {
      if (!request.signal.aborted) { busy.current = false; setLoading(false) }
    }
  }

  useEffect(() => {
    controller.current?.abort()
    busy.current = false
    if (previousCategory.current !== categoryId) {
      setItems([])
      setCursor(null)
      setWarning('')
    }
    previousCategory.current = categoryId
    void load(null)
    return () => { controller.current?.abort() }
  }, [categoryId, revision])

  return (
    <ScrollView navigationTitle="红果鉴" background={theme.background}>
      <VStack alignment="leading" spacing={16} padding={{ top: 12, bottom: 24 }}>
        <VStack padding={{ leading: 16, trailing: 16 }}>
        <VStack alignment="leading" spacing={8} padding={20} background={theme.soft}
          clipShape={{ type: 'rect', cornerRadius: 22 }} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <Text font="caption" fontWeight="bold" foregroundStyle={theme.accent}>红果 · 随身剧场</Text>
          <Text font="title2" fontWeight="bold" foregroundStyle={theme.text}>好故事，接着看。</Text>
          <Text font="subheadline" foregroundStyle={theme.secondary}>发现新剧，把喜欢的故事放进追剧单。</Text>
        </VStack>
        </VStack>
        <Picker title="分类" value={categoryId} onChanged={setCategoryId} pickerStyle="segmented" padding={{ leading: 16, trailing: 16 }}>
          {hongguo.categories.map(item => <Text key={item.id} tag={item.id}>{item.title}</Text>)}
        </Picker>
        <HStack padding={{ leading: 20, trailing: 20 }}>
          <Text font="headline">{category.title}</Text>
          <Text font="caption" foregroundStyle={theme.secondary}>{items.length ? `已加载 ${items.length} 部` : '按上线时间'}</Text>
          <Spacer />
          <Button systemImage="arrow.clockwise" title="刷新" labelStyle="iconOnly" action={() => setRevision(value => value + 1)} />
        </HStack>
        {warning ? <Notice message={warning} /> : null}
        <DramaGrid items={items} />
        {loading ? <Loading /> : null}
        {error ? <Notice message={error} retry={() => { void load(failedCursor.current) }} /> : null}
        {!loading && !error && cursor ? <Button title="加载更多" action={() => { void load(cursor) }} buttonStyle="bordered" frame={{ maxWidth: 'infinity' }} /> : null}
        {!loading && !error && !cursor ? <Notice message={items.length ? '已经到底了' : '该分类暂无剧集'} /> : null}
      </VStack>
    </ScrollView>
  )
}
