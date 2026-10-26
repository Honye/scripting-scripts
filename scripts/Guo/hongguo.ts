import { AbortController, fetch } from 'scripting'
import { Buffer } from 'buffer'
import type { AbortSignal } from 'scripting'
import type { Category, CatalogCursor, CatalogPage, Drama, DramaDetail, DramaProvider, Episode, MediaSource, SearchResult } from './types'
import { dramas, encrypted, errorMessage, loader, mediaAddresses, mergeDramas, numericID, object, parseAppDetail, parseCatalog, parseJSON, parseWebDetail, routerData, string } from './parse'
import type { Row } from './parse'
import { queryString } from './sign'
import { playerHeaders } from './player_sign'
import { appMedia, backupMedia, mediaPlan } from './playback_routes'
import { playbackResponse } from './playback_crypto'

const website = 'https://hongguoduanju.com'
const appBase = 'https://api5-normal-sinfonlineb.fqnovel.com'
const appAgent = 'com.phoenix.read/73532 (Linux; U; Android 16; zh_CN; 25053RT47C; Build/BP2A.250605.031.A3; Cronet/TTNetVersion:04657795 2026-01-23 QuicVersion:c67e9834 2025-09-08)'
const webAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1'
const categories: Category[] = [
  { id: 'short_play', title: '真人剧', route: 'real-drama', scene: 'default' },
  { id: 'comic_series', title: '漫剧', route: 'comic-drama', scene: 'comic_series' },
  { id: 'ai_series', title: 'AI 剧', route: 'ai-drama', scene: 'ai_series' }
]

function identity(): { deviceId: string; installId: string } {
  const saved = Storage.get<{ deviceId: string; installId: string }>('guo.v1.device')
  if (saved && numericID(saved.deviceId) && numericID(saved.installId)) return saved
  const generate = () => '1' + Array.from({ length: 18 }, () => Math.floor(Math.random() * 10)).join('')
  const value = { deviceId: generate(), installId: generate() }
  if (!Storage.set('guo.v1.device', value)) throw new Error('无法保存设备标识，请检查 Scripting 存储')
  return value
}

type RequestOptions = { method?: string; headers?: Record<string, string>; body?: string }

class ResponseFailure extends Error {
  constructor(message: string, readonly retryable: boolean) { super(message) }
}

async function delay(milliseconds: number, signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('请求已取消')
  await new Promise<void>((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      reject(new Error('请求已取消'))
    }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve() }, milliseconds)
    signal?.addEventListener('abort', cancel)
    if (signal?.aborted) cancel()
  })
}

async function requestOnce(url: string, options: RequestOptions, signal?: AbortSignal): Promise<string> {
  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort()
  if (signal?.aborted) throw new Error('请求已取消')
  signal?.addEventListener('abort', cancel)
  const timeout = setTimeout(() => { timedOut = true; controller.abort() }, 20000)
  try {
    const response = await fetch(url, { ...options, timeout: 20, signal: controller.signal })
    if (!response.ok) throw new ResponseFailure(`红果请求失败（HTTP ${response.status}）`, response.status >= 500 || response.status === 408)
    const text = await response.text()
    if (!text) throw new ResponseFailure('红果接口返回空数据', true)
    if (text.length > 8 * 1024 * 1024) throw new ResponseFailure('红果返回的数据过大', false)
    return text
  } catch (error) {
    if (timedOut) throw new Error('红果请求超时，请检查网络后重试')
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', cancel)
  }
}

async function request(url: string, options: RequestOptions = {}, signal?: AbortSignal): Promise<string> {
  try {
    return await requestOnce(url, options, signal)
  } catch (error) {
    if (signal?.aborted || object(error).retryable === false) throw error
    await delay(2000, signal)
    return requestOnce(url, options, signal)
  }
}

async function appRequest(path: string, payload: Row, signal?: AbortSignal): Promise<Row> {
  for (let attempt = 0; ; attempt++) {
    if (attempt) await delay(attempt * 1000, signal)
    try {
      return await appRequestOnce(path, payload, signal)
    } catch (error) {
      if (signal?.aborted || attempt >= 1 || object(error).retryable === false) throw error
    }
  }
}

async function appRequestOnce(path: string, payload: Row, signal?: AbortSignal): Promise<Row> {
  const device = identity()
  const now = Date.now()
  const query = queryString({
    aid: '8662', app_name: 'novelread', version_code: '73532', version_name: '7.3.5.32',
    manifest_version_code: '73532', update_version_code: '73532', channel: 'update_64',
    device_platform: 'android', os: 'android', ssmix: 'a', device_type: '25053RT47C',
    device_brand: 'Redmi', language: 'zh', os_api: '36', os_version: '16',
    resolution: '1280*2772', dpi: '520', ac: 'wifi', device_id: device.deviceId,
    iid: device.installId, _rticket: String(now)
  })
  const body = JSON.stringify(payload)
  const text = await requestOnce(`${appBase}${path}?${query}`, {
    method: 'POST', body,
    headers: {
      'User-Agent': appAgent, Accept: 'application/json', 'X-XS-From-Web': '0',
      'Sdk-Version': '2', 'Content-Type': 'application/json; charset=utf-8',
      ...playerHeaders(query, body, device.deviceId, now)
    }
  }, signal)
  let result: Row
  try { result = object(parseJSON(text)) } catch { throw new ResponseFailure('红果 App 接口返回格式异常', false) }
  const code = string(result, 'code', 'Code', 'status_code') || string(object(result.BaseResp), 'StatusCode')
  if (code && code !== '0') throw new ResponseFailure(`红果接口暂不可用（${code.slice(0, 20)}）`, false)
  return result
}

function webRequest(path: string, signal?: AbortSignal): Promise<string> {
  return request(website + path, {
    headers: { 'User-Agent': webAgent, Referer: website + '/', 'Accept-Language': 'zh-CN,zh;q=0.9' }
  }, signal)
}

async function webCatalog(category: Category, page: number, signal?: AbortSignal): Promise<CatalogPage> {
  const data = loader(routerData(await webRequest(`/category/${category.route}?page=${page}`, signal)), 'category_page', 'category_$')
  if (data.isSuccess === false || !Array.isArray(data.recommendList)) throw new Error('红果网页分类暂不可用')
  const items = dramas(data.recommendList, category.title)
  if (data.recommendList.length && !items.length) throw new Error('红果网页分类格式已变化')
  const totalPages = Number(string(object(data.pagination), 'totalPages'))
  const hasMore = items.length > 0 && (totalPages > 0 ? page < totalPages : items.length >= 24)
  return {
    items,
    next: hasMore ? { transport: 'web', page: page + 1, offset: 0, session: '', signature: items.map(item => item.id).sort().join(',') } : null
  }
}

async function catalog(category: Category, cursor: CatalogCursor | null, signal?: AbortSignal): Promise<CatalogPage> {
  if (!categories.some(item => item.id === category.id)) throw new Error('未知红果分类')
  if (cursor?.transport === 'web') {
    const page = await webCatalog(category, cursor.page, signal)
    if (page.next && page.next.signature === cursor.signature) throw new Error('网页分页没有前进，请刷新后重试')
    return page
  }
  try {
    const result = await appRequest('/reading/distribution/category/landpage/v/', {
      req_scene: category.scene, offset: cursor?.offset || 0, limit: 18,
      req_type: 'only_content', need_selector_panel: false, client_req_type: cursor ? 2 : 3,
      session_id: cursor?.session || '', filter_ids: '',
      select_items: {
        genre: [category.id], sort: ['online_time'], gender: [], category_dim_theme: [],
        category_dim_role: [], category_dim_epoch: [], online_time: [], creation_status: []
      }
    }, signal)
    return parseCatalog(result, cursor, category.title)
  } catch (error) {
    if (signal?.aborted || cursor) throw error
    try {
      const fallback = await webCatalog(category, 1, signal)
      return { ...fallback, warning: 'App 目录暂不可用，当前显示网页目录' }
    } catch (webError) {
      if (signal?.aborted) throw webError
      throw new Error(`红果目录加载失败。App：${errorMessage(error)}；网页：${errorMessage(webError)}`)
    }
  }
}

function keyword(value: string): string {
  const query = value.normalize('NFKC').trim()
  if (!query || Array.from(query).length > 80 || /[\x00-\x1f\x7f]/.test(query)) throw new Error('请输入 1–80 个字符的搜索词')
  return query
}

async function suggestionRows(query: string, count: number, signal?: AbortSignal): Promise<unknown[]> {
  const result = object(parseJSON(await webRequest(`/incent_resource/suggestion?${queryString({ app_id: '8662', query, count: String(count) })}`, signal)))
  const rows = result.suggest_list ?? object(result.data).suggest_list
  if (!Array.isArray(rows)) throw new Error('红果搜索联想暂不可用')
  return rows
}

async function search(value: string, signal?: AbortSignal): Promise<SearchResult> {
  const query = keyword(value)
  const results = await Promise.allSettled([
    suggestionRows(query, 50, signal).then(rows => dramas(rows.filter(row => string(object(row), 'word_type') === 'short_play_name'))),
    webRequest('/search/' + encodeURIComponent(query), signal).then(html => {
      const page = loader(routerData(html), 'search_(keyword)/page', 'search_')
      if (page.isSuccess !== true || string(page, 'query') !== query || !Array.isArray(page.searchList)) throw new Error('红果综合搜索暂不可用')
      const items = dramas(page.searchList)
      if (page.searchList.length && !items.length) throw new Error('红果搜索数据格式已变化')
      return { items, limited: Number(string(page, 'totalCount')) > items.length }
    })
  ])
  if (signal?.aborted) throw new Error('请求已取消')
  const [names, page] = results
  if (names.status === 'rejected' && page.status === 'rejected') throw new Error('红果搜索暂不可用，请检查网络后重试')
  const items = mergeDramas(page.status === 'fulfilled' ? page.value.items : [], names.status === 'fulfilled' ? names.value : [])
  const rank = (title: string) => title === query ? 0 : title.startsWith(query) ? 1 : title.includes(query) ? 2 : 3
  items.sort((left, right) => rank(left.title) - rank(right.title))
  const partial = names.status === 'rejected' || page.status === 'rejected' || page.value.limited
  return { items, warning: partial ? '当前为部分搜索结果；可换用更完整的剧名搜索' : undefined }
}

const detailCache = new Map<string, { value: DramaDetail; expires: number }>()

async function detail(drama: Drama, signal?: AbortSignal): Promise<DramaDetail> {
  if (!numericID(drama.sourceId)) throw new Error('无效剧集 ID')
  const cached = detailCache.get(drama.id)
  if (cached && cached.expires > Date.now()) return cached.value
  let value: DramaDetail
  try {
    value = parseAppDetail(await appRequest('/novel/player/video_detail/v1/', { series_id: drama.sourceId }, signal), drama)
  } catch (error) {
    if (signal?.aborted) throw error
    value = parseWebDetail(await webRequest(`/detail?series_id=${drama.sourceId}`, signal), drama)
  }
  if (detailCache.size >= 32) detailCache.delete(detailCache.keys().next().value!)
  detailCache.set(drama.id, { value, expires: Date.now() + 5 * 60 * 1000 })
  return value
}

function decode(value: string): string {
  return Data.fromBase64String(value)?.toRawString() || ''
}

async function resolve(drama: Drama, episode: Episode, signal?: AbortSignal): Promise<MediaSource> {
  if (!numericID(drama.sourceId) || !numericID(episode.id)) throw new Error('无效分集 ID')
  const failures: string[] = []
  try {
    const result = await appRequest('/novel/player/video_model/v1/', {
      video_id: episode.id, content_type: 1,
      biz_param: { need_all_video_definition: true, video_platform: 3 }
    }, signal)
    return appMedia(result, episode.id, decode, webAgent)
  } catch (error) {
    if (signal?.aborted) throw error
    failures.push(`App：${errorMessage(error)}`)
  }
  try {
    const page = loader(routerData(await webRequest(`/player/${drama.sourceId}/${episode.id}`, signal)), 'player_', 'player_page')
    if (string(page, 'series_id') === drama.sourceId && string(page, 'vid') === episode.id) {
      const info = object(page.video_player_info)
      if (!encrypted(info)) {
        const addresses = mediaAddresses(info, decode)
        if (addresses.length) return mediaPlan(addresses.map(url => ({ url, headers: { Referer: website + '/', 'User-Agent': webAgent }, origin: 'web' })))
      }
    }
    throw new Error('官网未返回该集可直放的媒体')
  } catch (error) {
    if (signal?.aborted) throw error
    failures.push(`网页取流：${errorMessage(error)}`)
  }
  try {
    const reference = Buffer.from(JSON.stringify({
      content_type: 1004, from_video_id: '', series_id: drama.sourceId, vid: episode.id, video_platform: 3
    })).toString('base64')
    const body = await request(`https://djapi.999888456.xyz/api/hongguo/play?${queryString({ id: reference })}`, {
      headers: { 'User-Agent': webAgent, Referer: website + '/' }
    }, signal)
    return backupMedia(playbackResponse(body), webAgent)
  } catch (error) {
    if (signal?.aborted) throw error
    failures.push(`备用接口：${errorMessage(error)}`)
  }
  throw new Error(`该集取流失败，已尝试全部入口。${failures.join('；')}`)
}

export const hongguo: DramaProvider = {
  id: 'hongguo', name: '红果', categories, catalog, search, detail, resolve,
  async suggestions(value, signal) {
    const rows = await suggestionRows(keyword(value), 10, signal)
    return Array.from(new Set(rows.map(value => string(object(value), 'name')).filter(Boolean))).slice(0, 10)
  },
  pageURL(drama, episode) {
    if (!numericID(drama.sourceId) || (episode && !numericID(episode.id))) throw new Error('无效剧集链接')
    return episode ? `${website}/player/${drama.sourceId}/${episode.id}` : `${website}/detail?series_id=${drama.sourceId}`
  }
}

export const providers: DramaProvider[] = [hongguo]

export function providerFor(drama: Drama): DramaProvider {
  const provider = providers.find(item => item.id === drama.source)
  if (!provider) throw new Error('该站源暂未接入')
  return provider
}
