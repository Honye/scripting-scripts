import type { AbortSignal } from 'scripting'
import type { MediaVariant } from './types'
import { isHTTP } from './parse'

export interface PreparedMedia {
  url: string
  headers: Record<string, string>
  release: () => Promise<void>
}

export function shellQuote(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'"
}

export function remuxCommand(input: string, output: string, key: string): string {
  if (!/^[0-9a-f]{32}$/i.test(key)) throw new Error('红果媒体密钥无效')
  return `ffmpeg -hide_banner -loglevel error -nostdin -y -decryption_key ${shellQuote(key)} -i ${shellQuote(input)} -map 0:v:0 -map '0:a:0?' -c copy -movflags +faststart ${shellQuote(output)}`
}

export async function prepareMedia(media: MediaVariant, signal: AbortSignal, progress: (message: string) => void): Promise<PreparedMedia> {
  if (signal.aborted) throw new Error('请求已取消')
  if (!media.decryptionKey) return { url: media.url, headers: media.headers, release: async () => {} }
  if (!/^[0-9a-f]{32}$/i.test(media.decryptionKey) || !isHTTP(media.url)) throw new Error('红果媒体参数无效')
  if (typeof DownloadManager === 'undefined' || typeof Shell === 'undefined') throw new Error('当前 Scripting 缺少本地媒体处理组件')
  const directory = `${FileManager.temporaryDirectory}/guo-playback-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const input = directory + '/input.mp4'
  const output = directory + '/playback.mp4'
  let task: DownloadManager.Task | null = null
  let queue: DownloadManager.Queue | null = null
  const cancel = () => { void task?.cancel().catch(() => {}) }
  const release = async () => {
    if (await FileManager.exists(directory)) await FileManager.remove(directory)
  }
  await FileManager.createDirectory(directory, true)
  signal.addEventListener('abort', cancel)
  try {
    queue = await DownloadManager.open({
      identifier: 'guo-playback-v1', mode: 'foreground', maxConcurrentTasks: 1,
      timeoutIntervalForRequest: 20, timeoutIntervalForResource: 120,
      retry: { maxAttempts: 2, baseDelay: 1, maxDelay: 2 }
    })
    if (signal.aborted) throw new Error('请求已取消')
    progress('正在缓冲本集…')
    task = await queue.download({ url: media.url, headers: media.headers, destination: input })
    task.onProgress = value => {
      if (!signal.aborted && value.fractionCompleted !== null) progress(`正在缓冲本集… ${Math.round(value.fractionCompleted * 100)}%`)
    }
    if (signal.aborted) { await task.cancel(); throw new Error('请求已取消') }
    await task.waitUntilFinished()
    if (signal.aborted) throw new Error('请求已取消')
    progress('正在准备本集…')
    const result = await Shell.run(
      remuxCommand(input, output, media.decryptionKey),
      { timeout: 60 }
    )
    if (signal.aborted) throw new Error('请求已取消')
    if (result.timedOut || result.cancelled) throw new Error('本集媒体处理超时，请重试或切换线路')
    if (result.exitCode !== 0 || !(await FileManager.isFile(output))) {
      const unavailable = /not found|unknown command|unrecognized option.*decryption_key/i.test(result.output)
      throw new Error(unavailable ? '当前 Scripting 的媒体组件不支持红果加密视频' : '本集媒体处理失败，请切换线路或重试')
    }
    return { url: output, headers: {}, release }
  } catch (error) {
    if (task) await task.cancel().catch(() => {})
    await release()
    throw error
  } finally {
    signal.removeEventListener('abort', cancel)
    if (task) {
      task.onProgress = null
      await task.remove({ deleteFile: true }).catch(() => {})
    }
    queue?.dispose()
  }
}
