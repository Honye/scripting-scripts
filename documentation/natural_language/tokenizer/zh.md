将文本按 word / sentence / paragraph / document 粒度切分。

---

## 函数

### `NaturalLanguage.tokenize(text, options?): TokenRange[]`
按指定粒度遍历 `text`，返回按文本顺序排列的 token 列表。

- `options.unit?: "word" | "sentence" | "paragraph" | "document"` —— 默认 `"word"`。
- `options.language?: Language` —— 可选语言提示，对没有显式词边界的语言（中文、日文、泰文等）尤其有用。

每个 token 形如：

```ts
{
  text: string                 // token 内容
  range: { location, length }  // UTF-16 偏移
  attributes: {                // 仅在命中时出现
    emoji?: boolean
    numeric?: boolean
    symbolic?: boolean
  }
}
```

---

## 示例

```ts
// 词级切分
const words = NaturalLanguage.tokenize("Hello, world! 🎉", { unit: "word" })
// → ["Hello", "world", "🎉"]（最后一个 token 的 attributes.emoji 为 true）

// 句级切分
const sentences = NaturalLanguage.tokenize(
  "第一句。第二句!",
  { unit: "sentence" }
)
// → 2 个 token

// 中文：传入语言提示帮助分词
const cn = NaturalLanguage.tokenize("苹果发布了新产品", {
  unit: "word",
  language: "zh-Hans"
})
```

---

## 注意事项

- `range.location` / `range.length` 是 UTF-16 偏移，与 JS 原生字符串索引一致。`text.substring(range.location, range.location + range.length)` 一定还原 `token.text`。
- 分词器**不会**过滤标点或空白。如果只想拿到有意义的词，自行过滤或改用 `Tagger.tags(..., { omitPunctuation: true, omitWhitespace: true })`。
