`Gazetteer` is a user-supplied dictionary mapping **labels** to **terms**. Attach one to a `Tagger` to make the tagger recognize domain-specific vocabulary — product names, code identifiers, internal jargon — that the system model wouldn't normally catch.

---

## Construction

```ts
const gazetteer = new NaturalLanguage.Gazetteer({
  product: ["Scripting", "Pro"],
  company: ["Acme", "Acme Corp"]
}, "en")
```

- `dictionary`: `{ label: [term, term, ...] }`. Each label can have many terms; the gazetteer maps any matching term back to that label.
- `language?: Language` — optional hint when terms are language-specific.

The constructor **throws** if the dictionary is malformed (e.g. empty terms or duplicate terms under different labels).

---

## Properties

| Property | Type | Description |
|---|---|---|
| `language` | `Language \| null` | Language hint passed to the constructor (may not be retained for dictionary-built gazetteers). |

---

## Methods

### `label(term: string): string | null`
Returns the label `term` maps to, or `null` for a miss.

```ts
gazetteer.label("Scripting")   // → "product"
gazetteer.label("Acme")        // → "company"
gazetteer.label("Banana")      // → null
```

---

## Using a gazetteer with `Tagger`

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
// → tags include { tag: "company", ... } and { tag: "product", ... },
//   instead of just OrganizationName / nil.
```

Gazetteer hits **override** the system model for that scheme. If the tagger is constructed with `"nameType"`, then `setGazetteers([gz], "nameType")` will replace standard `OrganizationName` / `PersonalName` labels with your custom labels for the words that match.

---

## Notes

- This is the lightweight, in-script way to extend tagging. The heavier (and out of scope here) alternative is `NLModel`, which trains a full classifier from labeled data.
- Multiple gazetteers can be attached to the same scheme via `setGazetteers([gz1, gz2, ...], scheme)`.
