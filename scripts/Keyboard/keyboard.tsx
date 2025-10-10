import KeyboardView from './components/KeyboardView'

async function main() {
  await Promise.all([
    // Hide the default toolbar
    CustomKeyboard.setToolbarVisible(false),
    // 系统键盘高度: English 无工具栏 226
    // 系统键盘候选词（工具栏）高度：45
    CustomKeyboard.requestHeight(226),
  ])

  CustomKeyboard.present(<KeyboardView />)
}

main()
