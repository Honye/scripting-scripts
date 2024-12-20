import { AlertExample } from "./alert"
import { PromptExample } from "./prompt"
import { ActionSheetExample } from "./action_sheet"
import { ScrollView, VStack } from "scripting"

export function DialogExample() {

  return <ScrollView>
    <VStack>
      <AlertExample />
      <PromptExample />
      <ActionSheetExample />
    </VStack>
  </ScrollView>
}