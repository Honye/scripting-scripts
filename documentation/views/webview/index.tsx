import { ScrollView, VStack } from "scripting"
import { WebViewControllerExample } from "./webview_controller"
import { PresentWebViewExample } from "./present_webview"
import { EmbedAWebViewExample } from "./embed_webview"

export function WebViewExample() {
  return <ScrollView
    frame={{
      maxHeight: "infinity"
    }}
  >
    <VStack>
      <WebViewControllerExample />
      <PresentWebViewExample />
      <EmbedAWebViewExample />
    </VStack>
  </ScrollView>
}