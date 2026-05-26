`ContextualEmbedding` 提供 transformer 风格的序列嵌入：句子中每个 token 拿到的向量**依赖上下文**（与 `Embedding` 不同，后者把同一个词永远映射到同一个向量）。

**仅 iOS 17+ 可用。** 早期 OS 上类仍存在，但所有方法都 reject `"ContextualEmbedding requires iOS 17 or later."`

---

## 静态工厂

### `ContextualEmbedding.forLanguage(language): ContextualEmbedding | null`
返回适合 `language` 的最新 embedding，没有则返回 `null`。

### `ContextualEmbedding.forScript(script): ContextualEmbedding | null`
返回适合 ISO 15924 脚本（`"Latn"`、`"Hans"`、`"Cyrl"` 等）的最新 embedding。

### `ContextualEmbedding.forModelIdentifier(modelIdentifier): ContextualEmbedding | null`
按 model identifier 精确定位 embedding —— 当你希望推理时复用与训练时完全相同的模型时使用。

```ts
const emb = NaturalLanguage.ContextualEmbedding.forLanguage("en")
```

---

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `modelIdentifier` | `string` | 该模型修订的稳定标识符。 |
| `languages` | `Language[]` | 模型覆盖的语言。 |
| `scripts` | `Script[]` | 模型覆盖的脚本。 |
| `revision` | `number` | OS 发布的修订号。 |
| `dimension` | `number` | 单个 token 向量的长度。 |
| `maximumSequenceLength` | `number` | 模型每次最多输出多少个 token 向量。 |
| `hasAvailableAssets` | `boolean` | 模型资源是否已下载到设备。 |

---

## 方法

### `prepare(): Promise<void>`
请求把模型资源加载到设备，完成后 resolve。首次调用会触发下载，可能耗时较长，之后调用很快。在 `prepare()` resolve 之前直接调 `embeddingResult()` 通常会失败。

> **模拟器限制：** simulator sandbox 无法写 `/var/db/com.apple.naturallanguaged/...`，因此 `prepare()` 在模拟器上始终 reject。请在真机上测试。

### `embeddingResult(text, language?): Promise<ContextualEmbeddingResult>`
对 `text` 计算上下文嵌入。每个 token 使用模型自带的分词（通常是 wordpiece），含 UTF-16 range 和长度为 `dimension` 的向量。

```ts
{
  sequenceLength: number
  tokens: Array<{
    text: string
    range: { location: number, length: number }
    vector: number[]
  }>
}
```

---

## 示例

```ts
const emb = NaturalLanguage.ContextualEmbedding.forLanguage("en")
if (!emb) return

await emb.prepare()

const r = await emb.embeddingResult("The bank charged a fee.", "en")
console.log(r.sequenceLength)       // token 向量数量
console.log(r.tokens[0].vector.length === emb.dimension)   // true

// 同句两个 token 的 cosine 相似度：
const a = r.tokens[1].vector
const b = r.tokens[2].vector
let dot = 0, na = 0, nb = 0
for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] }
const cos = dot / (Math.sqrt(na) * Math.sqrt(nb))
```

---

## 注意事项

- 与 `Embedding.distance` 不同，上下文嵌入是**句子敏感**的："river bank" 与 "bank account" 里的 `bank` 拿到的向量不同。
- 模型资源在设备上各 app 共享；首次下载后再调 `prepare()` 几乎零开销。
