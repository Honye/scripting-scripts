import { Navigation, Script } from "scripting";
import KeyboardView from "./components/KeyboardView";

async function main() {
  Navigation.present({
    element: <KeyboardView />
  }).finally(() => Script.exit())
}

main()
