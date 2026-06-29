控制页面的状态栏以及非瞬态系统覆盖层(如 Home 指示器)的可见性 —— 适合构建沉浸式全屏体验。

## 类型

```ts
// 隐藏状态栏。
statusBarHidden?: boolean

// 系统覆盖层(如 Home 指示器)的首选可见性。
// "hidden" 让系统自动隐藏;"visible" 保持显示;"automatic" 交由系统决定。
// 需要 iOS 16.0 或更高版本。
persistentSystemOverlays?: "automatic" | "visible" | "hidden"
```

## 重要

要让它们生效:

- **必须挂在页面的根视图上** —— 例如 `NavigationStack`,而不是内部的子视图。导航容器会拦截该 preference,挂在嵌套视图上不起作用。
- **以全屏方式呈现页面。** 在 sheet 呈现下,状态栏与系统覆盖层由呈现它的页面持有,该 preference 会被忽略:

  ```ts
  Navigation.present({
    element: <MyImmersivePage />,
    modalPresentationStyle: "fullScreen",
  })
  ```

说明:

- `persistentSystemOverlays="visible"` 就是默认状态,设置它不会有可观察的变化。想看到效果请用 `"hidden"`。
- iOS 不允许永久移除 Home 指示器 —— `"hidden"` 只是让它变淡并自动隐藏,手指交互时又会出现。

## 示例

```tsx
function ImmersivePage() {
  return <NavigationStack
    statusBarHidden={true}
    persistentSystemOverlays="hidden"
  >
    <VStack frame={Device.screen}>
      <Text>沉浸式全屏内容</Text>
    </VStack>
  </NavigationStack>
}

// 以全屏方式呈现,modifier 才会生效。
Navigation.present({
  element: <ImmersivePage />,
  modalPresentationStyle: "fullScreen",
})
```

也可以用链式 modifier 的形式:

```tsx
<NavigationStack>
  ...
</NavigationStack>
  .statusBarHidden(true)
  .persistentSystemOverlays("hidden")
```
