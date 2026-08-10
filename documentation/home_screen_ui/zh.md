脚本可以接管 App 首页的一个 Tab。在脚本项目里新增 `home_screen_default_ui.tsx`，默认导出一个函数组件，然后在 Tab 里选中该脚本，这个组件就会作为一个完整的 Tab 渲染出来，与 Scripts、Agent、Tools、Settings 并列。

到 **设置** 打开 **Show Home Tab** 开关，Tab 才会出现，默认是关的。

## 文件

```tsx
// home_screen_default_ui.tsx
import { Button, HStack, List, NavigationStack, Section, Text, useState } from "scripting"

export default function HomeScreenView() {
  const [count, setCount] = useState(0)

  return <NavigationStack>
    <List navigationTitle="Home">
      <Section header={<Text>Counter</Text>}>
        <HStack>
          <Text>Tapped {count} times</Text>
          <Button
            title="Tap"
            action={() => setCount(count + 1)}
          />
        </HStack>
      </Section>
    </List>
  </NavigationStack>
}
```

要求：

- 文件名必须是 `home_screen_default_ui.tsx`，放在脚本项目根目录，与 `index.tsx` 同级。
- 必须有 **默认导出**，且导出的是一个函数组件。
- 组件占据整个 Tab，导航形态由你自己决定：`NavigationStack`、`NavigationSplitView`、或者干脆不要导航栏都行，App 不会替你套。

**Reload / Choose Script / Clear Selection** 这组操作在 tab bar 上长按 Home 图标调出，App 不会往你的界面里塞任何东西。

运行时 `Script.env` 的值是 `"home_screen"`，可以据此和 `index.tsx` 复用同一份组件却走不同分支。

文件里的 import 照常解析，所以可以把 UI 拆到同一脚本项目的多个文件里。

## 与 `index.tsx` 的区别

`index.tsx` 是一次「运行」：通常调用 `Navigation.present(...)`，最后以 `Script.exit()` 结束。`home_screen_default_ui.tsx` 不是这样跑的，组件被直接挂到 Tab 上，因此：

- 主视图**不要**用 `Navigation.present` 呈现，直接 return 即可。
- **不要**调用 `Script.exit()`。退出会终止运行中的实例，Tab 上会留下一个不再响应的界面，只能手动重新加载。
- 顶层代码只在 Tab 首次构建 UI 时执行一次。

脚本以自己的身份和已声明的权限运行，与从脚本列表里运行完全一致。

## 生命周期

只要 Tab 处于开启状态，实例就一直存活：

- 切到别的 Tab 再切回来，组件状态保留，不会重建。
- 改了代码**不会**热更新。改完长按 tab bar 上的 Home 图标，点 **Reload**。
- 关闭开关、换脚本、清除选择，都会停止当前运行的实例。

正因为常驻，请把它当成一个长期存在的页面来写：定时器、订阅、内存里的大数据在关闭 Tab 之前都会一直占着。

## Tab 事件

组件常驻，所以"被切走了"和"又被切回来了"对它是两件真实发生但默认收不到的事。用 `Script.onHomeTabEvent` 监听：

```tsx
import { Script } from "scripting"

const off = Script.onHomeTabEvent(event => {
  switch (event) {
    case "selected":
      refresh()      // 从别的 Tab 切了过来
      break
    case "reselected":
      scrollToTop()  // 已经在 Home 上，又点了一次 Home
      break
    case "deselected":
      pauseTimer()   // 切到别的 Tab 去了
      break
  }
})

// 不再需要时反注册
off()
```

三个事件**互斥**，一次切换或点击只发其中一个，不用操心先后顺序。

- 首次出现**不发**事件：顶层代码本来就是在 Tab 显示出来的那一刻跑的。
- 程序化切换（比如长按菜单里的 Choose Script 会先切到 Home Tab）同样算 `"selected"`。
- App 退到后台再回来是另一条轴，不从这里发；那个用 SwiftUI 的 `scenePhase` 处理。
- 回调在主线程执行，别在里面做重活。

## 选择脚本

选择、切换、清除都在 Tab 内完成，设置里只有那个开关：

- 未选择脚本、或所选脚本已不再提供该文件时，空状态上直接给出选择入口。
- 已经在渲染时，长按 tab bar 上的 Home 图标换脚本或清除选择。

列表只显示包含 `home_screen_default_ui.tsx` 的脚本。

Tab 的图标取自所选脚本自己的图标，所以换个脚本图标，这个 Tab 的样子也跟着变。

## 出错时

文件有语法错误、默认导出的不是函数、或者没有返回可渲染的视图时，Tab 会显示具体的错误信息而不是界面，并且仍然可以重试或改选其它脚本。选中的脚本被删除后同理。

## 边写边预览

文件存在后，编辑器的脚本菜单里会出现 **Preview Home Screen UI**，不用切 Tab 就能看效果。预览始终按磁盘上的文件重新构建，因此看到的是最近一次保存的代码。

预览是独立的一份运行实例，不是那个 Tab，所以**收不到 Tab 事件** —— 要验 `Script.onHomeTabEvent`，得在 Home Tab 上真的切来切去。
