A script can take over a tab on the app's home screen. Add a `home_screen_default_ui.tsx` file to the script project, default-export a function component from it, and pick that script in the tab. The component is then rendered as a full tab, right next to Scripts, Agent, Tools and Settings.

Turn on **Show Home Tab** in **Settings** to reveal the tab — it is off by default.

## The File

```tsx
// home_screen_default_ui.tsx
import { Button, HStack, List, NavigationStack, Section, Text, useState } from "scripting"

export default function HomeScreenView() {
  const [count, setCount] = useState(0)

  return <NavigationStack>
    <List navigationTitle="Home">
      <Section header={<Text>Counter</Text>}>
        <HStack>
          <Text>Tapped {count} times</Text>
          <Button
            title="Tap"
            action={() => setCount(count + 1)}
          />
        </HStack>
      </Section>
    </List>
  </NavigationStack>
}
```

Requirements:

- The file must be named `home_screen_default_ui.tsx` and live at the root of the script project, next to `index.tsx`.
- It must have a **default export**, and that export must be a function component.
- The component owns the whole tab, and the navigation container is yours: `NavigationStack`, `NavigationSplitView`, or no navigation bar at all — the app does not add one.

The **Reload / Choose Script / Clear Selection** actions live behind a long press on the Home icon in the tab bar. The app never injects anything into your own UI.

At runtime `Script.env` is `"home_screen"`, so a shared component can branch on it to behave differently than it does under `index.tsx`.

Anything the file imports is resolved as usual, so you can split the UI across several files in the same script project.

## How It Differs from `index.tsx`

`index.tsx` is a script *run*: it usually calls `Navigation.present(...)` and ends with `Script.exit()`. `home_screen_default_ui.tsx` is not run that way — the component is mounted directly into the tab, so:

- Do **not** call `Navigation.present` for your main view; just return it.
- Do **not** call `Script.exit()`. Exiting kills the running instance and leaves the tab showing a view that no longer responds; you would have to reload it.
- Top-level code runs once, when the tab first builds the UI.

The script runs with its own identity and its declared permissions, exactly like running it from the script list.

## Lifecycle

The instance stays alive while the tab is enabled:

- Switching to another tab and back keeps the component state — it is not rebuilt.
- Editing the file does **not** hot-reload the tab. After changing the code, long-press the Home icon in the tab bar and pick **Reload**.
- Turning the toggle off, choosing a different script, or clearing the selection stops the running instance.

Because it stays resident, treat it like a long-lived app screen: timers, subscriptions and large in-memory data keep costing you until the tab is turned off.

## Tab Events

Because the component stays resident, "the user left" and "the user came back" are real
events it would otherwise never hear about. Listen with `Script.onHomeTabEvent`:

```tsx
import { Script } from "scripting"

const off = Script.onHomeTabEvent(event => {
  switch (event) {
    case "selected":
      refresh()      // switched here from another tab
      break
    case "reselected":
      scrollToTop()  // already on Home, tapped Home again
      break
    case "deselected":
      pauseTimer()   // switched away to another tab
      break
  }
})

// Stop listening
off()
```

The three events are **mutually exclusive**: a single switch or tap delivers exactly one of
them, so there is no ordering to reason about.

- Nothing is delivered for the initial appearance — your top-level code already runs at the
  moment the tab is shown.
- Programmatic switches count as `"selected"` too (Choose Script, for instance, switches to
  the Home tab first).
- Sending the app to the background is a different axis and is not reported here; use
  SwiftUI's `scenePhase` for that.
- The callback runs on the main thread, so keep it light.

## Choosing the Script

Picking, switching and clearing all happen in the tab itself; Settings only has the toggle.

- When nothing is selected, or the selected script no longer provides the file, the empty state offers a picker.
- While a script is rendering, long-press the Home icon in the tab bar to switch scripts or clear the selection.

Only scripts that contain `home_screen_default_ui.tsx` are listed.

The tab uses the selected script's own icon, so changing the script's icon changes how the tab looks.

## Errors

If the file has a syntax error, does not default-export a function, or returns no view, the tab shows the error message instead of the UI, and you can still pick another script or try again. The same goes for a script that was deleted after it was selected.

## Previewing While You Edit

In the editor, the script menu offers **Preview Home Screen UI** once the file exists, so you can check the result without switching tabs. The preview always builds the file as it is on disk, so it reflects your latest saved changes.

The preview is a separate instance and is not the tab itself, so it receives **no tab events**. To try `Script.onHomeTabEvent`, switch tabs for real on the Home tab.
