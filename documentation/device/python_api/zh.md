`scripting` Python 包提供了 `Device` 命名空间,以只读属性形式暴露宿主设备的信息 —— 型号、系统版本、屏幕、语言、电池、方向等。每次属性访问都会触发一次 RPC 调用读取当前值;如果在紧凑循环里多次读同一属性,自行缓存结果。

```python
import scripting; Device = scripting.Device

print(Device.model, Device.systemName, Device.systemVersion)
```

---

## 属性

### 硬件标识

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `Device.model` | str | 例如 `"iPhone"`、`"iPad"`。 |
| `Device.localizedModel` | str | 本地化的 `model`。 |
| `Device.systemName` | str | 例如 `"iOS"`、`"iPadOS"`。 |
| `Device.systemVersion` | str | 例如 `"17.0"`。 |
| `Device.isiPhone` | bool | 当前设备是 iPhone。 |
| `Device.isiPad` | bool | 当前设备是 iPad。 |
| `Device.isiOSAppOnMac` | bool | 当前以"iOS app on Mac" 形态运行。 |

### 屏幕

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `Device.screen` | dict | `{"width": float, "height": float, "scale": float}`。 |
| `Device.colorScheme` | str | `"light"` 或 `"dark"`。 |

### 电池与传感器

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `Device.batteryState` | str | `"full"` / `"charging"` / `"unplugged"` / `"unknown"`。 |
| `Device.batteryLevel` | float | `0.0`-`1.0`,无法监测时为 `-1.0`。 |
| `Device.proximityState` | bool | 近距感应器贴近用户。 |

### 方向

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `Device.orientation` | str | `"portrait"` / `"portraitUpsideDown"` / `"landscapeLeft"` / `"landscapeRight"` / `"faceUp"` / `"faceDown"` / `"unknown"`。 |
| `Device.isLandscape` | bool | 横屏方向。 |
| `Device.isPortrait` | bool | 竖屏方向。 |
| `Device.isFlat` | bool | 设备水平放置。 |

### 语言

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `Device.systemLocale` | str | 当前 locale 标识,如 `"en_US"`。 |
| `Device.preferredLanguages` | list[str] | 用户语言偏好列表,如 `["en-US", "zh-Hans-CN"]`。 |
| `Device.systemLanguageTag` | str | 与 `preferredLanguages` 元素同形态。 |
| `Device.systemLanguageCode` | str | 例如 `"en"`。 |
| `Device.systemCountryCode` | str | 例如 `"US"`。 |
| `Device.systemScriptCode` | str | 例如 `"Hans"`(没有显式 script 的语言下为空)。 |

---

## 示例

### 判断 iPad / 横屏布局

```python
import scripting; Device = scripting.Device

if Device.isiPad and Device.isLandscape:
    print("使用宽屏布局")
else:
    print("使用窄屏布局")
```

### 电池状态

```python
import scripting; Device = scripting.Device

state = Device.batteryState
level = Device.batteryLevel
print(f"电量: {int(level * 100)}% ({state})")
```

### 按语言切换问候语

```python
import scripting; Device = scripting.Device

primary = (Device.preferredLanguages or ["en"])[0]
greeting = "你好" if primary.startswith("zh") else "Hello"
print(greeting)
```
