import {
  Button,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
  VStack
} from 'scripting'
import { i18n } from '../i18n'
import { regionFor, regionName } from '../regions'
import { channelsFor, officialGiftCardUrl, redeemUrl } from '../giftcards'
import type { Account } from '../types'

/**
 * FR-GIFT-01..07.
 *
 * FR-GIFT-04 and FR-GIFT-05 are marked mandatory in the spec and they are the
 * reason for the shape of this screen: Apple's own channel and third-party
 * resellers live in separate sections that never interleave, and the disclaimer
 * is part of the third-party section itself rather than a dismissible notice.
 * Someone about to hand money to a reseller should not be able to reach that
 * point without having seen who they are dealing with.
 */
export function GiftCards({
  account,
  onUpdateBalance
}: {
  account: Account
  onUpdateBalance: () => void
}) {
  const region = regionFor(account.region)
  const official = officialGiftCardUrl(account.region)
  const channels = channelsFor(account.region)

  return (
    <List
      navigationTitle={i18n.giftCards}
      navigationBarTitleDisplayMode="inline"
    >
      <Section>
        <HStack>
          <Text font={22}>{region.flag}</Text>
          <VStack alignment="leading" spacing={2}>
            <Text>{account.alias}</Text>
            <Text font="caption" foregroundStyle="secondaryLabel">
              {regionName(region)} · {account.currency}
            </Text>
          </VStack>
          <Spacer />
        </HStack>
      </Section>

      <Section
        header={<Text>{i18n.giftCardOfficial}</Text>}
        footer={
          official == null ? (
            // FR-GIFT-02: say so, rather than link somewhere that will not work.
            <Text foregroundStyle="systemOrange">{i18n.giftCardNoOfficial}</Text>
          ) : undefined
        }
      >
        {official != null ? (
          <Button action={() => Safari.openURL(official)}>
            <HStack>
              <Image systemName="giftcard" />
              <Text foregroundStyle="label">{i18n.giftCardOfficialAction}</Text>
              <Spacer />
              <Image systemName="arrow.up.forward" foregroundStyle="tertiaryLabel" />
            </HStack>
          </Button>
        ) : null}
        <Button action={() => Safari.openURL(redeemUrl())}>
          <HStack>
            <Image systemName="qrcode.viewfinder" />
            <Text foregroundStyle="label">{i18n.giftCardRedeem}</Text>
            <Spacer />
            <Image systemName="arrow.up.forward" foregroundStyle="tertiaryLabel" />
          </HStack>
        </Button>
      </Section>

      {/* FR-GIFT-04: its own section, never mixed into Apple's. */}
      <Section
        header={<Text>{i18n.giftCardThirdParty}</Text>}
        footer={
          // FR-GIFT-05: standing, not dismissible, and shown whether or not the
          // list has entries.
          <Text foregroundStyle="secondaryLabel">{i18n.giftCardDisclaimer}</Text>
        }
      >
        {channels.length === 0 ? (
          <Text foregroundStyle="secondaryLabel">
            {i18n.giftCardThirdPartyEmpty}
          </Text>
        ) : (
          channels.map((channel) => (
            <Button key={channel.id} action={() => Safari.openURL(channel.url)}>
              <HStack>
                <Text foregroundStyle="label">{channel.name}</Text>
                {channel.sponsored ? (
                  // FR-GIFT-06.
                  <Text
                    font="caption2"
                    foregroundStyle="secondaryLabel"
                    padding={{ horizontal: 5, vertical: 1 }}
                    background={{
                      style: 'quaternarySystemFill',
                      shape: { type: 'rect', cornerRadius: 4 }
                    }}
                  >
                    {i18n.giftCardSponsored}
                  </Text>
                ) : null}
                <Spacer />
                <Image systemName="arrow.up.forward" foregroundStyle="tertiaryLabel" />
              </HStack>
            </Button>
          ))
        )}
      </Section>

      <Section footer={<Text>{i18n.giftCardAfterTopUp}</Text>}>
        <Button title={i18n.updateBalance} action={onUpdateBalance} />
      </Section>
    </List>
  )
}
