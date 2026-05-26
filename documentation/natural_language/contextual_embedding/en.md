`ContextualEmbedding` provides transformer-style sequence embeddings: each token in a sentence gets a vector that depends on its surrounding context (unlike `Embedding`, where a word always maps to the same vector).

---

## Static factories

### `ContextualEmbedding.forLanguage(language): ContextualEmbedding | null`
Most recent embedding suitable for `language`, or `null` if none.

### `ContextualEmbedding.forScript(script): ContextualEmbedding | null`
Most recent embedding for an ISO 15924 script (`"Latn"`, `"Hans"`, `"Cyrl"`, ...).

### `ContextualEmbedding.forModelIdentifier(modelIdentifier): ContextualEmbedding | null`
Locate an embedding by its model identifier. Useful when you want inference to use exactly the same model as a previous training run — capture the `modelIdentifier` then, reuse it here.

```ts
const emb = NaturalLanguage.ContextualEmbedding.forLanguage("en")
```

---

## Properties

| Property | Type | Description |
|---|---|---|
| `modelIdentifier` | `string` | Stable identifier for this model revision. |
| `languages` | `Language[]` | Languages the model covers. |
| `scripts` | `Script[]` | Scripts the model covers. |
| `revision` | `number` | OS-published revision number. |
| `dimension` | `number` | Length of each token vector. |
| `maximumSequenceLength` | `number` | Maximum number of token vectors the model will emit per input. |
| `hasAvailableAssets` | `boolean` | Whether the model assets are already on-device. |

---

## Methods

### `prepare(): Promise<void>`
Request that the model's assets be loaded onto the device, then resolve. The assets are downloaded on demand the first time, so the first call may take noticeably longer than subsequent ones. `embeddingResult()` before `prepare()` resolves will typically fail.

> **Simulator limitation:** the simulator sandbox can't write to `/var/db/com.apple.naturallanguaged/...`, so `prepare()` always rejects there. Use a real device.

### `embeddingResult(text, language?): Promise<ContextualEmbeddingResult>`
Compute contextual embeddings for `text`. Each token in the result has the model's own tokenization (typically wordpieces), its UTF-16 range, and a vector of length `dimension`.

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

## Example

```ts
const emb = NaturalLanguage.ContextualEmbedding.forLanguage("en")
if (!emb) return

await emb.prepare()

const r = await emb.embeddingResult("The bank charged a fee.", "en")
console.log(r.sequenceLength)       // number of token vectors
console.log(r.tokens[0].vector.length === emb.dimension)   // true

// Cosine similarity between two tokens in the same sentence:
const a = r.tokens[1].vector
const b = r.tokens[2].vector
let dot = 0, na = 0, nb = 0
for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] }
const cos = dot / (Math.sqrt(na) * Math.sqrt(nb))
```

---

## Notes

- Unlike `Embedding.distance`, contextual embeddings are sentence-aware: `"bank"` in "river bank" and "bank account" yield different vectors.
- The model assets are shared across all apps on the device; `prepare()` is cheap after the first download.
