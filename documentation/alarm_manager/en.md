`AlarmManager` (iOS 26+) is a global API provided by Scripting for creating and managing AlarmKit-based alarms, timers, and countdown reminders. It does not need to be imported and can be used directly in scripts.

This API is suitable for scenarios such as:

* Creating one-time alarms, such as “remind me tonight at 10:30 PM”
* Creating daily or weekly recurring alarms
* Creating Pomodoro timers, workout timers, and countdown-based reminders
* Customizing alert titles, buttons, colors, icons, and metadata
* Using `AppIntent` to handle alert button actions
* Listening for alarm state changes and updating UI accordingly

---

## Availability

Before using `AlarmManager`, you should first check whether the current environment supports AlarmKit:

```tsx
if (!AlarmManager.isAvailable) {
  console.log("AlarmKit is not available on this device")
}
```

If the current device or system version does not support it, related methods may not work.

---

## Core Concepts

`AlarmManager` is built around these main types:

* `Alarm`: an existing alarm instance
* `Schedule`: the schedule rule that determines when an alarm fires
* `Countdown`: countdown-related parameters
* `Button`: button styling for the alert UI
* `Sound`: alert sound configuration
* `AlertPresentation`: content shown when the alarm is alerting
* `CountdownPresentation`: content shown while countdown is running
* `PausedPresentation`: content shown while countdown is paused
* `Attributes`: the overall presentation configuration
* `Configuration`: the final configuration object used to create alarms, timers, or countdown reminders

---

## Alarm ID Rules

The `id` passed to an alarm must be generated with:

```tsx
UUID.string()
```

Do not manually build fixed IDs, and do not reuse old IDs. Every new alarm, timer, or countdown reminder should use a newly generated UUID string.

Correct example:

```tsx
const id = UUID.string()
```

Not recommended:

```tsx
const id = "morning-alarm"
const id = `timer-${Date.now()}`
```

All later operations such as `cancel`, `stop`, `pause`, `resume`, and `startCountdown` must use the exact same ID that was used when the alarm was created.

---

## AlarmState

```tsx
type AlarmState = "scheduled" | "countdown" | "paused" | "alerting"
```

Represents the current state of an alarm.

### `"scheduled"`

The alarm has been scheduled and is waiting to fire.

Common cases:

* Fixed-time alarms
* Weekly recurring alarms
* Countdown-based alarms that have not started yet

### `"countdown"`

A countdown is currently running.

Common cases:

* An active timer
* A started countdown reminder

### `"paused"`

The countdown is currently paused.

### `"alerting"`

The alarm has fired and is currently presenting its alert.

---

## SecondaryButtonBehavior

```tsx
type SecondaryButtonBehavior = "countdown" | "custom"
```

Controls the behavior of the secondary button shown in the alert UI.

### `"countdown"`

The secondary button starts a countdown flow.

This is typically used for “remind me later” or “remind me again in a few minutes” behavior.

### `"custom"`

The secondary button is treated as a custom action button, and its actual behavior is defined by `secondaryIntent`.

---

## AlarmAppIntent

```tsx
type AlarmAppIntent = AppIntent<any, AppIntentProtocol.LiveActivityIntent>
```

Represents an `AppIntent` that can be attached to alarm buttons.

It is mainly used for:

* Running additional logic when the stop button is tapped
* Running custom logic when the secondary button is tapped
* Integrating alarm interactions with Live Activity, Widget, or ControlWidget logic

It can be assigned through:

* `Configuration.alarm(...).stopIntent`
* `Configuration.alarm(...).secondaryIntent`
* `Configuration.timer(...).stopIntent`
* `Configuration.timer(...).secondaryIntent`
* `Configuration.countdown(...).stopIntent`
* `Configuration.countdown(...).secondaryIntent`

Note that the required protocol type here is:

```tsx
AppIntentProtocol.LiveActivityIntent
```

That means any `AppIntent` used with `AlarmManager` should be registered with the `LiveActivityIntent` protocol.

A full example is provided later in this document.

---

## AlarmUpdateListener

```tsx
type AlarmUpdateListener = (alarms: Alarm[]) => void
```

A callback used to listen for alarm list updates.

When alarms are created, cancelled, paused, resumed, started, or otherwise updated, the listener receives the latest `Alarm[]`.

---

## Alarm

```tsx
class Alarm {
  readonly id: string
  readonly state: AlarmState
  readonly schedule?: Schedule | null
  readonly countdownDuration?: Countdown | null
}
```

Represents an existing alarm object.

### `id`

```tsx
readonly id: string
```

The unique identifier of the alarm.

It must be generated with `UUID.string()` when the alarm is created. All later operations such as cancel, stop, pause, and resume depend on this value.

### `state`

```tsx
readonly state: AlarmState
```

The current alarm state.

### `schedule`

```tsx
readonly schedule?: Schedule | null
```

The scheduling rule for this alarm.

Pure timers may not have a `schedule`.

### `countdownDuration`

```tsx
readonly countdownDuration?: Countdown | null
```

The countdown-related configuration for this alarm.

---

## Schedule

```tsx
class Schedule {
  readonly type: "fixed" | "relative"
  readonly date?: Date | null
  readonly hour?: number | null
  readonly minute?: number | null
  readonly weekdays?: number[] | null

  static fixed(date: Date): Schedule
  static relative(hour: number, minute: number): Schedule
  static weekly(hour: number, minute: number, weekdays: number[]): Schedule
}
```

Describes when an alarm should fire.

### `type`

```tsx
readonly type: "fixed" | "relative"
```

The schedule type.

* `"fixed"`: a fixed absolute time
* `"relative"`: a schedule based on hour and minute

### `date`

```tsx
readonly date?: Date | null
```

The exact trigger date for a fixed-time schedule.

### `hour`

```tsx
readonly hour?: number | null
```

The hour component of the schedule.

### `minute`

```tsx
readonly minute?: number | null
```

The minute component of the schedule.

### `weekdays`

```tsx
readonly weekdays?: number[] | null
```

The weekday array for weekly recurring schedules.

The exact weekday number mapping depends on your underlying implementation. Typically this uses values from 1 to 7.

### `Schedule.fixed(date)`

```tsx
static fixed(date: Date): Schedule
```

Creates a fixed-time schedule.

```tsx
const schedule = AlarmManager.Schedule.fixed(
  new Date("2026-03-20T22:30:00")
)
```

### `Schedule.relative(hour, minute)`

```tsx
static relative(hour: number, minute: number): Schedule
```

Creates a schedule based on hour and minute.

This is typically suitable for “every day at a given time” scenarios.

```tsx
const schedule = AlarmManager.Schedule.relative(7, 30)
```

### `Schedule.weekly(hour, minute, weekdays)`

```tsx
static weekly(hour: number, minute: number, weekdays: number[]): Schedule
```

Creates a weekly recurring schedule.

```tsx
const schedule = AlarmManager.Schedule.weekly(8, 0, [2, 3, 4, 5, 6])
```

---

## Countdown

```tsx
class Countdown {
  readonly preAlert?: number | null
  readonly postAlert?: number | null

  static create(options?: {
    preAlert?: DurationInSeconds | null
    postAlert?: DurationInSeconds | null
  }): Countdown
}
```

Defines countdown-related parameters.

### `preAlert`

```tsx
readonly preAlert?: number | null
```

The countdown duration before the alert, in seconds.

### `postAlert`

```tsx
readonly postAlert?: number | null
```

The additional duration after the alert, in seconds.

The exact behavior depends on your underlying implementation.

### `Countdown.create(options?)`

```tsx
static create(options?: {
  preAlert?: DurationInSeconds | null
  postAlert?: DurationInSeconds | null
}): Countdown
```

Creates a countdown configuration object.

```tsx
const countdown = AlarmManager.Countdown.create({
  preAlert: 10 * 60,
  postAlert: 5 * 60
})
```

---

## Button

```tsx
class Button {
  static create(options: {
    title?: string
    textColor?: Color
    systemImageName?: string
  }): Button
}
```

Defines the appearance of a button shown in the alert UI.

### Parameters

#### `title`

The button title.

#### `textColor`

The button text color.

In this documentation, `Color` should be provided as a hex string, for example:

```tsx
"#ffffff"
"#ff9500"
"#34c759"
```

#### `systemImageName`

The SF Symbols name to use for the button icon.

### `Button.create(options)`

```tsx
static create(options: {
  title?: string
  textColor?: Color
  systemImageName?: string
}): Button
```

```tsx
const stopButton = AlarmManager.Button.create({
  title: "Stop",
  textColor: "#ffffff",
  systemImageName: "stop.fill"
})

const snoozeButton = AlarmManager.Button.create({
  title: "Later",
  textColor: "#ffffff",
  systemImageName: "timer"
})
```

---

## Sound

```tsx
class Sound {
  static default(): Sound
  static named(name: string): Sound
}
```

Defines the alert sound.

### `Sound.default()`

```tsx
static default(): Sound
```

Uses the system default sound.

```tsx
const sound = AlarmManager.Sound.default()
```

### `Sound.named(name)`

```tsx
static named(name: string): Sound
```

Uses a sound with the specified name.

```tsx
const sound = AlarmManager.Sound.named("bell")
```

Available names depend on your underlying implementation and system support.

---

## AlertPresentation

```tsx
class AlertPresentation {
  static create(options: {
    title: string
    stopButton?: Button | null
    secondaryButton?: Button | null
    secondaryBehavior?: SecondaryButtonBehavior | null
  }): AlertPresentation
}
```

Defines the UI shown when the alarm is alerting.

### Parameters

#### `title`

The alert title. This is required.

#### `stopButton`

> **Deprecated.** Starting with iOS 26.1 the alert's stop action is rendered by the system as a slider, not as a custom button. `stopButton` is kept only for backward compatibility and is silently ignored on iOS 26.1+. You can omit it.

The stop button appearance (iOS 26.0 fallback only).

#### `secondaryButton`

The secondary button appearance.

#### `secondaryBehavior`

The behavior of the secondary button. Possible values:

* `"countdown"`
* `"custom"`

### `AlertPresentation.create(options)`

```tsx
static create(options: {
  title: string
  stopButton?: Button | null
  secondaryButton?: Button | null
  secondaryBehavior?: SecondaryButtonBehavior | null
}): AlertPresentation
```

```tsx
const alert = AlarmManager.AlertPresentation.create({
  title: "Wake up",
  stopButton: AlarmManager.Button.create({
    title: "Dismiss",
    textColor: "#ffffff",
    systemImageName: "xmark"
  }),
  secondaryButton: AlarmManager.Button.create({
    title: "Remind me later",
    textColor: "#ffffff",
    systemImageName: "timer"
  }),
  secondaryBehavior: "countdown"
})
```

---

## CountdownPresentation

```tsx
class CountdownPresentation {
  static create(title?: string | null, pauseButton?: Button | null): CountdownPresentation
}
```

Defines the UI shown while a countdown is running.

### `CountdownPresentation.create(title?, pauseButton?)`

```tsx
static create(title?: string | null, pauseButton?: Button | null): CountdownPresentation
```

```tsx
const countdownPresentation = AlarmManager.CountdownPresentation.create(
  "Focus session in progress",
  AlarmManager.Button.create({
    title: "Pause",
    textColor: "#ffffff",
    systemImageName: "pause.fill"
  })
)
```

---

## PausedPresentation

```tsx
class PausedPresentation {
  static create(title?: string | null, resumeButton?: Button | null): PausedPresentation | null
}
```

Defines the UI shown while a countdown is paused.

### `PausedPresentation.create(title?, resumeButton?)`

```tsx
static create(title?: string | null, resumeButton?: Button | null): PausedPresentation | null
```

```tsx
const pausedPresentation = AlarmManager.PausedPresentation.create(
  "Paused",
  AlarmManager.Button.create({
    title: "Resume",
    textColor: "#ffffff",
    systemImageName: "play.fill"
  })
)
```

---

## Attributes

```tsx
class Attributes {
  static create(options: {
    alert: AlertPresentation
    countdown?: CountdownPresentation | null
    paused?: PausedPresentation | null
    tintColor?: Color
    metadata?: Record<string, string>
    liveActivity?: {
      name: string
    }
  }): Attributes | null
}
```

Combines the full presentation configuration for an alarm.

### Parameters

#### `alert`

The alert presentation shown when the alarm fires. This is required.

#### `countdown`

The presentation shown while countdown is running.

#### `paused`

The presentation shown while countdown is paused.

#### `tintColor`

The main tint color. Hex strings are recommended, such as:

```tsx
"#ffffff"
"#007aff"
"#ff9500"
```

#### `metadata`

Additional metadata for your own business logic.

#### `liveActivity`

Optional custom Live Activity UI binding. If the current script provides `alarm_live_activity.tsx` and registers the same name with `AlarmLiveActivity.register`, Scripting renders that UI on the Lock Screen and Dynamic Island. Otherwise, it uses the built-in alarm UI.

```tsx
liveActivity: {
  name: "FocusTimerActivity"
}
```

See the **Alarm Live Activity** document for the full UI builder API.

### `Attributes.create(options)`

```tsx
static create(options: {
  alert: AlertPresentation
  countdown?: CountdownPresentation | null
  paused?: PausedPresentation | null
  tintColor?: Color
  metadata?: Record<string, string>
  liveActivity?: {
    name: string
  }
}): Attributes | null
```

```tsx
const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Pomodoro finished",
    stopButton: AlarmManager.Button.create({
      title: "Done",
      textColor: "#ffffff",
      systemImageName: "checkmark"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Focusing",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#ff9500",
  metadata: {
    type: "pomodoro",
    source: "study-script"
  },
  liveActivity: {
    name: "FocusTimerActivity"
  }
})
```

---

## Configuration

```tsx
class Configuration {
  static alarm(options: {
    schedule?: Schedule | null
    attributes: Attributes
    sound?: Sound | null
    stopIntent?: AlarmAppIntent | null
    secondaryIntent?: AlarmAppIntent | null
  }): Configuration | null

  static timer(options: {
    duration: DurationInSeconds
    attributes: Attributes
    sound?: Sound | null
    stopIntent?: AlarmAppIntent | null
    secondaryIntent?: AlarmAppIntent | null
  }): Configuration | null

  static countdown(options: {
    countdown?: Countdown | null
    schedule?: Schedule | null
    attributes: Attributes
    sound?: Sound | null
    stopIntent?: AlarmAppIntent | null
    secondaryIntent?: AlarmAppIntent | null
  }): Configuration | null
}
```

Creates the final configuration object passed to `AlarmManager.schedule()`.

---

## Configuration.alarm

```tsx
static alarm(options: {
  schedule?: Schedule | null
  attributes: Attributes
  sound?: Sound | null
  stopIntent?: AlarmAppIntent | null
  secondaryIntent?: AlarmAppIntent | null
}): Configuration | null
```

Creates a regular alarm configuration.

Suitable for:

* One-time alarms
* Daily alarms
* Weekly recurring alarms

### Parameters

#### `schedule`

The alarm schedule.

#### `attributes`

The presentation attributes. Required.

#### `sound`

The alert sound.

#### `stopIntent`

An `AppIntent` bound to the stop button.

#### `secondaryIntent`

An `AppIntent` bound to the secondary button.

### Example

```tsx
const schedule = AlarmManager.Schedule.fixed(
  new Date("2026-03-20T07:30:00")
)

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Good morning, time to wake up",
    stopButton: AlarmManager.Button.create({
      title: "Dismiss",
      textColor: "#ffffff",
      systemImageName: "xmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "Later",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "countdown"
  }),
  tintColor: "#34c759",
  metadata: {
    category: "morning"
  }
})

const configuration = AlarmManager.Configuration.alarm({
  schedule,
  attributes,
  sound: AlarmManager.Sound.default()
})
```

---

## Configuration.timer

```tsx
static timer(options: {
  duration: DurationInSeconds
  attributes: Attributes
  sound?: Sound | null
  stopIntent?: AlarmAppIntent | null
  secondaryIntent?: AlarmAppIntent | null
}): Configuration | null
```

Creates a timer configuration.

Suitable for:

* Pomodoro timers
* Workout timers
* Cooking reminders
* Short focus sessions

### Parameters

#### `duration`

The total duration of the timer, in seconds.

#### `attributes`

The presentation attributes. Required.

#### `sound`

The alert sound.

#### `stopIntent`

An `AppIntent` bound to the stop action.

#### `secondaryIntent`

An `AppIntent` bound to the secondary action.

### Example

```tsx
const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "25-minute focus session finished",
    stopButton: AlarmManager.Button.create({
      title: "Done",
      textColor: "#ffffff",
      systemImageName: "checkmark"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Focusing",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#ff9500",
  metadata: {
    mode: "focus"
  }
})

const configuration = AlarmManager.Configuration.timer({
  duration: 25 * 60,
  attributes,
  sound: AlarmManager.Sound.default()
})
```

---

## Configuration.countdown

```tsx
static countdown(options: {
  countdown?: Countdown | null
  schedule?: Schedule | null
  attributes: Attributes
  sound?: Sound | null
  stopIntent?: AlarmAppIntent | null
  secondaryIntent?: AlarmAppIntent | null
}): Configuration | null
```

Creates a countdown reminder configuration.

Suitable for:

* Triggering a countdown after a scheduled time
* “Remind me later” flows
* Custom pre-alert and post-alert countdown behavior

### Parameters

#### `countdown`

The countdown configuration.

#### `schedule`

The schedule rule.

#### `attributes`

The presentation attributes. Required.

#### `sound`

The alert sound.

#### `stopIntent`

An `AppIntent` bound to the stop action.

#### `secondaryIntent`

An `AppIntent` bound to the secondary action.

### Example

```tsx
const countdown = AlarmManager.Countdown.create({
  preAlert: 15 * 60,
  postAlert: 5 * 60
})

const schedule = AlarmManager.Schedule.relative(21, 0)

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Get ready to rest",
    stopButton: AlarmManager.Button.create({
      title: "OK",
      textColor: "#ffffff",
      systemImageName: "bed.double.fill"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "Remind me in 15 minutes",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "countdown"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Rest countdown in progress",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#af52de",
  metadata: {
    scene: "night"
  }
})

const configuration = AlarmManager.Configuration.countdown({
  countdown,
  schedule,
  attributes,
  sound: AlarmManager.Sound.default()
})
```

---

## isAvailable

```tsx
const isAvailable: boolean
```

Indicates whether AlarmKit is available in the current environment.

```tsx
if (!AlarmManager.isAvailable) {
  throw new Error("AlarmManager is not available")
}
```

---

## alarms

```tsx
function alarms(): Promise<Alarm[]>
```

Returns all current alarms.

### Return Value

Returns `Promise<Alarm[]>`.

### Example

```tsx
const list = await AlarmManager.alarms()

for (const alarm of list) {
  console.log(alarm.id, alarm.state)
}
```

---

## schedule

```tsx
function schedule(id: string, configuration: Configuration): Promise<Alarm>
```

Creates and schedules an alarm using the provided configuration.

### Parameters

#### `id`

The unique alarm ID.

It must be generated with `UUID.string()`.

#### `configuration`

A configuration created by `AlarmManager.Configuration.alarm()`, `timer()`, or `countdown()`.

### Return Value

Returns the created `Alarm`.

### Example

```tsx
const configuration = AlarmManager.Configuration.timer({
  duration: 10 * 60,
  attributes: AlarmManager.Attributes.create({
    alert: AlarmManager.AlertPresentation.create({
      title: "10 minutes are up",
      stopButton: AlarmManager.Button.create({
        title: "Stop",
        textColor: "#ffffff",
        systemImageName: "stop.fill"
      })
    }),
    countdown: AlarmManager.CountdownPresentation.create(
      "Counting down",
      AlarmManager.Button.create({
        title: "Pause",
        textColor: "#ffffff",
        systemImageName: "pause.fill"
      })
    ),
    paused: AlarmManager.PausedPresentation.create(
      "Paused",
      AlarmManager.Button.create({
        title: "Resume",
        textColor: "#ffffff",
        systemImageName: "play.fill"
      })
    ),
    tintColor: "#007aff"
  }),
  sound: AlarmManager.Sound.default()
})

const id = UUID.string()
const alarm = await AlarmManager.schedule(id, configuration)

console.log(alarm.id, alarm.state)
```

---

## cancel

```tsx
function cancel(id: string): Promise<boolean>
```

Cancels the specified alarm.

### Parameters

#### `id`

The alarm ID to cancel.

### Return Value

Returns whether the operation succeeded.

### Example

```tsx
const success = await AlarmManager.cancel(alarmId)
console.log("Cancel result:", success)
```

---

## stop

```tsx
function stop(id: string): Promise<boolean>
```

Stops the specified alarm or alert.

This is typically used when an alarm is already alerting, or when the current flow should be terminated.

### Example

```tsx
const success = await AlarmManager.stop(alarmId)
console.log("Stop result:", success)
```

---

## pause

```tsx
function pause(id: string): Promise<boolean>
```

Pauses the specified countdown or timer.

### Example

```tsx
const success = await AlarmManager.pause(alarmId)
console.log("Pause result:", success)
```

---

## resume

```tsx
function resume(id: string): Promise<boolean>
```

Resumes a paused countdown or timer.

### Example

```tsx
const success = await AlarmManager.resume(alarmId)
console.log("Resume result:", success)
```

---

## startCountdown

```tsx
function startCountdown(id: string): Promise<boolean>
```

Starts the countdown flow for the specified alarm.

This is usually used with alarms created using `Configuration.countdown()` or flows that include “remind me later” behavior.

### Example

```tsx
const success = await AlarmManager.startCountdown(alarmId)
console.log("Start countdown result:", success)
```

---

## addAlarmUpdateListener

```tsx
function addAlarmUpdateListener(listener: AlarmUpdateListener): void
```

Adds an alarm update listener.

When the alarm list changes, the callback receives the latest `Alarm[]`.

### Example

```tsx
const listener = (alarms: AlarmManager.Alarm[]) => {
  console.log("Alarm count:", alarms.length)
  for (const alarm of alarms) {
    console.log(alarm.id, alarm.state)
  }
}

AlarmManager.addAlarmUpdateListener(listener)
```

---

## removeAlarmUpdateListener

```tsx
function removeAlarmUpdateListener(listener?: AlarmUpdateListener): void
```

Removes a previously added listener, or removes all listeners if no argument is provided.

### Parameters

#### `listener`

The listener function to remove.

If this argument is omitted, the exact behavior depends on your underlying implementation.

### Example

```tsx
const listener = (alarms: AlarmManager.Alarm[]) => {
  console.log("Updated:", alarms.length)
}

AlarmManager.addAlarmUpdateListener(listener)

AlarmManager.removeAlarmUpdateListener(listener)
```

---

## Using AppIntent with AlarmManager

`AlarmManager` supports `AppIntent` through `stopIntent` and `secondaryIntent`.

This allows alert buttons to do more than just stop an alert or start a countdown. They can also run custom script logic, for example:

* Marking a task as completed when the user taps Stop
* Updating local state when an alert is dismissed
* Refreshing Widgets or Live Activities after “Later” is tapped
* Triggering additional business logic through global APIs

---

## Where AppIntent Must Be Defined

All `AppIntent` definitions must be placed in:

```tsx
app_intents.tsx
```

Do not define them in `widget.tsx`, `live_activity.tsx`, `control_widget.tsx`, or regular script files.

When an `AppIntent` runs:

```tsx
Script.env === "app_intents"
```

That means the `perform` function always executes in the `app_intents` environment.

---

## AppIntent Types

### AppIntent<T>

Represents a concrete app intent instance.

| Field      | Type                | Description                                        |
| ---------- | ------------------- | -------------------------------------------------- |
| `script`   | `string`            | The script path, generated internally              |
| `name`     | `string`            | The unique intent name                             |
| `protocol` | `AppIntentProtocol` | The protocol type used by the intent               |
| `params`   | `T`                 | The parameters passed when the intent is triggered |

### AppIntentFactory<T>

```tsx
type AppIntentFactory<T> = (params: T) => AppIntent<T>
```

A factory function that creates an `AppIntent` instance from parameters.

### AppIntentPerform<T>

```tsx
type AppIntentPerform<T> = (params: T) => Promise<void>
```

The async function that runs when the intent is triggered.

### AppIntentProtocol

| Enum Member            | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `AppIntent`            | A regular app intent                                         |
| `AudioPlaybackIntent`  | An intent for controlling audio playback                     |
| `AudioRecordingIntent` | An intent for controlling audio recording                    |
| `LiveActivityIntent`   | An intent for starting, pausing, or updating Live Activities |

For `AlarmManager`, you should use:

```tsx
AppIntentProtocol.LiveActivityIntent
```

---

## AppIntentManager.register

```tsx
static register<T = undefined>(options: {
  name: string
  protocol: AppIntentProtocol
  perform: AppIntentPerform<T>
}): AppIntentFactory<T>
```

Registers a new `AppIntent`.

### Parameters

#### `name`

The unique intent name.

#### `protocol`

The protocol type for the intent.

#### `perform`

The async function that runs when the intent is triggered.

### Return Value

Returns a factory function that creates the corresponding `AppIntent` instance.

---

## AppIntent Example for AlarmManager

The example below shows how to define two intents in `app_intents.tsx` for use with `AlarmManager`.

```tsx
/// app_intents.tsx

export const StopFocusAlarmIntent = AppIntentManager.register({
  name: "StopFocusAlarmIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId, taskId }: { alarmId: string; taskId: string }) => {
    console.log("Stopping alert:", alarmId, taskId)

    // Your custom logic goes here
    // For example, update task state, save logs, refresh UI, etc.
    await Storage.set(`task:${taskId}:finished`, true)

    Widget.reloadAll()
  }
})

export const SnoozeFocusAlarmIntent = AppIntentManager.register({
  name: "SnoozeFocusAlarmIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId }: { alarmId: string }) => {
    console.log("Snoozing alert:", alarmId)

    Widget.reloadAll()
  }
})
```

---

## Binding AppIntent to AlarmManager

Once the intents are defined, they can be attached through `stopIntent` and `secondaryIntent`.

```tsx
const alarmId = UUID.string()

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Focus session finished",
    stopButton: AlarmManager.Button.create({
      title: "Done",
      textColor: "#ffffff",
      systemImageName: "checkmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "Snooze 5 min",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "custom"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Counting down",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#007aff",
  metadata: {
    type: "focus"
  }
})

const configuration = AlarmManager.Configuration.timer({
  duration: 25 * 60,
  attributes,
  sound: AlarmManager.Sound.default(),
  stopIntent: StopFocusAlarmIntent({
    alarmId,
    taskId: "task_001"
  }),
  secondaryIntent: SnoozeFocusAlarmIntent({
    alarmId
  })
})

await AlarmManager.schedule(alarmId, configuration)
```

In this example:

* The stop button triggers `StopFocusAlarmIntent`
* The secondary button triggers `SnoozeFocusAlarmIntent`
* The secondary button uses `"custom"`, so its behavior is fully defined by `secondaryIntent`

---

## Using Countdown Behavior for the Secondary Button

If you want the secondary button to directly use AlarmKit’s countdown behavior, set:

```tsx
secondaryBehavior: "countdown"
```

Example:

```tsx
const alarmId = UUID.string()

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Time to rest",
    stopButton: AlarmManager.Button.create({
      title: "Dismiss",
      textColor: "#ffffff",
      systemImageName: "xmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "Remind me in 10 minutes",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "countdown"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Snooze countdown in progress",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#ff3b30"
})

const configuration = AlarmManager.Configuration.countdown({
  countdown: AlarmManager.Countdown.create({
    preAlert: 10 * 60
  }),
  attributes,
  sound: AlarmManager.Sound.default()
})

await AlarmManager.schedule(alarmId, configuration)
```

This approach is better for standard snooze-style interactions.

---

## Creating a One-Time Alarm

```tsx
if (!AlarmManager.isAvailable) {
  throw new Error("AlarmKit is not available in the current environment")
}

const alarmId = UUID.string()

const schedule = AlarmManager.Schedule.fixed(
  new Date("2026-03-20T22:30:00")
)

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Time to rest",
    stopButton: AlarmManager.Button.create({
      title: "Dismiss",
      textColor: "#ffffff",
      systemImageName: "xmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "Remind me in 10 minutes",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "countdown"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Snooze countdown in progress",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#ff3b30",
  metadata: {
    purpose: "sleep"
  }
})

const configuration = AlarmManager.Configuration.alarm({
  schedule,
  attributes,
  sound: AlarmManager.Sound.default()
})

const alarm = await AlarmManager.schedule(alarmId, configuration)
console.log("Created:", alarm.id, alarm.state)
```

---

## Creating a Weekly Recurring Alarm

```tsx
const alarmId = UUID.string()

const schedule = AlarmManager.Schedule.weekly(7, 30, [2, 3, 4, 5, 6])

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Weekday wake-up reminder",
    stopButton: AlarmManager.Button.create({
      title: "Wake Up",
      textColor: "#ffffff",
      systemImageName: "sun.max.fill"
    })
  }),
  tintColor: "#34c759",
  metadata: {
    tag: "weekday-morning"
  }
})

const configuration = AlarmManager.Configuration.alarm({
  schedule,
  attributes,
  sound: AlarmManager.Sound.default()
})

await AlarmManager.schedule(alarmId, configuration)
```

---

## Creating a Pomodoro Timer

```tsx
const alarmId = UUID.string()

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Your focus session has ended",
    stopButton: AlarmManager.Button.create({
      title: "Done",
      textColor: "#ffffff",
      systemImageName: "checkmark.circle.fill"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Focusing",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Focus paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#ff9500",
  metadata: {
    type: "pomodoro",
    duration: "1500"
  }
})

const configuration = AlarmManager.Configuration.timer({
  duration: 25 * 60,
  attributes,
  sound: AlarmManager.Sound.default()
})

await AlarmManager.schedule(alarmId, configuration)
```

---

## Creating a Manually Started Countdown Reminder

```tsx
const alarmId = UUID.string()

const countdown = AlarmManager.Countdown.create({
  preAlert: 5 * 60,
  postAlert: 60
})

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "Snooze time is over",
    stopButton: AlarmManager.Button.create({
      title: "Got it",
      textColor: "#ffffff",
      systemImageName: "bell.slash.fill"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "Snooze in progress",
    AlarmManager.Button.create({
      title: "Pause",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "Countdown paused",
    AlarmManager.Button.create({
      title: "Resume",
      textColor: "#ffffff",
      systemImageName: "play.fill"
    })
  ),
  tintColor: "#af52de"
})

const configuration = AlarmManager.Configuration.countdown({
  countdown,
  attributes,
  sound: AlarmManager.Sound.default()
})

await AlarmManager.schedule(alarmId, configuration)
await AlarmManager.startCountdown(alarmId)
```

---

## Querying and Controlling Alarms

```tsx
const alarms = await AlarmManager.alarms()
console.log("Alarm count:", alarms.length)

const firstAlarm = alarms[0]
if (firstAlarm) {
  await AlarmManager.pause(firstAlarm.id)
  await AlarmManager.resume(firstAlarm.id)
  await AlarmManager.stop(firstAlarm.id)
}
```

---

## Listening for Alarm State Changes

```tsx
const listener = (alarms: AlarmManager.Alarm[]) => {
  const summary = alarms.map(item => ({
    id: item.id,
    state: item.state
  }))
  console.log("Latest alarm states:", JSON.stringify(summary, null, 2))
}

AlarmManager.addAlarmUpdateListener(listener)

// Remove when no longer needed
// AlarmManager.removeAlarmUpdateListener(listener)
```

---

## Execution Environment

`AlarmManager` itself is a global API and can be used directly in regular scripts.

However, if you attach `AppIntent` objects to `AlarmManager`, those intent `perform` functions always run in:

```tsx
Script.env === "app_intents"
```

That means:

* Alarm creation logic such as `AlarmManager.schedule()` usually runs in a normal script environment
* Logic for `stopIntent` and `secondaryIntent` runs in the `perform` functions defined in `app_intents.tsx`
* Inside `perform`, you can safely do things like network requests, state updates, Widget refreshes, and Live Activity updates

---

## Best Practices

### Always use UUID.string() for alarmId

This is a strict requirement of `AlarmManager`.

```tsx
const alarmId = UUID.string()
```

### Keep the generated alarmId

Once an alarm is created, keep the `alarmId` if you need to pause, resume, stop, or cancel it later.

### Use metadata for business-related information

Store task IDs, source pages, scene names, or other app-specific values there.

```tsx
metadata: {
  taskId: "task_123",
  scene: "study",
  source: "focus-page"
}
```

### Keep all AppIntent definitions in app_intents.tsx

Do not scatter them across multiple files.

### Use explicit parameter types for AppIntent

This improves type checking and editor completion.

```tsx
perform: async ({ alarmId, taskId }: { alarmId: string; taskId: string }) => {
  // ...
}
```

### Prefer countdown for standard snooze behavior

If you only need a normal “remind me again in a few minutes” flow, prefer:

```tsx
secondaryBehavior: "countdown"
```

If you need completely custom logic, use:

```tsx
secondaryBehavior: "custom"
secondaryIntent: ...
```

---

## Notes

### Attributes.create(...) may return null

```tsx
const attributes = AlarmManager.Attributes.create(...)
```

Its return type is `Attributes | null`, so you should validate the result in stricter flows.

### Configuration methods may also return null

```tsx
const configuration = AlarmManager.Configuration.timer(...)
```

These methods also allow `null`, so validate before calling `schedule()`.

### pause, resume, and startCountdown are not meaningful for every alarm type

These methods are generally intended for timers or countdown-based flows. For fixed-time alarms, some operations may not make sense.

---

## Full Example

The example below shows a complete flow that includes `AppIntent`.

```tsx
/// app_intents.tsx

export const StopPomodoroIntent = AppIntentManager.register({
  name: "StopPomodoroIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId, sessionId }: { alarmId: string; sessionId: string }) => {
    console.log("Pomodoro finished:", alarmId, sessionId)
    await Storage.set(`pomodoro:${sessionId}:done`, true)
    Widget.reloadAll()
  }
})

export const ExtendPomodoroIntent = AppIntentManager.register({
  name: "ExtendPomodoroIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId, extraMinutes }: { alarmId: string; extraMinutes: number }) => {
    console.log("Extending Pomodoro:", alarmId, extraMinutes)
    Widget.reloadAll()
  }
})
```

```tsx
/// regular script file

async function main() {
  if (!AlarmManager.isAvailable) {
    console.log("AlarmManager is not available")
    return
  }

  const listener = (alarms: AlarmManager.Alarm[]) => {
    console.log(
      "Alarm update:",
      alarms.map(item => `${item.id}:${item.state}`).join(", ")
    )
  }

  AlarmManager.addAlarmUpdateListener(listener)

  const alarmId = UUID.string()

  const attributes = AlarmManager.Attributes.create({
    alert: AlarmManager.AlertPresentation.create({
      title: "Focus session finished",
      stopButton: AlarmManager.Button.create({
        title: "Done",
        textColor: "#ffffff",
        systemImageName: "checkmark"
      }),
      secondaryButton: AlarmManager.Button.create({
        title: "Extend 5 min",
        textColor: "#ffffff",
        systemImageName: "timer"
      }),
      secondaryBehavior: "custom"
    }),
    countdown: AlarmManager.CountdownPresentation.create(
      "Focusing",
      AlarmManager.Button.create({
        title: "Pause",
        textColor: "#ffffff",
        systemImageName: "pause.fill"
      })
    ),
    paused: AlarmManager.PausedPresentation.create(
      "Paused",
      AlarmManager.Button.create({
        title: "Resume",
        textColor: "#ffffff",
        systemImageName: "play.fill"
      })
    ),
    tintColor: "#007aff",
    metadata: {
      feature: "focus-mode"
    }
  })

  if (!attributes) {
    throw new Error("Failed to create Attributes")
  }

  const configuration = AlarmManager.Configuration.timer({
    duration: 15 * 60,
    attributes,
    sound: AlarmManager.Sound.default(),
    stopIntent: StopPomodoroIntent({
      alarmId,
      sessionId: "session_001"
    }),
    secondaryIntent: ExtendPomodoroIntent({
      alarmId,
      extraMinutes: 5
    })
  })

  if (!configuration) {
    throw new Error("Failed to create Configuration")
  }

  const alarm = await AlarmManager.schedule(alarmId, configuration)
  console.log("Created alarm:", alarm.id, alarm.state)

  const current = await AlarmManager.alarms()
  console.log("Current alarms:", current.map(item => item.id))

  await AlarmManager.pause(alarmId)
  await AlarmManager.resume(alarmId)

  // Remove when finished
  // AlarmManager.removeAlarmUpdateListener(listener)
}

main().catch(error => {
  console.log(String(error))
})
```
