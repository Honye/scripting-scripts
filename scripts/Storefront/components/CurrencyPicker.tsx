import {
  Button,
  HStack,
  Image,
  List,
  Navigation,
  NavigationStack,
  Section,
  Spacer,
  Text,
  TextField,
  useState
} from 'scripting'
import { i18n } from '../i18n'
import { currencySymbol } from '../format'
import { CURRENCIES } from '../regions'

/**
 * Presented modally, resolving with an ISO 4217 code. Exists because the
 * storefront-to-currency defaults in `regions.ts` cannot be perfect: Apple bills
 * some storefronts in USD instead of the local currency, and changes which ones
 * over time. Rather than pretend the table is authoritative, the user can fix a
 * single account in one tap.
 */
export function CurrencyPicker({ selected }: { selected: string }) {
  const dismiss = Navigation.useDismiss()
  const [query, setQuery] = useState('')

  const q = query.trim().toUpperCase()
  const matches = q === '' ? CURRENCIES : CURRENCIES.filter((c) => c.includes(q))

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.accountCurrency}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />]
        }}
      >
        <Section>
          <TextField
            title={i18n.accountCurrency}
            labelsHidden
            prompt={i18n.accountCurrency}
            value={query}
            onChanged={setQuery}
            textInputAutocapitalization="characters"
            autocorrectionDisabled={true}
          />
        </Section>

        <Section>
          {matches.map((currency) => (
            <Button key={currency} action={() => dismiss(currency)}>
              <HStack spacing={12}>
                <Text
                  foregroundStyle="secondaryLabel"
                  frame={{ width: 44, alignment: 'leading' }}
                >
                  {currencySymbol(currency)}
                </Text>
                <Text foregroundStyle="label">{currency}</Text>
                <Spacer />
                {currency === selected ? (
                  <Image systemName="checkmark" foregroundStyle="systemBlue" />
                ) : null}
              </HStack>
            </Button>
          ))}
        </Section>
      </List>
    </NavigationStack>
  )
}
