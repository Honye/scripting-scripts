import { HStack, Navigation, NavigationStack, Path2D, PathShape, Rectangle, Script, ScrollView, Text, useState, VStack } from "scripting"

// 一个可复用的三角形(绝对坐标),演示构建 + 几何查询 + clip。
const triangle = new Path2D(p => {
  p.move({ x: 150, y: 20 })
  p.addLine({ x: 20, y: 260 })
  p.addLine({ x: 280, y: 260 })
  p.closeSubpath()
})

function Example() {
  const [probeInside, setProbeInside] = useState(false)
  const rect = triangle.boundingRect()

  return <NavigationStack>
    <ScrollView>
      <VStack
        navigationTitle={"Path2D"}
        navigationBarTitleDisplayMode={"inline"}
        spacing={28}
        padding
      >
        <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
          {`\`Path2D\` mirrors SwiftUI's \`Path\`: build it with line / curve commands, then render it
          with \`<PathShape>\` (fill / stroke / modifiers), query its geometry, or use it as a clip
          shape. Points are {"{ x, y }"}, angles are radians.`}
        </Text>

        {/* 1. Static path: fill + stroke */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>1. Build + fill / stroke</Text>
          <PathShape
            path={triangle}
            fill={"systemOrange"}
            stroke={{ shapeStyle: "label", strokeStyle: { lineWidth: 3 } }}
            frame={{ width: 300, height: 280 }}
          />
        </VStack>

        {/* 2. Curves */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>2. Quadratic + cubic curves</Text>
          <PathShape
            fill={"systemPink"}
            frame={{ width: 300, height: 220 }}
            draw={(p, size) => {
              p.move({ x: size.width / 2, y: 30 })
              p.addCurve(
                { x: size.width / 2, y: size.height - 20 },
                { x: 0, y: size.height * 0.6 },
                { x: size.width * 0.3, y: size.height },
              )
              p.addCurve(
                { x: size.width / 2, y: 30 },
                { x: size.width * 0.7, y: size.height },
                { x: size.width, y: size.height * 0.6 },
              )
            }}
          />
        </VStack>

        {/* 3. Arc + rounded rect, stroked */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>3. Arc + rounded rect</Text>
          <PathShape
            stroke={{ shapeStyle: "systemBlue", strokeStyle: { lineWidth: 4 } }}
            frame={{ width: 300, height: 160 }}
            draw={(p) => {
              p.addRoundedRect({ rect: { x: 20, y: 20, width: 120, height: 120 }, cornerRadius: 24 })
              p.addArc({ center: { x: 230, y: 80 }, radius: 55, startAngle: 0, endAngle: Math.PI * 1.5 })
            }}
          />
        </VStack>

        {/* 4. Geometry query */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>4. Geometry</Text>
          <Text font={"caption"} foregroundStyle={"secondaryLabel"}>
            boundingRect = {"{"} x: {rect.x.toFixed(0)}, y: {rect.y.toFixed(0)}, w:{" "}
            {rect.width.toFixed(0)}, h: {rect.height.toFixed(0)} {"}"}
          </Text>
          <HStack spacing={12}>
            <Text>contains (150, 200): {String(triangle.contains({ x: 150, y: 200 }))}</Text>
          </HStack>
          <Text>contains (10, 10): {String(triangle.contains({ x: 10, y: 10 }))}</Text>
        </VStack>

        {/* 5. As a clip shape */}
        <VStack alignment={"leading"} spacing={8}>
          <Text font={"headline"}>5. clipShape</Text>
          <Rectangle
            fill={"systemTeal"}
            frame={{ width: 300, height: 280 }}
            clipShape={triangle}
          />
        </VStack>

      </VStack>
    </ScrollView>
  </NavigationStack>
}

async function run() {
  await Navigation.present({ element: <Example /> })
  Script.exit()
}

run()
