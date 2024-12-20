import { TapGestureExample } from "./tap_gesture"
import { DoubleTapGestureExample } from "./double_tap_gesture"
import { LongPressGestureExample } from "./long_press_gesture"
import { ScrollView, VStack } from "scripting"

export function GesturesExample() {

  return <ScrollView
    navigationTitle={"Gestures"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <VStack>
      <TapGestureExample />
      <DoubleTapGestureExample />
      <LongPressGestureExample />
    </VStack>
  </ScrollView>
}