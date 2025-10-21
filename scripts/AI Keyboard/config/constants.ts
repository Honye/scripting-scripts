export const ai_configs = {
  Grok: {
    api_keys: ['YOUR_GROK_API_KEY_1', 'YOUR_GROK_API_KEY_2'],
    proxy_urls: ['https://api.milltea.com'],
    models: ['grok-3-fast-beta', 'mixtral-8x7b-32768'],
    api_endpoint_template: '{proxy_url}/v1/chat/completions',
    type: 'openai_compatible',
  },
  ChatGPT: {
    api_keys: ['YOUR_CHATGPT_API_KEY_1', 'YOUR_CHATGPT_API_KEY_2'],
    proxy_urls: ['https://api.openai.com', 'YOUR_CHATGPT_PROXY_URL'],
    models: ['gpt-4o', 'gpt-3.5-turbo'],
    api_endpoint_template: '{proxy_url}/v1/chat/completions',
    type: 'openai_compatible',
  },
  DeepSeek: {
    api_keys: ['YOUR_DEEPSEEK_API_KEY_1'],
    proxy_urls: ['https://api.deepseek.com'],
    models: ['deepseek-chat', 'deepseek-coder'],
    api_endpoint_template: '{proxy_url}/v1/chat/completions',
    type: 'openai_compatible',
  },
  Gemini: {
    api_keys: ['YOUR_GEMINI_API_KEY_1'],
    proxy_urls: ['https://generativelanguage.googleapis.com'],
    models: ['gemini-2.5-pro', 'gemini-pro'],
    api_endpoint_template:
      '{proxy_url}/v1beta/models/{model}:generateContent?key={api_key}',
    type: 'gemini',
  },
}
export type AIServiceType = keyof typeof ai_configs

export const usage_toast = true
export const keyboard_vibrate = 0 // -1:无振动, 0~2: 振动强度

export const role_data: Record<string, [string, string, string?]> = {
  助手: ['', '你是一个热心且乐于助人的Ai助手，提供帮助和建议。', ''],
  续写: ['', '用相同语言继续创作或完成内容。'],
  翻译文本: ['将所给内容翻译成指定语言。', ''],
  总结: ['', '用相同语言总结内容，提炼出关键信息。'],
  润色: ['', '用相同语言对内容进行润色或优化。'],
  百度搜索: ['', ''],
  扩展: [
    '',
    '你是一名高级网络工程师兼自动化脚本专家，精通 Surge、JSBox、JavaScript 和 API 调用，且具有极强的逻辑分析与优化能力。请从专业技术视角出发，基于以下内容，进行详细推演、拓展、优化或修复建议，以利于高效实现目标功能：\n\n{USER_CONTENT}',
  ],
  吐槽: ['', '使用相同语言启动强烈的怼人模式，进行尖锐的反击讽刺与吐槽。'],
  谷歌搜索: ['', ''],
}

export const translateTargets: Record<
  string,
  { name: string; prompt: string }
> = {
  en: {
    name: '英语',
    prompt:
      'Translate the following text to English (American English preferably, if not specified otherwise).',
  },
  'zh-Hans': { name: '中文', prompt: '将以下文本翻译成中文（简体）。' },
  ja: { name: '日语', prompt: '将以下文本翻译成日语。' },
  th: { name: '泰语', prompt: '将以下文本翻译成泰语。' },
  hxw: {
    name: '火星文',
    prompt:
      '将以下文本转换成火星文风格，请使用网络上流行的、非主流的、有趣的字符或表达方式。',
  },
}

export const edit_tool: Record<string, string> = {
  Start: 'arrow.left.to.line',
  Left: 'arrow.left',
  Right: 'arrow.right',
  End: 'arrow.right.to.line',
  Return: 'return',
  Copy: 'doc.on.doc',
  Paste: 'doc.on.clipboard',
  Cut: 'scissors',
  Empty: 'trash',
  Dismiss: 'keyboard.chevron.compact.down',
}

// Storage Keys
export const PREF_TRANSLATE_TARGET_KEY = 'keyboard_translate_target_key_v1'
export const PREF_CURRENT_AI_SERVICE = 'keyboard_ai_service_name_v1'
export const PREF_AI_CONFIG_INDICES = 'keyboard_ai_config_indices_v1'
export const dialogueKey = 'keyboard_dialogue_v1'
export const sprayButtonModeKey = 'keyboard_spray_mode_v1'

export const systemMarker = '⚙️ 系统:\n'
export const userMarker = '👨‍💻 用户:\n'
export const assistantMarker = '🤖 助手:\n'
export const endMarker = '🔚'

export const user_gesture = {
  tap: 1,
  long_press: 0,
}
