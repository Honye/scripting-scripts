# scenePadding

按系统认为当前场景合适的间距,为指定边添加内边距(例如让内容与系统 UI 边距对齐)。

## `scenePadding?: true | EdgeSet`

- 传入 `true` —— 对**所有**边应用场景内边距。
- 传入 `EdgeSet`(`"all"`、`"horizontal"`、`"vertical"`、`"top"`、`"bottom"`、`"leading"`、`"trailing"`,或边的数组)—— 选择具体的边。

## 示例

```tsx
<Text scenePadding={true}>All edges</Text>

<VStack scenePadding="horizontal">
  <Text>Horizontally scene-padded</Text>
</VStack>

<Text scenePadding={["top", "bottom"]}>Top & bottom</Text>
```
