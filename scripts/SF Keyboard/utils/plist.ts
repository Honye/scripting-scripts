/**
 * 极简 plist 解析器，支持 Apple 的两种格式：
 *  - XML plist（`<?xml ... <plist>`）
 *  - 二进制 plist（`bplist00`）
 *
 * SF Symbols.app 里的 `symbol_categories.plist` / `name_availability.plist`
 * 通常是二进制格式，因此两种都要支持。
 */

import { pick } from '../constants/i18n'

export type PlistValue =
  | string
  | number
  | boolean
  | Date
  | Uint8Array
  | PlistValue[]
  | { [key: string]: PlistValue }

// ---------------------------------------------------------------- 入口

export function parsePlist(bytes: Uint8Array): PlistValue {
  if (isBinaryPlist(bytes)) return parseBinaryPlist(bytes)
  return parseXmlPlist(decodeUtf8(bytes))
}

export function isBinaryPlist(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false
  // "bplist00"
  const magic = [0x62, 0x70, 0x6c, 0x69, 0x73, 0x74]
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false
  }
  return true
}

// ---------------------------------------------------------------- 二进制

function parseBinaryPlist(bytes: Uint8Array): PlistValue {
  if (bytes.length < 40) throw new Error(pick('二进制 plist 太短', 'Binary plist is too short'))

  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  )
  const trailerStart = bytes.length - 32
  const offsetSize = bytes[trailerStart + 6]
  const objectRefSize = bytes[trailerStart + 7]
  const numObjects = readUInt(view, trailerStart + 8, 8)
  const topObject = readUInt(view, trailerStart + 16, 8)
  const offsetTableOffset = readUInt(view, trailerStart + 24, 8)

  const offsets: number[] = new Array(numObjects)
  for (let i = 0; i < numObjects; i++) {
    offsets[i] = readUInt(view, offsetTableOffset + i * offsetSize, offsetSize)
  }

  const cache: (PlistValue | undefined)[] = new Array(numObjects)

  function readObject(index: number): PlistValue {
    const cached = cache[index]
    if (cached !== undefined) return cached
    const start = offsets[index]
    if (start == null) throw new Error(pick(`对象 ${index} 越界`, `Object ${index} is out of bounds`))

    const marker = bytes[start]
    const type = marker >> 4
    const info = marker & 0x0f
    let value: PlistValue

    switch (type) {
      case 0x0: {
        if (info === 0x08) value = false
        else if (info === 0x09) value = true
        else value = ''
        break
      }
      case 0x1: {
        // 整数：2^info 字节
        const len = 1 << info
        value = readUInt(view, start + 1, len)
        break
      }
      case 0x2: {
        const len = 1 << info
        value = len === 4 ? view.getFloat32(start + 1) : view.getFloat64(start + 1)
        break
      }
      case 0x3: {
        // 日期：2001-01-01 起的秒数
        const seconds = view.getFloat64(start + 1)
        value = new Date(Date.UTC(2001, 0, 1) + seconds * 1000)
        break
      }
      case 0x4: {
        const [len, dataStart] = readLength(view, bytes, start, info)
        value = bytes.slice(dataStart, dataStart + len)
        break
      }
      case 0x5: {
        // ASCII
        const [len, dataStart] = readLength(view, bytes, start, info)
        let s = ''
        for (let i = 0; i < len; i++) s += String.fromCharCode(bytes[dataStart + i])
        value = s
        break
      }
      case 0x6: {
        // UTF-16 BE
        const [len, dataStart] = readLength(view, bytes, start, info)
        let s = ''
        for (let i = 0; i < len; i++) {
          s += String.fromCharCode(view.getUint16(dataStart + i * 2))
        }
        value = s
        break
      }
      case 0x8: {
        // UID
        value = readUInt(view, start + 1, info + 1)
        break
      }
      case 0xa:
      case 0xc: {
        const [len, dataStart] = readLength(view, bytes, start, info)
        const arr: PlistValue[] = []
        for (let i = 0; i < len; i++) {
          arr.push(readObject(readUInt(view, dataStart + i * objectRefSize, objectRefSize)))
        }
        value = arr
        break
      }
      case 0xd: {
        const [len, dataStart] = readLength(view, bytes, start, info)
        const obj: { [key: string]: PlistValue } = {}
        for (let i = 0; i < len; i++) {
          const keyRef = readUInt(view, dataStart + i * objectRefSize, objectRefSize)
          const valRef = readUInt(
            view,
            dataStart + len * objectRefSize + i * objectRefSize,
            objectRefSize
          )
          const key = readObject(keyRef)
          obj[String(key)] = readObject(valRef)
        }
        value = obj
        break
      }
      default:
        throw new Error(
          pick(
            `不支持的 plist 对象类型 0x${type.toString(16)}`,
            `Unsupported plist object type 0x${type.toString(16)}`
          )
        )
    }

    cache[index] = value
    return value
  }

  return readObject(topObject)
}

/** 读取 4/8/A/C/D 类型的长度，返回 [长度, 数据起始位置] */
function readLength(
  view: DataView,
  bytes: Uint8Array,
  start: number,
  info: number
): [number, number] {
  if (info !== 0x0f) return [info, start + 1]
  const intMarker = bytes[start + 1]
  const intLen = 1 << (intMarker & 0x0f)
  const len = readUInt(view, start + 2, intLen)
  return [len, start + 2 + intLen]
}

function readUInt(view: DataView, offset: number, size: number): number {
  switch (size) {
    case 1:
      return view.getUint8(offset)
    case 2:
      return view.getUint16(offset)
    case 4:
      return view.getUint32(offset)
    case 8: {
      const hi = view.getUint32(offset)
      const lo = view.getUint32(offset + 4)
      return hi * 0x100000000 + lo
    }
    default: {
      let n = 0
      for (let i = 0; i < size; i++) n = n * 256 + view.getUint8(offset + i)
      return n
    }
  }
}

// ---------------------------------------------------------------- XML

type Token = { tag: string; closing: boolean; selfClosing: boolean; index: number }

/**
 * 用极简的标签扫描来解析 XML plist。
 * 只处理 plist 允许的元素，不做通用 XML 校验。
 */
export function parseXmlPlist(text: string): PlistValue {
  const body = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '')
  const plistStart = body.indexOf('<plist')
  const scope = plistStart >= 0 ? body.slice(body.indexOf('>', plistStart) + 1) : body

  let pos = 0

  function skipSpace() {
    while (pos < scope.length && /\s/.test(scope[pos])) pos++
  }

  function nextToken(): Token | null {
    skipSpace()
    const lt = scope.indexOf('<', pos)
    if (lt < 0) return null
    const gt = scope.indexOf('>', lt)
    if (gt < 0) return null
    const raw = scope.slice(lt + 1, gt).trim()
    pos = gt + 1
    const closing = raw.startsWith('/')
    const selfClosing = raw.endsWith('/')
    const tag = raw.replace(/^\//, '').replace(/\/$/, '').split(/\s/)[0]
    return { tag, closing, selfClosing, index: lt }
  }

  function readTextUntilClose(tag: string): string {
    const close = `</${tag}>`
    const end = scope.indexOf(close, pos)
    const raw = end < 0 ? scope.slice(pos) : scope.slice(pos, end)
    pos = end < 0 ? scope.length : end + close.length
    return decodeEntities(raw)
  }

  function parseValue(token: Token): PlistValue {
    switch (token.tag) {
      case 'true':
        return true
      case 'false':
        return false
      case 'string':
        return token.selfClosing ? '' : readTextUntilClose('string')
      case 'key':
        return token.selfClosing ? '' : readTextUntilClose('key')
      case 'integer':
        return token.selfClosing ? 0 : parseInt(readTextUntilClose('integer'), 10)
      case 'real':
        return token.selfClosing ? 0 : parseFloat(readTextUntilClose('real'))
      case 'date':
        return token.selfClosing ? new Date(0) : new Date(readTextUntilClose('date'))
      case 'data':
        return token.selfClosing ? '' : readTextUntilClose('data').replace(/\s/g, '')
      case 'array': {
        const arr: PlistValue[] = []
        if (token.selfClosing) return arr
        for (;;) {
          const t = nextToken()
          if (!t || (t.closing && t.tag === 'array')) break
          arr.push(parseValue(t))
        }
        return arr
      }
      case 'dict': {
        const obj: { [key: string]: PlistValue } = {}
        if (token.selfClosing) return obj
        for (;;) {
          const kt = nextToken()
          if (!kt || (kt.closing && kt.tag === 'dict')) break
          if (kt.tag !== 'key') continue
          const key = String(parseValue(kt))
          const vt = nextToken()
          if (!vt) break
          obj[key] = parseValue(vt)
        }
        return obj
      }
      default:
        return ''
    }
  }

  const first = nextToken()
  if (!first) throw new Error(pick('plist 内容为空', 'plist content is empty'))
  return parseValue(first)
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
}

function decodeUtf8(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  while (i < bytes.length) {
    const b = bytes[i]
    if (b < 0x80) {
      out += String.fromCharCode(b)
      i += 1
    } else if (b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
      i += 2
    } else if (b < 0xf0) {
      out += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      )
      i += 3
    } else {
      const cp =
        ((b & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f)
      const off = cp - 0x10000
      out += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff))
      i += 4
    }
  }
  return out
}
