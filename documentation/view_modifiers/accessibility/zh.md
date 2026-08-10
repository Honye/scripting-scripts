# 无障碍(Accessibility)修饰器

一组把视图信息传达给 VoiceOver 等辅助功能的 modifier,对应 SwiftUI 的无障碍修饰符。

## Modifier 列表

### `accessibilityLabel?: string`
标识视图的简短标签(如播放按钮用 `"Play"`)。

### `accessibilityHint?: string`
描述执行视图动作后会发生什么(如 `"Plays the current track"`)。

### `accessibilityValue?: string`
视图当前值的文字描述(如滑块的 `"70%"`)。

### `accessibilityHidden?: boolean`
为 `true` 时对辅助功能隐藏该视图。

### `accessibilityIdentifier?: string`
用于 UI 测试的稳定标识符。VoiceOver 不会朗读。

### `accessibilitySortPriority?: number`
该元素相对同级的朗读顺序。数值越大越先朗读。

### `accessibilityAddTraits?: AccessibilityTrait | AccessibilityTrait[]`
为元素添加一个或多个描述其行为的 trait。取值可为:
`isButton`、`isHeader`、`isSelected`、`isLink`、`isSearchField`、`isImage`、`playsSound`、`isKeyboardKey`、`isStaticText`、`isSummaryElement`、`updatesFrequently`、`startsMediaSession`、`allowsDirectInteraction`、`causesPageTurn`、`isModal`、`isToggle`(iOS 17+)。

### `accessibilityRemoveTraits?: AccessibilityTrait | AccessibilityTrait[]`
从元素移除给定 trait。

### `accessibilityHeading?: AccessibilityHeadingLevel`
把视图标记为某级标题:`unspecified`、`h1`、`h2`、`h3`、`h4`、`h5`、`h6`。

### `accessibilityElement?: boolean | AccessibilityChildBehavior`
把视图合并为单个无障碍元素,并控制子元素如何暴露:
`ignore`(默认)、`contain`、`combine`。传 `true` 等价 `ignore`。

## 示例

```tsx
<Image
  systemName="play.fill"
  accessibilityLabel="Play"
  accessibilityHint="Plays the current track"
  accessibilityAddTraits="isButton"
/>

<HStack accessibilityElement="combine">
  <Text>Battery</Text>
  <Text>70%</Text>
</HStack>

<Text accessibilityHeading="h1">Chapter One</Text>
```
