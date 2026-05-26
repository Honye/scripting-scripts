Detect the dominant language of a string or rank candidate languages by confidence.

---

## Functions

### `NaturalLanguage.dominantLanguage(text: string): Language | null`
Return the single most likely language for `text`. Returns `null` when the text is too short or ambiguous to classify.

```ts
NaturalLanguage.dominantLanguage("Bonjour le monde")   // → "fr"
NaturalLanguage.dominantLanguage("今天天气很好")       // → "zh-Hans"
NaturalLanguage.dominantLanguage("")                   // → null
```

---

### `NaturalLanguage.languageHypotheses(text, options?): LanguageHypothesis[]`
Return up to `maximumCount` candidate languages sorted by confidence (descending).

- `options.maximumCount?: number` — defaults to `3`.
- `options.constraints?: Language[]` — soft preference; recognizer favors candidates in this set but is not strictly limited to them.
- `options.hints?: { [language: string]: number }` — prior probabilities (BCP-47 → 0...1).

```ts
const ranked = NaturalLanguage.languageHypotheses("Buenos días", {
  maximumCount: 3,
  constraints: ["es", "pt", "it"],
  hints: { es: 0.8 }
})
// → [{ language: "es", confidence: 0.92 }, { language: "pt", confidence: 0.05 }, ...]
```

---

## Notes

- Language identification is offline and extremely fast — feel free to call it on every keystroke if needed.
- For very short input (one or two words), the recognizer may return `null` or low confidence. Provide more context when possible.
