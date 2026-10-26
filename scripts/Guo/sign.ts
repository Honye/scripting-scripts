export function queryString(values: Record<string, string>): string {
  const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, '+')
  return Object.keys(values).sort().map(key => `${encode(key)}=${encode(values[key])}`).join('&')
}

export function signedHeaders(query: string, body: string, md5: (value: string) => string, now: number): Record<string, string> {
  const timestamp = Math.floor(now / 1000)
  const payload = Array<number>(20).fill(0)
  function copyHash(value: string, offset: number) {
    const hash = md5(value)
    for (let index = 0; index < 4; index++) payload[offset + index] = parseInt(hash.slice(index * 2, index * 2 + 2), 16)
  }
  copyHash(query, 0)
  if (body) copyHash(body, 4)
  payload.splice(12, 4, 0, 6, 11, 28)
  for (let index = 0; index < 4; index++) payload[16 + index] = (timestamp >>> (24 - index * 8)) & 255
  const key = [0x44, 0xb9, 0xb9, 0xd9, 0xa4, 0xae, 0xf9, 0xfc, 0xa4, 0x93, 0xaa, 0x75, 0x7c, 0xa3, 0xc2, 0xc4, 0xa4, 0x96, 0x93, 0x8f]
  for (let index = 0; index < 20; index++) payload[index] ^= key[index]
  for (let index = 0; index < 20; index++) {
    const byte = payload[index]
    const mixed = (((byte << 4) | (byte >>> 4)) & 255) ^ payload[(index + 1) % 20]
    let reversed = 0
    for (let bit = 0; bit < 8; bit++) reversed |= ((mixed >>> bit) & 1) << (7 - bit)
    payload[index] = reversed ^ 255 ^ 20
  }
  const headers: Record<string, string> = {
    'X-Khronos': String(timestamp),
    'X-Gorgon': [0x84, 0x04, 0x40, 0x1c, 0, 0, ...payload].map(value => value.toString(16).padStart(2, '0')).join(''),
    'X-SS-Req-Ticket': String(now)
  }
  if (body) headers['X-SS-STUB'] = md5(body).toUpperCase()
  return headers
}
