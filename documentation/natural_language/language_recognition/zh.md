检测字符串的主语言或按置信度排序候选语言。

---

## 函数

### `NaturalLanguage.dominantLanguage(text: string): Language | null`
返回 `text` 最可能的单一语言。当文本过短或无法判断时返回 `null`。

```ts
NaturalLanguage.dominantLanguage("Bonjour le monde")   // → "fr"
NaturalLanguage.dominantLanguage("今天天气很好")       // → "zh-Hans"
NaturalLanguage.dominantLanguage("")                   // → null
```

---

### `NaturalLanguage.languageHypotheses(text, options?): LanguageHypothesis[]`
返回最多 `maximumCount` 个候选语言，按置信度降序。

- `options.maximumCount?: number` —— 默认 `3`。
- `options.constraints?: Language[]` —— 软约束；识别器会**优先**考虑此集合中的语言，但**不强制**只返回它们。
- `options.hints?: { [language: string]: number }` —— 先验概率（BCP-47 → 0...1）。

```ts
const ranked = NaturalLanguage.languageHypotheses("Buenos días", {
  maximumCount: 3,
  constraints: ["es", "pt", "it"],
  hints: { es: 0.8 }
})
// → [{ language: "es", confidence: 0.92 }, { language: "pt", confidence: 0.05 }, ...]
```

---

## 注意事项

- 语言识别完全离线，速度极快，可以在每次输入时调用。
- 当输入只有一两个词时，识别器可能返回 `null` 或低置信度。尽量提供更多上下文。
