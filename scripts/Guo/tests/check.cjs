const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { test } = require('node:test')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

const root = path.resolve(__dirname, '..')
const clone = value => JSON.parse(JSON.stringify(value))
const sample = {
  series_id_str: '1234567890123456789', series_title: '合成剧集',
  episode_cnt: 2, series_intro: '仅用于验证的合成文本', tags: ['测试']
}
const episodes = [
  { vid: '2234567890123456789', vid_index: 1 },
  { vid: '3234567890123456789', vid_index: 2 }
]
const html = data => `<script>window._ROUTER_DATA = ${JSON.stringify({ loaderData: data })};</script>`
const response = value => ({ ok: true, status: 200, text: async () => typeof value === 'string' ? value : JSON.stringify(value) })
const flush = () => new Promise(resolve => setImmediate(resolve))

function encodedKey(key = '0123456789abcdef0123456789abcdef', tag = 'legacy') {
  const decoded = Buffer.from('0' + key)
  const raw = Buffer.alloc(1 + decoded.length + tag.length)
  let even = 250
  let odd = 85
  for (let index = 0; index < decoded.length; index++) {
    const bits = index.toString(2).replace(/0/g, '').length
    const value = (index % 2 ? odd : even) ^ ((decoded[index] + 21 + bits) & 255)
    raw[index + 1] = value
    if (index % 2) odd = value
    else even = value
  }
  raw[0] = (tag.length + 48) ^ raw[1] ^ raw[2]
  const seed = raw[decoded.length - 1] ^ raw[decoded.length]
  Buffer.from(tag).forEach((value, index) => { raw[1 + decoded.length + index] = value ^ seed })
  return raw.toString('base64')
}

function encodedResponse(value) {
  const material = Buffer.from('0123456789abcdef9876543210fedcba')
  const mask = [104, 64, 70, 166, 190, 168, 143, 130, 225, 254, 251, 217, 196, 34, 45, 60, 29, 20, 103, 105]
  const encoded = Buffer.alloc(material.length)
  for (let index = 0; index < material.length; index++) {
    const slot = index % mask.length
    const rotated = material[index] ^ (index ? encoded[index - 1] : 109) ^ mask[slot] ^ ((90 + 13 * slot) & 255) ^ 85
    encoded[index] = ((((rotated >>> 3) | (rotated << 5)) & 255) - 215 + 11 * index) & 255
  }
  const cipher = crypto.createCipheriv('aes-128-cbc', material.subarray(0, 16), material.subarray(16, 32))
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
  return `v2.abcd${encoded.toString('hex')}.${body.toString('base64')}`
}

async function liveFetch(url, options) {
  if (!process.env.GUO_PROXY) return fetch(url, options)
  const args = ['--proxy', process.env.GUO_PROXY, '--location', '--silent', '--show-error', '--max-time', '20', '--write-out', '\n%{http_code}', url]
  for (const [name, value] of Object.entries(options.headers || {})) args.push('--header', `${name}: ${value}`)
  if (options.method) args.push('--request', options.method)
  if (options.body) args.push('--data-binary', options.body)
  const { stdout } = await promisify(execFile)('curl', args, { signal: options.signal, maxBuffer: 16 * 1024 * 1024 })
  const separator = stdout.lastIndexOf('\n')
  const status = Number(stdout.slice(separator + 1))
  return { ok: status >= 200 && status < 300, status, text: async () => stdout.slice(0, separator) }
}

function runtime() {
  const cache = new Map()
  const state = { storage: new Map(), failWrite: false, effects: [], players: [], webViews: [], alerts: [], calls: [], audioActive: false, waits: [], values: [], files: new Map(), directories: new Set(), downloads: [], shellCalls: [], queues: [], realFiles: false, temporaryDirectory: '/sandbox/tmp' }
  class Data {
    constructor(value) { this.value = value }
    static fromRawString(value) { return new Data(Buffer.from(value)) }
    static fromBase64String(value) { return new Data(Buffer.from(value, 'base64')) }
    toRawString() { return this.value.toString('utf8') }
    toHexString() { return this.value.toString('hex') }
  }
  class Player {
    constructor() { this.currentTime = 0; this.duration = 0; this.disposed = false; this.timeControlStatus = 0; state.players.push(this) }
    setSource(url, options) { this.source = url; this.options = options; return true }
    play(rate) { this.rate = rate; this.playing = true; this.timeControlStatus = 2; return true }
    pause() { this.playing = false; this.timeControlStatus = 0 }
    dispose() { this.disposed = true }
  }
  class WebPlayer {
    constructor(options) { this.options = options; this.disposed = false; state.webViews.push(this) }
    async loadRequest(request) { this.request = request; return true }
    dispose() { this.disposed = true }
  }
  const host = {
    AbortController,
    fetch: async (url, options) => {
      state.calls.push({ url, options })
      if (!state.fetch) throw new Error('测试禁止外网请求')
      return state.fetch(url, options)
    },
    useEffect: effect => { state.effects.push(effect) },
    useState: initial => {
      const value = typeof initial === 'function' ? initial() : initial
      const index = state.values.length
      state.values.push(value)
      return [value, next => { state.values[index] = typeof next === 'function' ? next(state.values[index]) : next }]
    },
    useObservable: value => ({ value }),
    AppEvents: { scenePhase: { addListener: listener => { state.sceneChanged = listener }, removeListener: () => {} } }
  }
  const context = vm.createContext({
    console,
    setTimeout: (callback, milliseconds, ...args) => {
      if (milliseconds > 0 && milliseconds <= 2000) { state.waits.push(milliseconds); return setTimeout(callback, 0, ...args) }
      return setTimeout(callback, milliseconds, ...args)
    },
    clearTimeout, setInterval, clearInterval,
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Data, AVPlayer: Player, WebViewController: WebPlayer,
    TimeControlStatus: { paused: 0, waitingToPlayAtSpecifiedRate: 1, playing: 2 },
    FileManager: {
      get temporaryDirectory() { return state.temporaryDirectory },
      createDirectory: async directory => { if (state.realFiles) fs.mkdirSync(directory, { recursive: true }); else state.directories.add(directory) },
      exists: async filename => state.realFiles ? fs.existsSync(filename) : state.files.has(filename) || state.directories.has(filename),
      isFile: async filename => state.realFiles ? fs.existsSync(filename) && fs.statSync(filename).isFile() : state.files.has(filename),
      remove: async filename => {
        if (state.realFiles) fs.rmSync(filename, { force: true, recursive: true })
        else {
          state.directories.delete(filename)
          for (const key of state.files.keys()) if (key === filename || key.startsWith(filename + '/')) state.files.delete(key)
        }
      }
    },
    DownloadManager: { open: async options => {
      const queue = {
        options, disposed: false, dispose() { this.disposed = true },
        download: async options => {
          const task = {
            options, cancelled: false, removed: false, onProgress: null,
            async cancel() { this.cancelled = true },
            async remove() { this.removed = true; if (state.realFiles) fs.rmSync(options.destination, { force: true }); else state.files.delete(options.destination) },
            async waitUntilFinished() {
              if (state.performDownload) await state.performDownload(options)
              else state.files.set(options.destination, new Uint8Array([1, 2, 3]))
              return options.destination
            }
          }
          state.downloads.push(task)
          if (state.onDownload) state.onDownload(task)
          return task
        }
      }
      state.queues.push(queue)
      return queue
    } },
    Shell: { run: async (command, options) => {
      state.shellCalls.push({ command, options })
      if (state.shellRun) return state.shellRun(command, options)
      const output = command.match(/'([^']+\/playback\.mp4)'$/)?.[1]
      state.files.set(output, new Uint8Array([4, 5, 6]))
      return { exitCode: 0, output: '', timedOut: false, cancelled: false }
    } },
    Crypto: { md5: data => new Data(crypto.createHash('md5').update(data.value).digest()) },
    Storage: {
      get: key => state.storage.has(key) ? clone(state.storage.get(key)) : null,
      set: (key, value) => {
        if (state.failWrite) return false
        state.storage.set(key, clone(value))
        return true
      }
    },
    SharedAudioSession: {
      setCategory: () => {}, setActive: active => { state.audioActive = active }
    },
    Dialog: { alert: async message => { state.alerts.push(message) } }
  })
  function load(relative) {
    let filename = path.resolve(root, relative)
    if (!path.extname(filename)) filename += fs.existsSync(filename + '.ts') ? '.ts' : '.tsx'
    if (cache.has(filename)) return cache.get(filename).exports
    const module = { exports: {} }
    cache.set(filename, module)
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, jsxFactory: 'createElement' }
    }).outputText
    const requireLocal = name => {
      if (name === 'scripting') return host
      if (name === 'crypto' || name === 'buffer') return require(name)
      if (!name.startsWith('.')) throw new Error('禁止测试外部依赖：' + name)
      return load(path.resolve(path.dirname(filename), name))
    }
    vm.runInContext(`(function(require, module, exports) {${code}\n})`, context, { filename })(requireLocal, module, module.exports)
    return module.exports
  }
  return { state, load }
}

test('长整数 ID 无精度损失，字符串内容不被改写', () => {
  const { load } = runtime()
  const { parseJSON, routerData } = load('parse')
  assert.deepEqual(clone(parseJSON('{"id":1234567890123456789,"text":"1234567890123456789 \\\" }","n":2,"decimal":1.25}')), {
    id: '1234567890123456789', text: '1234567890123456789 " }', n: 2, decimal: 1.25
  })
  const data = routerData(html({ detail_page: { title: '} \\ " {' } }))
  assert.equal(data.loaderData.detail_page.title, '} \\ " {')
  assert.throws(() => routerData('<script>window._ROUTER_DATA = {"x":1'), /不完整/)
})

test('请求签名与 Go 算法固定向量一致', () => {
  const { signedHeaders, queryString } = runtime().load('sign')
  const headers = signedHeaders('aid=8662&device_id=1000000000000000000', '{"series_id":"1234567890123456789"}', value => crypto.createHash('md5').update(value).digest('hex'), 1700000000000)
  assert.equal(headers['X-Gorgon'], '8404401c0000f00f81980282311d7022103fad22c9d970977efb')
  assert.equal(headers['X-SS-STUB'], '352087405C5F0D5C521420838592218C')
  assert.equal(headers['X-Khronos'], '1700000000')
  assert.equal(queryString({ z: '中文', a: 'a b' }), 'a=a+b&z=%E4%B8%AD%E6%96%87')
  assert.equal(queryString({ resolution: '1280*2772' }), 'resolution=1280%2A2772')
})

test('完整播放签名的 SM3 与独立参考向量一致，包含 Argus 和 Ladon', () => {
  const { sm3, playerHeaders } = runtime().load('player_sign')
  for (const data of [Buffer.from('abc'), Buffer.alloc(0), Buffer.from(Array.from({ length: 100 }, (_, index) => index))]) {
    assert.equal(Buffer.from(sm3(data)).toString('hex'), crypto.createHash('sm3').update(data).digest('hex'))
  }
  const headers = playerHeaders('aid=8662&device_id=1000000000000000000', '{"series_id":"1234567890123456789"}', '1000000000000000000', 1700000000000, Uint8Array.from({ length: 11 }, (_, index) => index))
  assert.equal(headers['X-Gorgon'], '8404401c0000f00f81980282311d7022103fad22c9d970977efb')
  assert.equal(crypto.createHash('sha256').update(headers['X-Argus']).digest('hex'), '07a71521e0aaa896b47fc80730c89347ce63b8be695dbd96fa9fd1f9f298de72')
  assert.equal(headers['X-Ladon'], 'AgMEBVbVr6bCGXEl3RbL1aAkpFHJpdxRfjTl94yWLoz6K/SQ')
})

test('网页路由优先准确名称并跳过空布局，不受字段顺序影响', () => {
  const { loader, routerData } = runtime().load('parse')
  const category = { isSuccess: true, recommendList: [sample] }
  const data = routerData(html({ category_layout: null, 'category_$': category }))
  assert.equal(loader(data, 'category_page', 'category_$').recommendList.length, 1)
  assert.equal(loader({ loaderData: { category_layout: { seo: true }, 'category_$': category } }, 'category_page', 'category_$').isSuccess, true)
  const search = loader({ loaderData: { search_layout: {}, 'search_(keyword)/page': { query: '合成' } } }, 'search_(keyword)/page', 'search_')
  assert.equal(search.query, '合成')
  const detail = loader({ loaderData: { detail_layout: null, detail_page: { seriesDetail: sample } } }, 'detail_page', 'detail_')
  assert.equal(detail.seriesDetail.series_id_str, sample.series_id_str)
  const player = loader({ loaderData: { player_layout: null, 'player_($series)/page': { vid: episodes[0].vid } } }, 'player_', 'player_page')
  assert.equal(player.vid, episodes[0].vid)
})

test('按原项目解析媒体密钥和 v2 备用接口响应，拒绝不支持的密钥版本', () => {
  const { contentKey, playbackResponse } = runtime().load('playback_crypto')
  assert.equal(contentKey(encodedKey()), '0123456789abcdef0123456789abcdef')
  assert.throws(() => contentKey(encodedKey(undefined, 'app_v2')), /版本暂不支持/)
  assert.throws(() => contentKey('invalid==='), /Base64/)
  const data = { key_urls: [{ kid: '1'.repeat(32), src: 'https://media.example.test/test.mp4', spade_a: encodedKey() }] }
  assert.deepEqual(clone(playbackResponse(encodedResponse(data))), data)
  assert.throws(() => playbackResponse('v2.abcd0102.aGVsbG8='), /密钥无效/)
})

test('取流按 App → 网页媒体数据 → 备用 API 顺序，保持原剧和分集 ID', async () => {
  const { load, state } = runtime()
  const drama = load('parse').parseDrama(sample)
  const episode = { id: episodes[1].vid, number: 2, title: '第 2 集' }
  state.fetch = async url => {
    if (url.includes('fqnovel.com')) return response('')
    if (url.startsWith('https://hongguoduanju.com/player/')) return response(html({ player_layout: null, player_page: {
      series_id: drama.sourceId, vid: episodes[0].vid, video_player_info: { main_url: 'https://media.example.test/wrong.mp4' }
    } }))
    assert.ok(url.startsWith('https://djapi.999888456.xyz/api/hongguo/play?'))
    const reference = JSON.parse(Buffer.from(new URL(url).searchParams.get('id'), 'base64').toString())
    assert.deepEqual(reference, { content_type: 1004, from_video_id: '', series_id: drama.sourceId, vid: episode.id, video_platform: 3 })
    return response(encodedResponse({ parse: 0, jx: false, key_urls: [
      { name: '720P', kid: '1'.repeat(32), src: 'https://media.example.test/720.mp4', spade_a: encodedKey() },
      { name: '1080P', kid: '1'.repeat(32), src: 'https://media.example.test/1080.mp4', spade_a: encodedKey() }
    ] }))
  }
  const media = await load('hongguo').hongguo.resolve(drama, episode)
  assert.equal(state.calls.length, 4)
  assert.equal(media.origin, 'backup')
  assert.equal(media.quality, 1080)
  assert.equal(media.alternatives.length, 1)
  assert.equal(media.decryptionKey, '0123456789abcdef0123456789abcdef')
})

test('App 请求网络失败默认重试两次并重新签名，成功后不访问其他入口', async () => {
  const { load, state } = runtime()
  const drama = load('parse').parseDrama(sample)
  const episode = { id: episodes[0].vid, number: 1, title: '第 1 集' }
  let count = 0
  state.fetch = async () => {
    if (++count === 1) throw new TypeError('TLS connection failed')
    return response({ code: 0, data: { video_model: { vid: 'v0200-synthetic-media-asset', video_list: { high: {
      main_url: 'https://media.example.test/1080.mp4', backup_url: 'https://backup.example.test/1080.mp4',
      encrypt_info: { encrypt: true, spade_a: encodedKey() }, video_meta: { codec_type: 'h264', definition: '1080p' }
    } } } } })
  }
  const media = await load('hongguo').hongguo.resolve(drama, episode)
  assert.equal(count, 2)
  assert.equal(state.calls[0].options.method, 'POST')
  assert.ok(state.calls[0].options.headers['X-Argus'])
  assert.ok(state.calls[0].options.headers['X-Ladon'])
  assert.notEqual(state.calls[0].options.headers['X-SS-Req-Ticket'], state.calls[1].options.headers['X-SS-Req-Ticket'])
  assert.ok(state.waits.includes(1000))
  assert.equal(media.alternatives[0].url, 'https://backup.example.test/1080.mp4')
  assert.equal(media.decryptionKey.length, 32)
})

test('备用接口拒绝解析网页标志或无效密钥标识，不把网页交给播放器', () => {
  const { backupMedia } = runtime().load('playback_routes')
  assert.throws(() => backupMedia({ parse: true, key_urls: [] }, 'agent'), /没有返回直接媒体地址/)
  assert.throws(() => backupMedia({ key_urls: [{ src: 'https://media.example.test/test.mp4', kid: 'bad', spade_a: encodedKey() }] }, 'agent'), /密钥标识无效/)
})

test('媒体资源标识与数字分集 ID 分开校验，保留原项目的取流 User-Agent', () => {
  const { appMedia } = runtime().load('playback_routes')
  const data = vid => ({ data: { video_model: { vid, video_list: [{ main_url: 'https://media.example.test/video.mp4' }] } } })
  assert.equal(appMedia(data('v0200-synthetic-asset'), episodes[0].vid, value => value, 'original-agent').headers['User-Agent'], 'original-agent')
  assert.throws(() => appMedia(data(episodes[1].vid), episodes[0].vid, value => value, 'original-agent'), /其他分集/)
})

test('加密媒体在设备上缓冲并无损准备，密钥不持久化，释放临时文件', async () => {
  const { load, state } = runtime()
  const media = { url: 'https://media.example.test/encrypted.mp4', headers: { Referer: 'https://novel.snssdk.com/' }, decryptionKey: '0123456789abcdef0123456789abcdef' }
  const result = await load('prepare_media').prepareMedia(media, new AbortController().signal, () => {})
  assert.ok(result.url.endsWith('/playback.mp4'))
  assert.equal(state.downloads[0].options.headers.Referer, media.headers.Referer)
  assert.ok(state.downloads[0].removed)
  assert.ok(state.queues[0].disposed)
  assert.ok(state.shellCalls[0].command.includes(`-decryption_key '${media.decryptionKey}'`))
  assert.ok(!state.shellCalls[0].command.includes(media.url))
  assert.ok(!state.shellCalls[0].command.includes('$GUO_MEDIA_INPUT'))
  assert.equal(state.storage.size, 0)
  await result.release()
  assert.equal(state.files.size, 0)
  assert.equal(state.directories.size, 0)
})

test('取消加密媒体准备会取消下载并清理任务及目录，不运行 FFmpeg', async () => {
  const { load, state } = runtime()
  const controller = new AbortController()
  state.onDownload = () => controller.abort()
  await assert.rejects(load('prepare_media').prepareMedia({ url: 'https://media.example.test/test.mp4', headers: {}, decryptionKey: '0'.repeat(32) }, controller.signal, () => {}), /取消/)
  assert.ok(state.downloads[0].cancelled)
  assert.ok(state.downloads[0].removed)
  assert.equal(state.shellCalls.length, 0)
  assert.equal(state.directories.size, 0)
})

test('本地 FFmpeg 用合成 CENC 文件验证真实解密、封装与解码', { skip: process.env.GUO_FFMPEG !== '1' }, async () => {
  const execute = promisify(execFile)
  const directory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), "guo-cenc- '$()-"))
  const encrypted = path.join(directory, 'synthetic.mp4')
  const key = '0123456789abcdef0123456789abcdef'
  try {
    await execute('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:r=10', '-t', '1', '-c:v', 'libx264', '-threads', '1', '-pix_fmt', 'yuv420p', '-an', '-encryption_scheme', 'cenc-aes-ctr', '-encryption_key', key, '-encryption_kid', '1'.repeat(32), '-movflags', '+faststart', encrypted])
    const { load, state } = runtime()
    state.realFiles = true
    state.temporaryDirectory = directory
    state.performDownload = async options => fs.copyFileSync(encrypted, options.destination)
    state.shellRun = async (command, options) => {
      try {
        const result = await execute('/bin/sh', ['-c', command], { env: { ...process.env, ...options.env } })
        return { exitCode: 0, output: result.stdout + result.stderr, timedOut: false, cancelled: false }
      } catch (error) { return { exitCode: 1, output: error.stderr, timedOut: false, cancelled: false } }
    }
    const prepared = await load('prepare_media').prepareMedia({ url: 'https://synthetic.example.test/video.mp4', headers: {}, decryptionKey: key }, new AbortController().signal, () => {})
    try {
      await execute('ffmpeg', ['-v', 'error', '-i', prepared.url, '-f', 'null', '-'])
      assert.ok(fs.statSync(prepared.url).size > 0)
    } finally { await prepared.release() }
    assert.equal(fs.readdirSync(directory).length, 1)
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
})

test('分类阻止重复和倒退游标，合并剧集去重且保留简介', () => {
  const { parseCatalog, parseDrama, mergeDramas } = runtime().load('parse')
  const result = { data: { video_data: [sample], has_more: true, next_offset: 18, session_id: 'session' } }
  const first = parseCatalog(result, null, '真人剧')
  assert.equal(first.next.offset, 18)
  assert.throws(() => parseCatalog(result, first.next, '真人剧'), /没有前进/)
  assert.throws(() => parseCatalog({ data: { ...result.data, has_more: 'true' } }, null, '真人剧'), /分页标记/)
  const old = parseDrama(sample)
  const sparse = { ...old, cover: '', description: '', episodeCount: 0, title: old.sourceId }
  const merged = mergeDramas([old], [sparse])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].description, sample.series_intro)
  assert.equal(merged[0].title, sample.series_title)
})

test('详情拒绝错剧、重复 ID 和不连续集数', () => {
  const { parseAppDetail, parseDrama, parseWebDetail } = runtime().load('parse')
  const drama = parseDrama(sample)
  const detail = video => ({ data: { video_data: { ...sample, video_list: video } } })
  assert.equal(parseAppDetail(detail(episodes), drama).episodes[1].number, 2)
  assert.throws(() => parseAppDetail({ data: { video_data: { ...sample, series_id_str: '999' } } }, drama), /其他剧集/)
  assert.throws(() => parseAppDetail(detail([episodes[0], { ...episodes[1], vid_index: 3 }]), drama), /完整连续/)
  assert.throws(() => parseAppDetail(detail([episodes[0], { ...episodes[1], vid: episodes[0].vid }]), drama), /完整连续/)
  assert.equal(parseWebDetail(html({ detail_page: { seriesDetail: { ...sample, vid_list: episodes.map(item => item.vid) } } }), drama).episodes.length, 2)
  assert.throws(() => parseWebDetail(html({ detail_page: { seriesDetail: { ...sample, series_id_str: '999', vid_list: ['111'] } } }), drama), /所请求/)
})

test('目录初页可回退网页，后续页失败保留同一游标体系', async () => {
  const { load, state } = runtime()
  const { hongguo } = load('hongguo')
  state.fetch = async url => {
    if (url.includes('fqnovel.com')) throw new Error('App unavailable')
    return response(html({ category_page: { isSuccess: true, recommendList: [sample], pagination: { totalPages: 3 } } }))
  }
  const page = await hongguo.catalog(hongguo.categories[0], null)
  assert.equal(page.next.transport, 'web')
  assert.equal(page.next.page, 2)
  assert.ok(page.warning)
  await assert.rejects(hongguo.catalog(hongguo.categories[0], { transport: 'app', offset: 18, session: 's', page: 1, signature: '' }), /App unavailable/)
})

test('搜索保留部分结果并显示提示，全部失败不冒充无结果', async () => {
  const { load, state } = runtime()
  const { hongguo } = load('hongguo')
  state.fetch = async url => {
    if (url.includes('/search/')) throw new Error('offline')
    return response({ suggest_list: [{ word_type: 'short_play_name', name: sample.series_title, video_data: sample }] })
  }
  const partial = await hongguo.search('合成')
  assert.equal(partial.items.length, 1)
  assert.ok(partial.warning)
  state.fetch = async () => { throw new Error('offline') }
  await assert.rejects(hongguo.search('合成'), /暂不可用/)
  await assert.rejects(hongguo.search('x'.repeat(81)), /1–80/)
})

test('GET 的短暂 TLS 失败只重试一次，取消后不重试', async () => {
  const { load, state } = runtime()
  const { hongguo } = load('hongguo')
  let count = 0
  state.fetch = async () => {
    if (++count === 1) throw new TypeError('A TLS error caused the secure connection to fail.')
    return response({ suggest_list: [{ name: '合成剧集' }] })
  }
  assert.deepEqual(clone(await hongguo.suggestions('合成')), ['合成剧集'])
  assert.equal(count, 2)
  count = 0
  state.fetch = async () => { count++; throw new TypeError('fetch failed') }
  await assert.rejects(hongguo.suggestions('合成'), /fetch failed/)
  assert.equal(count, 2)
  count = 0
  const controller = new AbortController()
  state.fetch = async () => { count++; controller.abort(); throw new TypeError('fetch failed') }
  await assert.rejects(hongguo.suggestions('合成', controller.signal))
  assert.equal(count, 1)
})

test('只接受目标分集的公开媒体，跳过加密和不支持编码', async () => {
  const { load, state } = runtime()
  const parse = load('parse')
  const drama = parse.parseDrama(sample)
  const episode = { id: episodes[1].vid, number: 2, title: '第 2 集' }
  const { hongguo } = load('hongguo')
  state.fetch = async url => {
    if (url.startsWith('https://hongguoduanju.com/player/')) return response(html({ player_page: {
      series_id: drama.sourceId, vid: episodes[0].vid,
      video_player_info: { main_url: 'https://media.example.test/wrong.mp4' }
    } }))
    return response({ code: 0, data: { video_model: { vid: episode.id, video_list: {
      encrypted: { main_url: 'https://media.example.test/encrypted.mp4', encrypt_info: { encrypt: true } },
      unsupported: { main_url: 'https://media.example.test/unsupported.mp4', video_meta: { codec_type: 'bytevc2' } },
      clear: { main_url: Buffer.from('https://media.example.test/correct.mp4').toString('base64'), video_meta: { codec_type: 'h264' } }
    } } } })
  }
  const media = await hongguo.resolve(drama, episode)
  assert.equal(media.url, 'https://media.example.test/correct.mp4')
  state.fetch = async url => url.startsWith('https://hongguoduanju.com/player/') ? response(html({ player_page: {} })) : response({ data: { video_model: { video_list: [{ main_url: 'https://media.example.test/encrypted.mp4', encrypt_info: { spade_a: 'encrypted' } }] } } })
  await assert.rejects(hongguo.resolve(drama, episode), /已尝试全部入口/)
  assert.ok(state.calls.every(call => !/\.(jpg|png|webp)(\?|$)/.test(call.url)))
})

test('本地历史按实际进度保存，追剧状态流转且失败写入不污染内存', () => {
  const { load, state } = runtime()
  const store = load('store')
  const drama = load('parse').parseDrama(sample)
  const episode = { id: episodes[0].vid, number: 1, title: '第 1 集' }
  store.setFollow(drama, 'want')
  store.saveProgress(drama, episode, 0, 100)
  assert.equal(store.library().history.length, 0)
  store.saveProgress(drama, episode, 35, 100)
  assert.equal(store.library().history[0].position, 35)
  assert.equal(store.library().follows[0].status, 'watching')
  store.saveProgress(drama, episode, 40, 100)
  assert.equal(store.library().history.length, 1)
  store.setFollow(drama, 'finished')
  store.saveProgress(drama, episode, 45, 100)
  assert.equal(store.library().follows[0].status, 'finished')
  state.failWrite = true
  assert.throws(() => store.removeHistory(), /保存失败/)
  assert.equal(store.library().history.length, 1)
  state.failWrite = false
  for (let index = 0; index < 25; index++) store.rememberSearch('词' + index)
  store.rememberSearch('词24')
  assert.equal(store.library().recentSearches.length, 20)
  store.removeHistory()
  assert.equal(store.library().follows.length, 1)
})

test('播放器就绪后续播，退出保存并释放，自动下一集', async () => {
  const { load, state } = runtime()
  const drama = load('parse').parseDrama(sample)
  const detail = { drama, episodes: episodes.map((item, index) => ({ id: item.vid, number: index + 1, title: `第 ${index + 1} 集` })) }
  const store = load('store')
  store.saveProgress(drama, detail.episodes[0], 35, 100)
  load('hongguo').hongguo.resolve = async () => ({ url: 'https://media.example.test/test.mp4', headers: {} })
  const next = []
  load('views/Player').PlayerView({ detail, episode: detail.episodes[0], onNext: value => next.push(value), onClose: () => {} })
  const cleanup = state.effects.shift()()
  await flush()
  const player = state.players[0]
  assert.equal(player.currentTime, 0)
  player.duration = 100
  player.onReadyToPlay()
  assert.equal(player.currentTime, 35)
  assert.equal(player.playing, true)
  player.currentTime = 100
  player.onEnded()
  assert.equal(next[0].id, detail.episodes[1].id)
  assert.equal(store.library().history[0].position, 100)
  cleanup()
  assert.equal(player.disposed, true)
  assert.equal(player.onEnded, undefined)
  assert.equal(state.audioActive, false)
})

test('取流未完成即退出，不启动或泄漏播放器', async () => {
  const { load, state } = runtime()
  const drama = load('parse').parseDrama(sample)
  const episode = { id: episodes[0].vid, number: 1, title: '第 1 集' }
  let complete
  load('hongguo').hongguo.resolve = () => new Promise(resolve => { complete = resolve })
  load('views/Player').PlayerView({ detail: { drama, episodes: [episode] }, episode, onNext: () => {}, onClose: () => {} })
  const cleanup = state.effects.shift()()
  cleanup()
  complete({ url: 'https://media.example.test/test.mp4', headers: {} })
  await flush()
  assert.equal(state.players.length, 0)
  assert.equal(load('store').library().history.length, 0)
})

test('取流失败保持原生错误页，不创建网页或伪造历史', async t => {
  const { load, state } = runtime()
  const drama = load('parse').parseDrama(sample)
  const episode = { id: episodes[1].vid, number: 2, title: '第 2 集' }
  load('hongguo').hongguo.resolve = async () => { throw new Error('红果返回的数据为空或过大') }
  load('views/Player').PlayerView({ detail: { drama, episodes: [episode] }, episode, onNext: () => {}, onClose: () => {} })
  const cleanup = state.effects.shift()()
  t.after(cleanup)
  await flush()
  assert.equal(state.webViews.length, 0)
  assert.equal(state.players.length, 0)
  assert.ok(state.values.some(value => value === 'Error: 红果返回的数据为空或过大'))
  assert.equal(load('store').library().history.length, 0)
})

test('原生播放切换备用线路、刷新一次，最多自动恢复三次并保留进度', async t => {
  const { load, state } = runtime()
  const drama = load('parse').parseDrama(sample)
  const episode = { id: episodes[0].vid, number: 1, title: '第 1 集' }
  let resolves = 0
  load('hongguo').hongguo.resolve = async () => {
    resolves++
    return { url: 'https://media.example.test/main.mp4', headers: {}, alternatives: [{ url: 'https://media.example.test/backup.mp4', headers: {} }] }
  }
  load('views/Player').PlayerView({ detail: { drama, episodes: [episode] }, episode, onNext: () => {}, onClose: () => {} })
  const cleanup = state.effects.shift()()
  t.after(cleanup)
  await flush()
  state.players[0].duration = 100
  state.players[0].onReadyToPlay()
  state.players[0].currentTime = 25
  state.players[0].onError('unsupported')
  state.players[0].onError('unsupported again')
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(state.players.length, 2)
  assert.equal(state.players[1].source, 'https://media.example.test/backup.mp4')
  state.players[1].duration = 100
  state.players[1].onReadyToPlay()
  assert.equal(state.players[1].currentTime, 25)
  for (let index = 1; index < 4; index++) {
    state.players[index].onError('failed')
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.equal(resolves, 2)
  assert.equal(state.players.length, 4)
  assert.equal(state.webViews.length, 0)
  assert.ok(state.players.every(player => player.disposed))
  assert.ok(state.values.some(value => typeof value === 'string' && value.startsWith('自动恢复未成功')))
})

test('可选联网检查：只请求目录和详情文本', { skip: process.env.GUO_LIVE !== '1' }, async () => {
  const { load, state } = runtime()
  state.fetch = liveFetch
  const { hongguo } = load('hongguo')
  const page = await hongguo.catalog(hongguo.categories[0], null)
  assert.ok(page.items.length > 0, '目录应返回可识别的剧集')
  const detail = await hongguo.detail(page.items[0])
  assert.ok(detail.episodes.length > 0)
  assert.ok(state.calls.every(call => !/\.(jpg|png|webp)(\?|$)/.test(call.url)))
  console.log(`联网检查：目录 ${page.items.length} 部，详情 ${detail.episodes.length} 集`)
})
