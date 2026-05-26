`<Annotation>` 把任意视图树锚定到地图坐标上。相比 `<Marker>` 只能用固定 pin 形态
（tint + glyph），Annotation 渲染**你自己写的 SwiftUI 子树** —— badge、照片、自定义
形状都可以。当 pin 需要长得不像 MapKit 原生标记时,就用 Annotation。

```tsx
<Map cameraPosition={cam}>
  <Annotation
    coordinate={{ latitude: 31.24, longitude: 121.49 }}
    title="外滩"
    anchor="bottom"
  >
    <ZStack>
      <Circle fill="systemRed" frame={{ width: 24, height: 24 }} />
      <Text font="caption2" foregroundStyle="white">★</Text>
    </ZStack>
  </Annotation>
</Map>
```

iOS 17+。`tag` 选中需要 iOS 18+,跟 `<Marker tag>` 一致。

---

## Props

| Prop | 类型 | 说明 |
|---|---|---|
| `coordinate` | `MapCoordinate` | 必填。Annotation 锚定的地图坐标。 |
| `title` | `string?` | 可选,MapKit 在 content view 旁边渲染的标签。空 / 省略 = 无标签。 |
| `anchor` | `KeywordPoint \| Point?` | content view 上哪个点贴坐标。默认 `"center"`。 |
| `tag` | `string?` | 给 `<Map selection>` 用的稳定 id;没有 tag 的 Annotation 不参与选中。 |

### `anchor` 取值

`KeywordPoint` 覆盖 SwiftUI 命名 `UnitPoint`,常用九宫格:

```ts
"center" | "top" | "bottom" | "leading" | "trailing"
| "topLeading" | "topTrailing" | "bottomLeading" | "bottomTrailing" | "zero"
```

需要精细定位时传 `[0..1]` 单位坐标的 `Point`:

```tsx
<Annotation coordinate={pt} anchor={{ x: 0.5, y: 0.85 }}>...</Annotation>
```

例如要让 pin 的下沿对准坐标,用 `"bottom"`。

---

## 选中

Annotation 点击参与 `<Map selection>` 的方式跟 tagged marker 完全一致 ——
点中 tagged annotation 时 observable 收到 `{ type: "marker", tag }`,点空白时收到 `null`:

```tsx
const selection = useObservable<MapSelectionValue | null>(null)

return <Map cameraPosition={cam} selection={selection}>
  <Annotation coordinate={spot} tag="bund" anchor="bottom">
    <CustomPin highlighted={isSelected(selection.value, "bund")} />
  </Annotation>
</Map>
```

Annotation **不**参与 `<Map itemSelection>` —— 没有 `MapItem` 可绑。脚本若使用了
`itemSelection`,Annotation 正常渲染但点击不会写 observable。

---

## Map 级标题 / 副标题可见性

`<Map>` 暴露两个 prop 控制 MapKit 渲染的文本标签是否显示:

| Prop | 类型 | 说明 |
|---|---|---|
| `annotationTitles` | `"automatic" \| "visible" \| "hidden"` | `Marker(item:)` / `<Annotation>` / Apple POI 标题标签的可见性。 |
| `annotationSubtitles` | `"automatic" \| "visible" \| "hidden"` | 副标题可见性。主要影响 `Marker(item:)`(`MapItem.placemark` 自带 subtitle)与 Apple POI。 |

```tsx
<Map cameraPosition={cam} annotationTitles="hidden">
  {/* 上面 Annotation 的 title 也会一并被隐藏。 */}
  ...
</Map>
```

值对应 MapKit `Visibility`:`"automatic"` 走 MapKit 默认的 zoom 相关行为。
`<Annotation>` 本身没有 subtitle 字段,所以 `annotationSubtitles` 对 Annotation 输出无效,
只影响同图的 `Marker(item:)` / Apple POI。

---

## 选中时弹自定义 popover / sheet

Annotation 的 content 闭包就是普通 SwiftUI 视图子树,view 层任意 modifier —
包括 `popover` 与 sheet 系列 —— 都能直接挂上。我们没有专门的 "Annotation 卡片"
prop,因为完全不需要:用跟普通 view 一样的 modifier 即可,popover 会自动锚到
Annotation 的 content 视图上。

```tsx
const selection = useObservable<MapSelectionValue | null>(null)
const popoverShown = useObservable(false)

// 把 popover 的开关跟 selection observable 同步。
useEffect(() => {
  popoverShown.setValue(
    selection.value?.type === "marker" && selection.value.tag === "bund"
  )
}, [selection.value])

return <Map cameraPosition={cam} selection={selection}>
  <Annotation coordinate={spot} tag="bund" anchor="bottom">
    <CustomPin
      popover={{
        isPresented: popoverShown,
        content: <BundDetail onDismiss={() => selection.setValue(null)} />,
      }}
    />
  </Annotation>
</Map>
```

SwiftUI 原生方案就是这套模式 —— Apple 的 `itemDetailSelectionAccessory` /
`featureSelectionAccessory` 只服务 `Marker(item:)` 与 Apple 自绘 POI;
`<Annotation>` 自定义卡片走 view-layer modifier 路径,跟标准 SwiftUI 行为一致。

---

## `<Annotation>` 还是 `<Marker>`?

- **`<Marker>`** —— 视觉是 MapKit 标准 pin:tint + 可选 SF Symbol glyph / monogram /
  从 `MapItem` 自动选的 POI glyph。普通定位 pin、`MapItem` 形态都用 Marker。
- **`<Annotation>`** —— 视觉是你自己的 SwiftUI 子树。chip / 照片 callout / 异形
  装饰这些都用 Annotation。

两者可以在同一个 `<Map>` 内共存,共用同一套 `<Map selection>` / `tag` 选中机制。
