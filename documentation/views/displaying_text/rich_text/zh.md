`Text` 组件支持通过 `styledText` 属性渲染富文本内容，用于实现比普通文本或 Markdown 更细粒度的样式控制。

通过 `StyledText`，开发者可以：

* 设置字体、颜色、描边、下划线等文本样式
* 构建嵌套的富文本结构
* 添加可点击链接或点击事件
* 控制段落级排版（paragraph-level layout）

新增的 `paragraphStyle` 字段用于控制段落布局行为，底层对应原生排版系统（类似 `NSParagraphStyle`），适合实现：

* 对齐方式控制
* 行距与段落间距
* 首行缩进
* 文本截断策略
* 自动连字符（hyphenation）
* 多语言书写方向支持

---

## StyledText

### 类型定义

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

文本内容，可以是：

* 字符串
* 子 styledText 数组（支持嵌套）

示例：

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

### 字体相关属性

| 属性              | 描述   |
| --------------- | ---- |
| font            | 字体样式 |
| fontDesign      | 字体设计 |
| fontWeight      | 字体粗细 |
| italic          | 是否斜体 |
| bold            | 是否加粗 |
| baselineOffset  | 基线偏移 |
| kerning         | 字符间距 |
| monospaced      | 等宽字体 |
| monospacedDigit | 等宽数字 |

---

### 装饰属性

#### 下划线

```ts
underlineColor
underlineStyle
```

UnderlineStyle 支持：

* single
* double
* thick
* byWord
* patternDash
* patternDashDot
* patternDashDotDot
* patternDot

---

#### 删除线

```ts
strikethroughColor
strikethroughStyle
```

---

#### 描边

```ts
strokeColor
strokeWidth
```

---

### 颜色属性

```ts
foregroundColor
backgroundColor
```

---

### 交互属性

#### link

设置链接地址。

#### onTapGesture

点击回调。

---

## ParagraphStyle

### 概述

`paragraphStyle` 用于控制文本段落级排版行为。

适用于：

* 多行文本布局
* 阅读类内容
* 富文本排版
* 多语言文本显示

---

### alignment

文本对齐方式。

```ts
alignment?: "left" | "center" | "right" | "justified" | "natural"
```

* left：左对齐
* center：居中
* right：右对齐
* justified：两端对齐
* natural：系统默认

---

### firstLineHeadIndent

首行缩进距离。

```ts
firstLineHeadIndent?: number
```

示例：

```tsx
paragraphStyle: {
  firstLineHeadIndent: 20
}
```

---

### headIndent

除首行外的左侧缩进。

---

### tailIndent

右侧缩进。

注意：

* 正值表示从左边开始计算
* 负值表示从右边计算

---

### paragraphSpacing

段落之间的额外间距。

---

### lineSpacing

行间距。

---

### lineBreakMode

文本换行策略。

```ts
lineBreakMode?:
  | "byCharWrapping"
  | "byClipping"
  | "byTruncatingHead"
  | "byTruncatingTail"
  | "byTruncatingMiddle"
```

说明：

* byCharWrapping：按字符换行
* byClipping：直接裁剪
* byTruncatingHead：头部截断
* byTruncatingTail：尾部截断
* byTruncatingMiddle：中间截断

---

### minLineHeight / maxLineHeight

控制最小和最大行高。

---

### lineHeightMultiple

基于字体行高的倍数。

例如：

```ts
lineHeightMultiple: 1.5
```

---

### baseWritingDirection

书写方向。

```ts
baseWritingDirection?: "natural" | "leftToRight" | "rightToLeft"
```

适用于：

* RTL 语言支持
* 混合语言文本

---

### hyphenationFactor

自动连字符程度（0~1）。

值越大，越容易拆分单词换行。

---

### usesDefaultHyphenation

是否使用系统默认连字符策略。

---

## 综合示例

```tsx
<Text
  styledText={{
    content: "这是一个富文本段落示例，用于展示 paragraphStyle。",
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

## 使用建议

### 何时使用 paragraphStyle

建议在以下场景使用：

* 长文本阅读界面
* 文章排版
* 聊天气泡优化
* 多语言排版
* 自定义文本布局

---

### styledText 与 Markdown 的选择

| 场景      | 推荐                          |
| ------- | --------------------------- |
| 简单格式    | Markdown                    |
| 高度可控样式  | styledText                  |
| 段落级排版控制 | styledText + paragraphStyle |

---

### 性能建议

* 避免过深的嵌套结构
* 优先复用样式对象
* 对长文本建议分段构建
