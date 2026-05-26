控制视图如何响应从左到右和从右到左的布局方向。

## 类型

```ts
layoutDirectionBehavior?: "fixed" | "mirrors" | {
  mirrors: "leftToRight" | "rightToLeft"
}
```

## 取值

| 值 | 说明 |
| --- | --- |
| `"fixed"` | 保持视图固定，不随布局方向变化而镜像。 |
| `"mirrors"` | 根据当前布局方向镜像视图。 |
| `{ mirrors: "leftToRight" }` | 按从左到右的布局方向计算镜像行为。 |
| `{ mirrors: "rightToLeft" }` | 按从右到左的布局方向计算镜像行为。 |

## 示例

```tsx
<Image
  systemName="arrow.forward"
  layoutDirectionBehavior="mirrors"
/>
```

## 系统要求

`layoutDirectionBehavior` 需要 iOS 18.0 或更高版本。
