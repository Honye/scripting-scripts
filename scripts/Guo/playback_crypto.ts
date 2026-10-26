import { Buffer } from 'buffer'
import { createDecipheriv } from 'crypto'
import { object, parseJSON } from './parse'
import type { Row } from './parse'

export function base64Bytes(value: string): Uint8Array {
  const text = value.trim()
  if (!text || !/^[A-Za-z0-9+/]+={0,2}$/.test(text) || text.length % 4 === 1) throw new Error('红果 Base64 数据无效')
  const bytes = Buffer.from(text, 'base64')
  if (bytes.toString('base64').replace(/=+$/, '') !== text.replace(/=+$/, '')) throw new Error('红果 Base64 数据无效')
  return Uint8Array.from(bytes)
}

export function contentKey(value: string): string {
  if (value.length > 1024) throw new Error('红果媒体密钥数据过长')
  const raw = base64Bytes(value)
  if (raw.length < 3) throw new Error('红果媒体密钥编码无效')
  const tagLength = (raw[0] ^ raw[1] ^ raw[2]) - 48
  const contentLength = raw.length - tagLength - 1
  if (tagLength < 1 || contentLength < 33 || contentLength >= raw.length) throw new Error('红果媒体密钥结构无效')
  const seed = raw[raw.length - tagLength - 2] ^ raw[raw.length - tagLength - 1]
  const tag = Array.from(raw.slice(raw.length - tagLength), byte => String.fromCharCode(byte ^ seed)).join('')
  if (tag === 'app_v2' || tag === 'web_v2') throw new Error('红果媒体密钥版本暂不支持')
  let previousEven = 250
  let previousOdd = 85
  let decoded = ''
  for (let index = 0; index < contentLength; index++) {
    const current = raw[index + 1]
    const previous = index % 2 === 0 ? previousEven : previousOdd
    if (index % 2 === 0) previousEven = current
    else previousOdd = current
    let bits = 0
    for (let number = index; number; number >>>= 1) bits += number & 1
    decoded += String.fromCharCode(((previous ^ current) - 21 - bits) & 255)
  }
  const padding = /^[0-9a-z]$/i.test(decoded[0]) ? parseInt(decoded[0], 36) : -1
  if (padding < 0 || contentLength - padding - 1 !== 32 || !/^[0-9a-f]{32}$/i.test(decoded.slice(1, 33))) throw new Error('红果媒体密钥内容无效')
  return decoded.slice(1, 33).toLowerCase()
}

export function playbackResponse(body: string): Row {
  const text = body.trim()
  if (!text.startsWith('v2.')) return object(parseJSON(text))
  const parts = text.split('.')
  if (parts.length !== 3 || parts[1].length <= 4 || parts[1].length > 1028 || !/^[0-9a-f]+$/i.test(parts[1].slice(4)) || parts[1].length % 2) throw new Error('红果备用接口响应密钥无效')
  const encoded = Buffer.from(parts[1].slice(4), 'hex')
  if (encoded.length < 32) throw new Error('红果备用接口响应密钥无效')
  const mask = [104, 64, 70, 166, 190, 168, 143, 130, 225, 254, 251, 217, 196, 34, 45, 60, 29, 20, 103, 105]
  const material = Buffer.alloc(encoded.length)
  for (let index = 0; index < encoded.length; index++) {
    const previous = index ? encoded[index - 1] : 109
    const slot = index % mask.length
    const salt = mask[slot] ^ ((90 + 13 * slot) & 255) ^ 85
    const shifted = (encoded[index] + 215 - 11 * index) & 255
    material[index] = previous ^ salt ^ (((shifted << 3) | (shifted >>> 5)) & 255)
  }
  const ciphertext = base64Bytes(parts[2])
  if (!ciphertext.length || ciphertext.length % 16) throw new Error('红果备用接口加密响应无效')
  const decoder = createDecipheriv('aes-128-cbc', Uint8Array.from(material.subarray(0, 16)), Uint8Array.from(material.subarray(16, 32)))
  decoder.setAutoPadding(false)
  const plain = Buffer.concat([decoder.update(ciphertext), decoder.final()])
  const padding = plain[plain.length - 1]
  if (padding < 1 || padding > 16 || plain.subarray(plain.length - padding).some(value => value !== padding)) throw new Error('红果备用接口响应解密失败')
  return object(parseJSON(plain.subarray(0, plain.length - padding).toString('utf8')))
}
