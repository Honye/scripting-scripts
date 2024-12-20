import { ScrollView } from "scripting"
import { SFSymbolImageExample } from "./sfsymbol_image"
import { NetworkImageExample } from "./network_image"
import { ImageRendererExample } from "./image_renderer"
import { QRImageExample } from "./qr_image"


export function ImageExample() {
  return <ScrollView
    navigationTitle={"Image"}
    navigationBarTitleDisplayMode={"inline"}
  >
    <SFSymbolImageExample />
    <NetworkImageExample />
    <ImageRendererExample />
    <QRImageExample />
  </ScrollView>
}

