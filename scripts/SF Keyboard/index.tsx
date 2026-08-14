import { Navigation, NavigationStack } from 'scripting'
import { LibraryView } from './views/LibraryView'

/**
 * SF Keyboard —— App 入口
 *
 * 用来浏览 / 搜索图标、复制名称或 PNG，以及导入源文件更新图标列表。
 * 键盘本体在 keyboard.tsx。
 */
Navigation.present({
  element: (
    <NavigationStack>
      <LibraryView />
    </NavigationStack>
  ),
})
