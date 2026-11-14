import { Button, FlowLayout, Text } from 'scripting'

export type Chip = {
  key: string
  label: string
  selected: boolean
  onTap: () => void
}

/**
 * Wrapping row of capsule toggles — the tag filter and the tag editor share it.
 *
 * Every chip is a bordered button rather than a plain one: inside a `List` row,
 * plain-style buttons would all fire together on a tap anywhere in the row.
 */
export function TagChips({ chips }: { chips: Chip[] }) {
  return (
    <FlowLayout spacing={8}>
      {chips.map((chip) => (
        <Button
          key={chip.key}
          action={chip.onTap}
          buttonStyle={chip.selected ? 'borderedProminent' : 'bordered'}
          buttonBorderShape="capsule"
          controlSize="small"
        >
          <Text lineLimit={1}>{chip.label}</Text>
        </Button>
      ))}
    </FlowLayout>
  )
}

/** Read-only tags, for rows and headers. */
export function TagLine({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
      {tags.map((t) => `#${t}`).join('  ')}
    </Text>
  )
}
