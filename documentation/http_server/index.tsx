/**
 * HttpServer 端到端冒烟 demo
 *
 * 启动后会监听一个随机端口(`server.start({ port: 0 })`),并把多种 handler
 * 注册上去:
 *   - 同步 handler GET /sync (registerHandler,已 @deprecated)
 *   - 异步 handler GET /slow (服务端 sleep 200ms 再返回,registerAsyncHandler)
 *   - 路径变量 GET /user/:id (验证 request.params 的 key 没有 ":" 前缀)
 *   - queryParams GET /query?a=1&b=2
 *   - 静态文件 GET /readme (registerFile)
 *   - 目录服务 GET /static/:path (registerFilesFromDirectory)
 *   - 目录浏览 GET /browse/:path (registerDirectoryBrowser)
 *   - WebSocket /ws (echo)
 *   - async middleware:挂在所有路由前;请求带 X-Allow header 才放行,否则 401
 *   - 自定义 404 (setNotFoundHandler):把请求路径回显到 body
 *
 * UI 上有 "Run tests" 按钮:启动后在客户端 fetch 一遍每个 endpoint,
 * 并把每行 PASS/FAIL 输出到列表里。还有 "Stop server" 收尾。
 *
 * HTTPS sample:
 *   把下方 `enableHttps` 改成 true 并在 Script.directory 下放一个名为
 *   "server.p12" 的自签名证书(密码改成 P12_PASSWORD 常量),server 会以
 *   https 启动。`fetch` 自签名证书校验失败 — 验证手段是手动 curl -k 试。
 *   P12 也可以直接传 bytes:`tls.p12 = Keychain.getData("server.p12")`
 *   (Keychain 接口是同步的,直接返回 Data | null),接同一个 start API。
 */

import {
  Button, HStack, List, Navigation, NavigationStack, Script,
  Section, Spacer, Text, useState, VStack, Path,
  fetch,
} from "scripting"

const P12_PASSWORD = "swiftertest"
const enableHttps = false

type TestResult = {
  name: string
  pass: boolean
  detail: string
}

// Module-level singleton: 避免 useState lazy initializer 在每次 re-render
// 重跑,旧 HttpServer 被 GC 触发 deinit -> stop 的不可见路径
const server = new HttpServer()

function View() {
  const [port, setPort] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [busy, setBusy] = useState(false)

  // 拼一个本地目录给 registerFile / registerFilesFromDirectory / registerDirectoryBrowser
  // 用 Script.directory 下临时建几个文件
  async function prepareFixtures(): Promise<string> {
    const dir = Path.join(Script.directory, "http_demo_root")
    await FileManager.createDirectory(dir, true)

    const indexHTML = Path.join(dir, "index.html")
    if (!FileManager.existsSync(indexHTML)) {
      await FileManager.writeAsString(indexHTML, "<h1>index ok</h1>")
    }
    const note = Path.join(dir, "note.txt")
    if (!FileManager.existsSync(note)) {
      await FileManager.writeAsString(note, "hello from note")
    }
    const subdir = Path.join(dir, "sub")
    await FileManager.createDirectory(subdir, true)
    const subFile = Path.join(subdir, "inside.txt")
    if (!FileManager.existsSync(subFile)) {
      await FileManager.writeAsString(subFile, "deep file")
    }
    return dir
  }

  async function startServer() {
    if (running) return
    setBusy(true)
    try {
      const fixtureDir = await prepareFixtures()

      server.registerHandler("/sync", _ => {
        return HttpResponse.ok(HttpResponseBody.text("sync ok"))
      })

      // 异步 handler:走 registerAsyncHandler,JS 端可以返回 Promise,
      // server 在 setAsync 路径里 await 之后再发响应
      server.registerAsyncHandler("/slow", async _ => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return HttpResponse.ok(HttpResponseBody.text("slow ok"))
      })

      server.registerHandler("/user/:id", req => {
        const id = req.params["id"] ?? "<missing>"
        return HttpResponse.ok(HttpResponseBody.text(`user id = ${id}`))
      })

      server.registerHandler("/query", req => {
        const dump = req.queryParams.map(q => `${q.key}=${q.value}`).join("&")
        return HttpResponse.ok(HttpResponseBody.text(dump))
      })

      server.registerFile("/readme", Path.join(fixtureDir, "note.txt"))

      server.registerFilesFromDirectory("/static/:path", fixtureDir, {
        defaults: ["index.html"],
      })

      server.registerDirectoryBrowser("/browse/:path", fixtureDir)

      server.registerWebsocket("/ws", {
        handleText: (session, text) => {
          session.writeText(`echo:${text}`)
        },
      })

      // /protected 由 async middleware 守卫:必须带 x-auth header 才放行
      server.registerAsyncHandler("/protected", async _ => {
        return HttpResponse.ok(HttpResponseBody.text("welcome"))
      })

      // async middleware: 只对 /protected 生效,其它路由放行
      server.registerMiddleware(async req => {
        if (req.path === "/protected" && !req.headers["x-auth"]) {
          return HttpResponse.unauthorized(HttpResponseBody.text("missing x-auth"))
        }
        return null
      })

      // 自定义 async 404,把请求路径回显到 body
      server.setNotFoundHandler(async req => {
        return HttpResponse.notFound(HttpResponseBody.text(`no route: ${req.path}`))
      })

      const startOptions: any = { port: 0 }
      if (enableHttps) {
        startOptions.port = 0
        startOptions.tls = {
          p12: Path.join(Script.directory, "server.p12"),
          password: P12_PASSWORD,
        }
      }
      const err = server.start(startOptions)
      if (err) {
        console.error("server start failed:", err)
        Dialog.alert({ title: "Start failed", message: err })
        return
      }
      setPort(server.port)
      setRunning(true)
      console.log("server listening on port", server.port)
    } catch (e) {
      console.error(e)
      Dialog.alert({ title: "Start error", message: String(e) })
    } finally {
      setBusy(false)
    }
  }

  function stopServer() {
    server.stop()
    setRunning(false)
    setPort(null)
    setResults([])
  }

  async function runTests() {
    if (!running || port == null) return
    setBusy(true)
    const collected: TestResult[] = []
    const scheme = enableHttps ? "https" : "http"
    const base = `${scheme}://127.0.0.1:${port}`

    async function check(name: string, req: () => Promise<{ status: number; text: string }>, expect: (r: { status: number; text: string }) => string | null) {
      try {
        const r = await req()
        const failReason = expect(r)
        collected.push({
          name,
          pass: failReason == null,
          detail: failReason ?? `${r.status} ${r.text.slice(0, 80)}`,
        })
      } catch (e) {
        collected.push({ name, pass: false, detail: `threw: ${String(e)}` })
      }
    }

    async function fetchText(url: string, headers?: Record<string, string>): Promise<{ status: number; text: string }> {
      const resp = await fetch(url, headers ? { headers } : undefined)
      const text = await resp.text()
      return { status: resp.status, text }
    }

    await check("GET /sync", () => fetchText(`${base}/sync`), r =>
      r.status === 200 && r.text === "sync ok" ? null : `expected 200 "sync ok"`)

    await check("GET /slow (async, ~200ms)", () => fetchText(`${base}/slow`), r =>
      r.status === 200 && r.text === "slow ok" ? null : `expected 200 "slow ok"`)

    await check("GET /user/:id (params key without colon)", () => fetchText(`${base}/user/42`), r =>
      r.status === 200 && r.text === "user id = 42" ? null : `expected "user id = 42"`)

    await check("GET /query?a=1&b=2", () => fetchText(`${base}/query?a=1&b=2`), r =>
      r.status === 200 && r.text === "a=1&b=2" ? null : `expected "a=1&b=2"`)

    await check("GET /readme (registerFile)", () => fetchText(`${base}/readme`), r =>
      r.status === 200 && r.text === "hello from note" ? null : `expected note content`)

    await check("GET /static/ (default index.html)", () => fetchText(`${base}/static/`), r =>
      r.status === 200 && r.text.includes("index ok") ? null : `expected index.html content`)

    await check("GET /static/note.txt", () => fetchText(`${base}/static/note.txt`), r =>
      r.status === 200 && r.text === "hello from note" ? null : `expected note content`)

    // 关键回归:之前 fopen 在目录上不会失败,导致命中目录返回 200 + 空 body。
    // 修复后命中目录(/static/sub)应该是 404
    await check("GET /static/sub (directory hit -> 404)", () => fetchText(`${base}/static/sub`), r =>
      r.status === 404 ? null : `expected 404, got ${r.status} "${r.text}"`)

    await check("GET /browse/ (directoryBrowser root list)", () => fetchText(`${base}/browse/`), r =>
      r.status === 200 && r.text.toLowerCase().includes("note.txt") ? null : `expected listing with note.txt`)

    await check("GET /browse/note.txt (directoryBrowser file)", () => fetchText(`${base}/browse/note.txt`), r =>
      r.status === 200 && r.text === "hello from note" ? null : `expected note content`)

    // async middleware:无 x-auth header 时被 401 截胡
    await check("GET /protected without x-auth (middleware 401)", () => fetchText(`${base}/protected`), r =>
      r.status === 401 && r.text === "missing x-auth" ? null : `expected 401 "missing x-auth", got ${r.status} "${r.text}"`)

    // 带 x-auth header 时 middleware 放行,/protected handler 返回 welcome
    await check("GET /protected with x-auth (middleware pass-through)", () => fetchText(`${base}/protected`, { "x-auth": "token" }), r =>
      r.status === 200 && r.text === "welcome" ? null : `expected 200 "welcome", got ${r.status} "${r.text}"`)

    // 自定义 404: setNotFoundHandler 把请求路径回显到 body
    await check("GET /nope (setNotFoundHandler echoes path)", () => fetchText(`${base}/nope`), r =>
      r.status === 404 && r.text === "no route: /nope" ? null : `expected 404 "no route: /nope", got ${r.status} "${r.text}"`)

    // WebSocket echo:用 WebSocket 客户端连一下
    // 注:WebSocket.onmessage 直接收 string | Data,不是 event 对象
    await check("WebSocket /ws echo", async () => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)
      const received = await new Promise<string>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ws timeout")), 3000)
        ws.onopen = () => ws.send("ping")
        ws.onmessage = msg => {
          clearTimeout(t)
          const text = typeof msg === "string" ? msg : (msg.toRawString() ?? "")
          resolve(text)
        }
        ws.onerror = e => {
          clearTimeout(t)
          reject(e)
        }
      })
      ws.close()
      return { status: 200, text: received }
    }, r => r.text === "echo:ping" ? null : `expected "echo:ping", got "${r.text}"`)

    setResults(collected)
    setBusy(false)
    console.log("tests done", collected.filter(r => r.pass).length, "/", collected.length, "passed")
  }

  // 注:不能用 useEffect cleanup 来 stop server —— Scripting 的 hook
  // 在 setState 触发 re-render 时会重跑 cleanup,会把 server 关掉。
  // 改成 Close 按钮显式 stop + dismiss。
  const dismiss = Navigation.useDismiss()
  function closeAndStop() {
    server.stop()
    dismiss()
  }

  return <NavigationStack>
    <List
      navigationTitle="HttpServer demo"
      toolbar={{
        topBarTrailing: <Button title="Close" action={closeAndStop} />,
      }}
    >
      <Section title="Server">
        <HStack>
          <Text>State</Text>
          <Spacer />
          <Text>{server.state}{port != null ? ` :${port}` : ""}</Text>
        </HStack>
        {/* 注:多个 Button 在 List 的 Section 里要垂直直接排,不要塞在
            HStack 里 —— SwiftUI List 行里两个 Button 排一起,点击事件
            会扩散到整行,两个 Button 都被命中,Start/Stop 误触跑测试。 */}
        {running
          ? <Button title="Stop server" disabled={busy} action={stopServer} />
          : <Button title="Start server" disabled={busy} action={startServer} />}
        <Button title="Run tests" disabled={!running || busy} action={runTests} />
      </Section>
      {results.length > 0 ? <Section title={`Results (${results.filter(r => r.pass).length}/${results.length})`}>
        {results.map((r, i) =>
          <VStack key={String(i)} alignment="leading">
            <HStack>
              <Text foregroundStyle={r.pass ? "green" : "red"}>{r.pass ? "PASS" : "FAIL"}</Text>
              <Text>{r.name}</Text>
            </HStack>
            <Text font="caption" foregroundStyle="secondaryLabel">{r.detail}</Text>
          </VStack>
        )}
      </Section> : null}
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present(<View />)
  Script.exit()
}

run()
