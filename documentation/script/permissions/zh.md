Scripting 支持对敏感的设备能力按**单个脚本**进行授权。当用户在设置中开启 **Require Per-Script Permission(按脚本申请权限)** 后,每个脚本都需要单独被授予对日历、提醒事项、通讯录、定位、相册、HomeKit、健康、剪贴板、文件系统等能力的访问——即使 App 本身已经获得了对应的系统权限。

默认情况下,某个能力会在脚本第一次调用对应 API 时申请。`Script.requestAccess` 让脚本可以提前一次性申请多个能力,用户一次授予即可,而不必逐个被弹框打断。

---

## `ScriptingApi`

可按脚本授予的能力标识符:

```ts
type ScriptingApi =
  | "calendar"
  | "reminders"
  | "alarms"
  | "contacts"
  | "location"
  | "homeKit"
  | "photos"
  | "health"
  | "clipboard"
  | "fileSystem"
```

---

## `Script.requestAccess(apis: ScriptingApi[]): Promise<ScriptingApi[]>`

申请脚本对一个或多个能力的访问,并 resolve 出最终被授予的能力集合。

- `apis` 必填,且必须是非空数组。传空数组或包含未知标识符时 promise 会 reject。
- 会对其中**尚未决定**的能力弹框申请,记住用户的选择,并在之后实际调用对应 API 时据此放行/拦截。
- 已经被允许或拒绝的能力不会再次弹框。若所有申请的能力都已决定,则不弹框。
- 在没有可呈现 UI 的环境(小组件、键盘、通知、分享扩展)中不弹框。
- 弹框里用户可逐个能力设置,或使用 **Allow All** / **Deny All**。
- **不**做 Scripting PRO 检查。需要 PRO 的能力(如 `alarms`、`health`、`homeKit`)仍会在实际调用对应 API 时强制校验。

```ts
const granted = await Script.requestAccess(["calendar", "reminders"])

if (granted.includes("calendar")) {
  // 现在可以直接使用日历 API,不会再触发首次使用弹框。
}
```

---

## 声明所需权限

长按脚本并选择 **Required Permissions** 即可声明脚本所需的能力。已声明的能力会在脚本首次从 App 内运行时自动申请。
