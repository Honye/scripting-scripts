Controls the visibility of the status bar and the non-transient system overlays (such as the Home indicator) for a page — useful for building immersive, full-screen experiences.

## Type

```ts
// Hide the status bar.
statusBarHidden?: boolean

// Preferred visibility of system overlays such as the Home indicator.
// "hidden" lets the system auto-hide them; "visible" keeps them shown; "automatic" lets the system decide.
// Requires iOS 16.0 or later.
persistentSystemOverlays?: "automatic" | "visible" | "hidden"
```

## Important

For these to take effect:

- **Apply them to the page's root view** — for example the `NavigationStack`, not an inner child. A navigation container intercepts the preference, so applying it to a nested view does nothing.
- **Present the page full screen.** In a sheet presentation the status bar and system overlays are owned by the presenting page, so the preference is ignored:

  ```ts
  Navigation.present({
    element: <MyImmersivePage />,
    modalPresentationStyle: "fullScreen",
  })
  ```

Notes:

- `persistentSystemOverlays="visible"` is the default state, so it produces no observable change. Use `"hidden"` to see an effect.
- iOS never removes the Home indicator permanently — `"hidden"` only dims and auto-hides it; it reappears on interaction.

## Example

```tsx
function ImmersivePage() {
  return <NavigationStack
    statusBarHidden={true}
    persistentSystemOverlays="hidden"
  >
    <VStack frame={Device.screen}>
      <Text>Immersive full-screen content</Text>
    </VStack>
  </NavigationStack>
}

// Present full screen so the modifiers take effect.
Navigation.present({
  element: <ImmersivePage />,
  modalPresentationStyle: "fullScreen",
})
```

You can also apply them as chainable modifiers:

```tsx
<NavigationStack>
  ...
</NavigationStack>
  .statusBarHidden(true)
  .persistentSystemOverlays("hidden")
```
