import { contentKey, playbackResponse } from '../playback_crypto'
import { remuxCommand, shellQuote } from '../prepare_media'
import { playerHeaders } from '../player_sign'
import { createHash } from 'crypto'

export async function verifyMediaEngine(): Promise<string> {
  const key = '0123456789abcdef0123456789abcdef'
  const headers = playerHeaders('aid=8662&device_id=1000000000000000000', '{"series_id":"1234567890123456789"}', '1000000000000000000', 1700000000000, Uint8Array.from({ length: 11 }, (_, index) => index))
  if (createHash('sha256').update(headers['X-Argus']).digest('hex') !== '07a71521e0aaa896b47fc80730c89347ce63b8be695dbd96fa9fd1f9f298de72' || headers['X-Ladon'] !== 'AgMEBVbVr6bCGXEl3RbL1aAkpFHJpdxRfjTl94yWLoz6K/SQ') throw new Error('播放签名组件验证失败')
  if (contentKey('mr8T+FqxEf1fsBDgaZkS5WyZK9Fhmy3WYpgyyUizNM5LspWcnpiagA==') !== key || playbackResponse('v2.abcd709a38795a812344c27f2406ed7712ce8b9caa385292f39c4abfbcc9d863e13a.liIkxbavowHfmhBUtkxKeeGW6sHy86/cJQStjY3nRXM=').verified !== 'native') throw new Error('取流解析组件验证失败')
  const directory = `${FileManager.temporaryDirectory}/guo-media-check-${Date.now()}`
  await FileManager.createDirectory(directory, true)
  try {
    const input = directory + '/encrypted.mp4'
    const output = directory + '/clear.mp4'
    const commands = [
      `ffmpeg -hide_banner -loglevel error -nostdin -y -f lavfi -i color=c=black:s=160x90:r=10 -t 1 -c:v mpeg4 -threads 1 -an -encryption_scheme cenc-aes-ctr -encryption_key ${key} -encryption_kid 11111111111111111111111111111111 ${shellQuote(input)}`,
      remuxCommand(input, output, key),
      `ffmpeg -hide_banner -loglevel error -nostdin -i ${shellQuote(output)} -f null -`
    ]
    for (let index = 0; index < commands.length; index++) {
      const result = await Shell.run(commands[index], { timeout: 30 })
      if (result.exitCode !== 0 || result.cancelled || result.timedOut) throw new Error(`媒体验证第 ${index + 1} 步失败：${result.output.slice(-600)}`)
    }
    return '媒体验证通过：完整播放签名、备用接口响应解析、媒体密钥解析，以及 Scripting 自带 FFmpeg 的合成 CENC 视频解密封装和完整解码均通过。未请求站源图片或视频。'
  } finally {
    if (await FileManager.exists(directory)) await FileManager.remove(directory)
  }
}
