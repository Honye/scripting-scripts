import { ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function HapticFeedbackExample() {

  return <ScrollView
    navigationTitle={"HapticFeedback"}
  >
    <VStack>
      <APIExample
        title={"HapticFeedback.vibrate"}
        subtitle={"Invoke a brief vibration."}
        code={`HapticFeedback.vibrate()`}
        run={() => {
          HapticFeedback.vibrate()
        }}
      />

      <APIExample
        title={"HapticFeedback.lightImpact"}
        subtitle={"A collision between small, light user interface elements."}
        code={`HapticFeedback.lightImpact()`}
        run={() => {
          HapticFeedback.lightImpact()
        }}
      />

      <APIExample
        title={"HapticFeedback.mediumImpact"}
        subtitle={"A collision between moderately sized user interface elements."}
        code={`HapticFeedback.mediumImpact()`}
        run={() => {
          HapticFeedback.mediumImpact()
        }}
      />

      <APIExample
        title={"HapticFeedback.heavyImpact"}
        subtitle={"A collision between large, heavy user interface elements."}
        code={`HapticFeedback.heavyImpact()`}
        run={() => {
          HapticFeedback.heavyImpact()
        }}
      />

      <APIExample
        title={"HapticFeedback.softImpact"}
        subtitle={"A collision between user interface elements that are soft, exhibiting a large amount of compression or elasticity."}
        code={`HapticFeedback.softImpact()`}
        run={() => {
          HapticFeedback.softImpact()
        }}
      />

      <APIExample
        title={"HapticFeedback.rigidImpact"}
        subtitle={"A collision between user interface elements that are rigid, exhibiting a small amount of compression or elasticity."}
        code={`HapticFeedback.rigidImpact()`}
        run={() => {
          HapticFeedback.rigidImpact()
        }}
      />

      <APIExample
        title={"HapticFeedback.selection"}
        subtitle={"Triggers selection feedback. This method tells the generator that the user has changed a selection. In response, the generator may play the appropriate haptics. Don’t use this feedback when the user makes or confirms a selection; use it only when the selection changes."}
        code={`HapticFeedback.selection()`}
        run={() => {
          HapticFeedback.selection()
        }}
      />

      <APIExample
        title={"HapticFeedback.notificationSuccess"}
        subtitle={"A notification feedback type that indicates a task has completed successfully."}
        code={`HapticFeedback.notificationSuccess()`}
        run={() => {
          HapticFeedback.notificationSuccess()
        }}
      />

      <APIExample
        title={"HapticFeedback.notificationError"}
        subtitle={"A notification feedback type that indicates a task has failed."}
        code={`HapticFeedback.notificationError()`}
        run={() => {
          HapticFeedback.notificationError()
        }}
      />

      <APIExample
        title={"HapticFeedback.notificationWarning"}
        subtitle={"A notification feedback type that indicates a task has produced a warning."}
        code={`HapticFeedback.notificationWarning()`}
        run={() => {
          HapticFeedback.notificationWarning()
        }}
      />
    </VStack>
  </ScrollView>
}