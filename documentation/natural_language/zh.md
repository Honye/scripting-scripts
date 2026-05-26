`NaturalLanguage` 模块为脚本提供端上、低延迟的文本分析能力：

- **语言识别** —— 判定主语言或排序候选语言。
- **分词** —— 按 word / sentence / paragraph / document 切分文本。
- **标注（Tagger）** —— 词性、词元、语言/脚本、命名实体、情感打分。
- **词与句嵌入（Embedding）** —— 内置向量，用于相似度、邻居、距离计算。
- **Gazetteer 词典** —— 用户提供的自定义词典，可覆盖系统模型的标注结果。
- **上下文嵌入** —— transformer 风格的序列向量。

所有能力**完全在设备本地运行**：无网络、无授权弹窗。

---

## 快速开始

```ts
// 语言识别
const lang = NaturalLanguage.dominantLanguage("Bonjour le monde")
// → "fr"

// 分词
const tokens = NaturalLanguage.tokenize("Hello, world!", { unit: "word" })
// → [{ text: "Hello", range: { location: 0, length: 5 }, attributes: {} }, ...]

// 词性 + 命名实体识别
const tagger = new NaturalLanguage.Tagger(["nameType", "sentimentScore"])
tagger.setText("Tim Cook visited Beijing yesterday.")
const entities = tagger.enumerateNamedEntities()
// → [{ entity: "personalName", text: "Tim Cook", range: ... },
//    { entity: "placeName",    text: "Beijing",  range: ... }]

// 词相似度
const emb = NaturalLanguage.Embedding.wordEmbedding("en")
if (emb) {
  console.log(emb.distance("cat", "kitten"))   // 比较近
  console.log(emb.neighbors("happy", 5))       // 最近的 5 个词
}
```

---

## 子模块

| 主题 | 说明 |
|---|---|
| [语言识别](language_recognition/zh.md) | `dominantLanguage`、`languageHypotheses` |
| [分词](tokenizer/zh.md) | `tokenize` |
| [Tagger](tagger/zh.md) | `Tagger` —— 词性、命名实体、情感、自定义标签 |
| [Embedding](embedding/zh.md) | `Embedding` —— 词向量、句向量 |
| [Gazetteer](gazetteer/zh.md) | `Gazetteer` —— 给 Tagger 用的自定义词典 |
| [上下文嵌入](contextual_embedding/zh.md) | `ContextualEmbedding` |

---

## 通用类型

```ts
type Language = "en" | "zh-Hans" | "zh-Hant" | "ja" | "ko" | "fr" | ... | (string & {})
type TokenUnit = "word" | "sentence" | "paragraph" | "document"
type StringRange = { location: number, length: number }   // UTF-16 偏移
```

- **`Language`** 是 BCP-47 语言代码（如 `"en"`、`"zh-Hans"`）。TypeScript union 给编辑器补全提示，运行时接受任意字符串。
- **`StringRange`** 使用 UTF-16 偏移 —— 与 JS 字符串原生索引一致，因此 `text.substring(range.location, range.location + range.length)` 总能还原 token 内容。
- 同步函数（语言识别、分词、Tagger 查询、Embedding 查询）直接返回结果；仅 `ContextualEmbedding.prepare()` / `embeddingResult()` 是 `Promise`。
