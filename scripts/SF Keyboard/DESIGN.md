# SF Keyboard 设计与使用说明

Scripting 脚本位置：`scripts/SF Keyboard/`

## 文件结构

```
SF Keyboard/
├─ index.tsx                 App 入口：浏览 / 搜索 / 导入源文件
├─ keyboard.tsx              自定义键盘入口
├─ types.ts                  共享类型
├─ constants/
│  ├─ i18n.ts                中英双语文案表（跟随系统语言）
│  ├─ theme.ts               配色（浅色/深色）
│  ├─ categories.ts          分类元信息（key 与官方 category key 对齐）
│  └─ symbols.ts             内置图标数据（26 个分类，约 2450 个符号）
├─ hooks/useSymbolLibrary.ts 图标库状态（加载 / 分类 / 搜索 / 最近使用）
├─ utils/
│  ├─ layout.ts              键盘尺寸自适应
│  ├─ library.ts             App Group 存储、校验、导入合并、最近使用
│  ├─ parser.ts              源文件解析（plist / json / csv / txt）
│  ├─ plist.ts               plist 解析器（XML + bplist00 二进制）
│  └─ png.tsx                符号渲染成 PNG、写剪贴板、导出文件
├─ components/
│  ├─ SFKeyboardView.tsx     键盘主视图
│  ├─ CategorySidebar.tsx    左侧分类栏
│  ├─ SymbolGrid.tsx         右侧图标网格
│  └─ SymbolCell.tsx         单个图标格子（含长按菜单）
└─ views/LibraryView.tsx     App 内的图标库管理界面
```

## 键盘交互

- **点击图标** → 把图标名输入到光标处，并计入「最近」
- **长按图标** → 菜单：输入名称 / 复制名称 / 复制 PNG（64、128、256pt 三档）
- **取词搜索** → 读取光标前的最后一个词做搜索；选中图标时会先删掉这个词再插入名称
- 左侧分类栏第一项是「最近」，按使用频次维护，最多 48 个
- 底部工具条：回到 Scripting 键盘列表 / 空格 / 删除 / 换行
  （不自绘地球键，Scripting 键盘最底部已有系统的输入法切换键）

PNG 通过 `ImageRenderer.toPNGData` 渲染，写入剪贴板时同时带 `public.png` 和
`public.plain-text` 两种表示 —— 粘贴到文本框得到名称，粘贴到图片位置得到图片。

**SVG 暂未实现**：Scripting 拿不到 SF Symbols 的矢量路径，只能渲染位图。
如果以后要做，可选方案是把高分辨率 PNG 用 base64 内嵌进 `<svg><image>`，
或者支持导入 SF Symbols.app 导出的 `.svg` 资源包。

## 中英双语

`constants/i18n.ts` 里一行写中英两份：

```ts
copyName: pick('复制名称', 'Copy Name'),
copied: (name: string) => pick(`已复制「${name}」`, `Copied “${name}”`),
```

`pick()` 在模块加载时读 `Device.systemLanguageCode`，`zh*` 走中文，其余走英文，
不做 App 内手动切换。键盘扩展和 App 各自加载各自的模块实例，但读的是同一个系统语言，
所以两边一致。

分类名放在 `constants/categories.ts` 的 `label` / `labelEn` / `labelEnShort` 三个字段：
键盘侧栏只有 60~76pt 宽，英文用短名（Communication → Comms），App 里的分类胶囊用全名。

`script.json` 的 `localizedDescriptions` 填了 zh / en；`localizedNames` 留空，
脚本名在两种语言下都显示 "SF Keyboard"。

新增文案时**必须**加进 `i18n.ts`，不要在组件里写裸字符串。抛给用户看的 Error
（`parser.ts` / `plist.ts` 里的）也走 `pick()`，因为它们会进「导入失败」弹窗。

## 配色

`constants/theme.ts` 统一管理。前景色用系统语义色（`label` / `secondaryLabel` /
`systemBlue`）自动适配深浅色；背景色因为要贴合键盘灰底，显式给 light / dark 两个值。

**坑**：Scripting 的十六进制颜色不支持 alpha 通道，`#00000000` 解析失败会退化成白色。
需要透明用关键字 `clear`，或者干脆不渲染那个形状（分类栏未选中项就是这么做的）。

## 图标数据

### 内置列表

`constants/symbols.ts` 按官方分类整理，`indices` 分类（a.circle、1.square.fill 之类）
由规则生成，不手写。

首次运行时会用 `UIImage.fromSFSymbol()` 逐个校验，**当前 iOS 版本不存在的名称会被自动剔除**，
所以内置列表里带一些新系统才有的符号也不会出现空白格。校验结果落盘到
`App Group Documents/SFKeyboard/library.json`，之后不再重复校验。

### 导入源文件更新列表

App 里「更多」菜单 → **导入并合并** / **导入并覆盖**，可一次选多个文件。

推荐从 SF Symbols.app 里取这两个文件（macOS 上路径为
`/Applications/SF Symbols.app/Contents/Resources/Metadata/`）：

| 文件 | 作用 |
| --- | --- |
| `symbol_categories.plist` | 符号名 → 分类映射，**最重要**，一份就能建出完整分类 |
| `name_availability.plist` | 全部符号名 + 最低系统版本，用来补齐没有分类的符号 |
| `categories.plist` | 分类 key → 显示名，用来给自定义分类命名（可选） |

这些是二进制 plist，解析器已支持，不需要先转成 XML。把它们拷到 iCloud Drive
或用 AirDrop 传到 iPhone，再在 App 里选中即可。

也支持这些格式：

- **JSON**：`["name", ...]`、`{"分类": ["name", ...]}`、`[{name, categories}]`、
  `{"symbols": {"name": "1.0"}}`
- **CSV**：`name,category`（带表头会自动跳过）
- **纯文本**：每行一个名称；`# 分类名` 或 `[分类名]` 开一节，`分类: 名称` 单行指定

导入后会自动跑一遍可用性校验，弹窗会告诉你解析到多少条、实际可用多少个、过滤掉多少个。

「恢复内置列表」会删掉 `library.json` 回到出厂数据。`library.source` 存的是语言无关的
`'builtin'`，显示时才翻译（旧数据里的中文「内置」也兼容）。

## 已知取舍

- 键盘里没有输入框式搜索（键盘扩展里 TextField 抢焦点不可靠），改用「取词搜索」
- 单个分类超过 900 个图标时键盘只渲染前 900 个，提示用搜索缩小范围；App 里上限 1500
- 校验 2000+ 个符号是同步调用，首次启动会有 1 秒左右的「正在准备图标库…」

## 在这个沙箱里改代码的注意事项

云端 Cowork 会话对挂载目录禁用了 `unlink`，所以：

- `unzip -o` 覆盖会失败，要先解到 `$HOME` 再 `cp -f` 过去
- 任何 git 命令（包括 `git status`）都会留下删不掉的 `.git/index.lock`，
  **git 操作建议直接在 Mac 上做**，或者改用桌面端的「在你的电脑上运行」
