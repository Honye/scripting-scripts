import { List, Section, Text, Toggle, useState } from 'scripting'
import { comboLabel, HOLD_KEYS } from '../settings'
import type { HoldKey, Settings } from '../settings'

type TextSelectSettings = Settings['textSelect']

/** 文本选择: hold-to-select on/off and the key combo. */
export function TextSelectPage({
  value,
  onChange
}: {
  value: TextSelectSettings
  onChange: (next: TextSelectSettings) => void
}) {
  // Own copy, so the page stays current even if the pushed view isn't
  // re-rendered with new props.
  const [textSelect, setTextSelect] = useState(value)
  const { enabled, keys } = textSelect

  function apply(next: TextSelectSettings) {
    setTextSelect(next)
    onChange(next)
  }

  function toggleKey(key: HoldKey, on: boolean) {
    const next = on
      ? HOLD_KEYS.map((k) => k.key).filter((k) => k === key || keys.includes(k))
      : keys.filter((k) => k !== key)
    // At least one key must stay selected.
    if (next.length === 0) return
    apply({ ...textSelect, keys: next })
  }

  return (
    <List navigationTitle="文本选择">
      <Section
        footer={
          <Text>
            {`按住 ${comboLabel(keys)} 拖动，即可选择网页禁止选择的文字；松开后仍可 ⌘C 复制。`}
          </Text>
        }
      >
        <Toggle
          title="按住快捷键选择任意文字"
          systemImage="character.cursor.ibeam"
          value={enabled}
          onChanged={(on) => apply({ ...textSelect, enabled: on })}
        />
      </Section>

      {enabled ? (
        <Section
          header={<Text>快捷键</Text>}
          footer={
            <Text>
              需要同时按住所有已选按键。iPad 上长按 ⌘ 会弹出快捷键列表，建议优先使用 ⌥。
            </Text>
          }
        >
          {HOLD_KEYS.map(({ key, label }) => {
            const on = keys.includes(key)
            return (
              <Toggle
                key={key}
                title={label}
                value={on}
                // The last selected key can't be turned off.
                disabled={on && keys.length === 1}
                onChanged={(v) => toggleKey(key, v)}
              />
            )
          })}
        </Section>
      ) : null}
    </List>
  )
}
