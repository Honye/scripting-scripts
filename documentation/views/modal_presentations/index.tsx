import { ScrollView, VStack } from "scripting"
import { SheetExample } from "./sheet"
import { PopoverExample } from "./popover"
import { FullScreenCoverExample } from "./full_screen_cover"
import { ConfiguringSheetHeightExample } from "./configuring_sheet_height"
import { PresentAlertExample } from "./alert"
import { PresentConfirmationDialogExample } from "./confirmation_dialog"

export function ModalPresentationsExample() {
  return <ScrollView>
    <VStack>
      <SheetExample />
      <ConfiguringSheetHeightExample />
      <FullScreenCoverExample />
      <PopoverExample />
      <PresentAlertExample />
      <PresentConfirmationDialogExample />
    </VStack>
  </ScrollView>
}