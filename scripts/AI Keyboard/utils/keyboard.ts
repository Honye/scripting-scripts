import {
  systemMarker,
  userMarker,
  assistantMarker,
  endMarker,
} from '../config/constants'

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function get_content(includeLength: boolean): Promise<string> {
  let content =
    (await CustomKeyboard.selectedText) ||
    [
      await CustomKeyboard.textBeforeCursor,
      await CustomKeyboard.textAfterCursor,
    ].join('')
  if (includeLength) {
    const cleanContent = content
      .replace(
        new RegExp(
          `(${escapeRegExp(systemMarker)}|${escapeRegExp(
            userMarker
          )}|${escapeRegExp(assistantMarker)}|${escapeRegExp(endMarker)})`,
          'g'
        ),
        ''
      )
      .replace(/\n+/g, '\n')
    content = `长度: ${cleanContent.length}\n\n${content}`
  }
  return content
}

export async function get_content_for_new_buttons(): Promise<string> {
  let inputText = await get_content(false)
  let trimmedInputText = (inputText || '').trim()
  if (trimmedInputText) return trimmedInputText

  let clipboardText = ((await Pasteboard.getString()) || '').trim()
  if (clipboardText) return clipboardText

  return ''
}

export async function delete_content(times: number) {
  for (let i = 0; i < times; i++) {
    await CustomKeyboard.deleteBackward()
  }
}
