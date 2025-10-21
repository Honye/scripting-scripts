import { useState, useCallback, useEffect, fetch } from 'scripting'
import {
  ai_configs,
  AIServiceType,
  dialogueKey,
  PREF_AI_CONFIG_INDICES,
  PREF_CURRENT_AI_SERVICE,
  PREF_TRANSLATE_TARGET_KEY,
  translateTargets,
  user_gesture,
} from '../config/constants'
import { callAI } from '../services/ai'
import {
  get_content,
  delete_content,
  get_content_for_new_buttons,
} from '../utils/keyboard'

type AIConfigIndices = Record<
  string,
  { key_idx: number; proxy_idx: number; model_idx: number }
>

export function useAIKeyboard() {
  const [isGenerating, setGenerating] = useState(false)
  const [isMultiTurn, setMultiTurn] = useState(
    Storage.get<{ mode: boolean }>(dialogueKey)?.mode || false
  )
  const [currentAIServiceName, setCurrentAIServiceName] = useState(
    (Storage.get<string>(PREF_CURRENT_AI_SERVICE) || Object.keys(ai_configs)[0]) as AIServiceType
  )
  const [currentConfigIndices, setCurrentConfigIndices] =
    useState<AIConfigIndices>(
      Storage.get<AIConfigIndices>(PREF_AI_CONFIG_INDICES) || {}
    )
  const [currentTranslateTarget, setCurrentTranslateTarget] = useState(
    Storage.get<string>(PREF_TRANSLATE_TARGET_KEY) || 'zh-Hans'
  )
  const [contextVisible, setContextVisible] = useState(false)
  const [contextContent, setContextContent] = useState('')
  const [banner, setBanner] = useState('')

  useEffect(() => {
    // Initialize indices for any new services
    const updatedIndices = { ...currentConfigIndices }
    let needsUpdate = false
    Object.keys(ai_configs).forEach((serviceName) => {
      if (!updatedIndices[serviceName]) {
        updatedIndices[serviceName] = { key_idx: 0, proxy_idx: 0, model_idx: 0 }
        needsUpdate = true
      }
    })
    if (needsUpdate) {
      setCurrentConfigIndices(updatedIndices)
      Storage.set(PREF_AI_CONFIG_INDICES, updatedIndices)
    }
  }, [])

  const getCurrentAiConfig = useCallback(() => {
    const service_config = ai_configs[currentAIServiceName]
    const indices = currentConfigIndices[currentAIServiceName]

    if (!service_config || !indices) {
      const fallbackServiceName = Object.keys(ai_configs)[0] as AIServiceType
      Dialog.alert({
        message: `AI 服务 "${currentAIServiceName}" 未配置，已切换回 ${fallbackServiceName}`,
      })
      setCurrentAIServiceName(fallbackServiceName)
      Storage.set(PREF_CURRENT_AI_SERVICE, fallbackServiceName)
      // This will trigger a re-render and the function will be called again with the correct config
      return null
    }

    const api_key =
      service_config.api_keys[indices.key_idx % service_config.api_keys.length]
    const proxy_url_base =
      service_config.proxy_urls[
        indices.proxy_idx % service_config.proxy_urls.length
      ]
    const model =
      service_config.models[indices.model_idx % service_config.models.length]

    let api_url = service_config.api_endpoint_template
      .replace('{proxy_url}', proxy_url_base)
      .replace('{model}', model)

    if (service_config.type === 'gemini') {
      api_url = api_url.replace('{api_key}', api_key)
    }

    return {
      name: currentAIServiceName,
      api_key: api_key,
      model: model,
      api_url: api_url,
      type: service_config.type,
      raw_proxy_url: proxy_url_base,
    }
  }, [currentAIServiceName, currentConfigIndices])

  const toggleMultiTurn = useCallback(() => {
    const newMode = !isMultiTurn
    setMultiTurn(newMode)
    Storage.set(dialogueKey, { mode: newMode })
    Dialog.alert({ message: '对话模式' + (newMode ? ' 开' : ' 关') })
  }, [isMultiTurn])

  const showContext = useCallback(async () => {
    const content = await get_content(true)
    setContextContent(content)
    setContextVisible(true)
  }, [])

  const dismissContext = useCallback(() => {
    setContextVisible(false)
    setContextContent('')
  }, [])

  const edit = useCallback(
    async (action: string, gesture: 'tap' | 'long_press') => {
      HapticFeedback.selection()

      const before = (await CustomKeyboard.textBeforeCursor)?.length || 0
      const after = (await CustomKeyboard.textAfterCursor)?.length || 0

      switch (action) {
        case 'Start':
          return CustomKeyboard.moveCursor(-before)
        case 'Left':
          return CustomKeyboard.moveCursor(-1)
        case 'Right':
          return CustomKeyboard.moveCursor(1)
        case 'End':
          return CustomKeyboard.moveCursor(after)
        case 'Return':
          return CustomKeyboard.insertText('\n')
        case 'Paste':
          const clipboardText = await Clipboard.getText()
          return CustomKeyboard.insertText(clipboardText || '')
        case 'Dismiss':
          return gesture === 'tap' ? CustomKeyboard.dismiss() : CustomKeyboard.dismissToHome()
        case 'Empty':
          if (gesture === 'tap') return CustomKeyboard.deleteBackward()
          break // Continue for long press
      }

      const content = await get_content(false)
      if (action !== 'Empty') {
        await Pasteboard.setString(content)
      }

      if (action === 'Copy') {
        return Dialog.alert({ message: '完成' })
      }

      if (action === 'Cut' || action === 'Empty') {
        const selectedText = await CustomKeyboard.selectedText
        if (!selectedText) {
          await CustomKeyboard.moveCursor(after)
          await delete_content(content.length)
        } else {
          await CustomKeyboard.deleteBackward()
        }
      }
    },
    []
  )

  const gpt = useCallback(
    async (role: string, gesture: 'tap' | 'long_press') => {
      HapticFeedback.selection()
      if (isGenerating) {
        Dialog.alert({ message: '正在生成中' })
        return
      }

      let user_content: string
      let translation_source_info = {
        from_selection: false,
        original_all_text_length_to_delete: 0,
        is_translation_from_input_field: false,
      }

      if (role === '翻译文本') {
        const raw_selected_text = await CustomKeyboard.selectedText
        const raw_all_text = [await CustomKeyboard.textBeforeCursor, await CustomKeyboard.textBeforeCursor].join('')
        user_content = await get_content_for_new_buttons()

        if (raw_selected_text && raw_selected_text.trim() === user_content) {
          translation_source_info.from_selection = true
          translation_source_info.is_translation_from_input_field = true
        } else if (
          !raw_selected_text &&
          raw_all_text &&
          raw_all_text.trim() === user_content
        ) {
          translation_source_info.original_all_text_length_to_delete =
            raw_all_text.length
          translation_source_info.is_translation_from_input_field = true
        }
      } else {
        user_content = await get_content(false)
      }

      const nonTranslateRolesRequireContent = [
        '助手',
        '续写',
        '总结',
        '润色',
        '扩展',
        '吐槽',
      ]
      if (
        !user_content &&
        !isMultiTurn &&
        nonTranslateRolesRequireContent.includes(role)
      ) {
        setBanner('未找到提示')
        setTimeout(() => setBanner(''), 1000)
        return
      }
      if (
        role === '翻译文本' &&
        (!user_content || user_content.trim() === '')
      ) {
        setBanner('请输入或粘贴需要翻译的内容')
        setTimeout(() => setBanner(''), 1000)
        return
      }

      setGenerating(true)

      if (!isMultiTurn) {
        if (!user_gesture[gesture]) {
          await CustomKeyboard.moveCursor(1)
          await CustomKeyboard.insertText('\n')
        }
        const selectedText = await CustomKeyboard.selectedText
        if (user_gesture[gesture] && !selectedText) {
          await delete_content(user_content.length)
        }
      }

      const aiConfig = getCurrentAiConfig()
      if (!aiConfig) {
        setGenerating(false)
        return
      }

      try {
        await callAI({
          aiConfig,
          role,
          user_content,
          isMultiTurn,
          currentTranslateTarget,
          translation_source_info,
        })
      } catch (error: any) {
        console.error(error)
        Dialog.alert({ title: 'AI 请求失败', message: error.message })
      } finally {
        setGenerating(false)
      }
    },
    [isGenerating, isMultiTurn, currentTranslateTarget, getCurrentAiConfig]
  )

  const fetchTextAndSend = useCallback(async () => {
    try {
      const resp = await fetch('https://yyapi.a1aa.cn/api.php?level=max')
      const text = await resp.text()
      if (text) {
        await CustomKeyboard.insertText(text)
        // Scripting does not have a direct `send()` method for keyboard.
        // This would typically be a user action.
        // We can insert a newline to simulate pressing send in some apps.
        await CustomKeyboard.insertText('\n')
        HapticFeedback.lightImpact()
      }
    } catch (error: any) {
      Dialog.alert({ title: '获取文本失败', message: error.message })
    }
  }, [])

  const showLanguageMenu = useCallback(async () => {
    const items = Object.keys(translateTargets).map((key) => {
      return (
        translateTargets[key].name +
        (key === currentTranslateTarget ? ' ✓' : '')
      )
    })
    const selectedIndex = await Dialog.actionSheet({
      title: '选择目标语言',
      actions: items.map((label) => ({ label })),
    })

    if (selectedIndex !== null) {
      const selectedKey = Object.keys(translateTargets)[selectedIndex]
      if (selectedKey !== currentTranslateTarget) {
        setCurrentTranslateTarget(selectedKey)
        Storage.set(PREF_TRANSLATE_TARGET_KEY, selectedKey)
        Dialog.alert({
          message: `翻译目标已设为: ${translateTargets[selectedKey].name}`,
        })
      }
    }
  }, [currentTranslateTarget])

  const changeTranslateTarget = useCallback(async (target: string) => {
    if (target !== currentTranslateTarget) {
      setCurrentTranslateTarget(target)
      Storage.set(PREF_TRANSLATE_TARGET_KEY, target)
    }
  }, [currentTranslateTarget])

  const showAIModelMenu = useCallback(async () => {
    const availableAIs = Object.keys(ai_configs) as AIServiceType[]
    const items = availableAIs.map(
      (aiName) => `${aiName}${aiName === currentAIServiceName ? ' ✓' : ''}`
    )

    const selectedIndex = await Dialog.actionSheet({
      title: '切换 AI 模型',
      actions: items.map((label) => ({ label })),
    })

    if (selectedIndex !== null) {
      const selectedAiName = availableAIs[selectedIndex]
      if (selectedAiName !== currentAIServiceName) {
        setCurrentAIServiceName(selectedAiName)
        Storage.set(PREF_CURRENT_AI_SERVICE, selectedAiName)
        Dialog.alert({ message: `已切换到 ${selectedAiName}` })
      }
    }
  }, [currentAIServiceName])

  const changeAiService = useCallback(async (serviceName: AIServiceType) => {
    if (serviceName !== currentAIServiceName) {
      setCurrentAIServiceName(serviceName)
      Storage.set(PREF_CURRENT_AI_SERVICE, serviceName)
    }
  }, [currentAIServiceName])

  return {
    state: {
      isGenerating,
      isMultiTurn,
      currentAIServiceName,
      currentTranslateTarget,
      contextVisible,
      contextContent,
      banner,
    },
    actions: {
      changeAiService,
      changeTranslateTarget,
      setGenerating,
      toggleMultiTurn,
      showContext,
      dismissContext,
    },
    edit,
    gpt,
    fetchTextAndSend,
    showLanguageMenu,
    showAIModelMenu,
  }
}
