import { AIKeyboardView } from "./components/AIKeyboardView"
import { getAdaptiveLayoutParams } from "./utils/adaptive"

/**
 * AI Keyboard for Scripting
 *
 * Converted from JSBox script.
 * Original author: @Neurogram
 */
async function main() {
  const adaptiveParams = getAdaptiveLayoutParams()
  await Promise.all([
    CustomKeyboard.setToolbarVisible(false),
    CustomKeyboard.requestHeight(adaptiveParams.totalHeight),
  ])

  CustomKeyboard.present(
    <AIKeyboardView />
  )
}

main()
