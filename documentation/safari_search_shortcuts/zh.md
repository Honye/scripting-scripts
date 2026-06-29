搜索快捷指令让你在 Safari 地址栏中输入「触发词 + 查询词」,直接跳转到目标站点的搜索结果——例如输入 `gh hello world`,即可跳转到 GitHub 搜索「hello world」。

此功能需要 Scripting PRO。

---

## 工作方式

当你从 Safari 地址栏发起搜索时,Scripting 会检查查询的第一个词。如果它与某个快捷指令的触发词匹配,查询的其余部分就会被发送到该快捷指令的搜索 URL,而不是你的默认搜索引擎。

- **第一个词**是触发词。一个快捷指令可以有多个触发词,任一命中即可激活。
- **其后的全部内容**作为搜索查询词。
- 查询词会被 URL 编码,并替换到 URL 中你填写 `%s` 的位置。

它适用于常见搜索引擎(Google、Bing、DuckDuckGo、Yahoo、Baidu、Ecosia、Startpage)上的 Safari 地址栏搜索。请确保你的查询以触发词开头。

---

## 添加快捷指令

在 Safari 浏览器脚本设置中打开 **Search Shortcuts(搜索快捷指令)**,点击 **Add(添加)**:

- **Triggers(触发词)**——一个或多个不含空格的词,如 `gh`。可以加多个(例如 `gh` 和 `git`),任一命中即激活。用 **Add trigger(添加触发词)** 增加,用减号按钮删除。
- **Name(名称)**——列表中显示的可选标签。
- **Search URL(搜索 URL)**——目标地址,在查询词应出现的位置填写 `%s`。

每个快捷指令都有 **Enabled(启用)** 开关。点击某行可编辑,左滑可删除。

### iPhone/iPad 与 Mac 使用不同 URL

默认情况下所有设备共用同一个搜索 URL。如果你希望在 iPhone/iPad 上用移动版站点、在 Mac 上用完整站点,可打开 **Use different URLs for iPhone/iPad and Mac(为 iPhone/iPad 与 Mac 使用不同 URL)**。开启时两个字段都会预填当前 URL,你只需修改需要改的那端——例如 iPhone/iPad 用 `m.` 移动版域名、Mac 用桌面版域名。扩展会按你发起搜索的设备选用对应 URL;某端留空时回退到共用 URL。

---

## 示例

| 触发词 | 搜索 URL |
| --- | --- |
| `gh`、`git` | `https://github.com/search?q=%s` |
| `yt` | `https://www.youtube.com/results?search_query=%s` |
| `npm` | `https://www.npmjs.com/search?q=%s` |
| `w` | `https://zh.wikipedia.org/w/index.php?search=%s` |

使用上面的 `gh` 快捷指令,搜索 `gh swiftui`(或 `git swiftui`)会打开 `https://github.com/search?q=swiftui`。

目标地址不一定是网页搜索。自定义 app URL scheme 或 Universal Link 同样有效,因此一个快捷指令可以直接打开另一个 app 的搜索。

---

## 说明

- 只有当第一个词等于任一触发词时才会匹配。不以触发词开头的普通查询会原样交给你的默认搜索引擎。
- 触发词匹配不区分大小写。
- 你在设置中所做的修改会在下次搜索时生效。
