`MapLookAround` 根据坐标查询对应的 LookAround(街景)场景引用。配合 `<LookAroundPreview>`
视图渲染。

```tsx
import { LookAroundPreview, useEffect, useState } from "scripting"

function Example() {
  const [scene, setScene] = useState<MapLookAroundScene | null>(null)
  useEffect(() => {
    MapLookAround.request({ latitude: 37.3349, longitude: -122.0090 })
      .then(setScene)
  }, [])
  return <LookAroundPreview scene={scene} frame={{ height: 240 }} />
}
```

---

## `request` — 拉取场景

```ts
const scene = await MapLookAround.request({
  latitude: 31.2397,
  longitude: 121.4994,
})
if (scene == null) {
  // 该位置无街景。
}
```

`scene` 是 `MKLookAroundScene` 的不透明句柄。JS 端可读字段:

| 成员 | 类型 | 说明 |
|---|---|---|
| `coordinate` | `MapCoordinate` | 请求时使用的锚点坐标。 |

## `<LookAroundPreview scene>` — 渲染场景

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `scene` | `MapLookAroundScene \| null` | — | 要渲染的场景。`null` 时显示占位。 |
| `showsRoadLabels` | `boolean?` | `true` | 是否叠加街道名标签。 |
| `allowsNavigation` | `boolean?` | `true` | 允许点击展开全屏查看器。 |
| `badgePosition` | `"topLeading" \| "topTrailing" \| "bottomTrailing"?` | `"topLeading"` | "Look Around" 徽标位置。 |

组件同样接收 `frame` / `padding` / `clipShape` 等标准布局 / 装饰修饰符。

## 注意事项

- LookAround 覆盖主要在美 / 欧 / 日韩主要城市,大量坐标会返回 `null`;UI 上要处理 null 分支。
- 视图内部使用 Apple 原生预览组件,无法叠加自定义 overlay / annotation。
- 场景引用在 JS context 存活期间一直有效,不需要 dispose。
