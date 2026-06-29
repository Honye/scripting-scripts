`AlarmManager` (iOS 26+) 是 Scripting 提供的全局 API，用于创建和管理基于 AlarmKit 的闹钟、定时器和倒计时提醒。它不需要导入，可直接在脚本中使用。

这个 API 适合以下场景：

* 创建一次性闹钟，例如“今晚 22:30 提醒我”
* 创建每天或每周重复的闹钟
* 创建番茄钟、运动计时器、倒计时等短时提醒
* 自定义提醒界面的标题、按钮、颜色、图标和元数据
* 结合 `AppIntent` 让提醒界面的按钮触发脚本逻辑
* 监听闹钟状态变化并同步更新 UI

---

## 使用前提

建议在使用前先判断当前环境是否支持 AlarmKit：

```tsx
if (!AlarmManager.isAvailable) {
  console.log("当前系统不支持 AlarmKit")
}
```

如果当前设备或系统版本不支持，相关方法可能无法正常工作。

---

## 基本概念

`AlarmManager` 主要围绕以下对象工作：

* `Alarm`：已存在的闹钟实例
* `Schedule`：触发时间规则
* `Countdown`：倒计时参数
* `Button`：提醒界面按钮样式
* `Sound`：提醒声音
* `AlertPresentation`：提醒触发时的展示内容
* `CountdownPresentation`：倒计时进行中的展示内容
* `PausedPresentation`：倒计时暂停时的展示内容
* `Attributes`：提醒界面的整体展示属性
* `Configuration`：最终用于创建闹钟、定时器、倒计时的配置对象

---

## Alarm ID 规则

创建闹钟时传入的 `id` 必须使用：

```tsx
UUID.string()
```

生成。

不要手动拼接固定字符串，也不要复用旧 ID。每次创建新的闹钟、定时器或倒计时时，都应生成一个新的 UUID 字符串。

正确示例：

```tsx
const id = UUID.string()
```

不推荐：

```tsx
const id = "morning-alarm"
const id = `timer-${Date.now()}`
```

后续对闹钟的 `cancel`、`stop`、`pause`、`resume`、`startCountdown` 等操作，都需要使用创建时对应的同一个 ID。

---

## AlarmState

```tsx
type AlarmState = "scheduled" | "countdown" | "paused" | "alerting"
```

表示闹钟当前状态。

### `"scheduled"`

表示闹钟已创建，处于等待触发状态。

常见于：

* 固定时间闹钟
* 每周重复闹钟
* 尚未开始的倒计时流程

### `"countdown"`

表示当前处于倒计时进行中。

常见于：

* 已开始运行的定时器
* 已启动的倒计时提醒

### `"paused"`

表示当前倒计时已暂停。

### `"alerting"`

表示提醒已经触发，当前处于提醒展示或响铃状态。

---

## SecondaryButtonBehavior

```tsx
type SecondaryButtonBehavior = "countdown" | "custom"
```

控制提醒界面第二按钮的行为方式。

### `"countdown"`

第二按钮用于启动一个倒计时行为。

通常适合“稍后提醒我”“再过几分钟提醒一次”这类场景。

### `"custom"`

第二按钮作为自定义按钮存在，实际行为由 `secondaryIntent` 决定。

---

## AlarmAppIntent

```tsx
type AlarmAppIntent = AppIntent<any, AppIntentProtocol.LiveActivityIntent>
```

表示可绑定到闹钟按钮上的 `AppIntent`。

它主要用于：

* 停止按钮触发额外业务逻辑
* 次要按钮触发自定义动作
* 与 Live Activity、Widget、ControlWidget 等机制联动

可配置的位置包括：

* `Configuration.alarm(...).stopIntent`
* `Configuration.alarm(...).secondaryIntent`
* `Configuration.timer(...).stopIntent`
* `Configuration.timer(...).secondaryIntent`
* `Configuration.countdown(...).stopIntent`
* `Configuration.countdown(...).secondaryIntent`

注意这里要求的 `AppIntent` 协议类型是：

```tsx
AppIntentProtocol.LiveActivityIntent
```

也就是说，给 `AlarmManager` 绑定的意图应当使用 `LiveActivityIntent` 协议注册。

后文有完整示例。

---

## AlarmUpdateListener

```tsx
type AlarmUpdateListener = (alarms: Alarm[]) => void
```

用于监听闹钟列表变化的回调函数。

当闹钟被创建、取消、暂停、恢复、开始倒计时或状态发生变化时，监听器会收到最新的 `Alarm[]`。

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

表示一个已存在的闹钟对象。

### `id`

```tsx
readonly id: string
```

闹钟唯一标识符。

创建闹钟时必须使用 `UUID.string()` 生成，后续取消、停止、暂停、恢复等操作都依赖这个值。

### `state`

```tsx
readonly state: AlarmState
```

当前闹钟的状态。

### `schedule`

```tsx
readonly schedule?: Schedule | null
```

闹钟的时间规则。

纯定时器场景下不一定有 `schedule`。

### `countdownDuration`

```tsx
readonly countdownDuration?: Countdown | null
```

倒计时相关配置。

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

用于描述闹钟的触发时间规则。

### `type`

```tsx
readonly type: "fixed" | "relative"
```

表示时间规则类型。

* `"fixed"`：固定绝对时间
* `"relative"`：按小时和分钟规则安排

### `date`

```tsx
readonly date?: Date | null
```

固定时间闹钟的具体触发时间。

### `hour`

```tsx
readonly hour?: number | null
```

触发小时。

### `minute`

```tsx
readonly minute?: number | null
```

触发分钟。

### `weekdays`

```tsx
readonly weekdays?: number[] | null
```

每周重复触发的星期数组。

具体 weekday 的编号语义以你的底层实现为准。通常会使用 1 到 7 表示一周中的某几天。

### `Schedule.fixed(date)`

```tsx
static fixed(date: Date): Schedule
```

创建一个固定时间触发的日程。

```tsx
const schedule = AlarmManager.Schedule.fixed(
  new Date("2026-03-20T22:30:00")
)
```

### `Schedule.relative(hour, minute)`

```tsx
static relative(hour: number, minute: number): Schedule
```

创建一个按时分安排的规则。

通常适合“每天某个时间”的提醒。

```tsx
const schedule = AlarmManager.Schedule.relative(7, 30)
```

### `Schedule.weekly(hour, minute, weekdays)`

```tsx
static weekly(hour: number, minute: number, weekdays: number[]): Schedule
```

创建一个每周重复的提醒规则。

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

用于定义倒计时相关参数。

### `preAlert`

```tsx
readonly preAlert?: number | null
```

提醒前的倒计时时长，单位为秒。

### `postAlert`

```tsx
readonly postAlert?: number | null
```

提醒后的附加时长，单位为秒。

具体行为取决于底层实现。

### `Countdown.create(options?)`

```tsx
static create(options?: {
  preAlert?: DurationInSeconds | null
  postAlert?: DurationInSeconds | null
}): Countdown
```

创建倒计时配置对象。

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

用于定义提醒界面按钮样式。

### 参数

#### `title`

按钮标题。

#### `textColor`

按钮文字颜色。

文档中的 `Color` 建议使用十六进制字符串形式，例如：

```tsx
"#ffffff"
"#ff9500"
"#34c759"
```

#### `systemImageName`

SF Symbols 图标名称。

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
  title: "停止",
  textColor: "#ffffff",
  systemImageName: "stop.fill"
})

const snoozeButton = AlarmManager.Button.create({
  title: "稍后",
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

用于定义提醒声音。

### `Sound.default()`

```tsx
static default(): Sound
```

使用系统默认声音。

```tsx
const sound = AlarmManager.Sound.default()
```

### `Sound.named(name)`

```tsx
static named(name: string): Sound
```

使用指定名称的声音。

```tsx
const sound = AlarmManager.Sound.named("bell")
```

可用名称取决于你的底层实现与系统支持情况。

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

用于定义提醒触发时的展示内容。

### 参数

#### `title`

提醒标题，必填。

#### `stopButton`

> **已废弃。** 从 iOS 26.1 起，提醒响起时的停止按钮由系统以 slider 形式渲染，不再使用自定义按钮。`stopButton` 仅为向后兼容保留，在 iOS 26.1+ 会被忽略，可以不填。

停止按钮样式（仅 iOS 26.0 回退使用）。

#### `secondaryButton`

第二按钮样式。

#### `secondaryBehavior`

第二按钮行为，可选值：

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
  title: "起床时间到了",
  stopButton: AlarmManager.Button.create({
    title: "关闭",
    textColor: "#ffffff",
    systemImageName: "xmark"
  }),
  secondaryButton: AlarmManager.Button.create({
    title: "稍后提醒",
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

用于定义倒计时进行中的展示内容。

### `CountdownPresentation.create(title?, pauseButton?)`

```tsx
static create(title?: string | null, pauseButton?: Button | null): CountdownPresentation
```

```tsx
const countdownPresentation = AlarmManager.CountdownPresentation.create(
  "专注计时中",
  AlarmManager.Button.create({
    title: "暂停",
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

用于定义倒计时暂停时的展示内容。

### `PausedPresentation.create(title?, resumeButton?)`

```tsx
static create(title?: string | null, resumeButton?: Button | null): PausedPresentation | null
```

```tsx
const pausedPresentation = AlarmManager.PausedPresentation.create(
  "已暂停",
  AlarmManager.Button.create({
    title: "继续",
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

用于组合提醒界面的完整展示属性。

### 参数

#### `alert`

提醒触发时的展示内容，必填。

#### `countdown`

倒计时状态的展示内容。

#### `paused`

暂停状态的展示内容。

#### `tintColor`

整体强调色，建议使用十六进制字符串：

```tsx
"#ffffff"
"#007aff"
"#ff9500"
```

#### `metadata`

附加元数据，可用于记录业务信息。

#### `liveActivity`

可选的自定义 Live Activity UI 绑定。如果当前脚本提供了 `alarm_live_activity.tsx`，并用 `AlarmLiveActivity.register` 注册了同名 UI，Scripting 会在锁屏和灵动岛渲染该 UI；否则使用内置闹钟 UI。

```tsx
liveActivity: {
  name: "FocusTimerActivity"
}
```

完整 UI builder API 请参考 **Alarm Live Activity** 文档。

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
    title: "番茄钟结束",
    stopButton: AlarmManager.Button.create({
      title: "完成",
      textColor: "#ffffff",
      systemImageName: "checkmark"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "专注中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "已暂停",
    AlarmManager.Button.create({
      title: "继续",
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

用于生成最终可传给 `AlarmManager.schedule()` 的配置对象。

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

创建普通闹钟配置。

适合：

* 一次性固定时间提醒
* 每天提醒
* 每周重复提醒

### 参数

#### `schedule`

触发时间规则。

#### `attributes`

提醒展示属性，必填。

#### `sound`

提醒声音。

#### `stopIntent`

停止按钮绑定的 `AppIntent`。

#### `secondaryIntent`

第二按钮绑定的 `AppIntent`。

### 示例

```tsx
const schedule = AlarmManager.Schedule.fixed(
  new Date("2026-03-20T07:30:00")
)

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "早安，起床了",
    stopButton: AlarmManager.Button.create({
      title: "关闭",
      textColor: "#ffffff",
      systemImageName: "xmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "稍后",
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

创建定时器配置。

适合：

* 番茄钟
* 运动计时器
* 烹饪提醒
* 短时专注任务

### 参数

#### `duration`

定时器总时长，单位秒。

#### `attributes`

展示属性，必填。

#### `sound`

提醒声音。

#### `stopIntent`

停止动作绑定的 `AppIntent`。

#### `secondaryIntent`

第二按钮动作绑定的 `AppIntent`。

### 示例

```tsx
const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "25分钟专注结束",
    stopButton: AlarmManager.Button.create({
      title: "完成",
      textColor: "#ffffff",
      systemImageName: "checkmark"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "专注中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "暂停中",
    AlarmManager.Button.create({
      title: "继续",
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

创建倒计时提醒配置。

适合：

* 到某个时间点后再进入倒计时
* 实现“稍后提醒我”
* 自定义提醒前后的倒计时流程

### 参数

#### `countdown`

倒计时参数。

#### `schedule`

触发日程。

#### `attributes`

展示属性，必填。

#### `sound`

提醒声音。

#### `stopIntent`

停止动作绑定的 `AppIntent`。

#### `secondaryIntent`

第二按钮动作绑定的 `AppIntent`。

### 示例

```tsx
const countdown = AlarmManager.Countdown.create({
  preAlert: 15 * 60,
  postAlert: 5 * 60
})

const schedule = AlarmManager.Schedule.relative(21, 0)

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "准备休息",
    stopButton: AlarmManager.Button.create({
      title: "知道了",
      textColor: "#ffffff",
      systemImageName: "bed.double.fill"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "15分钟后提醒",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "countdown"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "休息倒计时中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "已暂停",
    AlarmManager.Button.create({
      title: "恢复",
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

表示当前环境是否支持 AlarmKit。

```tsx
if (!AlarmManager.isAvailable) {
  throw new Error("当前系统不支持 AlarmManager")
}
```

---

## alarms

```tsx
function alarms(): Promise<Alarm[]>
```

获取当前所有闹钟。

### 返回值

返回 `Promise<Alarm[]>`。

### 示例

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

根据配置创建并调度一个闹钟。

### 参数

#### `id`

闹钟唯一标识符。

必须使用 `UUID.string()` 生成。

#### `configuration`

通过 `AlarmManager.Configuration.alarm()`、`timer()` 或 `countdown()` 创建的配置对象。

### 返回值

返回创建后的 `Alarm`。

### 示例

```tsx
const configuration = AlarmManager.Configuration.timer({
  duration: 10 * 60,
  attributes: AlarmManager.Attributes.create({
    alert: AlarmManager.AlertPresentation.create({
      title: "10分钟到了",
      stopButton: AlarmManager.Button.create({
        title: "结束",
        textColor: "#ffffff",
        systemImageName: "stop.fill"
      })
    }),
    countdown: AlarmManager.CountdownPresentation.create(
      "倒计时中",
      AlarmManager.Button.create({
        title: "暂停",
        textColor: "#ffffff",
        systemImageName: "pause.fill"
      })
    ),
    paused: AlarmManager.PausedPresentation.create(
      "暂停中",
      AlarmManager.Button.create({
        title: "继续",
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

取消指定闹钟。

### 参数

#### `id`

要取消的闹钟 ID。

### 返回值

返回是否取消成功。

### 示例

```tsx
const success = await AlarmManager.cancel(alarmId)
console.log("取消结果:", success)
```

---

## stop

```tsx
function stop(id: string): Promise<boolean>
```

停止指定闹钟或提醒。

通常用于提醒已经触发，或者需要主动终止当前流程时。

### 示例

```tsx
const success = await AlarmManager.stop(alarmId)
console.log("停止结果:", success)
```

---

## pause

```tsx
function pause(id: string): Promise<boolean>
```

暂停指定倒计时或定时器。

### 示例

```tsx
const success = await AlarmManager.pause(alarmId)
console.log("暂停结果:", success)
```

---

## resume

```tsx
function resume(id: string): Promise<boolean>
```

恢复已暂停的倒计时或定时器。

### 示例

```tsx
const success = await AlarmManager.resume(alarmId)
console.log("恢复结果:", success)
```

---

## startCountdown

```tsx
function startCountdown(id: string): Promise<boolean>
```

启动指定闹钟的倒计时流程。

通常适用于通过 `Configuration.countdown()` 创建的配置，或提醒流程中存在“稍后提醒”语义的场景。

### 示例

```tsx
const success = await AlarmManager.startCountdown(alarmId)
console.log("开始倒计时:", success)
```

---

## addAlarmUpdateListener

```tsx
function addAlarmUpdateListener(listener: AlarmUpdateListener): void
```

添加闹钟更新监听器。

当闹钟列表发生变化时，回调会收到最新的 `Alarm[]`。

### 示例

```tsx
const listener = (alarms: AlarmManager.Alarm[]) => {
  console.log("闹钟数量:", alarms.length)
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

移除之前添加的监听器，不传移除所有。

### 参数

#### `listener`

要移除的监听器函数。

如果省略该参数，其具体行为以你的底层实现为准。

### 示例

```tsx
const listener = (alarms: AlarmManager.Alarm[]) => {
  console.log("更新:", alarms.length)
}

AlarmManager.addAlarmUpdateListener(listener)

AlarmManager.removeAlarmUpdateListener(listener)
```

---

## 在 AlarmManager 中使用 AppIntent

`AlarmManager` 支持通过 `stopIntent` 和 `secondaryIntent` 把按钮行为交给 `AppIntent` 处理。

这使得提醒按钮不仅可以停止或触发倒计时，还可以进一步执行脚本逻辑，例如：

* 停止提醒后写入本地状态
* 点击“完成”后更新任务状态
* 点击“稍后提醒”后刷新 Widget 或 Live Activity
* 结合其他全局 API 执行业务逻辑

---

## AppIntent 的定义位置

所有 `AppIntent` 都必须定义在：

```tsx
app_intents.tsx
```

中。

不要把它们定义在 `widget.tsx`、`live_activity.tsx`、`control_widget.tsx` 或普通脚本文件中。

并且在执行时：

```tsx
Script.env === "app_intents"
```

也就是说，`perform` 函数运行在 `app_intents` 环境。

---

## AppIntent 相关类型

### AppIntent<T>

表示一个具体的意图实例。

| 字段名        | 类型                  | 描述                   |
| ---------- | ------------------- | -------------------- |
| `script`   | `string`            | 脚本路径，由系统内部生成         |
| `name`     | `string`            | 意图名称，唯一标识该 AppIntent |
| `protocol` | `AppIntentProtocol` | 意图协议类型               |
| `params`   | `T`                 | 执行时的参数               |

### AppIntentFactory<T>

```tsx
type AppIntentFactory<T> = (params: T) => AppIntent<T>
```

用于根据参数创建 `AppIntent` 实例。

### AppIntentPerform<T>

```tsx
type AppIntentPerform<T> = (params: T) => Promise<void>
```

表示被触发后执行的异步逻辑。

### AppIntentProtocol

| 枚举成员                   | 描述                 |
| ---------------------- | ------------------ |
| `AppIntent`            | 普通意图               |
| `AudioPlaybackIntent`  | 音频播放相关意图           |
| `AudioRecordingIntent` | 音频录制相关意图           |
| `LiveActivityIntent`   | Live Activity 相关意图 |

对于 `AlarmManager`，需要使用：

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

用于注册一个新的 `AppIntent`。

### 参数

#### `name`

意图名称，必须唯一。

#### `protocol`

意图协议类型。

#### `perform`

当意图被触发时执行的异步函数。

### 返回值

返回一个工厂函数，可通过传入参数创建对应的 `AppIntent` 实例。

---

## AlarmManager 的 AppIntent 示例

下面示例展示如何在 `app_intents.tsx` 中定义两个可供 `AlarmManager` 使用的意图。

```tsx
/// app_intents.tsx

export const StopFocusAlarmIntent = AppIntentManager.register({
  name: "StopFocusAlarmIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId, taskId }: { alarmId: string; taskId: string }) => {
    console.log("停止提醒:", alarmId, taskId)

    // 这里可以执行你的业务逻辑
    // 例如更新任务状态、记录日志、刷新界面等
    await Storage.set(`task:${taskId}:finished`, true)

    Widget.reloadAll()
  }
})

export const SnoozeFocusAlarmIntent = AppIntentManager.register({
  name: "SnoozeFocusAlarmIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId }: { alarmId: string }) => {
    console.log("稍后提醒:", alarmId)

    // 可按需刷新 UI 或做其他状态处理
    Widget.reloadAll()
  }
})
```

---

## 把 AppIntent 绑定到 AlarmManager

定义好 `AppIntent` 后，可以通过 `stopIntent` 和 `secondaryIntent` 传入配置中。

```tsx
const alarmId = UUID.string()

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "专注时间结束",
    stopButton: AlarmManager.Button.create({
      title: "完成",
      textColor: "#ffffff",
      systemImageName: "checkmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "稍后5分钟",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "custom"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "倒计时中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "已暂停",
    AlarmManager.Button.create({
      title: "继续",
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

上面这个例子里：

* 停止按钮会触发 `StopFocusAlarmIntent`
* 第二按钮会触发 `SnoozeFocusAlarmIntent`
* 第二按钮行为设为了 `"custom"`，因此其实际逻辑由 `secondaryIntent` 决定

---

## 使用 countdown 行为的第二按钮

如果你希望第二按钮直接走 AlarmKit 的倒计时语义，可使用：

```tsx
secondaryBehavior: "countdown"
```

示例：

```tsx
const alarmId = UUID.string()

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "该休息了",
    stopButton: AlarmManager.Button.create({
      title: "关闭",
      textColor: "#ffffff",
      systemImageName: "xmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "10分钟后提醒",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "countdown"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "稍后提醒倒计时中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "已暂停",
    AlarmManager.Button.create({
      title: "继续",
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

这种方式更适合“稍后提醒”这种标准倒计时交互。

---

## 创建一次性闹钟

```tsx
if (!AlarmManager.isAvailable) {
  throw new Error("当前环境不支持 AlarmKit")
}

const alarmId = UUID.string()

const schedule = AlarmManager.Schedule.fixed(
  new Date("2026-03-20T22:30:00")
)

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "该休息了",
    stopButton: AlarmManager.Button.create({
      title: "关闭",
      textColor: "#ffffff",
      systemImageName: "xmark"
    }),
    secondaryButton: AlarmManager.Button.create({
      title: "10分钟后提醒",
      textColor: "#ffffff",
      systemImageName: "timer"
    }),
    secondaryBehavior: "countdown"
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "稍后提醒倒计时中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "已暂停",
    AlarmManager.Button.create({
      title: "继续",
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
console.log("已创建:", alarm.id, alarm.state)
```

---

## 创建每周重复闹钟

```tsx
const alarmId = UUID.string()

const schedule = AlarmManager.Schedule.weekly(7, 30, [2, 3, 4, 5, 6])

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "工作日早起提醒",
    stopButton: AlarmManager.Button.create({
      title: "起床",
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

## 创建番茄钟定时器

```tsx
const alarmId = UUID.string()

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "当前专注时段已结束",
    stopButton: AlarmManager.Button.create({
      title: "完成",
      textColor: "#ffffff",
      systemImageName: "checkmark.circle.fill"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "专注中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "专注已暂停",
    AlarmManager.Button.create({
      title: "继续",
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

## 创建可手动启动的倒计时提醒

```tsx
const alarmId = UUID.string()

const countdown = AlarmManager.Countdown.create({
  preAlert: 5 * 60,
  postAlert: 60
})

const attributes = AlarmManager.Attributes.create({
  alert: AlarmManager.AlertPresentation.create({
    title: "稍后提醒时间到了",
    stopButton: AlarmManager.Button.create({
      title: "知道了",
      textColor: "#ffffff",
      systemImageName: "bell.slash.fill"
    })
  }),
  countdown: AlarmManager.CountdownPresentation.create(
    "稍后提醒中",
    AlarmManager.Button.create({
      title: "暂停",
      textColor: "#ffffff",
      systemImageName: "pause.fill"
    })
  ),
  paused: AlarmManager.PausedPresentation.create(
    "倒计时已暂停",
    AlarmManager.Button.create({
      title: "继续",
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

## 查询与控制闹钟

```tsx
const alarms = await AlarmManager.alarms()
console.log("当前闹钟数量:", alarms.length)

const firstAlarm = alarms[0]
if (firstAlarm) {
  await AlarmManager.pause(firstAlarm.id)
  await AlarmManager.resume(firstAlarm.id)
  await AlarmManager.stop(firstAlarm.id)
}
```

---

## 监听闹钟状态变化

```tsx
const listener = (alarms: AlarmManager.Alarm[]) => {
  const summary = alarms.map(item => ({
    id: item.id,
    state: item.state
  }))
  console.log("最新闹钟状态:", JSON.stringify(summary, null, 2))
}

AlarmManager.addAlarmUpdateListener(listener)

// 不再需要时移除
// AlarmManager.removeAlarmUpdateListener(listener)
```

---

## 执行环境说明

`AlarmManager` 本身是全局 API，可以在普通脚本中直接使用。

但如果你给 `AlarmManager` 绑定了 `AppIntent`，那么这些意图的 `perform` 函数执行环境为：

```tsx
Script.env === "app_intents"
```

这意味着：

* `AlarmManager.schedule()` 等闹钟创建逻辑，通常运行在普通脚本环境
* `stopIntent` / `secondaryIntent` 对应的逻辑，运行在 `app_intents.tsx` 中定义的 `perform` 里
* 你可以在 `perform` 中执行网络请求、状态更新、Widget 刷新、Live Activity 刷新等逻辑

---

## 最佳实践

### 始终使用 UUID.string() 生成 alarmId

这是 `AlarmManager` 的硬性要求。不要自己构造 ID。

```tsx
const alarmId = UUID.string()
```

### 保留创建时的 alarmId

创建成功后，应自行保存该 `alarmId`，方便后续暂停、恢复、停止、取消。

### 优先使用 metadata 保存业务信息

比如任务 ID、场景、来源等。

```tsx
metadata: {
  taskId: "task_123",
  scene: "study",
  source: "focus-page"
}
```

### 把 AppIntent 集中定义在 app_intents.tsx

不要散落在不同文件中，方便维护。

### 为 AppIntent 定义明确的参数类型

这样能获得更好的类型检查和自动补全。

```tsx
perform: async ({ alarmId, taskId }: { alarmId: string; taskId: string }) => {
  // ...
}
```

### 需要标准“稍后提醒”时优先使用 countdown

如果只是实现标准的“几分钟后再提醒”，推荐使用：

```tsx
secondaryBehavior: "countdown"
```

如果需要完全自定义逻辑，再使用：

```tsx
secondaryBehavior: "custom"
secondaryIntent: ...
```

---

## 注意事项

### Attributes.create(...) 可能返回 null

```tsx
const attributes = AlarmManager.Attributes.create(...)
```

返回类型是 `Attributes | null`，建议在严格场景下进行判空。

### Configuration 创建方法也可能返回 null

```tsx
const configuration = AlarmManager.Configuration.timer(...)
```

返回类型同样允许为 `null`，建议在调用 `schedule()` 前先校验。

### pause、resume、startCountdown 不适用于所有闹钟类型

这些方法更适合定时器或倒计时场景。对于普通固定时间闹钟，某些操作可能没有实际意义。

---

## 完整示例

下面给出一个包含 `AppIntent` 的完整示例。

```tsx
/// app_intents.tsx

export const StopPomodoroIntent = AppIntentManager.register({
  name: "StopPomodoroIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId, sessionId }: { alarmId: string; sessionId: string }) => {
    console.log("番茄钟结束:", alarmId, sessionId)
    await Storage.set(`pomodoro:${sessionId}:done`, true)
    Widget.reloadAll()
  }
})

export const ExtendPomodoroIntent = AppIntentManager.register({
  name: "ExtendPomodoroIntent",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async ({ alarmId, extraMinutes }: { alarmId: string; extraMinutes: number }) => {
    console.log("延长番茄钟:", alarmId, extraMinutes)
    Widget.reloadAll()
  }
})
```

```tsx
/// 普通脚本文件

async function main() {
  if (!AlarmManager.isAvailable) {
    console.log("当前系统不支持 AlarmManager")
    return
  }

  const listener = (alarms: AlarmManager.Alarm[]) => {
    console.log(
      "闹钟更新:",
      alarms.map(item => `${item.id}:${item.state}`).join(", ")
    )
  }

  AlarmManager.addAlarmUpdateListener(listener)

  const alarmId = UUID.string()

  const attributes = AlarmManager.Attributes.create({
    alert: AlarmManager.AlertPresentation.create({
      title: "专注时间结束",
      stopButton: AlarmManager.Button.create({
        title: "完成",
        textColor: "#ffffff",
        systemImageName: "checkmark"
      }),
      secondaryButton: AlarmManager.Button.create({
        title: "延长5分钟",
        textColor: "#ffffff",
        systemImageName: "timer"
      }),
      secondaryBehavior: "custom"
    }),
    countdown: AlarmManager.CountdownPresentation.create(
      "专注中",
      AlarmManager.Button.create({
        title: "暂停",
        textColor: "#ffffff",
        systemImageName: "pause.fill"
      })
    ),
    paused: AlarmManager.PausedPresentation.create(
      "已暂停",
      AlarmManager.Button.create({
        title: "继续",
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
    throw new Error("创建 Attributes 失败")
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
    throw new Error("创建 Configuration 失败")
  }

  const alarm = await AlarmManager.schedule(alarmId, configuration)
  console.log("已创建闹钟:", alarm.id, alarm.state)

  const current = await AlarmManager.alarms()
  console.log("当前闹钟:", current.map(item => item.id))

  await AlarmManager.pause(alarmId)
  await AlarmManager.resume(alarmId)

  // 结束后可移除监听
  // AlarmManager.removeAlarmUpdateListener(listener)
}

main().catch(error => {
  console.log(String(error))
})
```
