import { HStack, Spacer, Text, TextField } from 'scripting'
import { currencySymbol } from '../format'

/**
 * Money input. The value is kept as the raw string while editing — parsing on
 * every keystroke would fight the user as they type "12." — and only converted
 * by the caller on save.
 */
export function AmountField({
  title,
  currency,
  value,
  onChanged,
  invalid
}: {
  title: string
  currency: string
  value: string
  onChanged: (value: string) => void
  invalid?: boolean
}) {
  return (
    <HStack>
      <Text>{title}</Text>
      <Spacer />
      <Text foregroundStyle="secondaryLabel">{currencySymbol(currency)}</Text>
      <TextField
        title={title}
        labelsHidden
        prompt="0.00"
        value={value}
        onChanged={onChanged}
        keyboardType="decimalPad"
        multilineTextAlignment="trailing"
        foregroundStyle={invalid ? 'systemRed' : 'label'}
        frame={{ maxWidth: 120 }}
      />
    </HStack>
  )
}
