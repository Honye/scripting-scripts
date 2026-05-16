The `scripting` Python package exposes `Device` with read-only properties describing the host device — model, system version, screen, locale, battery, and orientation. Each property fires a single RPC call to fetch the current value; cache the result yourself if you read the same property in a tight loop.

```python
import scripting; Device = scripting.Device

print(Device.model, Device.systemName, Device.systemVersion)
```

---

## Properties

### Hardware identity

| Name | Type | Description |
| --- | --- | --- |
| `Device.model` | str | E.g. `"iPhone"`, `"iPad"`. |
| `Device.localizedModel` | str | Localized form of `model`. |
| `Device.systemName` | str | E.g. `"iOS"`, `"iPadOS"`. |
| `Device.systemVersion` | str | E.g. `"17.0"`. |
| `Device.isiPhone` | bool | The current device is an iPhone. |
| `Device.isiPad` | bool | The current device is an iPad. |
| `Device.isiOSAppOnMac` | bool | Running as an iOS app on Mac (Catalyst-style). |

### Screen

| Name | Type | Description |
| --- | --- | --- |
| `Device.screen` | dict | `{"width": float, "height": float, "scale": float}`. |
| `Device.colorScheme` | str | `"light"` or `"dark"`. |

### Battery & sensors

| Name | Type | Description |
| --- | --- | --- |
| `Device.batteryState` | str | `"full"`, `"charging"`, `"unplugged"`, `"unknown"`. |
| `Device.batteryLevel` | float | `0.0`-`1.0`, `-1.0` if monitoring is unavailable. |
| `Device.proximityState` | bool | Proximity sensor close to user. |

### Orientation

| Name | Type | Description |
| --- | --- | --- |
| `Device.orientation` | str | `"portrait"`, `"portraitUpsideDown"`, `"landscapeLeft"`, `"landscapeRight"`, `"faceUp"`, `"faceDown"`, `"unknown"`. |
| `Device.isLandscape` | bool | Device is in landscape orientation. |
| `Device.isPortrait` | bool | Device is in portrait orientation. |
| `Device.isFlat` | bool | Device is lying flat. |

### Locale

| Name | Type | Description |
| --- | --- | --- |
| `Device.systemLocale` | str | Current locale identifier, e.g. `"en_US"`. |
| `Device.preferredLanguages` | list[str] | User-preferred language tags, e.g. `["en-US", "zh-Hans-CN"]`. |
| `Device.systemLanguageTag` | str | Same shape as items in `preferredLanguages`. |
| `Device.systemLanguageCode` | str | E.g. `"en"`. |
| `Device.systemCountryCode` | str | E.g. `"US"`. |
| `Device.systemScriptCode` | str | E.g. `"Hans"` (empty for languages without explicit script). |

---

## Examples

### Detect iPad / portrait layout

```python
import scripting; Device = scripting.Device

if Device.isiPad and Device.isLandscape:
    print("Render the wide layout")
else:
    print("Render the narrow layout")
```

### Battery status

```python
import scripting; Device = scripting.Device

state = Device.batteryState
level = Device.batteryLevel
print(f"Battery: {int(level * 100)}% ({state})")
```

### Localized greeting

```python
import scripting; Device = scripting.Device

primary = (Device.preferredLanguages or ["en"])[0]
greeting = "你好" if primary.startswith("zh") else "Hello"
print(greeting)
```
