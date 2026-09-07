import { Intent, Navigation, Script } from 'scripting'
import { QuickAdd } from './views/QuickAdd'

/**
 * Share-sheet entry point. `script.json` registers `intentInputTypes: ["URLs"]`
 * — capital URLs; the lowercase spelling in spec FR-SHARE-01 is a typo and would
 * leave the script out of the share menu entirely.
 *
 * Text is read as a fallback because some sources hand a link over as plain
 * text rather than as a URL.
 */
async function main() {
  const shared = Intent.urlsParameter?.[0] ?? Intent.textsParameter?.[0] ?? null
  await Navigation.present({ element: <QuickAdd input={shared} /> })
  Script.exit()
}

main()
