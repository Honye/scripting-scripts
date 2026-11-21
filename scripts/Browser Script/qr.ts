/**
 * QR encoding + styled SVG rendering for the Scripting settings page previews.
 *
 * browser.tsx draws its panel with an exact copy of this file (minus the
 * `export` keywords) between "BEGIN/END copy of qr.ts" markers, because it
 * can't import: the Scripting build compiles it alone as CommonJS. Any change
 * here must be copied there, so the preview matches the code in Safari.
 *
 * Pure module: touches neither the 'scripting' module nor App/DOM globals.
 */

// ============================================================================
// Vendored QR encoder (byte mode, UTF-8) — qrcode-generator algorithm by
// Kazuhiko Arase (MIT). Versions 1-40, EC levels L/M/Q/H, auto version + mask.
// ============================================================================

export type ECLevel = 'L' | 'M' | 'Q' | 'H'

// QR error-correction level indicators (note: these are NOT L<M<Q<H ordered).
const EC_INDICATOR: Record<ECLevel, number> = { L: 1, M: 0, Q: 3, H: 2 }

// ---------------------------------------------------------------------------
// Galois field GF(256) tables (primitive polynomial 0x11d)
// ---------------------------------------------------------------------------

const EXP_TABLE: number[] = new Array(256)
const LOG_TABLE: number[] = new Array(256)
for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i
for (let i = 8; i < 256; i++) {
  EXP_TABLE[i] =
    EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8]
}
for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i

function glog(n: number): number {
  if (n < 1) throw new Error('glog(' + n + ')')
  return LOG_TABLE[n]
}

function gexp(n: number): number {
  while (n < 0) n += 255
  while (n >= 256) n -= 255
  return EXP_TABLE[n]
}

// ---------------------------------------------------------------------------
// Reed-Solomon block layout: [numBlocks, totalCount, dataCount, ...] per
// version, in EC-level order L, M, Q, H.
// ---------------------------------------------------------------------------

const RS_BLOCK_TABLE: number[][] = [
  [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
  [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
  [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
  [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
  [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
  [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
  [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
  [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
  [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
  [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
  [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
  [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
  [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
  [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
  [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13],
  [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
  [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
  [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
  [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
  [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
  [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
  [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13],
  [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
  [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
  [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
  [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
  [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
  [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
  [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
  [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
  [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
  [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
  [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
  [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
  [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
  [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
  [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
  [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
  [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
  [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]
]

// Alignment-pattern centre coordinates per version (index = version - 1).
const PATTERN_POSITION_TABLE: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42],
  [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62],
  [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78],
  [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170]
]

const G15 = 0b10100110111
const G18 = 0b1111100100101
const G15_MASK = 0b101010000010010

// ---------------------------------------------------------------------------
// Bit buffer
// ---------------------------------------------------------------------------

class BitBuffer {
  buffer: number[] = []
  length = 0

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1)
    }
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8)
    if (this.buffer.length <= bufIndex) this.buffer.push(0)
    if (bit) this.buffer[bufIndex] |= 0x80 >>> this.length % 8
    this.length++
  }
}

// ---------------------------------------------------------------------------
// Polynomial helpers (over GF(256))
// ---------------------------------------------------------------------------

function polyTrimLeadingZeros(num: number[]): number[] {
  let offset = 0
  while (offset < num.length && num[offset] === 0) offset++
  return num.slice(offset)
}

function getErrorCorrectPolynomial(ecLength: number): number[] {
  let a = [1]
  for (let i = 0; i < ecLength; i++) {
    a = polyMultiply(a, [1, gexp(i)])
  }
  return a
}

function polyMultiply(a: number[], b: number[]): number[] {
  const num = new Array<number>(a.length + b.length - 1).fill(0)
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      num[i + j] ^= gexp(glog(a[i]) + glog(b[j]))
    }
  }
  return num
}

// Remainder of (data * x^ecLength) divided by the EC generator polynomial.
function polyMod(dividend: number[], generator: number[]): number[] {
  let num = polyTrimLeadingZeros(dividend)
  while (num.length - generator.length >= 0) {
    const ratio = glog(num[0])
    const next = num.slice()
    for (let i = 0; i < generator.length; i++) {
      next[i] ^= gexp(glog(generator[i]) + ratio)
    }
    num = polyTrimLeadingZeros(next)
  }
  return num
}

// ---------------------------------------------------------------------------
// Data + error-correction codeword generation
// ---------------------------------------------------------------------------

interface RSBlock {
  totalCount: number
  dataCount: number
}

function rsBlockOffset(ecIndicator: number): number {
  switch (ecIndicator) {
    case 1: return 0 // L
    case 0: return 1 // M
    case 3: return 2 // Q
    case 2: return 3 // H
    default: throw new Error('bad ec level')
  }
}

function getRSBlocks(typeNumber: number, ecIndicator: number): RSBlock[] {
  const row = RS_BLOCK_TABLE[(typeNumber - 1) * 4 + rsBlockOffset(ecIndicator)]
  const blocks: RSBlock[] = []
  for (let i = 0; i < row.length; i += 3) {
    const count = row[i]
    const totalCount = row[i + 1]
    const dataCount = row[i + 2]
    for (let j = 0; j < count; j++) blocks.push({ totalCount, dataCount })
  }
  return blocks
}

function getTotalDataCount(typeNumber: number, ecIndicator: number): number {
  return getRSBlocks(typeNumber, ecIndicator).reduce((s, b) => s + b.dataCount, 0)
}

function lengthInBits(typeNumber: number): number {
  return typeNumber < 10 ? 8 : 16
}

function createData(typeNumber: number, ecIndicator: number, data: number[]): number[] {
  const rsBlocks = getRSBlocks(typeNumber, ecIndicator)
  const buffer = new BitBuffer()

  // Byte mode indicator (0100) + length + payload.
  buffer.put(4, 4)
  buffer.put(data.length, lengthInBits(typeNumber))
  for (const b of data) buffer.put(b, 8)

  const totalDataBits =
    rsBlocks.reduce((s, b) => s + b.dataCount, 0) * 8

  // Terminator + byte alignment + pad codewords.
  if (buffer.length + 4 <= totalDataBits) buffer.put(0, 4)
  while (buffer.length % 8 !== 0) buffer.putBit(false)
  while (true) {
    if (buffer.length >= totalDataBits) break
    buffer.put(0xec, 8)
    if (buffer.length >= totalDataBits) break
    buffer.put(0x11, 8)
  }

  return createBytes(buffer, rsBlocks)
}

function createBytes(buffer: BitBuffer, rsBlocks: RSBlock[]): number[] {
  let offset = 0
  let maxDcCount = 0
  let maxEcCount = 0
  const dcdata: number[][] = []
  const ecdata: number[][] = []

  for (const block of rsBlocks) {
    const dcCount = block.dataCount
    const ecCount = block.totalCount - block.dataCount
    maxDcCount = Math.max(maxDcCount, dcCount)
    maxEcCount = Math.max(maxEcCount, ecCount)

    const dc = new Array<number>(dcCount)
    for (let i = 0; i < dcCount; i++) dc[i] = 0xff & buffer.buffer[i + offset]
    offset += dcCount

    const rsPoly = getErrorCorrectPolynomial(ecCount)
    const dividend = dc.concat(new Array<number>(rsPoly.length - 1).fill(0))
    const mod = polyMod(dividend, rsPoly)

    const ec = new Array<number>(rsPoly.length - 1)
    for (let i = 0; i < ec.length; i++) {
      const modIndex = i + mod.length - ec.length
      ec[i] = modIndex >= 0 ? mod[modIndex] : 0
    }

    dcdata.push(dc)
    ecdata.push(ec)
  }

  const totalCodeCount = rsBlocks.reduce((s, b) => s + b.totalCount, 0)
  const result = new Array<number>(totalCodeCount)
  let index = 0
  for (let i = 0; i < maxDcCount; i++) {
    for (const dc of dcdata) if (i < dc.length) result[index++] = dc[i]
  }
  for (let i = 0; i < maxEcCount; i++) {
    for (const ec of ecdata) if (i < ec.length) result[index++] = ec[i]
  }
  return result
}

// ---------------------------------------------------------------------------
// BCH codes for format / version information
// ---------------------------------------------------------------------------

function getBCHDigit(data: number): number {
  let digit = 0
  while (data !== 0) {
    digit++
    data >>>= 1
  }
  return digit
}

function getBCHTypeInfo(data: number): number {
  let d = data << 10
  while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
    d ^= G15 << (getBCHDigit(d) - getBCHDigit(G15))
  }
  return ((data << 10) | d) ^ G15_MASK
}

function getBCHTypeNumber(data: number): number {
  let d = data << 12
  while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
    d ^= G18 << (getBCHDigit(d) - getBCHDigit(G18))
  }
  return (data << 12) | d
}

// ---------------------------------------------------------------------------
// Mask patterns
// ---------------------------------------------------------------------------

function maskFn(pattern: number, i: number, j: number): boolean {
  switch (pattern) {
    case 0: return (i + j) % 2 === 0
    case 1: return i % 2 === 0
    case 2: return j % 3 === 0
    case 3: return (i + j) % 3 === 0
    case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
    case 5: return ((i * j) % 2) + ((i * j) % 3) === 0
    case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0
    case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0
    default: throw new Error('bad mask pattern: ' + pattern)
  }
}

// ---------------------------------------------------------------------------
// Matrix construction
// ---------------------------------------------------------------------------

type Matrix = Array<Array<boolean | null>>

function setupPositionProbePattern(m: Matrix, row: number, col: number): void {
  const n = m.length
  for (let r = -1; r <= 7; r++) {
    if (row + r < 0 || n <= row + r) continue
    for (let c = -1; c <= 7; c++) {
      if (col + c < 0 || n <= col + c) continue
      const isDark =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      m[row + r][col + c] = isDark
    }
  }
}

function setupTimingPattern(m: Matrix): void {
  const n = m.length
  for (let r = 8; r < n - 8; r++) if (m[r][6] === null) m[r][6] = r % 2 === 0
  for (let c = 8; c < n - 8; c++) if (m[6][c] === null) m[6][c] = c % 2 === 0
}

function setupPositionAdjustPattern(m: Matrix, typeNumber: number): void {
  const pos = PATTERN_POSITION_TABLE[typeNumber - 1]
  for (const row of pos) {
    for (const col of pos) {
      if (m[row][col] !== null) continue
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          m[row + r][col + c] =
            r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)
        }
      }
    }
  }
}

function setupTypeNumber(m: Matrix, typeNumber: number, test: boolean): void {
  const n = m.length
  const bits = getBCHTypeNumber(typeNumber)
  for (let i = 0; i < 18; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    m[Math.floor(i / 3)][(i % 3) + n - 8 - 3] = mod
    m[(i % 3) + n - 8 - 3][Math.floor(i / 3)] = mod
  }
}

function setupTypeInfo(
  m: Matrix,
  ecIndicator: number,
  maskPattern: number,
  test: boolean
): void {
  const n = m.length
  const data = (ecIndicator << 3) | maskPattern
  const bits = getBCHTypeInfo(data)

  for (let i = 0; i < 15; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    if (i < 6) m[i][8] = mod
    else if (i < 8) m[i + 1][8] = mod
    else m[n - 15 + i][8] = mod
  }
  for (let i = 0; i < 15; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    if (i < 8) m[8][n - i - 1] = mod
    else if (i < 9) m[8][15 - i - 1 + 1] = mod
    else m[8][15 - i - 1] = mod
  }
  m[n - 8][8] = !test // fixed dark module
}

function mapData(m: Matrix, data: number[], maskPattern: number): void {
  const n = m.length
  let inc = -1
  let row = n - 1
  let bitIndex = 7
  let byteIndex = 0

  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (;;) {
      for (let c = 0; c < 2; c++) {
        if (m[row][col - c] === null) {
          let dark = false
          if (byteIndex < data.length) {
            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1
          }
          if (maskFn(maskPattern, row, col - c)) dark = !dark
          m[row][col - c] = dark
          bitIndex--
          if (bitIndex === -1) {
            byteIndex++
            bitIndex = 7
          }
        }
      }
      row += inc
      if (row < 0 || n <= row) {
        row -= inc
        inc = -inc
        break
      }
    }
  }
}

function buildMatrix(
  typeNumber: number,
  ecIndicator: number,
  dataCache: number[],
  maskPattern: number,
  test: boolean
): Matrix {
  const n = typeNumber * 4 + 17
  const m: Matrix = Array.from({ length: n }, () => new Array<boolean | null>(n).fill(null))

  setupPositionProbePattern(m, 0, 0)
  setupPositionProbePattern(m, n - 7, 0)
  setupPositionProbePattern(m, 0, n - 7)
  setupPositionAdjustPattern(m, typeNumber)
  setupTimingPattern(m)
  setupTypeInfo(m, ecIndicator, maskPattern, test)
  if (typeNumber >= 7) setupTypeNumber(m, typeNumber, test)
  mapData(m, dataCache, maskPattern)
  return m
}

// ---------------------------------------------------------------------------
// Mask penalty scoring
// ---------------------------------------------------------------------------

function lostPoint(m: Matrix): number {
  const n = m.length
  const isDark = (r: number, c: number): boolean => m[r][c] === true
  let lost = 0

  // Rule 1: runs of same-colour modules in rows/columns.
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      let sameCount = 0
      const dark = isDark(row, col)
      for (let r = -1; r <= 1; r++) {
        if (row + r < 0 || n <= row + r) continue
        for (let c = -1; c <= 1; c++) {
          if (col + c < 0 || n <= col + c) continue
          if (r === 0 && c === 0) continue
          if (dark === isDark(row + r, col + c)) sameCount++
        }
      }
      if (sameCount > 5) lost += 3 + sameCount - 5
    }
  }

  // Rule 2: 2x2 blocks of the same colour.
  for (let row = 0; row < n - 1; row++) {
    for (let col = 0; col < n - 1; col++) {
      let count = 0
      if (isDark(row, col)) count++
      if (isDark(row + 1, col)) count++
      if (isDark(row, col + 1)) count++
      if (isDark(row + 1, col + 1)) count++
      if (count === 0 || count === 4) lost += 3
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns.
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n - 6; col++) {
      if (
        isDark(row, col) && !isDark(row, col + 1) && isDark(row, col + 2) &&
        isDark(row, col + 3) && isDark(row, col + 4) && !isDark(row, col + 5) &&
        isDark(row, col + 6)
      ) lost += 40
    }
  }
  for (let col = 0; col < n; col++) {
    for (let row = 0; row < n - 6; row++) {
      if (
        isDark(row, col) && !isDark(row + 1, col) && isDark(row + 2, col) &&
        isDark(row + 3, col) && isDark(row + 4, col) && !isDark(row + 5, col) &&
        isDark(row + 6, col)
      ) lost += 40
    }
  }

  // Rule 4: balance of dark/light modules.
  let darkCount = 0
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) if (isDark(row, col)) darkCount++
  }
  const ratio = Math.abs((100 * darkCount) / (n * n) - 50) / 5
  lost += ratio * 10

  return lost
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function utf8Bytes(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000
        i++
      }
    }
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      )
    }
  }
  return bytes
}

function selectTypeNumber(dataLength: number, ecIndicator: number): number {
  for (let t = 1; t <= 40; t++) {
    const need = 4 + lengthInBits(t) + dataLength * 8
    if (need <= getTotalDataCount(t, ecIndicator) * 8) return t
  }
  throw new Error('Content is too long to encode in a QR code')
}

/**
 * Encode `text` and return the module matrix (true = dark). The smallest
 * fitting QR version and the lowest-penalty mask are chosen automatically.
 * Throws if the content exceeds the capacity of a version-40 code.
 */
export function encodeQR(text: string, ecLevel: ECLevel = 'M'): boolean[][] {
  const ecIndicator = EC_INDICATOR[ecLevel]
  const data = utf8Bytes(text)
  const typeNumber = selectTypeNumber(data.length, ecIndicator)
  const dataCache = createData(typeNumber, ecIndicator, data)

  // Mask selection is scored on a "test" matrix (format/version bits blanked),
  // matching the reference algorithm; the first strictly-lower score wins.
  let bestPattern = 0
  let minLost = Infinity
  for (let pattern = 0; pattern < 8; pattern++) {
    const candidate = buildMatrix(typeNumber, ecIndicator, dataCache, pattern, true)
    const lost = lostPoint(candidate)
    if (lost < minLost) {
      minLost = lost
      bestPattern = pattern
    }
  }

  return buildMatrix(typeNumber, ecIndicator, dataCache, bestPattern, false).map(
    (row) => row.map((v) => v === true)
  )
}

// ============================================================================
// Styled SVG rendering
// ============================================================================

/** 方块 / 圆点 / 圆角连接 / 菱形 */
export type DotShape = 'square' | 'dot' | 'rounded' | 'diamond'
/** 方形 / 圆角 / 圆形 — the three finder patterns. */
export type EyeShape = 'square' | 'rounded' | 'circle'

export interface QRStyle {
  dot: DotShape
  eye: EyeShape
  /** Foreground colour (hex or rgba()). */
  fg: string
  /** Gradient end colour; null for a solid foreground. */
  fg2: string | null
  /** Background colour. */
  bg: string
}

export const DEFAULT_STYLE: QRStyle = {
  dot: 'square',
  eye: 'square',
  fg: '#000000',
  fg2: null,
  bg: '#FFFFFF'
}

// Quiet zone in modules. The spec recommends 4, but for an on-screen code that
// is scanned by a phone camera 2 is reliably enough and avoids a thick border.
const QUIET_ZONE = 2

const num = (v: number): string => String(Math.round(v * 1000) / 1000)

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Rounded-rectangle subpath (clockwise). */
function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  if (r <= 0) return `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}Z`
  return (
    `M${num(x + r)} ${num(y)}H${num(x + w - r)}` +
    `A${num(r)} ${num(r)} 0 0 1 ${num(x + w)} ${num(y + r)}V${num(y + h - r)}` +
    `A${num(r)} ${num(r)} 0 0 1 ${num(x + w - r)} ${num(y + h)}H${num(x + r)}` +
    `A${num(r)} ${num(r)} 0 0 1 ${num(x)} ${num(y + h - r)}V${num(y + r)}` +
    `A${num(r)} ${num(r)} 0 0 1 ${num(x + r)} ${num(y)}Z`
  )
}

/** Circle subpath centred at (cx, cy). */
function circle(cx: number, cy: number, r: number): string {
  return (
    `M${num(cx - r)} ${num(cy)}` +
    `a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0` +
    `a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0Z`
  )
}

/** One finder pattern (7×7 ring + 3×3 centre); drawn with fill-rule evenodd. */
function eyePath(x: number, y: number, shape: EyeShape): string {
  switch (shape) {
    case 'circle':
      return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5) + circle(x + 3.5, y + 3.5, 1.5)
    case 'rounded':
      return roundRect(x, y, 7, 7, 2.2) + roundRect(x + 1, y + 1, 5, 5, 1.4) + roundRect(x + 2, y + 2, 3, 3, 1)
    default:
      return roundRect(x, y, 7, 7, 0) + roundRect(x + 1, y + 1, 5, 5, 0) + roundRect(x + 2, y + 2, 3, 3, 0)
  }
}

/** One alignment pattern (5×5 ring + centre) at top-left (x, y), evenodd. */
function alignPath(x: number, y: number, shape: EyeShape): string {
  switch (shape) {
    case 'circle':
      return circle(x + 2.5, y + 2.5, 2.5) + circle(x + 2.5, y + 2.5, 1.5) + circle(x + 2.5, y + 2.5, 0.5)
    case 'rounded':
      return roundRect(x, y, 5, 5, 1.6) + roundRect(x + 1, y + 1, 3, 3, 0.8) + roundRect(x + 2, y + 2, 1, 1, 0.35)
    default:
      return roundRect(x, y, 5, 5, 0) + roundRect(x + 1, y + 1, 3, 3, 0) + roundRect(x + 2, y + 2, 1, 1, 0)
  }
}

/** Data module with each corner rounded only where both neighbours on it are empty. */
function roundedModule(x: number, y: number, up: boolean, right: boolean, down: boolean, left: boolean): string {
  const r = 0.5
  const tl = !up && !left ? r : 0
  const tr = !up && !right ? r : 0
  const br = !down && !right ? r : 0
  const bl = !down && !left ? r : 0
  const arc = (rad: number, ex: number, ey: number) =>
    rad > 0 ? `A${num(rad)} ${num(rad)} 0 0 1 ${num(ex)} ${num(ey)}` : `L${num(ex)} ${num(ey)}`
  return (
    `M${num(x + tl)} ${num(y)}H${num(x + 1 - tr)}` +
    arc(tr, x + 1, y + tr) +
    `V${num(y + 1 - br)}` +
    arc(br, x + 1 - br, y + 1) +
    `H${num(x + bl)}` +
    arc(bl, x, y + 1 - bl) +
    `V${num(y + tl)}` +
    arc(tl, x + tl, y) +
    'Z'
  )
}

/** `#rrggbbff` / `#rgbf` → `#rrggbb` / `#rgb`, for SVG renderers without CSS Color 4. */
function svgColor(v: string): string {
  const s = v.trim()
  if (/^#[0-9a-f]{8}$/i.test(s) && /ff$/i.test(s)) return s.slice(0, 7)
  if (/^#[0-9a-f]{4}$/i.test(s) && /f$/i.test(s)) return s.slice(0, 4)
  return s
}

/**
 * Encode `text` and return a standalone SVG. Throws if the content is too long
 * for a QR code. Without `px` the SVG has only a viewBox (size it with CSS);
 * pass `px` when it is rasterised (the Scripting `SVG` view renders a bitmap
 * at the SVG's own size).
 */
export function qrSvg(text: string, style: QRStyle, opts: { px?: number } = {}): string {
  const matrix = encodeQR(text, 'M')
  const n = matrix.length
  const q = QUIET_ZONE
  const size = n + q * 2

  const inFinder = (r: number, c: number): boolean =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

  // Alignment-pattern centres (the ones overlapping a finder are not drawn).
  // Shaped dots break them up so badly that decoders can't lock on, so they
  // are drawn whole, in the eye shape, like the finders.
  const alignCenters: [number, number][] = []
  const pos = PATTERN_POSITION_TABLE[(n - 17) / 4 - 1] || []
  for (const ar of pos) {
    for (const ac of pos) {
      if (inFinder(ar, ac)) continue
      alignCenters.push([ar, ac])
    }
  }
  const inAlign = (r: number, c: number): boolean =>
    alignCenters.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2)

  const special = (r: number, c: number): boolean =>
    inFinder(r, c) || (style.dot !== 'square' && inAlign(r, c))
  const dark = (r: number, c: number): boolean =>
    r >= 0 && c >= 0 && r < n && c < n && matrix[r][c] && !special(r, c)

  let modules = ''
  for (let r = 0; r < n; r++) {
    if (style.dot === 'square') {
      // Merge horizontal runs so adjacent squares leave no seams.
      let c = 0
      while (c < n) {
        if (!dark(r, c)) {
          c++
          continue
        }
        let end = c
        while (end < n && dark(r, end)) end++
        modules += `M${c + q} ${r + q}h${end - c}v1h${c - end}Z`
        c = end
      }
      continue
    }
    for (let c = 0; c < n; c++) {
      if (!dark(r, c)) continue
      const x = c + q
      const y = r + q
      if (style.dot === 'dot') {
        modules += circle(x + 0.5, y + 0.5, 0.5)
      } else if (style.dot === 'diamond') {
        modules += `M${num(x + 0.5)} ${num(y - 0.05)}L${num(x + 1.05)} ${num(y + 0.5)}L${num(x + 0.5)} ${num(y + 1.05)}L${num(x - 0.05)} ${num(y + 0.5)}Z`
      } else {
        modules += roundedModule(x, y, dark(r - 1, c), dark(r, c + 1), dark(r + 1, c), dark(r, c - 1))
      }
    }
  }

  let eyes =
    eyePath(q, q, style.eye) +
    eyePath(q + n - 7, q, style.eye) +
    eyePath(q, q + n - 7, style.eye)
  if (style.dot !== 'square') {
    for (const [ar, ac] of alignCenters) eyes += alignPath(ac - 2 + q, ar - 2 + q, style.eye)
  }

  const fg = escapeAttr(svgColor(style.fg))
  const fill = style.fg2 ? 'url(#qrg)' : fg
  const defs = style.fg2
    ? `<defs><linearGradient id="qrg" gradientUnits="userSpaceOnUse" x1="${q}" y1="${q}" x2="${q + n}" y2="${q + n}">` +
      `<stop offset="0" stop-color="${fg}"/><stop offset="1" stop-color="${escapeAttr(svgColor(style.fg2))}"/>` +
      `</linearGradient></defs>`
    : ''
  const crisp = style.dot === 'square' ? ' shape-rendering="crispEdges"' : ''
  const px = opts.px ? ` width="${Math.round(opts.px)}" height="${Math.round(opts.px)}"` : ''

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"${px}>` +
    defs +
    `<rect width="${size}" height="${size}" fill="${escapeAttr(svgColor(style.bg))}"/>` +
    `<path d="${modules}" fill="${fill}"${crisp}/>` +
    `<path d="${eyes}" fill="${fill}" fill-rule="evenodd"${style.eye === 'square' ? ' shape-rendering="crispEdges"' : ''}/>` +
    `</svg>`
  )
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGBA_RE = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i

/** Colour strings we accept from settings: hex or rgb()/rgba(). */
export function isColorString(v: unknown): v is string {
  return typeof v === 'string' && (HEX_RE.test(v.trim()) || RGBA_RE.test(v.trim()))
}

function parseColor(v: string): [number, number, number] | null {
  const s = v.trim().toLowerCase()
  if (s === 'black') return [0, 0, 0]
  if (s === 'white') return [255, 255, 255]
  if (HEX_RE.test(s)) {
    let h = s.slice(1)
    if (h.length <= 4) h = h.split('').map((ch) => ch + ch).join('')
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const m = RGBA_RE.exec(s)
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
  return null
}

function luminance([r, g, b]: [number, number, number]): number {
  const ch = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

/** WCAG contrast ratio (1–21), or null when a colour can't be parsed. */
export function contrastRatio(a: string, b: string): number | null {
  const ca = parseColor(a)
  const cb = parseColor(b)
  if (!ca || !cb) return null
  const la = luminance(ca)
  const lb = luminance(cb)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
