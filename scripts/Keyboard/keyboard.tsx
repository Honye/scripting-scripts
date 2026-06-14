import KeyboardView from './components/KeyboardView'
import { KEYBOARD_HEIGHT, POPUP_RISE } from './constansts/layout'

async function main() {
  await Promise.all([
    // Hide the default toolbar
    CustomKeyboard.setToolbarVisible(false),
    // 系统键盘高度: English 无工具栏 226
    // 系统键盘候选词（工具栏）高度：45
    // 额外加上 POPUP_RISE：为第一排气泡预留顶部空间
    CustomKeyboard.requestHeight(KEYBOARD_HEIGHT + POPUP_RISE),
  ])

  CustomKeyboard.present(<KeyboardView />)
}

main()
