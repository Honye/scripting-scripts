import { Navigation, Script } from 'scripting'
import { App } from './views/App'

async function main() {
  await Navigation.present({ element: <App /> })
  Script.exit()
}

main()
