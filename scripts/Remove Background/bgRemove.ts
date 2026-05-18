// Hosts @imgly/background-removal inside a hidden WebView and exposes a
// promise-based API to the rest of the script. The library and the ONNX
// model are downloaded by the WebView on first run (~80MB) and cached by
// the system network cache for subsequent runs.

const LIB_VERSION = '1.4.5'

const LIB_URLS = [
  `https://esm.sh/@imgly/background-removal@${LIB_VERSION}`,
  `https://cdn.jsdelivr.net/npm/@imgly/background-removal@${LIB_VERSION}/dist/browser.mjs`,
  `https://unpkg.com/@imgly/background-removal@${LIB_VERSION}/dist/browser.mjs`,
  `https://staticimgly.com/@imgly/background-removal/${LIB_VERSION}/dist/browser.mjs`
]

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>bg-remove</title>
</head>
<body>
<div id="status">loading…</div>
<script>
(function () {
  window.__lib_ready = false
  window.__lib_error = null
  window.__lib_attempts = []
  window.__lib_started = true

  var removeBackground = null

  window.addEventListener('error', function (e) {
    if (!window.__lib_ready && !window.__lib_error) {
      window.__lib_error = 'window.error: ' + (e && e.message ? e.message : String(e))
    }
  })
  window.addEventListener('unhandledrejection', function (e) {
    if (!window.__lib_ready && !window.__lib_error) {
      var r = e && e.reason
      window.__lib_error = 'unhandledrejection: ' + (r && r.message ? r.message : String(r))
    }
  })

  var URLS = ${JSON.stringify(LIB_URLS)}

  function importWithTimeout(url, ms) {
    return new Promise(function (resolve, reject) {
      var done = false
      var t = setTimeout(function () {
        if (!done) {
          done = true
          reject(new Error('import timeout after ' + ms + 'ms'))
        }
      }, ms)
      import(url).then(function (mod) {
        if (!done) {
          done = true
          clearTimeout(t)
          resolve(mod)
        }
      }, function (err) {
        if (!done) {
          done = true
          clearTimeout(t)
          reject(err)
        }
      })
    })
  }

  ;(async function () {
    var errors = []
    for (var i = 0; i < URLS.length; i++) {
      var url = URLS[i]
      try {
        var mod = await importWithTimeout(url, 8000)
        var fn = mod.removeBackground
          || (mod.default && (typeof mod.default === 'function' ? mod.default : mod.default.removeBackground))
        if (typeof fn !== 'function') {
          throw new Error('removeBackground export not found in module from ' + url)
        }
        removeBackground = fn
        window.__lib_source = url
        window.__lib_ready = true
        var el = document.getElementById('status')
        if (el) el.textContent = 'ready (' + url + ')'
        return
      } catch (e) {
        var msg = (e && e.message ? e.message : String(e))
        errors.push(url + ' -> ' + msg)
        window.__lib_attempts = errors.slice()
      }
    }
    window.__lib_error = 'all CDNs failed: ' + errors.join(' | ')
    var el2 = document.getElementById('status')
    if (el2) el2.textContent = 'error: ' + window.__lib_error
  })()

  window.__processImage = async function (dataUrl) {
    if (!removeBackground) throw new Error(window.__lib_error || 'library not ready')
    var blob = await removeBackground(dataUrl, {
      output: { format: 'image/png', quality: 0.9 }
    })
    return await new Promise(function (resolve, reject) {
      var r = new FileReader()
      r.onload = function () {
        var s = String(r.result || '')
        var i = s.indexOf(',')
        resolve(i >= 0 ? s.substring(i + 1) : s)
      }
      r.onerror = function () { reject(r.error || new Error('FileReader failed')) }
      r.readAsDataURL(blob)
    })
  }
})()
</script>
</body>
</html>`

export class BgRemover {
  readonly controller: WebViewController
  private loadPromise: Promise<void> | null = null

  constructor() {
    this.controller = new WebViewController()
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        await this.controller.loadHTML(HTML, 'https://imgly.local/')
      })()
    }
    return this.loadPromise
  }

  async processBase64(base64: string, mimeType: string = 'image/png'): Promise<string> {
    await this.ensureLoaded()
    const dataUrl = `data:${mimeType};base64,${base64}`
    const inputLiteral = JSON.stringify(dataUrl)

    const code = `
      return new Promise(function(resolve) {
        (async function() {
          try {
            if (!window.__lib_started) {
              return resolve({ ok: false, error: 'WebView script did not start — loadHTML may not have executed inline scripts' })
            }
            const start = Date.now()
            while (!window.__lib_ready) {
              if (window.__lib_error) {
                return resolve({ ok: false, error: window.__lib_error })
              }
              if (Date.now() - start > 45000) {
                return resolve({
                  ok: false,
                  error: 'timeout loading background-removal library. attempts: '
                    + JSON.stringify(window.__lib_attempts || [])
                })
              }
              await new Promise(function(r) { setTimeout(r, 100) })
            }
            const out = await window.__processImage(${inputLiteral})
            resolve({ ok: true, data: out })
          } catch (e) {
            resolve({ ok: false, error: String((e && e.message) ? e.message : e) })
          }
        })()
      })
    `

    const evalPromise = this.controller.evaluateJavaScript<{
      ok: boolean
      data?: string
      error?: string
    }>(code)

    // Allow up to 3 minutes — first call also downloads ~80MB of ONNX model.
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('background removal hard timeout (180s)')), 180000)
    })

    const result = await Promise.race([evalPromise, timeoutPromise])

    if (!result || !result.ok || !result.data) {
      throw new Error((result && result.error) || 'background removal failed')
    }
    return result.data
  }

  dispose() {
    this.controller.dispose()
  }
}
