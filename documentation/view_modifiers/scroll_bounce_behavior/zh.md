# scrollBounceBehavior

配置可滚动视图(`ScrollView`、`List` 等)在某个方向上的回弹(bounce)行为。

## `scrollBounceBehavior?: ScrollBounceBehavior | { behavior, axes? }`

`ScrollBounceBehavior` 取值:
- `automatic` —— 由系统决定。
- `always` —— 到达内容末端时总是回弹。
- `basedOnSize` —— 仅当内容大到需要滚动时才回弹。

传入单个值配置**垂直**方向;传入对象可另选 `axes`(`"vertical"`、`"horizontal"` 或 `"all"`;默认垂直)。

## 示例

```tsx
// 内容装得下时不回弹。
<ScrollView scrollBounceBehavior="basedOnSize">
  {/* ... */}
</ScrollView>

// 应用到两个方向。
<ScrollView scrollBounceBehavior={{ behavior: "always", axes: "all" }}>
  {/* ... */}
</ScrollView>
```
