The `NaturalLanguage` module gives scripts on-device, low-latency access to text analysis:

- **Language identification** — detect the dominant language or rank candidates.
- **Tokenization** — split text into words, sentences, paragraphs, or whole documents.
- **Tagging** — part-of-speech, lemma, language/script, named-entity, sentiment.
- **Word & sentence embeddings** — built-in vectors for similarity, neighbors, distance.
- **Gazetteers** — user-supplied lexicons that override the system model for custom vocabularies.
- **Contextual embeddings** — transformer-style sequence embeddings.

All of these run entirely on the device. No network, no permission prompts.

---

## Quick start

```ts
// Language ID
const lang = NaturalLanguage.dominantLanguage("Bonjour le monde")
// → "fr"

// Tokenization
const tokens = NaturalLanguage.tokenize("Hello, world!", { unit: "word" })
// → [{ text: "Hello", range: { location: 0, length: 5 }, attributes: {} }, ...]

// Tagging (lexical class + NER)
const tagger = new NaturalLanguage.Tagger(["nameType", "sentimentScore"])
tagger.setText("Tim Cook visited Beijing yesterday.")
const entities = tagger.enumerateNamedEntities()
// → [{ entity: "personalName", text: "Tim Cook", range: ... },
//    { entity: "placeName",    text: "Beijing",  range: ... }]

// Word similarity
const emb = NaturalLanguage.Embedding.wordEmbedding("en")
if (emb) {
  console.log(emb.distance("cat", "kitten"))   // small
  console.log(emb.neighbors("happy", 5))       // 5 nearest words
}
```

---

## Submodules

| Topic | Description |
|---|---|
| [Language recognition](language_recognition/en.md) | `dominantLanguage`, `languageHypotheses` |
| [Tokenizer](tokenizer/en.md) | `tokenize` |
| [Tagger](tagger/en.md) | `Tagger` — POS, NER, sentiment, custom tags |
| [Embedding](embedding/en.md) | `Embedding` — word / sentence vectors |
| [Gazetteer](gazetteer/en.md) | `Gazetteer` — custom lexicon for tagger |
| [Contextual embedding](contextual_embedding/en.md) | `ContextualEmbedding` |

---

## Common types

```ts
type Language = "en" | "zh-Hans" | "zh-Hant" | "ja" | "ko" | "fr" | ... | (string & {})
type TokenUnit = "word" | "sentence" | "paragraph" | "document"
type StringRange = { location: number, length: number }   // UTF-16 offset
```

- **`Language`** is the BCP-47 language code (e.g. `"en"`, `"zh-Hans"`). The TypeScript union lists popular values for editor hints; any string is accepted.
- **`StringRange`** uses UTF-16 offsets — the same indexing JS strings use natively, so `text.substring(range.location, range.location + range.length)` always reproduces the token.
- Synchronous functions (language ID, tokenize, tagger queries, embedding lookups) return their result directly. Only `ContextualEmbedding.prepare()` and `embeddingResult()` are `Promise`-based.
