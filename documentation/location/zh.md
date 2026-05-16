Location API 用于获取设备的地理位置、进行正向与反向地理编码、从系统地图中选择位置，以及访问设备的方向与指南针信息。该 API 适用于脚本运行环境、交互式界面以及部分支持位置更新的小组件场景，并遵循系统的权限与精度限制。

## LocationAccuracy

表示脚本期望接收的位置精度级别。

**类型定义**

```ts
type LocationAccuracy =
  | "best"
  | "tenMeters"
  | "hundredMeters"
  | "kilometer"
  | "threeKilometers"
  | "bestForNavigation"
  | "reduced"
```

**说明**

* `best`
  请求设备可提供的最高精度。

* `tenMeters`
  大约 10 米级别的精度。

* `hundredMeters`
  大约 100 米级别的精度。

* `kilometer`
  大约 1 公里级别的精度。

* `threeKilometers`
  较粗略的 3 公里级别精度。

* `bestForNavigation`
  面向导航场景，精度和更新频率最高，耗电量也更高。

* `reduced`
  使用系统提供的低精度位置，常见于用户仅授权“模糊位置”的情况。

## LocationInfo

表示一个基础的地理坐标信息。

**类型定义**

```ts
type LocationInfo = {
  latitude: number
  longitude: number
  timestamp: number
}
```

**字段说明**

* `latitude`
  纬度，单位为度。

* `longitude`
  经度，单位为度。

* `timestamp`
  位置采集时间，毫秒级时间戳。

## LocationPlacemark

表示一个对人类友好的地理位置信息，通常由地理编码或反向地理编码返回。

**类型定义**

```ts
type LocationPlacemark = {
  location?: LocationInfo
  region?: string
  timeZone?: string
  name?: string
  thoroughfare?: string
  subThoroughfare?: string
  locality?: string
  subLocality?: string
  administrativeArea?: string
  subAdministrativeArea?: string
  postalCode?: string
  isoCountryCode?: string
  country?: string
  inlandWater?: string
  ocean?: string
  areasOfInterest?: string[]
}
```

**说明**

Placemark 可能包含地址、城市、省份、国家、兴趣点等信息。具体字段是否存在取决于系统地图数据和地理位置本身。

## Heading

Heading 表示设备的方向与指南针相关信息。

**类型定义**

```ts
type Heading = {
  headingAccuracy: number
  trueHeading: number
  magneticHeading: number
  timestamp: Date
  x: number
  y: number
  z: number
}
```

**字段说明**

* `headingAccuracy`
  报告方向与真实地磁方向之间的最大误差，单位为度。

* `trueHeading`
  相对于真北的方向角，单位为度。

* `magneticHeading`
  相对于磁北的方向角，单位为度。

* `timestamp`
  方向数据生成的时间。

* `x`、`y`、`z`
  三轴地磁场原始数据，单位为微特斯拉。

## 授权与配置

### isAuthorizedForWidgetUpdates

```ts
const isAuthorizedForWidgetUpdates: boolean
```

表示当前小组件是否有资格接收位置更新。该值受系统权限和小组件能力限制影响。

### accuracy

```ts
const accuracy: LocationAccuracy
```

当前配置的位置精度级别。

### setAccuracy

```ts
function setAccuracy(accuracy: LocationAccuracy): Promise<void>
```

设置脚本期望的位置精度。更高的精度可能会增加耗电量，并可能触发系统权限请求。

**示例**

```ts
await Location.setAccuracy("hundredMeters")
```

## 获取当前位置

### requestCurrent

```ts
function requestCurrent(
  options?: { forceRequest?: boolean }
): Promise<LocationInfo | null>
```

请求当前设备的位置。

默认情况下，如果系统中存在可用的缓存位置，会直接返回缓存结果；如果不存在缓存位置，则会发起一次新的定位请求。

当 `forceRequest` 为 `true` 时，会忽略缓存位置，始终请求最新位置。

**示例**

```ts
const location = await Location.requestCurrent()

if (location) {
  console.log(location.latitude, location.longitude)
}
```

强制请求最新位置：

```ts
const location = await Location.requestCurrent({
  forceRequest: true
})
```

### pickFromMap

```ts
function pickFromMap(): Promise<LocationInfo | null>
```

打开系统内置地图界面，让用户手动选择一个位置。

**示例**

```ts
const picked = await Location.pickFromMap()

if (picked) {
  console.log("Picked location:", picked.latitude, picked.longitude)
}
```

## 地理编码

### reverseGeocode

```ts
function reverseGeocode(options: {
  latitude: number
  longitude: number
  locale?: string
}): Promise<LocationPlacemark[] | null>
```

将经纬度坐标转换为可读的地址信息。

**示例**

```ts
const placemarks = await Location.reverseGeocode({
  latitude: 39.9042,
  longitude: 116.4074,
  locale: "zh-CN"
})

console.log(placemarks?.[0]?.locality)
```

### geocodeAddress

```ts
function geocodeAddress(options: {
  address: string
  locale?: string
}): Promise<LocationPlacemark[] | null>
```

将文本地址转换为地理位置信息。

**示例**

```ts
const results = await Location.geocodeAddress({
  address: "天安门",
  locale: "zh-CN"
})

const location = results?.[0]?.location
```

## 方向与指南针

### requestHeading

```ts
function requestHeading(): Promise<Heading | null>
```

获取最近一次上报的方向信息。如果尚未开始方向更新，则返回 `null`。

**示例**

```ts
const heading = await Location.requestHeading()

if (heading) {
  console.log(heading.trueHeading)
}
```

### startUpdatingHeading

```ts
function startUpdatingHeading(options?: {
  requestAlwaysAuthorization?: boolean
}): Promise<{ mode: "always" | "whenInUse" }>
```

开始持续监听设备方向变化。

当 `options.requestAlwaysAuthorization` 为 `true` 时，会向系统请求 "Always" 权限，
而不是默认的 "When In Use" 权限。

Promise resolve 时返回 `{ mode }`，表示系统实际授予的权限模式。如果你请求了 `"always"`
但拿到的是 `"whenInUse"`，说明 iOS 没有（或不再）弹出升级对话框 —— 通常是因为用户曾
拒绝过一次升级。iOS 仅允许一次程序内的 Always 升级请求，之后用户必须前往
**设置 → 隐私与安全 → 定位服务 → Scripting → 始终** 手动开启。

### stopUpdatingHeading

```ts
function stopUpdatingHeading(): void
```

停止方向更新。

### addHeadingListener

```ts
function addHeadingListener(
  listener: (heading: Heading) => void
): void
```

添加一个方向变化监听器。

**示例**

```ts
await Location.startUpdatingHeading()

Location.addHeadingListener(heading => {
  console.log("Heading:", heading.trueHeading)
})
```

### removeHeadingListener

```ts
function removeHeadingListener(
  listener?: (heading: Heading) => void
): void
```

移除方向监听器。如果未传入参数，将移除所有监听器。

### startUpdatingLocation

```ts
function startUpdatingLocation(options?: {
  requestAlwaysAuthorization?: boolean
}): Promise<{ mode: "always" | "whenInUse" }>
```

开始持续接收位置更新。新位置会被派发给通过 `addLocationListener` 注册的监听器。

当 `options.requestAlwaysAuthorization` 为 `true` 时，会请求 "Always" 权限。如果你需要在应用进入后台时
继续接收位置更新，需要使用 "Always" 权限。

Promise resolve 时返回 `{ mode }`，表示系统实际授予的权限。如果你请求了 `"always"` 但拿到
的是 `"whenInUse"`，说明 iOS 抑制了升级弹窗（每个应用安装周期内仅允许一次程序内升级请
求）。请引导用户前往 **设置 → 隐私与安全 → 定位服务 → Scripting → 始终** 手动开启。

### stopUpdatingLocation

```ts
function stopUpdatingLocation(): void
```

停止持续位置更新，并释放相关系统资源。该方法不会影响 `requestCurrent` 等一次性调用。

### addLocationListener

```ts
function addLocationListener(
  listener: (location: LocationInfo) => void
): void
```

添加一个位置变化监听器。每当系统报告新位置时被调用。

**示例**

```ts
await Location.startUpdatingLocation()

Location.addLocationListener(location => {
  console.log("Lat/Lng:", location.latitude, location.longitude)
})
```

### removeLocationListener

```ts
function removeLocationListener(
  listener?: (location: LocationInfo) => void
): void
```

移除位置变化监听器。如果未传入参数，将移除所有位置监听器并停止持续更新。

### allowsBackgroundLocationUpdates / setAllowsBackgroundLocationUpdates

```ts
const allowsBackgroundLocationUpdates: boolean
function setAllowsBackgroundLocationUpdates(value: boolean): void
```

是否允许应用进入后台后继续接收位置更新。

### pausesLocationUpdatesAutomatically / setPausesLocationUpdatesAutomatically

```ts
const pausesLocationUpdatesAutomatically: boolean
function setPausesLocationUpdatesAutomatically(value: boolean): void
```

当系统认为位置数据短期内不会变化时，是否自动暂停位置更新。

### showsBackgroundLocationIndicator / setShowsBackgroundLocationIndicator

```ts
const showsBackgroundLocationIndicator: boolean
function setShowsBackgroundLocationIndicator(value: boolean): void
```

在 `authorizedAlways` 下后台使用定位时，是否显示状态栏背景指示条。

### distanceFilter / setDistanceFilter

```ts
const distanceFilter: number
function setDistanceFilter(meters: number): void
```

生成新更新所需的最小水平移动距离（米）。设为 `-1` 表示报告所有移动。

### headingFilter / setHeadingFilter

```ts
const headingFilter: number
function setHeadingFilter(degrees: number): void
```

触发航向更新所需的最小角度变化（度）。设为 `-1` 表示报告所有变化。

### activityType / setActivityType

```ts
const activityType: ActivityType
function setActivityType(value: ActivityType): void
```

iOS 用以优化电量与精度的活动类型提示：`"other"`、`"automotiveNavigation"`、`"fitness"`、
`"otherNavigation"` 或 `"airborne"`。