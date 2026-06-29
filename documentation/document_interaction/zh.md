`DocumentInteraction` 接口为某个文件弹出系统的**"打开方式…"**菜单(以及更完整的操作菜单),让用户选择一个 App 来打开或拷贝该文件。

> **iOS 没有"用默认 App 打开"。** iOS 没有按文件类型设置默认 App 的概念,也没有任何公开 API 能把文件直接交给其关联 App 打开。弹出此菜单让用户自选,是把文件交给其它 App 的唯一受支持方式。

## API

```ts
namespace DocumentInteraction {
  // "打开方式…"菜单 —— 仅列出能打开/拷贝该文件的 App。
  function openInMenu(filePath: string): Promise<string | null>

  // 完整操作菜单 —— 打开方式 + 拷贝 / 打印 / 存到文件 / 标记 等。
  function optionsMenu(filePath: string): Promise<string | null>
}
```

两者都 resolve 为文件被交付到的那个 App 的 **bundle identifier**;若用户未选 App 直接关闭菜单则为 `null`(对 `optionsMenu`,执行拷贝等非"打开"操作时也为 `null`)。

- `openInMenu`:文件不存在、或没有任何 App 能打开它时 **reject**。
- `optionsMenu`:文件不存在时 **reject**。

在 iPad 上,菜单以 popover 形式从当前页面中心弹出。

## 示例

```tsx
const path = FileManager.documentsDirectory + "/report.pdf"

try {
  const app = await DocumentInteraction.openInMenu(path)
  if (app != null) {
    console.log("已在该 App 打开:", app) // 例如 "com.apple.mobilenotes"
  } else {
    console.log("用户关闭了菜单。")
  }
} catch (e) {
  // 文件不存在,或没有 App 能打开该类型文件。
  console.error(e)
}
```

## 说明

- `filePath` 必须是已存在文件的绝对路径。
- 对于通过文档选择器获取的(security-scoped)文件,弹菜单前请确保脚本仍持有对该文件的访问权。
- 文件的显示名取自其文件名;文件类型由扩展名推断。
