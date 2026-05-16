The `scripting` Python package exposes `Dialog`, mirroring the JS-side `Dialog` namespace. It provides synchronous wrappers around the host's modal UI — alerts, confirms, prompts and action sheets. Each call blocks until the user dismisses the dialog and returns the result.

```python
import scripting; Dialog = scripting.Dialog
```

The dialog is displayed on top of the currently visible view controller, so this only makes sense when the host app is in the foreground (e.g. when the user explicitly ran the script from the app).

---

## Methods

### `Dialog.alert(message, title=None, buttonLabel=None) -> None`

Show a single-button alert. Returns when the user taps the dismiss button.

```python
import scripting; Dialog = scripting.Dialog
Dialog.alert("Operation completed", title="Done")
```

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| message | str | Yes | Body text of the alert. |
| title | str | No | Optional title above the message. |
| buttonLabel | str | No | Custom dismiss button label. Defaults to localized `OK`. |

### `Dialog.confirm(message, title=None, cancelLabel=None, confirmLabel=None) -> bool`

Show a two-button confirm dialog. Returns `True` when the user taps the confirm button, `False` for cancel.

```python
import scripting; Dialog = scripting.Dialog

if Dialog.confirm("Delete the file?", title="Confirm",
                  cancelLabel="Keep", confirmLabel="Delete"):
    delete_file()
```

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| message | str | Yes | Body text. |
| title | str | No | Title. |
| cancelLabel | str | No | Custom cancel button label. |
| confirmLabel | str | No | Custom confirm button label. |

### `Dialog.prompt(title=None, message=None, defaultValue=None, placeholder=None, obscureText=False, cancelLabel=None, confirmLabel=None) -> str | None`

Show a text-input prompt. Returns the entered string, or `None` if the user cancelled.

```python
import scripting; Dialog = scripting.Dialog

name = Dialog.prompt(title="Your name", placeholder="Alice")
if name is not None:
    print(f"Hello, {name}")
```

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| title | str | No | Title. |
| message | str | No | Optional supporting text below the title. |
| defaultValue | str | No | Pre-filled text in the input. |
| placeholder | str | No | Placeholder shown when the input is empty. |
| obscureText | bool | No | When `True`, masks the input (password style). Defaults to `False`. |
| cancelLabel | str | No | Custom cancel button label. |
| confirmLabel | str | No | Custom confirm button label. |

### `Dialog.actionSheet(title, actions, message=None, cancelButton=True) -> int | None`

Show an action sheet with multiple choices. Returns the index of the chosen action (0-based), or `None` if cancelled.

```python
import scripting; Dialog = scripting.Dialog

idx = Dialog.actionSheet(
    title="Choose an export format",
    actions=[
        {"label": "JSON"},
        {"label": "CSV"},
        {"label": "Delete original", "destructive": True},
    ],
)
if idx == 0:
    export_json()
elif idx == 1:
    export_csv()
elif idx == 2:
    delete_original()
```

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| title | str | Yes | Sheet title. |
| actions | list[dict] | Yes | List of `{"label": str, "destructive": bool?}`. `destructive=True` renders the action in red. |
| message | str | No | Optional supporting text. |
| cancelButton | bool | No | Show a cancel button (defaults to `True`). |
