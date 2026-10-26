import { Buffer } from 'buffer'
import { createCipheriv, createHash, randomBytes } from 'crypto'
import { signedHeaders } from './sign'

const mask64 = (1n << 64n) - 1n
const bytes = (value: string) => Uint8Array.from(Buffer.from(value))
const fromHex = (value: string) => Uint8Array.from(Buffer.from(value, 'hex'))
const md5 = (value: string | Uint8Array) => Uint8Array.from(createHash('md5').update(value).digest())
const hex = (value: Uint8Array) => Buffer.from(value).toString('hex')
const base64 = (value: Uint8Array) => Buffer.from(value).toString('base64')

function join(...values: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(values.reduce((size, value) => size + value.length, 0))
  let offset = 0
  for (const value of values) { result.set(value, offset); offset += value.length }
  return result
}

function pad(value: Uint8Array): Uint8Array {
  const padding = 16 - value.length % 16
  return join(value, new Uint8Array(padding).fill(padding))
}

const rotate32 = (value: number, amount: number) => ((value << (amount & 31)) | (value >>> ((32 - amount) & 31))) >>> 0

export function sm3(input: Uint8Array): Uint8Array {
  const size = Math.ceil((input.length + 9) / 64) * 64
  const data = new Uint8Array(size)
  data.set(input)
  data[input.length] = 128
  const view = new DataView(data.buffer)
  view.setBigUint64(size - 8, BigInt(input.length) * 8n)
  const state = new Uint32Array([0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e])
  for (let offset = 0; offset < size; offset += 64) {
    const words = new Uint32Array(68)
    for (let index = 0; index < 16; index++) words[index] = view.getUint32(offset + index * 4)
    for (let index = 16; index < 68; index++) {
      const value = words[index - 16] ^ words[index - 9] ^ rotate32(words[index - 3], 15)
      words[index] = value ^ rotate32(value, 15) ^ rotate32(value, 23) ^ rotate32(words[index - 13], 7) ^ words[index - 6]
    }
    let [a, b, c, d, e, f, g, h] = state
    for (let index = 0; index < 64; index++) {
      const constant = index < 16 ? 0x79cc4519 : 0x7a879d8a
      const ff = index < 16 ? a ^ b ^ c : (a & b) | (a & c) | (b & c)
      const gg = index < 16 ? e ^ f ^ g : (e & f) | (~e & g)
      const ss1 = rotate32((rotate32(a, 12) + e + rotate32(constant, index)) >>> 0, 7)
      const tt1 = (ff + d + (ss1 ^ rotate32(a, 12)) + (words[index] ^ words[index + 4])) >>> 0
      const tt2 = (gg + h + ss1 + words[index]) >>> 0
      ;[a, b, c, d] = [tt1, a, rotate32(b, 9), c]
      ;[e, f, g, h] = [(tt2 ^ rotate32(tt2, 9) ^ rotate32(tt2, 17)) >>> 0, e, rotate32(f, 19), g]
    }
    const next = [a, b, c, d, e, f, g, h]
    for (let index = 0; index < 8; index++) state[index] ^= next[index]
  }
  const output = new Uint8Array(32)
  const result = new DataView(output.buffer)
  for (let index = 0; index < 8; index++) result.setUint32(index * 4, state[index])
  return output
}

function rotate64(value: bigint, amount: number): bigint {
  const shift = BigInt((amount % 64 + 64) % 64)
  return ((value << shift) | (value >> (64n - shift))) & mask64
}

function read64(value: Uint8Array, offset: number): bigint {
  let result = 0n
  for (let index = 7; index >= 0; index--) result = (result << 8n) | BigInt(value[offset + index])
  return result
}

function write64(value: Uint8Array, offset: number, number: bigint) {
  for (let index = 0; index < 8; index++) value[offset + index] = Number((number >> BigInt(index * 8)) & 255n)
}

function varint(value: number | bigint): number[] {
  let number = BigInt(value)
  const output: number[] = []
  while (number >= 128n) { output.push(Number(number & 127n) | 128); number >>= 7n }
  output.push(Number(number))
  return output
}

const field = (id: number, value: number | bigint) => [...varint(id * 8), ...varint(value)]
const blob = (id: number, value: Uint8Array) => [...varint(id * 8 + 2), ...varint(value.length), ...value]

function argus(query: string, body: string, timestamp: number, deviceId: string, nonce: Uint8Array): string {
  const key = fromHex('ac1adaae95a7af94a5114ab3b3a97dd80050aa0a39314c40528caec95256c28c')
  const bodyHash = sm3(body ? md5(body) : new Uint8Array(16))
  const queryHash = sm3(bytes(query))
  const counters = new Uint8Array([...field(1, 1), ...field(2, 1), ...field(3, 1), ...field(7, 3348294860)])
  const environment = new Uint8Array([...blob(1, bytes('25053RT47C')), ...blob(2, bytes('16')), ...blob(3, bytes('update_64')), ...field(4, 2147483648)])
  const random = (nonce[6] | (nonce[7] << 8) | (nonce[8] << 16) | (nonce[9] << 24)) & 0x7fffffff
  const message = new Uint8Array([
    ...field(1, 0x20200929 * 2), ...field(2, 2), ...field(3, random),
    ...blob(4, bytes('8662')), ...blob(5, bytes(deviceId)), ...blob(6, bytes('1611921764')),
    ...blob(7, bytes('7.3.5.32')), ...blob(8, bytes('v04.07.01-ml-android')),
    ...field(9, 135135744), ...blob(10, new Uint8Array(8)), ...field(11, 0),
    ...field(12, BigInt(timestamp) * 2n), ...blob(13, bodyHash.slice(0, 6)), ...blob(14, queryHash.slice(0, 6)),
    ...blob(15, counters), ...blob(16, new Uint8Array()), ...blob(20, bytes('none')),
    ...field(21, 738), ...blob(23, environment), ...field(25, 2)
  ])
  const data = pad(message)
  const derived = sm3(join(key, new Uint8Array([0x3c, 0xcc, 0x56, 0x7b]), key))
  const rounds: bigint[] = []
  for (let index = 0; index < 4; index++) rounds.push(read64(derived, index * 8))
  for (let index = 4; index < 72; index++) {
    let mixed = rotate64(rounds[index - 1], -3) ^ rounds[index - 3]
    mixed ^= rotate64(mixed, -1)
    rounds.push((~rounds[index - 4] ^ mixed ^ ((0x3dc94c3a046d678bn >> BigInt((index - 4) % 62)) & 1n) ^ 3n) & mask64)
  }
  for (let offset = 0; offset < data.length; offset += 16) {
    let left = read64(data, offset)
    let right = read64(data, offset + 8)
    for (const round of rounds) [left, right] = [right, (left ^ (rotate64(right, 1) & rotate64(right, 8)) ^ rotate64(right, 2) ^ round) & mask64]
    write64(data, offset, left)
    write64(data, offset + 8, right)
  }
  const xor = new Uint8Array([0xd0, 0x4f, 0xfd, 0xff, 0xd0, 0x4f, 0xfd, 0xff])
  for (let index = 0; index < data.length; index++) data[index] ^= xor[index % 8]
  const reversed = join(xor, data).reverse()
  const container = pad(join(new Uint8Array([0xa6, 0xe7, 0x83, 0xee, 0x70, 1, 0x10, 9, 0x18]), reversed, new Uint8Array([0x56, 0x7b])))
  const encoder = createCipheriv('aes-128-cbc', md5(key.slice(0, 16)), md5(key.slice(16)))
  encoder.setAutoPadding(false)
  return base64(join(new Uint8Array([0x3c, 0xcc]), Uint8Array.from(encoder.update(container)), Uint8Array.from(encoder.final())))
}

function ladon(aid: string, timestamp: number, prefix: Uint8Array): string {
  const digest = bytes(hex(md5(join(prefix, bytes(aid)))))
  let left = read64(digest, 0)
  let right = read64(digest, 8)
  const queue = [read64(digest, 16), read64(digest, 24)]
  const keys: bigint[] = []
  for (let index = 0; index < 34; index++) {
    keys.push(left)
    const mixed = ((rotate64(right, -8) + left) & mask64) ^ BigInt(index)
    queue.push(mixed)
    left = mixed ^ rotate64(left, 3)
    right = queue.shift()!
  }
  const data = pad(bytes(`${timestamp}-1611921764-${aid}`))
  for (let offset = 0; offset < data.length; offset += 16) {
    left = read64(data, offset)
    right = read64(data, offset + 8)
    for (const key of keys) {
      right = key ^ ((left + rotate64(right, -8)) & mask64)
      left = right ^ rotate64(left, 3)
    }
    write64(data, offset, left)
    write64(data, offset + 8, right)
  }
  return base64(join(prefix, data))
}

export function playerHeaders(query: string, body: string, deviceId: string, now: number, nonce: Uint8Array = Uint8Array.from(randomBytes(11))): Record<string, string> {
  if (nonce.length !== 11) throw new Error('红果请求随机参数无效')
  const timestamp = Math.floor(now / 1000) >>> 0
  return {
    ...signedHeaders(query, body, value => hex(md5(value)), now),
    'X-Argus': argus(query, body, timestamp, deviceId, nonce),
    'X-Ladon': ladon('8662', timestamp, nonce.slice(2, 6))
  }
}
