import {
  Button,
  GeometryReader,
  Image,
  RoundedRectangle,
  Text,
  VStack,
  ZStack
} from 'scripting'
import type { Color, VirtualNode } from 'scripting'
import { regionFor, regionName } from '../regions'
import { designImageUrl, formatCode } from '../gift_wallet'
import type { GiftCardDesign } from '../types'

/**
 * Card faces from the Storefront gift card design (collection v2).
 *
 * Every number below is taken from the design's 720 × 450 artboards and scaled
 * to whatever width the row gives the card, so the proportions stay exactly
 * as drawn. Text positions in the design are baselines; `place` turns them
 * into the top of the frame SwiftUI lays the text out in.
 *
 * The face carries only what is printed on a card. Notes, warnings and the
 * Redeem button belong to the row around it — and no part of the code is ever
 * shown here.
 */
const W = 720
const H = 450
const RADIUS = 27
/** SF Pro's ascender as a fraction of the point size: baseline → frame top. */
const ASCENT = 0.952

type Palette = {
  /** Primary text. */
  ink: string
  /** Secondary text. */
  mute: string
  /** Outer colour of the radial glow. */
  base: string
  /** Inner colour of the radial glow. */
  glow: string
}

/** A text slot: baseline origin, point size and letter spacing, all in artboard units. */
type Slot = { x: number; y: number; size: number; kerning?: number }

type Layout =
  /** Currency over a huge figure on the left, artwork on the right. */
  | {
      kind: 'amountLeft'
      code: Slot
      figure: Slot
      region: Slot
    }
  /** Artwork on the left; currency code over the figure on the right. */
  | {
      kind: 'valueRight'
      code: Slot
      amount: Slot
      region: Slot
    }
  /** Artwork centred; region bottom-left, amount bottom-right (x is its trailing edge). */
  | { kind: 'centered'; region: Slot; amount: Slot }

type Spec = {
  palette: Palette
  /** Artwork square: top-left corner and side. */
  art: { x: number; y: number; size: number }
  layout: Layout
}

const REGION = { size: 20 }

const SPECS: Record<GiftCardDesign, Spec> = {
  geode: {
    palette: {
      ink: '#1d1d1f',
      mute: '#525e76',
      base: '#d4def2',
      glow: '#b2c6ec'
    },
    art: { x: 365, y: 98, size: 310 },
    layout: {
      kind: 'amountLeft',
      code: { x: 40, y: 200, size: 25 },
      figure: { x: 36, y: 294, size: 112, kerning: -6 },
      region: { x: 40, y: 364, ...REGION }
    }
  },
  fogcamo: {
    palette: {
      ink: '#f5f7ff',
      mute: '#acb7cc',
      base: '#111b2b',
      glow: '#284a64'
    },
    art: { x: 15, y: 98, size: 310 },
    layout: {
      kind: 'valueRight',
      code: { x: 390, y: 165, size: 14, kerning: 2 },
      amount: { x: 383, y: 250, size: 65, kerning: -3 },
      region: { x: 390, y: 337, ...REGION }
    }
  },
  lofi: {
    palette: {
      ink: '#30202c',
      mute: '#846776',
      base: '#fff6f9',
      glow: '#ffdaeb'
    },
    art: { x: 369, y: 91, size: 320 },
    layout: {
      kind: 'amountLeft',
      code: { x: 40, y: 190, size: 22, kerning: 1 },
      figure: { x: 36, y: 286, size: 110, kerning: -6 },
      region: { x: 40, y: 364, ...REGION }
    }
  },
  convo: {
    palette: {
      ink: '#004d40',
      mute: '#57776c',
      base: '#f5f9f3',
      glow: '#e3eddf'
    },
    art: { x: 237, y: 77, size: 246 },
    layout: {
      kind: 'centered',
      // Alone now, so it shares the amount's baseline.
      region: { x: 40, y: 400, ...REGION },
      amount: { x: 680, y: 400, size: 53, kerning: -2 }
    }
  },
  melted: {
    palette: {
      ink: '#ffffff',
      mute: '#bfb5d2',
      base: '#19141f',
      glow: '#5a245d'
    },
    art: { x: 17, y: 111, size: 300 },
    layout: {
      kind: 'valueRight',
      code: { x: 394, y: 170, size: 14, kerning: 2 },
      amount: { x: 386, y: 268, size: 93, kerning: -4 },
      region: { x: 394, y: 347, ...REGION }
    }
  }
}

/**
 * Widest each amount may grow before it shrinks, in artboard units. Real
 * amounts run longer than the samples ("¥10,000" in a slot drawn for "100"),
 * and must give way rather than run into the artwork.
 */
const MAX_WIDTH: Record<Layout['kind'], number> = {
  amountLeft: 325,
  valueRight: 305,
  centered: 400
}

/** `#rrggbb` at an opacity, as the `rgba()` string Scripting takes. */
function alpha(hex: string, opacity: number): Color {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`
}

/**
 * The face names the currency by its ISO code, never a sign: one storefront's
 * card in a wallet of many, and "$" or "¥" alone would not say whose.
 */
export function cardAmount(amount: number, currency: string) {
  const figure = amount.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  })
  return { code: currency, figure, joined: `${currency} ${figure}` }
}

/**
 * Row insets for a card in a List or Form. Not zero at the sides: the grouped
 * cell still clips its content to its own corner radius, larger than the
 * card's, and a card flush with the cell lost the tips of its corners. Six
 * points clears the cell's curve.
 */
export const CARD_ROW_INSETS = { top: 6, leading: 6, bottom: 6, trailing: 6 }

/**
 * Below this width (in points) the card is drawn compact. At two columns on a
 * phone a card is ~170pt wide, a quarter of the artboard, and the design's
 * small type would land around 3–6pt.
 */
const COMPACT_BELOW = 300

/**
 * Compact type sizes, in artboard units. Only what identifies the card is kept
 * and enlarged — title, region code, currency, amount; the region name goes,
 * since the pill already says where the card is from.
 */
const COMPACT = {
  title: 46,
  pill: 30,
  code: 44,
  centeredAmount: 84,
  /** Floor for the corner radius, in points: proportional would be ~6pt. */
  minRadius: 10
}

export function GiftCardView({
  design,
  region,
  amount,
  currency,
  redeemed,
  menu
}: {
  design: GiftCardDesign
  region: string
  amount: number
  currency: string
  /** Spent cards keep their place but lose their colour. */
  redeemed?: boolean
  /**
   * Long-press menu items. Attached here rather than by the caller because
   * only the face knows its corner radius, which the lifted preview must use.
   */
  menu?: VirtualNode
}) {
  return (
    <ZStack
      frame={{ maxWidth: 'infinity' }}
      aspectRatio={{ value: W / H, contentMode: 'fit' }}
    >
      <GeometryReader>
        {(proxy) => (
          <CardFace
            scale={proxy.size.width / W}
            compact={proxy.size.width < COMPACT_BELOW}
            menu={menu}
            redeemed={redeemed}
            design={design}
            region={region}
            amount={amount}
            currency={currency}
          />
        )}
      </GeometryReader>
    </ZStack>
  )
}

/**
 * Where the code goes when it is printed (share images only): the region-name
 * line, which the pill makes redundant. Sized to stay clear of the artwork,
 * and of the amount on the centred layout, which shares its baseline.
 */
const CODE_SLOT: Record<
  Layout['kind'],
  { dy: number; size: number; maxWidth: number }
> = {
  amountLeft: { dy: 8, size: 26, maxWidth: 320 },
  valueRight: { dy: 0, size: 24, maxWidth: 300 },
  centered: { dy: 0, size: 26, maxWidth: 330 }
}

/** The centred layout's amount, narrowed to leave room for a printed code. */
const CENTERED_AMOUNT_WITH_CODE = 300

function CardFace({
  scale: s,
  compact,
  menu,
  redeemed,
  code,
  artwork,
  square,
  design,
  region,
  amount,
  currency
}: {
  scale: number
  compact: boolean
  menu?: VirtualNode
  redeemed?: boolean
  /** Printed in place of the region name. Share images only. */
  code?: string
  /** Artwork already in memory, for off-screen rendering. */
  artwork?: UIImage | null
  /** No rounded corners: the share image is a plain rectangle. */
  square?: boolean
  design: GiftCardDesign
  region: string
  amount: number
  currency: string
}) {
  const spec = SPECS[design]
  const { ink, mute, base, glow } = spec.palette
  const info = regionFor(region)
  const money = cardAmount(amount, currency)
  const maxWidth = MAX_WIDTH[spec.layout.kind]
  const radius = square
    ? 0
    : compact
      ? Math.max(RADIUS * s, COMPACT.minRadius)
      : RADIUS * s

  /** A slot grown to at least `size` when compact; untouched otherwise. */
  const grow = (slot: Slot, size: number): Slot =>
    compact ? { ...slot, size: Math.max(slot.size, size) } : slot

  /** Pins `node` with its top-leading corner at (x, y) on the artboard. */
  const pin = (x: number, y: number, node: VirtualNode, trailing?: boolean) => (
    <VStack
      frame={{
        maxWidth: 'infinity',
        maxHeight: 'infinity',
        alignment: trailing ? 'topTrailing' : 'topLeading'
      }}
      padding={
        trailing
          ? { top: y * s, trailing: (W - x) * s }
          : { top: y * s, leading: x * s }
      }
    >
      {node}
    </VStack>
  )

  /** Text in a slot, positioned by its baseline as the design specifies it. */
  const place = (
    slot: Slot,
    value: string,
    color: string,
    options: {
      weight?: 'medium' | 'semibold'
      fit?: boolean
      trailing?: boolean
      mono?: boolean
      /** Overrides the layout's amount width when fitting. */
      maxWidth?: number
    } = {}
  ) =>
    pin(
      slot.x,
      slot.y - slot.size * ASCENT,
      <Text
        font={slot.size * s}
        fontWeight={options.weight ?? 'medium'}
        fontDesign={options.mono ? 'monospaced' : undefined}
        kerning={(slot.kerning ?? 0) * s}
        foregroundStyle={color as Color}
        lineLimit={1}
        minScaleFactor={options.fit ? 0.35 : undefined}
        frame={
          options.fit
            ? {
                maxWidth: (options.maxWidth ?? maxWidth) * s,
                alignment: options.trailing ? 'trailing' : 'leading'
              }
            : undefined
        }
      >
        {value}
      </Text>,
      options.trailing
    )

  const layout = spec.layout

  /** The region-name line: the code when one is printed, else the name. */
  const regionLine = () => {
    if (code != null) {
      const slot = CODE_SLOT[layout.kind]
      return place(
        {
          x: layout.region.x,
          y: layout.region.y + slot.dy,
          size: slot.size,
          kerning: 1.5
        },
        formatCode(code),
        ink,
        { weight: 'semibold', mono: true, fit: true, maxWidth: slot.maxWidth }
      )
    }
    return compact ? null : place(layout.region, regionName(info), ink)
  }

  let body: (VirtualNode | null)[]
  if (layout.kind === 'amountLeft') {
    body = [
      place(grow(layout.code, COMPACT.code), money.code, mute),
      place(layout.figure, money.figure, ink, { fit: true }),
      regionLine()
    ]
  } else if (layout.kind === 'valueRight') {
    body = [
      place(grow(layout.code, COMPACT.code), money.code, mute),
      place(layout.amount, money.figure, ink, { fit: true }),
      regionLine()
    ]
  } else {
    body = [
      regionLine(),
      place(grow(layout.amount, COMPACT.centeredAmount), money.joined, ink, {
        fit: true,
        trailing: true,
        maxWidth: code != null ? CENTERED_AMOUNT_WITH_CODE : undefined
      })
    ]
  }

  return (
    <ZStack
      frame={{ width: W * s, height: H * s }}
      background={{
        style: {
          colors: [glow as Color, base as Color],
          center: { x: 0.78, y: 0.55 },
          startRadius: 0,
          endRadius: 0.8 * W * s
        },
        shape: { type: 'rect', cornerRadius: radius, style: 'continuous' }
      }}
      clipShape={{ type: 'rect', cornerRadius: radius, style: 'continuous' }}
      // On the face, not its container, so the long-press preview is grey too.
      grayscale={redeemed ? 1 : 0}
      opacity={redeemed ? 0.55 : 1}
      contentShape={{
        kind: 'contextMenuPreview',
        shape: { type: 'rect', cornerRadius: radius, style: 'continuous' }
      }}
      contextMenu={menu != null ? { menuItems: menu } : undefined}
    >
      {pin(
        spec.art.x,
        spec.art.y,
        artwork != null ? (
          <Image
            image={artwork}
            resizable
            scaleToFit
            frame={{ width: spec.art.size * s, height: spec.art.size * s }}
          />
        ) : (
          <Image
            imageUrl={designImageUrl(design)}
            resizable
            scaleToFit
            frame={{ width: spec.art.size * s, height: spec.art.size * s }}
            placeholder={
              <Image
                systemName="apple.logo"
                font={spec.art.size * s * 0.6}
                foregroundStyle={alpha(ink, 0.12)}
              />
            }
          />
        )
      )}

      {place(
        // Compact: lowered so it stays centred on the taller pill beside it.
        compact
          ? { x: 38, y: 68, size: COMPACT.title, kerning: -0.65 }
          : { x: 38, y: 56, size: 26, kerning: -0.65 },
        'Apple Gift Card',
        ink,
        {
          weight: 'semibold'
        }
      )}

      {/* Region pill: 60 × 32 at (622, 31), right edge 38 in from the card's;
          scaled up with its text when compact. */}
      {pin(
        682,
        compact ? 24 : 31,
        <Text
          font={(compact ? COMPACT.pill : 15) * s}
          fontWeight="semibold"
          kerning={1 * s}
          foregroundStyle={ink as Color}
          padding={{ horizontal: (compact ? 18 : 12) * s }}
          frame={{
            minWidth: (compact ? 92 : 60) * s,
            height: (compact ? 56 : 32) * s
          }}
          background={{ style: alpha(ink, 0.07), shape: 'capsule' }}
        >
          {region.toUpperCase()}
        </Text>,
        true
      )}

      {body}
    </ZStack>
  )
}

/**
 * The card as a share image, with its code printed on it. Drawn at the
 * artboard's own size rather than through `GeometryReader`: off-screen there is
 * no parent to propose a width. The artwork must be loaded beforehand — the
 * renderer takes one snapshot and does not wait for a network image.
 */
export function GiftCardShareImage({
  design,
  region,
  amount,
  currency,
  code,
  artwork
}: {
  design: GiftCardDesign
  region: string
  amount: number
  currency: string
  code: string
  /** Null when it could not be fetched: the logo placeholder is drawn instead. */
  artwork: UIImage | null
}) {
  return (
    <CardFace
      scale={1}
      square
      compact={false}
      code={code}
      artwork={artwork}
      design={design}
      region={region}
      amount={amount}
      currency={currency}
    />
  )
}

/** A swatch for the design picker: the card's own glow with its artwork. */
export function GiftCardThumb({
  design,
  selected,
  onSelect
}: {
  design: GiftCardDesign
  selected: boolean
  onSelect: () => void
}) {
  const { base, glow } = SPECS[design].palette
  return (
    <Button action={onSelect} buttonStyle="plain">
      <ZStack
        frame={{ width: 56, height: 35 }}
        background={{
          style: {
            colors: [glow as Color, base as Color],
            center: { x: 0.78, y: 0.55 },
            startRadius: 0,
            endRadius: 45
          },
          shape: { type: 'rect', cornerRadius: 6, style: 'continuous' }
        }}
        overlay={
          <RoundedRectangle
            cornerRadius={6}
            stroke={{
              shapeStyle: selected ? 'systemBlue' : ('separator' as Color),
              strokeStyle: { lineWidth: selected ? 2.5 : 0.5 }
            }}
          />
        }
      >
        <Image
          imageUrl={designImageUrl(design)}
          resizable
          scaleToFit
          frame={{ width: 26, height: 26 }}
          placeholder={
            <Image systemName="apple.logo" foregroundStyle="systemGray4" />
          }
        />
      </ZStack>
    </Button>
  )
}
