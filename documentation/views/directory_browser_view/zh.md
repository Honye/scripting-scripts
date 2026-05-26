`DirectoryBrowserView` 用于显示本地目录内容，并提供内置的文件管理操作。

它可以在编辑器中预览和编辑文本文件，使用 Quick Look 预览二进制文件，支持导入文件、导出文件、重命名、删除，以及进入子目录浏览。

## Props

```ts
type DirectoryBrowserViewProps = {
  title: string
  directoryPath?: string | null
  onFilesChanged?: () => void
}
```

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 显示在导航栏中的标题。 |
| `directoryPath` | `string \| null` | 要浏览的目录路径。未提供时显示为空目录。 |
| `onFilesChanged` | `() => void` | 导入、重命名、删除或保存文件后触发。 |

## 示例

```tsx
<NavigationStack>
  <DirectoryBrowserView
    title="Workspace"
    directoryPath={Script.directoryPath}
    onFilesChanged={() => console.log("Files changed")}
  />
</NavigationStack>
```

## 注意事项

* 建议放在 `NavigationStack` 中使用，这样子目录导航会更自然。
* 如果目标目录不存在，该视图会自动创建目录。
* 文本文件会在编辑器中打开，并可保存回原文件。
* 非文本文件会使用 Quick Look 打开。
* `onFilesChanged` 适合在文件变更后刷新外部状态。
