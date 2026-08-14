import { SFKeyboardView } from './components/SFKeyboardView'
import { getKeyboardLayout } from './utils/layout'

/**
 * SF Keyboard —— 自定义键盘入口
 *
 * 左侧分类、右侧图标网格：
 *  - 点击图标：把图标名输入到光标处
 *  - 长按图标：复制名称 / 复制 PNG
 *  - 「取词搜索」：拿光标前的词做搜索，选中后自动替换掉这个词
 */
async function main() {
  const layout = getKeyboardLayout()

  await Promise.all([
    CustomKeyboard.setToolbarVisible(false),
    CustomKeyboard.requestHeight(layout.totalHeight),
  ])

  CustomKeyboard.present(<SFKeyboardView />)
}

main()
