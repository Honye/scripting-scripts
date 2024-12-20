import { ScrollView, VStack } from "scripting"
import { OpenURLInSystemDefaultBrowserExample } from "./open_url_in_system_default_browser"
import { OpenURLinAppBrowserExample } from "./open_url_in_app_browser"

export function SafariExample() {
  return <ScrollView>
    <VStack>
      <OpenURLInSystemDefaultBrowserExample />
      <OpenURLinAppBrowserExample />
    </VStack>
  </ScrollView>
}