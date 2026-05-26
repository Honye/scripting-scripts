`Embedding` exposes Apple's built-in **word** and **sentence** embeddings: dense vectors used for similarity, nearest-neighbor search, and distance computation.

There is no public constructor — get an instance from one of the static factories.

---

## Static factories

### `Embedding.wordEmbedding(language, revision?): Embedding | null`
The built-in word embedding for `language`. Returns `null` if no embedding is available on this OS for that language.

### `Embedding.sentenceEmbedding(language, revision?): Embedding | null`
The built-in sentence embedding for `language` (iOS 14+). Returns `null` on iOS 13 or when no sentence embedding is available.

```ts
const wordEmb = NaturalLanguage.Embedding.wordEmbedding("en")
const sentEmb = NaturalLanguage.Embedding.sentenceEmbedding("en")
```

---

## Properties

| Property | Type | Description |
|---|---|---|
| `language` | `Language \| null` | Language of the embedding. |
| `dimension` | `number` | Length of each vector. |
| `vocabularySize` | `number` | Number of distinct tokens in the embedding. |
| `revision` | `number` | OS-published revision number; useful for cache busting. |

---

## Lookup methods

### `contains(token: string): boolean`
Whether `token` is in the embedding's vocabulary.

### `vector(token: string): number[] | null`
Vector for `token` (length = `dimension`), or `null` if the token isn't in vocabulary.

### `distance(first, second, type?): number | null`
Cosine distance between two tokens (`[0, 2]`; smaller is closer).
Returns `null` if either token isn't in vocabulary — use `contains` to disambiguate "no signal" from "very far apart".

### `neighbors(token, maximumCount, type?): { token, distance }[]`
Up to `maximumCount` nearest neighbors of `token`, sorted by ascending distance. Returns `[]` if `token` isn't in vocabulary.

---

## Examples

### Word similarity

```ts
const emb = NaturalLanguage.Embedding.wordEmbedding("en")
if (emb) {
  console.log(emb.distance("cat", "kitten"))     // small — semantically close
  console.log(emb.distance("cat", "airplane"))   // larger
}
```

### Nearest neighbors

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

### Raw vector

```ts
const v = emb?.vector("hello")
if (v) {
  // dot product with another vector ...
}
```

---

## Notes

- `wordEmbedding("en")` is the most reliably available embedding. Other languages may return `null` depending on OS revision.
- `distanceType` currently only supports `"cosine"`; the parameter is reserved for future metrics.
