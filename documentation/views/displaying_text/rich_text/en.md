The `Text` component supports rendering rich text using the `styledText` property, allowing fine-grained control beyond plain text or Markdown rendering.

With `StyledText`, developers can:

* Apply detailed text styling such as fonts, colors, strokes, and decorations
* Build nested rich text structures
* Add tappable links or gesture handlers
* Control paragraph-level layout and typography

The newly introduced `paragraphStyle` field provides advanced paragraph layout control. It maps conceptually to native paragraph layout systems (similar to `NSParagraphStyle`) and enables:

* Text alignment control
* Line spacing and paragraph spacing
* First-line indentation
* Truncation strategies
* Automatic hyphenation
* Multi-language writing direction support

---

## StyledText

### Type Definition

```ts
type StyledText = {
  font?
  fontDesign?
  fontWeight?
  italic?
  bold?
  baselineOffset?
  kerning?
  monospaced?
  monospacedDigit?

  underlineColor?
  underlineStyle?

  strokeColor?
  strokeWidth?

  strikethroughColor?
  strikethroughStyle?

  foregroundColor?
  backgroundColor?

  paragraphStyle?: ParagraphStyle

  content: string | (string | StyledText)[]
  link?: string
  onTapGesture?: () => void
}
```

---

### content

Defines the text content.

Can be:

* A string
* An array of strings and nested `StyledText` objects

Example:

```tsx
<Text
  styledText={{
    content: [
      "Hello ",
      {
        content: "world",
        bold: true,
        foregroundColor: "blue"
      }
    ]
  }}
/>
```

---

### Font-related Properties

| Property        | Description          |
| --------------- | -------------------- |
| font            | Font style           |
| fontDesign      | Font design variant  |
| fontWeight      | Font weight          |
| italic          | Applies italic style |
| bold            | Applies bold style   |
| baselineOffset  | Baseline offset      |
| kerning         | Character spacing    |
| monospaced      | Monospaced font      |
| monospacedDigit | Monospaced digits    |

---

### Decoration Properties

#### Underline

```ts
underlineColor
underlineStyle
```

Supported `UnderlineStyle` values:

* single
* double
* thick
* byWord
* patternDash
* patternDashDot
* patternDashDotDot
* patternDot

---

#### Strikethrough

```ts
strikethroughColor
strikethroughStyle
```

---

#### Stroke (Outline)

```ts
strokeColor
strokeWidth
```

---

### Color Properties

```ts
foregroundColor
backgroundColor
```

---

### Interaction Properties

#### link

Defines a URL link.

#### onTapGesture

Tap gesture callback.

---

## ParagraphStyle

### Overview

`paragraphStyle` controls paragraph-level typography and layout behavior.

Recommended for:

* Multi-line text layouts
* Reading interfaces
* Rich typography layouts
* Multi-language content

---

### alignment

Text alignment.

```ts
alignment?: "left" | "center" | "right" | "justified" | "natural"
```

* left: left-aligned
* center: centered
* right: right-aligned
* justified: fully justified
* natural: system default

---

### firstLineHeadIndent

Indentation applied only to the first line.

```ts
firstLineHeadIndent?: number
```

Example:

```tsx
paragraphStyle: {
  firstLineHeadIndent: 20
}
```

---

### headIndent

Left indentation applied to lines except the first.

---

### tailIndent

Right-side indentation.

Note:

* Positive values are measured from the left
* Negative values are measured from the right

---

### paragraphSpacing

Additional spacing between paragraphs.

---

### lineSpacing

Line spacing between lines.

---

### lineBreakMode

Text truncation and wrapping strategy.

```ts
lineBreakMode?:
  | "byCharWrapping"
  | "byClipping"
  | "byTruncatingHead"
  | "byTruncatingTail"
  | "byTruncatingMiddle"
```

Descriptions:

* byCharWrapping: wrap by character
* byClipping: clip overflow
* byTruncatingHead: truncate at head
* byTruncatingTail: truncate at tail
* byTruncatingMiddle: truncate in middle

---

### minLineHeight / maxLineHeight

Control minimum and maximum line height.

---

### lineHeightMultiple

Multiplier applied to the natural line height.

Example:

```ts
lineHeightMultiple: 1.5
```

---

### baseWritingDirection

Writing direction.

```ts
baseWritingDirection?: "natural" | "leftToRight" | "rightToLeft"
```

Useful for:

* RTL language support
* Mixed-direction text

---

### hyphenationFactor

Hyphenation level (0–1).

Higher values increase likelihood of word splitting.

---

### usesDefaultHyphenation

Whether to use system default hyphenation behavior.

---

## Full Example

```tsx
<Text
  styledText={{
    content: "This is a rich text paragraph example demonstrating paragraphStyle.",
    foregroundColor: "label",
    paragraphStyle: {
      alignment: "justified",
      firstLineHeadIndent: 20,
      lineSpacing: 6,
      paragraphSpacing: 12,
      lineHeightMultiple: 1.4
    }
  }}
/>
```

---

## Usage Recommendations

### When to Use paragraphStyle

Recommended scenarios:

* Long-form reading interfaces
* Article typography
* Chat bubble layout improvements
* Multi-language typesetting
* Custom text layout

---

### Choosing Between styledText and Markdown

| Scenario                       | Recommendation              |
| ------------------------------ | --------------------------- |
| Simple formatting              | Markdown                    |
| Highly customizable styling    | styledText                  |
| Paragraph-level layout control | styledText + paragraphStyle |

---

### Performance Tips

* Avoid excessively deep nesting
* Reuse style objects when possible
* For long content, consider splitting into segments
