import { ScrollView } from "scripting"
import { SimpleViewExample } from "./simple_view"
import { DismissableSimpleViewExample } from "./dismiss_simple_view"

export function PresentViewsExample() {

  return <ScrollView
    navigationTitle={"Present Views"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <SimpleViewExample />
    <DismissableSimpleViewExample />
  </ScrollView>
}