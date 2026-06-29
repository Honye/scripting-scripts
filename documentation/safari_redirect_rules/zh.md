重定向规则会在 Safari 中自动改写页面地址,把你带到另一个地址——例如把所有 `www.reddit.com` 页面跳转到 `old.reddit.com`,或把移动版站点跳转到桌面版。

此功能需要 Scripting PRO。

---

## 工作方式

当你打开一个页面时,Scripting 会按顺序用你启用的规则检查它的 URL。第一个模式匹配的规则会用其目标模板改写 URL,Safari 随即被重定向到那里。

每条规则都有一个**匹配模式**:

- **Wildcard(通配,默认、推荐)**——`*` 匹配任意连续字符。每个 `*` 都成为一个捕获,可在目标中用 `$1`、`$2` 等引用。
- **Regex(正则,进阶)**——模式是对整段 URL 进行匹配的正则表达式。用 `$0` 表示整段匹配,`$1`–`$9` 表示捕获组。

改写后的地址必须以 `http://` 或 `https://` 开头。

---

## 添加规则

在 Safari 浏览器脚本设置中打开 **Redirect Rules(重定向规则)**,点击 **Add(添加)**:

- **Name(名称)**——列表中显示的可选标签。
- **Match mode(匹配模式)**——Wildcard 或 Regex。
- **Match pattern(匹配模式串)**——要匹配的 URL 模式。
- **Redirect to(重定向到)**——目标模板,使用 `$1`、`$2`……(正则模式下还可用 `$0`)。
- **Test(测试)**——保存前输入一个样本 URL,预览改写结果。

每条规则都有 **Enabled(启用)** 开关。点击某行可编辑,左滑可删除。

---

## 示例

**Wildcard** —— Reddit 跳转到 old.reddit:

```
模式:    *://www.reddit.com/*
重定向到: https://old.reddit.com/$2
```

`https://www.reddit.com/r/swift` 会变成 `https://old.reddit.com/r/swift`。(`$1` 捕获了协议,`$2` 捕获了路径。)

**Regex** —— 移动版 Wikipedia 跳转到桌面版:

```
模式:    ^https://([a-z]+)\.m\.wikipedia\.org/(.*)$
重定向到: https://$1.wikipedia.org/$2
```

`https://en.m.wikipedia.org/wiki/Swift` 会变成 `https://en.wikipedia.org/wiki/Swift`。

---

## 说明

- 规则只作用于顶层页面导航,不作用于嵌入页面内部的内容。
- 一条会不断匹配自身输出的规则不会无限循环——某个目标地址在一个页面上被用过一次后,就不会再次重定向到它。
- 能用 Wildcard 就优先用。正则保持简单;过于复杂的正则可能拖慢匹配。
- 你在设置中所做的修改会在下次导航时生效。
