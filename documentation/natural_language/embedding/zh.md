`Embedding` 暴露系统内置的**词嵌入**和**句嵌入**：稠密向量，用于相似度计算、最近邻搜索、距离度量。

没有公共构造函数 —— 必须通过 static 工厂方法获取实例。

---

## 静态工厂

### `Embedding.wordEmbedding(language, revision?): Embedding | null`
获取 `language` 的内置词嵌入。在当前 OS 上没有该语言的 embedding 时返回 `null`。

### `Embedding.sentenceEmbedding(language, revision?): Embedding | null`
获取 `language` 的内置句嵌入（iOS 14+）。iOS 13 或没有可用句嵌入时返回 `null`。

```ts
const wordEmb = NaturalLanguage.Embedding.wordEmbedding("en")
const sentEmb = NaturalLanguage.Embedding.sentenceEmbedding("en")
```

---

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `language` | `Language \| null` | 该 embedding 的语言。 |
| `dimension` | `number` | 单个向量的长度。 |
| `vocabularySize` | `number` | 词表大小。 |
| `revision` | `number` | OS 发布的修订号，可用于缓存失效。 |

---

## 查询方法

### `contains(token: string): boolean`
判断 `token` 是否在词表中。

### `vector(token: string): number[] | null`
返回 `token` 的向量（长度等于 `dimension`），不在词表中时返回 `null`。

### `distance(first, second, type?): number | null`
两个 token 之间的 cosine 距离（`[0, 2]`，越小越近）。
任一 token 不在词表时返回 `null` —— 用 `contains` 可以区分 "查不到" 与 "真的很远"。

### `neighbors(token, maximumCount, type?): { token, distance }[]`
返回 `token` 最近的最多 `maximumCount` 个邻居，按距离升序。`token` 不在词表时返回 `[]`。

---

## 示例

### 词相似度

```ts
const emb = NaturalLanguage.Embedding.wordEmbedding("en")
if (emb) {
  console.log(emb.distance("cat", "kitten"))     // 较小 —— 语义相近
  console.log(emb.distance("cat", "airplane"))   // 较大
}
```

### 最近邻

```ts
const emb = NaturalLanguage.Embedding.wordEmbedding("en")
if (emb) {
  const nbs = emb.neighbors("happy", 5)
  for (const { token, distance } of nbs) {
    console.log(`${token}\t${distance.toFixed(3)}`)
  }
  // joyful  0.341
  // glad    0.402
  // ...
}
```

### 拿原始向量

```ts
const v = emb?.vector("hello")
if (v) {
  // 与其它向量做点积 / 余弦 ...
}
```

---

## 注意事项

- `wordEmbedding("en")` 是最稳定可用的 embedding。其他语言依 OS 版本而定，有些会返回 `null`。
- `distanceType` 目前仅支持 `"cosine"`，参数预留给未来扩展。
