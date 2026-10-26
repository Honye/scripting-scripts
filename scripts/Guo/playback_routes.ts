import type { MediaSource, MediaVariant } from './types'
import { encrypted, isHTTP, list, mediaAddresses, numericID, object, parseJSON, string } from './parse'
import type { Row } from './parse'
import { contentKey } from './playback_crypto'

export function mediaPlan(variants: MediaVariant[]): MediaSource {
  const seen = new Set<string>()
  const choices = variants.filter(item => {
    const identity = JSON.stringify([item.url, item.headers, item.decryptionKey || ''])
    if (!isHTTP(item.url) || seen.has(identity)) return false
    seen.add(identity)
    return true
  }).sort((left, right) => (right.quality || 0) - (left.quality || 0))
  if (!choices.length) throw new Error('该集没有兼容的播放线路')
  return { ...choices[0], alternatives: choices.slice(1) }
}

export function appMedia(result: Row, episodeId: string, decode: (value: string) => string, agent: string): MediaSource {
  const raw = object(result.data).video_model
  const model = object(typeof raw === 'string' ? parseJSON(raw) : raw)
  const mediaAssetId = string(model, 'vid', 'video_id')
  if (numericID(mediaAssetId) && mediaAssetId !== episodeId) throw new Error('红果返回了其他分集的播放信息')
  const rows = Array.isArray(model.video_list) ? model.video_list : Object.values(object(model.video_list))
  const choices: { variant: MediaVariant; score: number }[] = []
  let keyError: unknown = null
  for (const value of rows) {
    const row = object(value)
    const meta = object(row.video_meta)
    const codec = string(meta, 'codec_type').toLowerCase()
    if (codec === 'bytevc2' || string(row, 'gear_des_key').toLowerCase().includes('bytevc2')) continue
    const addresses = mediaAddresses(row, decode)
    if (!addresses.length) continue
    let key: string | undefined
    if (encrypted(row) || encrypted(model)) {
      try {
        key = contentKey(string(object(row.encrypt_info), 'spade_a') || string(row, 'spade_a') || string(object(model.encrypt_info), 'spade_a'))
      } catch (error) { keyError = error; continue }
    }
    let quality = Number(string(meta, 'vheight')) || 0
    const definition = Number(string(meta, 'definition').match(/\d+/)?.[0])
    const width = Number(string(meta, 'vwidth'))
    if (definition > 0) quality = definition
    else if (width > 0 && (!quality || width < quality)) quality = width
    for (const url of addresses) choices.push({
      variant: { url, headers: { Referer: 'https://novel.snssdk.com/', 'User-Agent': agent }, quality, decryptionKey: key, origin: 'app' },
      score: quality * 10 + (codec === 'h264' || codec === 'avc1' ? 1 : 0)
    })
  }
  if (!choices.length && keyError) throw keyError
  choices.sort((left, right) => right.score - left.score)
  return mediaPlan(choices.map(item => item.variant))
}

export function backupMedia(result: Row, agent: string): MediaSource {
  for (const flag of [result.parse, result.jx]) {
    if (flag !== undefined && flag !== null && flag !== false && flag !== 0 && flag !== '0' && flag !== '') throw new Error('红果备用播放接口没有返回直接媒体地址')
  }
  const choices: MediaVariant[] = []
  let keyError: unknown = null
  for (const value of list(result.key_urls)) {
    const row = object(value)
    const url = string(row, 'src')
    if (url.length > 8192 || !isHTTP(url)) continue
    try {
      if (!/^[0-9a-f]{32}$/i.test(string(row, 'kid'))) throw new Error('红果媒体密钥标识无效')
      choices.push({
        url, headers: { Referer: 'https://novel.snssdk.com/', 'User-Agent': agent }, origin: 'backup',
        quality: Number(string(row, 'name').match(/\d+/)?.[0]) || 0,
        decryptionKey: contentKey(string(row, 'spade_a'))
      })
    } catch (error) { keyError = error }
  }
  if (!choices.length && keyError) throw keyError
  return mediaPlan(choices)
}

export class PlaybackRecovery {
  private attempts = 0
  private refreshed = false

  next(hasAlternative: boolean): 'alternative' | 'refresh' | 'stop' {
    if (this.attempts >= 3) return 'stop'
    if (hasAlternative) { this.attempts++; return 'alternative' }
    if (!this.refreshed) { this.attempts++; this.refreshed = true; return 'refresh' }
    return 'stop'
  }
}
