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
import { regionFor, regionName, searchRegions } from '../regions'
import type { Region } from '../regions'

/** The flag + code chip used wherever an account's storefront is shown. */
export function RegionLabel({ code, font }: { code: string; font?: number }) {
  const region = regionFor(code)
  return (
    <HStack spacing={6}>
      <Text font={font ?? 20}>{region.flag}</Text>
      <Text font={font ? font - 4 : 13} foregroundStyle="secondaryLabel">
        {region.code.toUpperCase()}
      </Text>
    </HStack>
  )
}

/**
 * Presented modally, resolving with the chosen `Region` (or `undefined` when
 * dismissed). Region is the one field that cannot be typed freely: it doubles as
 * the App Store URL path segment and the iTunes `country` parameter, so a free
 * text value would silently break every lookup.
 *
 * The full storefront list is ~170 entries, so search is not optional here.
 */
export function RegionPicker({ selected }: { selected: string }) {
  const dismiss = Navigation.useDismiss()
  const [query, setQuery] = useState('')
  const matches = searchRegions(query)

  return (
    <NavigationStack>
      <List
        navigationTitle={i18n.accountRegion}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          topBarLeading: [<Button title={i18n.cancel} action={() => dismiss()} />]
        }}
      >
        <Section>
          <TextField
            title={i18n.searchRegion}
            labelsHidden
            prompt={i18n.searchRegion}
            value={query}
            onChanged={setQuery}
            textInputAutocapitalization="never"
            autocorrectionDisabled={true}
          />
        </Section>

        <Section
          footer={
            matches.length === 0 ? (
              <Text>{i18n.searchRegionEmpty}</Text>
            ) : undefined
          }
        >
          {matches.map((region: Region) => (
            <Button key={region.code} action={() => dismiss(region)}>
              <HStack spacing={12}>
                <Text font={24}>{region.flag}</Text>
                <Text foregroundStyle="label" lineLimit={1}>
                  {regionName(region)}
                </Text>
                <Spacer />
                <Text font="caption" foregroundStyle="secondaryLabel">
                  {region.code.toUpperCase()} · {region.currency}
                </Text>
                {region.code === selected ? (
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
