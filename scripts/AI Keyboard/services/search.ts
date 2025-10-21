import { get_content_for_new_buttons } from '../utils/keyboard'

export async function performSearch(
  engine: 'baidu' | 'google',
  setGenerating: (g: boolean) => void
) {
  let query = await get_content_for_new_buttons().catch((err) => {
    throw err
  })

  if (!query || query.trim() === '') {
    return Dialog.alert({ message: '请输入或粘贴搜索内容' })
  }

  setGenerating(true)
  let searchUrl = ''
  const encodedQuery = encodeURIComponent(query)

  if (engine === 'baidu') {
    searchUrl = `https://www.baidu.com/s?wd=${encodedQuery}`
  } else if (engine === 'google') {
    searchUrl = `https://www.google.com/search?q=${encodedQuery}`
  } else {
    setGenerating(false)
    return Dialog.alert({ message: '未知的搜索引擎' })
  }
  console.log('[DEBUG] 搜索 URL:', searchUrl)
  Safari.openURL(searchUrl)
  setTimeout(() => setGenerating(false), 500)
}
