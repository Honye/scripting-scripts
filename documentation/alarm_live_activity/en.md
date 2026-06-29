`AlarmLiveActivity` lets a script provide a custom Lock Screen and Dynamic Island UI for alarms created with `AlarmManager` on iOS 26+.

Use this when the built-in alarm Live Activity is not enough and you want the alarm to match your script's product style while keeping AlarmKit scheduling, pause, resume, countdown, and stop behavior.

---

## Files

Custom alarm Live Activity UI must be registered in a standalone file named:

```txt
alarm_live_activity.tsx
```

Your main script still creates the alarm from `index.tsx`. If `alarm_live_activity.tsx` does not exist, or the requested UI name is not registered, Scripting falls back to the built-in alarm UI.

---

## Register a UI

`AlarmLiveActivity` is exported from the `scripting` package:

```tsx
import {
  AlarmLiveActivity,
  LiveActivityUI,
  LiveActivityUIExpandedBottom,
  LiveActivityUIExpandedCenter,
  LiveActivityUIExpandedLeading,
  LiveActivityUIExpandedTrailing,
} from "scripting"

AlarmLiveActivity.register("FocusTimerActivity", state => {
  return (
    <LiveActivityUI
      content={<Text>{state.title}</Text>}
      compactLeading={<Text>{state.mode}</Text>}
      compactTrailing={<Text>{state.title}</Text>}
      minimal={<Text>{state.mode}</Text>}>
      <LiveActivityUIExpandedLeading>
        <Text>{state.title}</Text>
      </LiveActivityUIExpandedLeading>
      <LiveActivityUIExpandedTrailing>
        <Text>{state.mode}</Text>
      </LiveActivityUIExpandedTrailing>
      <LiveActivityUIExpandedCenter>
        <Text>{state.presentation.alert.title}</Text>
      </LiveActivityUIExpandedCenter>
      <LiveActivityUIExpandedBottom>
        <Text>{state.alarmID}</Text>
      </LiveActivityUIExpandedBottom>
    </LiveActivityUI>
  )
})
```

The returned root node must be `LiveActivityUI`. The `content`, `compactLeading`, `compactTrailing`, and `minimal` regions are required.

---

## Attach It to an Alarm

`AlarmManager` is a global API and does not need to be imported.

```tsx
const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Focus complete",
    stopButton: AlarmManager.Button.create({
      title: "Done",
      systemImageName: "checkmark"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Deep focus",
    AlarmManager.Button.create({
      title: "Pause",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Paused",
    AlarmManager.Button.create({
      title: "Resume",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#ff9f0a",
  metadata: {
    task: "Writing"
  },
  liveActivity: {
    name: "FocusTimerActivity"
  }
})
```

The `liveActivity.name` value must match the name passed to `AlarmLiveActivity.register`.

---

## Render State

The builder receives an `AlarmLiveActivityState` object:

```ts
type AlarmLiveActivityState = {
  alarmID: string
  mode: "scheduled" | "countdown" | "paused" | "alerting"
  title: string
  tintColor?: Color | null
  metadata: Record<string, string>
  presentation: AlarmLiveActivityPresentation
  actions: {
    pause?: AlarmLiveActivityAction | null
    resume?: AlarmLiveActivityAction | null
    stop: AlarmLiveActivityAction
    secondary?: AlarmLiveActivityAction | null
  }
  countdown?: {
    fireDate: Date
    totalCountdownDuration: number
  } | null
  paused?: {
    totalCountdownDuration: number
    prePauseCountdownDuration: number
  } | null
}
```

Use `mode` to switch the layout, `metadata` for your own display data, and `presentation` to reuse titles and button labels configured through `AlarmManager.Attributes`.

---

## Built-In Actions

The `actions` field contains AppIntent-backed controls created by Scripting for the current alarm.

```tsx
{state.actions.pause && (
  <Button intent={state.actions.pause.intent}>
    <Label title={state.actions.pause.title} systemImage={state.actions.pause.systemImageName ?? "pause.fill"} />
  </Button>
)}

<Button intent={state.actions.stop.intent} role="destructive">
  <Label title={state.actions.stop.title} systemImage={state.actions.stop.systemImageName ?? "xmark"} />
</Button>
```

These actions call the native `AlarmManager` operations for the alarm:

- `pause`
- `resume`
- `stop`
- `secondary`, when the alert secondary button uses `secondaryButtonBehavior: "countdown"`

If you need extra script-specific behavior, register your own `AppIntent` separately and use it in a normal Live Activity button. The standard `actions` field is the recommended way to control the alarm itself.

---

## Notes

- `AlarmManager` alert `stopIntent` and `secondaryIntent` still belong to the system alert presentation.
- Custom Live Activity buttons should use `state.actions.*.intent` for alarm pause, resume, stop, and countdown behavior.
- Keep Dynamic Island compact regions small. Prefer SF Symbols, short labels, and system fonts.
- Prefer `buttonStyle="glass"` or `buttonStyle="glassProminent"` on iOS 26 when the control is visible in the Lock Screen or expanded Dynamic Island.
