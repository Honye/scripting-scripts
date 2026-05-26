Split text into word, sentence, paragraph, or document tokens.

---

## Function

### `NaturalLanguage.tokenize(text, options?): TokenRange[]`
Walk `text` at the requested granularity and return an ordered list of tokens.

- `options.unit?: "word" | "sentence" | "paragraph" | "document"` — defaults to `"word"`.
- `options.language?: Language` — optional hint that helps the tokenizer pick the right model for languages without explicit word boundaries (e.g. Chinese, Japanese, Thai).

Each token is:

```ts
{
  text: string                 // the substring
  range: { location, length }  // UTF-16 offset
  attributes: {                // present only when relevant
    emoji?: boolean
    numeric?: boolean
    symbolic?: boolean
  }
}
```

---

## Examples

```ts
// Word tokens
const words = NaturalLanguage.tokenize("Hello, world! 🎉", { unit: "word" })
// → ["Hello", "world", "🎉"] (with attributes.emoji on the last one)

// Sentence tokens
const sentences = NaturalLanguage.tokenize(
  "First sentence. Second one!",
  { unit: "sentence" }
)
// → 2 tokens

// Chinese: pass a language hint to help word segmentation
const cn = NaturalLanguage.tokenize("苹果发布了新产品", {
  unit: "word",
  language: "zh-Hans"
})
```

---

## Notes

- `range.location` / `range.length` are UTF-16 offsets, matching native JS string indexing. `text.substring(range.location, range.location + range.length)` always returns `token.text`.
- The tokenizer does not filter punctuation or whitespace — if you only want substantive words, filter the result yourself or use `Tagger.tags(..., { omitPunctuation: true, omitWhitespace: true })`.
