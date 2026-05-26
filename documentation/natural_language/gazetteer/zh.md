`Gazetteer` 是一个由用户提供的字典：把**标签**映射到**词条**。配合 `Tagger.setGazetteers` 使用，可以让 Tagger 识别系统模型不认识的领域词汇 —— 产品名、代码标识符、内部术语等。

---

## 构造

```ts
const gazetteer = new NaturalLanguage.Gazetteer({
  product: ["Scripting", "Pro"],
  company: ["Acme", "Acme Corp"]
}, "en")
```

- `dictionary`：`{ label: [term, term, ...] }`。每个 label 可以有多个 term；gazetteer 把任何命中 term 反向映射回 label。
- `language?: Language` —— 词条与语言相关时的可选提示。

构造时如果字典不合法（如词条为空、同一词条在不同 label 下重复）会**抛错**。

---

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `language` | `Language \| null` | 构造时传入的语言提示（按字典构造方式可能不持久化）。 |

---

## 方法

### `label(term: string): string | null`
返回 `term` 命中的 label，未命中返回 `null`。

```ts
gazetteer.label("Scripting")   // → "product"
gazetteer.label("Acme")        // → "company"
gazetteer.label("Banana")      // → null
```

---

## 与 `Tagger` 配合使用

```ts
const gz = new NaturalLanguage.Gazetteer({
  product: ["Scripting"],
  company: ["Acme"]
}, "en")

const tagger = new NaturalLanguage.Tagger(["nameType"])
tagger.setGazetteers([gz], "nameType")
tagger.setText("Acme ships the Scripting app.")

const tags = tagger.tags(null, "word", "nameType", {
  omitWhitespace: true,
  omitPunctuation: true
})
// → tags 里会出现 { tag: "company", ... } 和 { tag: "product", ... },
//   而不是默认的 OrganizationName / nil。
```

Gazetteer 命中会**覆盖**系统模型对该 scheme 的判断。如果 tagger 用 `"nameType"` 构造，那么 `setGazetteers([gz], "nameType")` 会把匹配词的标准 `OrganizationName` / `PersonalName` 标签替换为你的自定义标签。

---

## 注意事项

- 这是脚本内最轻量的扩展标注方式。重量级方案是 `NLModel`（用带标注的训练数据训练完整分类器），本期不在范围内。
- 同一 scheme 可挂多个 gazetteer：`setGazetteers([gz1, gz2, ...], scheme)`。
