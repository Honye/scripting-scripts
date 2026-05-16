import { Button, HStack, Image, Navigation, NavigationStack, Script, Text, useState, VStack } from "scripting"

function Example() {
  const dismiss = Navigation.useDismiss()

  // drawOn: isActive=false is the steady "drawn" state (visible).
  // Flipping isActive false→true triggers the DRAW-OFF animation (the symbol erases away).
  // Flipping back triggers the DRAW-ON animation (the symbol redraws).
  const [hiddenDefault, setHiddenDefault] = useState(false)
  const [hiddenByLayer, setHiddenByLayer] = useState(false)
  const [hiddenIndividually, setHiddenIndividually] = useState(false)

  // options demo: pulse on a value change, with speed + finite repeat.
  // value-form effects honor `repeat` reliably; trigger-form drawOn does not (single-shot).
  const [pulseTick, setPulseTick] = useState(0)

  // appear/disappear via isActive (iOS 17+) — analogous trigger family.
  const [hiddenStar, setHiddenStar] = useState(false)

  // existing value-form regression
  const [bounceCounter, setBounceCounter] = useState(0)

  return <NavigationStack>
    <VStack
      navigationTitle="symbolEffect"
      navigationBarTitleDisplayMode="inline"
      toolbar={{
        topBarTrailing: <Button title="Done" action={dismiss} />
      }}
    >
      <VStack
        spacing={24}
        padding
        alignment="leading"
      >
        {/* drawOn / drawOff (iOS 26+) */}
        <VStack alignment="leading" spacing={8}>
          <Text font="headline">drawOn (iOS 26+)</Text>
          <Text font="caption" foregroundStyle="secondaryLabel">
            With drawOn, isActive=false is the "drawn" steady state. Tap Hide to play
            the draw-OFF animation (erases away); tap Show to play draw-ON (redraws).
            byLayer / individually only change how layered symbols animate.
          </Text>
          <HStack spacing={24}>
            <VStack spacing={6}>
              <Image
                systemName="checkmark.circle"
                font={48}
                foregroundStyle="systemGreen"
                symbolEffect={{ effect: "drawOn", isActive: hiddenDefault }}
              />
              <Button
                title={hiddenDefault ? "Show" : "Hide"}
                action={() => setHiddenDefault(!hiddenDefault)}
                controlSize="small"
                buttonStyle="bordered"
              />
              <Text font="caption2">drawOn</Text>
            </VStack>
            <VStack spacing={6}>
              <Image
                systemName="square.and.arrow.up"
                font={48}
                foregroundStyle="systemBlue"
                symbolEffect={{ effect: "drawOnByLayer", isActive: hiddenByLayer }}
              />
              <Button
                title={hiddenByLayer ? "Show" : "Hide"}
                action={() => setHiddenByLayer(!hiddenByLayer)}
                controlSize="small"
                buttonStyle="bordered"
              />
              <Text font="caption2">byLayer</Text>
            </VStack>
            <VStack spacing={6}>
              <Image
                systemName="cloud.sun"
                font={48}
                foregroundStyle="systemOrange"
                symbolEffect={{ effect: "drawOnIndividually", isActive: hiddenIndividually }}
              />
              <Button
                title={hiddenIndividually ? "Show" : "Hide"}
                action={() => setHiddenIndividually(!hiddenIndividually)}
                controlSize="small"
                buttonStyle="bordered"
              />
              <Text font="caption2">individually</Text>
            </VStack>
          </HStack>
        </VStack>

        {/* options on a value-form effect (where speed + repeat are reliably honored) */}
        <VStack alignment="leading" spacing={8}>
          <Text font="headline">options (speed + repeat)</Text>
          <Text font="caption" foregroundStyle="secondaryLabel">
            Tap Pulse to replay the pulse animation 3 times at 0.7x speed with a 0.4s gap.
            options.repeat works on value-bound effects; trigger-form drawOn is single-shot.
          </Text>
          <HStack spacing={16}>
            <Image
              systemName="bell.fill"
              font={48}
              foregroundStyle="systemRed"
              symbolEffect={{
                effect: "pulse",
                value: pulseTick,
                options: { speed: 0.7, repeat: { count: 3, delay: 0.4 } },
              }}
            />
            <Button
              title="Pulse"
              action={() => setPulseTick(pulseTick + 1)}
              buttonStyle="borderedProminent"
              controlSize="small"
            />
            <Text font="caption" monospaced>tick: {pulseTick}</Text>
          </HStack>
        </VStack>

        {/* appear / disappear via isActive */}
        <VStack alignment="leading" spacing={8}>
          <Text font="headline">disappear (isActive)</Text>
          <Text font="caption" foregroundStyle="secondaryLabel">
            The same trigger form works for the iOS 17+ appear / disappear / scale family.
            disappear isActive=true hides the symbol (fade-style), parallel to drawOn isActive=true.
          </Text>
          <HStack spacing={16}>
            <Image
              systemName="star.fill"
              font={48}
              foregroundStyle="systemYellow"
              symbolEffect={{ effect: "disappear", isActive: hiddenStar }}
            />
            <Button
              title={hiddenStar ? "Show" : "Hide"}
              action={() => setHiddenStar(!hiddenStar)}
              buttonStyle="bordered"
              controlSize="small"
            />
          </HStack>
        </VStack>

        {/* value-form regression */}
        <VStack alignment="leading" spacing={8}>
          <Text font="headline">value-bound (bounce on change)</Text>
          <Text font="caption" foregroundStyle="secondaryLabel">
            Existing form: animation replays whenever value changes.
          </Text>
          <HStack spacing={16}>
            <Image
              systemName="heart.fill"
              font={48}
              foregroundStyle="systemPink"
              symbolEffect={{ effect: "bounce", value: bounceCounter }}
            />
            <Button
              title="Bounce"
              action={() => setBounceCounter(bounceCounter + 1)}
              buttonStyle="bordered"
              controlSize="small"
            />
            <Text font="caption" monospaced>{bounceCounter}</Text>
          </HStack>
        </VStack>
      </VStack>
    </VStack>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />,
  })

  Script.exit()
}

run()
