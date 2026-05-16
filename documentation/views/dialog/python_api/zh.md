`scripting` Python 包提供了 `Dialog` 命名空间,对应 JS 端的 `Dialog`,封装宿主端的模态 UI —— 警告、确认、文本输入、操作表。每次调用同步阻塞直到用户关闭对话框,然后返回结果。

```python
import scripting; Dialog = scripting.Dialog
```

对话框显示在当前可见的视图控制器之上,因此**仅在宿主 app 处于前台**时有意义(例如用户明确从 app 运行脚本)。

---

## 方法

### `Dialog.alert(message, title=None, buttonLabel=None) -> None`

显示单按钮警告。用户点击关闭按钮后返回。

```python
import scripting; Dialog = scripting.Dialog
Dialog.alert("操作完成", title="完成")
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| message | str | 是 | 主体文本。 |
| title | str | 否 | 主体上方的可选标题。 |
| buttonLabel | str | 否 | 关闭按钮文案,默认本地化的 `OK`。 |

### `Dialog.confirm(message, title=None, cancelLabel=None, confirmLabel=None) -> bool`

显示双按钮确认对话框。用户点确认返回 `True`,点取消返回 `False`。

```python
import scripting; Dialog = scripting.Dialog

if Dialog.confirm("删除该文件?", title="确认",
                  cancelLabel="保留", confirmLabel="删除"):
    delete_file()
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| message | str | 是 | 主体文本。 |
| title | str | 否 | 标题。 |
| cancelLabel | str | 否 | 取消按钮文案。 |
| confirmLabel | str | 否 | 确认按钮文案。 |

### `Dialog.prompt(title=None, message=None, defaultValue=None, placeholder=None, obscureText=False, cancelLabel=None, confirmLabel=None) -> str | None`

显示文本输入对话框。返回用户输入的字符串,取消时返回 `None`。

```python
import scripting; Dialog = scripting.Dialog

name = Dialog.prompt(title="您的姓名", placeholder="Alice")
if name is not None:
    print(f"你好, {name}")
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | str | 否 | 标题。 |
| message | str | 否 | 标题下方的辅助说明。 |
| defaultValue | str | 否 | 输入框预填的文本。 |
| placeholder | str | 否 | 空时显示的占位文本。 |
| obscureText | bool | 否 | `True` 时遮掩输入(密码样式)。默认 `False`。 |
| cancelLabel | str | 否 | 取消按钮文案。 |
| confirmLabel | str | 否 | 确认按钮文案。 |

### `Dialog.actionSheet(title, actions, message=None, cancelButton=True) -> int | None`

显示带多选项的操作表。返回所选项的索引(0 起),取消时返回 `None`。

```python
import scripting; Dialog = scripting.Dialog

idx = Dialog.actionSheet(
    title="选择导出格式",
    actions=[
        {"label": "JSON"},
        {"label": "CSV"},
        {"label": "删除原文件", "destructive": True},
    ],
)
if idx == 0:
    export_json()
elif idx == 1:
    export_csv()
elif idx == 2:
    delete_original()
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | str | 是 | 操作表标题。 |
| actions | list[dict] | 是 | `{"label": str, "destructive": bool?}` 列表。`destructive=True` 让选项以红色显示。 |
| message | str | 否 | 标题下方的辅助说明。 |
| cancelButton | bool | 否 | 是否显示取消按钮,默认 `True`。 |
