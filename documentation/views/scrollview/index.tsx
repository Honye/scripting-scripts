import { Button, Color, ForEach, HStack, KeywordPoint, LazyVStack, Navigation, NavigationStack, Picker, RoundedRectangle, Script, ScrollView, Text, useState, VStack } from "scripting"

function Example() {
  const colors: Color[] = [
    "systemRed",
    "systemOrange",
    "systemYellow",
    "systemGreen",
    "systemBlue",
    "systemPurple",
    "systemIndigo",
    "systemPink",
  ]
  const [scrollAnchor, setScrollAnchor] = useState<KeywordPoint>("bottom")

  // scrollPosition demo —— 把 leading 可见 item id 双向绑到 state；
  // 子节点用 `key=...`，bridge 会映射到 SwiftUI `.id()`。
  const positionItems = Array.from({ length: 50 }, (_, i) => ({
    id: `pos-${i}`,
    title: `Row ${i + 1}`,
    color: colors[i % colors.length],
  }))
  const [visibleId, setVisibleId] = useState<string | null>(null)

  // onScrollTargetVisibilityChange demo —— iOS 18+，跟踪当前可见 id 集合（threshold ≥ 0.5）。
  const visItems = Array.from({ length: 30 }, (_, i) => ({
    id: `vis-${i}`,
    title: `Item ${i + 1}`,
    color: colors[i % colors.length],
  }))
  const [visibleIds, setVisibleIds] = useState<string[]>([])

  return <NavigationStack>
    <ScrollView
      navigationTitle={"ScrollView"}
      defaultScrollAnchor={scrollAnchor}
      navigationBarTitleDisplayMode={"inline"}
      key={scrollAnchor}
    >
      <VStack
        spacing={16}
        padding
      >
        <Picker
          title={"Default Scroll Anchor"}
          value={scrollAnchor}
          onChanged={setScrollAnchor as any}
          pickerStyle={"menu"}
        >
          <Text tag={"top"}>Top</Text>
          <Text tag={"center"}>Center</Text>
          <Text tag={"bottom"}>Bottom</Text>
        </Picker>

        <ScrollView
          axes={"horizontal"}
          frame={{
            height: 64
          }}
        >
          <HStack spacing={8}>
            <ForEach
              count={15}
              itemBuilder={index =>
                <RoundedRectangle
                  key={index.toString()}
                  fill={"systemIndigo"}
                  cornerRadius={6}
                  frame={{
                    width: 64,
                    height: 64,
                  }}
                  overlay={
                    <Text>{index}</Text>
                  }
                />
              }
            />
          </HStack>
        </ScrollView>

        <ForEach
          count={colors.length}
          itemBuilder={index => {
            const color = colors[index]
            return <RoundedRectangle
              key={color}
              fill={color}
              cornerRadius={16}
              frame={{
                height: 100
              }}
            />
          }}
        />

        {/* scrollPosition section —— 把 leading 可见 item id 同步给 JS，并支持 jump-to-id */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>scrollPosition(id:anchor:)</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            Two-way binds the leading visible item's id. Tap a Jump button to scroll to a row.
          </Text>
          <HStack spacing={6}>
            <Text font={"caption2"} foregroundStyle={"secondaryLabel"}>Visible:</Text>
            <Text font={"caption"} monospaced>{visibleId ?? "—"}</Text>
          </HStack>
          <HStack spacing={8}>
            <Button title={"Jump to first"} action={() => setVisibleId("pos-0")} buttonStyle={"borderedProminent"} controlSize={"small"} />
            <Button title={"Jump to 25"} action={() => setVisibleId("pos-24")} buttonStyle={"borderedProminent"} controlSize={"small"} />
            <Button title={"Jump to last"} action={() => setVisibleId("pos-49")} buttonStyle={"borderedProminent"} controlSize={"small"} />
          </HStack>
          <ScrollView
            frame={{ height: 280 }}
            background={
              <RoundedRectangle cornerRadius={12} fill={"secondarySystemBackground"} />
            }
            scrollPosition={{
              value: visibleId,
              onChanged: (id) => setVisibleId(id as string | null),
              anchor: "top",
            }}
          >
            <LazyVStack scrollTargetLayout spacing={8} padding={8}>
              {positionItems.map(it => (
                <HStack
                  key={it.id}
                  spacing={12}
                  padding={10}
                  background={
                    <RoundedRectangle cornerRadius={10} fill={{ color: it.color, opacity: 0.18 }} />
                  }
                >
                  <RoundedRectangle cornerRadius={6} frame={{ width: 24, height: 24 }} fill={it.color} />
                  <Text font={"body"}>{it.title}</Text>
                  <Text font={"caption"} foregroundStyle={"secondaryLabel"}>{it.id}</Text>
                </HStack>
              ))}
            </LazyVStack>
          </ScrollView>
        </VStack>

        {/* onScrollTargetVisibilityChange section —— iOS 18+，整组可见 id 跟踪 */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>onScrollTargetVisibilityChange</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            iOS 18+. Reports the array of currently-visible scroll-target ids (≥ 50% visible).
          </Text>
          <Text font={"caption2"} foregroundStyle={"secondaryLabel"}>
            visible ({visibleIds.length}):
          </Text>
          <Text font={"caption"} monospaced>
            {visibleIds.length > 0 ? visibleIds.join(", ") : "—"}
          </Text>
          <ScrollView
            frame={{ height: 220 }}
            background={
              <RoundedRectangle cornerRadius={12} fill={"secondarySystemBackground"} />
            }
            onScrollTargetVisibilityChange={{
              idType: "string",
              threshold: 0.5,
              onChanged: (ids) => setVisibleIds(ids as string[]),
            }}
          >
            <LazyVStack scrollTargetLayout spacing={8} padding={8}>
              {visItems.map(it => (
                <HStack
                  key={it.id}
                  spacing={12}
                  padding={10}
                  background={
                    <RoundedRectangle cornerRadius={10} fill={{ color: it.color, opacity: 0.18 }} />
                  }
                >
                  <RoundedRectangle cornerRadius={6} frame={{ width: 24, height: 24 }} fill={it.color} />
                  <Text font={"body"}>{it.title}</Text>
                  <Text font={"caption"} foregroundStyle={"secondaryLabel"}>{it.id}</Text>
                </HStack>
              ))}
            </LazyVStack>
          </ScrollView>
        </VStack>
      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()

