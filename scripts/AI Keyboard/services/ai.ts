import { fetch, HeadersInit } from 'scripting'
import {
  role_data,
  translateTargets,
  userMarker,
  assistantMarker,
  endMarker,
} from '../config/constants'
import { delete_content } from '../utils/keyboard'

type AIConfig = {
  name: string
  api_key: string
  model: string
  api_url: string
  type: string
  raw_proxy_url: string
}

type TranslationSourceInfo = {
  from_selection: boolean
  original_all_text_length_to_delete: number
  is_translation_from_input_field: boolean
}

export async function callAI({
  aiConfig,
  role,
  user_content,
  isMultiTurn,
  currentTranslateTarget,
  translation_source_info,
}: {
  aiConfig: AIConfig
  role: string
  user_content: string
  isMultiTurn: boolean
  currentTranslateTarget: string
  translation_source_info: TranslationSourceInfo
}) {
  let messages: { role: string; content: string }[] = []

  // Build messages array based on mode
  if (isMultiTurn) {
    // Simplified multi-turn logic for brevity. A full implementation
    // would parse the entire text content for conversation history.
    messages.push({ role: 'user', content: user_content })
  } else {
    if (role === '翻译文本') {
      const targetLangConfig = translateTargets[currentTranslateTarget]
      messages.push({ role: 'system', content: targetLangConfig.prompt })
      messages.push({ role: 'user', content: user_content })
    } else {
      if (role_data[role] && role_data[role][0]) {
        messages.push({ role: 'system', content: role_data[role][0] })
      }
      let preset_prompt = role_data[role] ? role_data[role][1] : ''
      let final_content = user_content
      if (preset_prompt) {
        if (preset_prompt.includes('{USER_CONTENT}')) {
          final_content = preset_prompt.replace('{USER_CONTENT}', user_content)
        } else {
          final_content = `${preset_prompt}\n${user_content}`
        }
      }
      messages.push({ role: 'user', content: final_content })
    }
  }

  if (
    messages.length === 0 ||
    (messages.length === 1 &&
      messages[0].role === 'system' &&
      (!messages[0].content || messages[0].content.trim() === '-'))
  ) {
    throw new Error('请输入有效的用户指令。')
  }

  // Prepare request
  let request_body: any
  let request_headers: HeadersInit = { 'Content-Type': 'application/json' }

  if (aiConfig.type === 'openai_compatible') {
    request_headers['Authorization'] = `Bearer ${aiConfig.api_key}`
    request_body = {
      model: aiConfig.model,
      messages: messages.filter((m) => m.content && m.content.trim() !== ''),
    }
  } else if (aiConfig.type === 'gemini') {
    let gemini_messages: { role: string; parts: { text: string }[] }[] = []
    let system_instruction_gemini: { parts: { text: string }[] } | null = null
    for (const msg of messages) {
      if (!msg.content || msg.content.trim() === '') continue
      if (msg.role === 'system') {
        if (!system_instruction_gemini) {
          system_instruction_gemini = { parts: [{ text: msg.content }] }
        } else {
          system_instruction_gemini.parts[0].text += '\n' + msg.content
        }
        continue
      }
      gemini_messages.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
    request_body = { contents: gemini_messages }
    if (system_instruction_gemini) {
      request_body.systemInstruction = system_instruction_gemini
    }
  } else {
    throw new Error(`不支持的 AI 类型: ${aiConfig.type}`)
  }

  const response = await fetch(aiConfig.api_url, {
    method: 'POST',
    headers: request_headers,
    body: JSON.stringify(request_body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `API 请求失败: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  const data = await response.json()
  let response_text = ''

  if (aiConfig.type === 'openai_compatible') {
    if (data.error) throw new Error(data.error.message)
    response_text = data.choices?.[0]?.message?.content || ''
  } else if (aiConfig.type === 'gemini') {
    if (data.error) throw new Error(`Gemini API 错误: ${data.error.message}`)
    if (data.promptFeedback?.blockReason)
      throw new Error(`内容被 Gemini 阻止: ${data.promptFeedback.blockReason}`)
    response_text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  if (!response_text) {
    throw new Error('AI 未返回有效内容')
  }

  // Insert response
  if (!isMultiTurn) {
    if (
      role === '翻译文本' &&
      translation_source_info.is_translation_from_input_field
    ) {
      if (translation_source_info.from_selection) {
        await CustomKeyboard.deleteBackward()
      } else if (
        translation_source_info.original_all_text_length_to_delete > 0
      ) {
        await delete_content(
          translation_source_info.original_all_text_length_to_delete
        )
      }
    }
    await CustomKeyboard.insertText(response_text)
  } else {
    const textToInsert = `\n${assistantMarker}${response_text.trim()}${endMarker}\n\n${userMarker}`
    await CustomKeyboard.insertText(textToInsert)
  }
}
