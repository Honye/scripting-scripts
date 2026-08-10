# Accessibility Modifiers

A set of modifiers that describe your views to assistive technologies such as VoiceOver, mirroring the SwiftUI accessibility modifiers.

## Modifiers

### `accessibilityLabel?: string`
A short label that identifies the view (for example `"Play"` for a play button).

### `accessibilityHint?: string`
Describes what happens when the user performs the view's action (for example `"Plays the current track"`).

### `accessibilityValue?: string`
A textual description of the view's current value (for example `"70%"` for a slider).

### `accessibilityHidden?: boolean`
Hides the view from assistive technologies when `true`.

### `accessibilityIdentifier?: string`
A stable identifier used for UI testing. Not spoken by VoiceOver.

### `accessibilitySortPriority?: number`
The order in which this element is read relative to siblings. Higher numbers are read first.

### `accessibilityAddTraits?: AccessibilityTrait | AccessibilityTrait[]`
Adds one or more traits describing how the element behaves. One or more of:
`isButton`, `isHeader`, `isSelected`, `isLink`, `isSearchField`, `isImage`, `playsSound`, `isKeyboardKey`, `isStaticText`, `isSummaryElement`, `updatesFrequently`, `startsMediaSession`, `allowsDirectInteraction`, `causesPageTurn`, `isModal`, `isToggle` (iOS 17+).

### `accessibilityRemoveTraits?: AccessibilityTrait | AccessibilityTrait[]`
Removes the given traits from the element.

### `accessibilityHeading?: AccessibilityHeadingLevel`
Marks the view as a heading at a level: `unspecified`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`.

### `accessibilityElement?: boolean | AccessibilityChildBehavior`
Combines the view into a single accessibility element and controls how its children are exposed:
`ignore` (default), `contain`, or `combine`. Pass `true` as a shortcut for `ignore`.

## Example

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
