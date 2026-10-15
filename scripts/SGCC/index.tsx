import { Navigation, Script } from 'scripting'
import { Settings } from './views/Settings'

async function main() {
  await Navigation.present({ element: <Settings /> })
  Script.exit()
}

main()
