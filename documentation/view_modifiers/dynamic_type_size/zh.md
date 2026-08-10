# dynamicTypeSize

覆盖视图内容的动态字体(Dynamic Type)大小。可固定为某个尺寸,或把用户偏好尺寸限制在一个区间内。

## `dynamicTypeSize?: DynamicTypeSize | { from?, to? }`

`DynamicTypeSize` 取值:`xSmall`、`small`、`medium`、`large`、`xLarge`、`xxLarge`、`xxxLarge`、`accessibility1`、`accessibility2`、`accessibility3`、`accessibility4`、`accessibility5`。

- 传入单个尺寸 —— **固定**动态字体大小。
- 传入 `{ from, to }` —— **限制**到一个区间。任一端可省略,构成半开区间。

## 示例

```tsx
// 固定尺寸。
<Text dynamicTypeSize="large">Fixed size</Text>

// 限制在 xSmall 到 accessibility1 之间。
<VStack dynamicTypeSize={{ from: "xSmall", to: "accessibility1" }}>
  <Text>Clamped subtree</Text>
</VStack>

// 仅设上限。
<Text dynamicTypeSize={{ to: "xxLarge" }}>Capped</Text>
```
