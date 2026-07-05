import { Navigation, Script } from 'scripting'
import { App } from './views/App'

Navigation.present({ element: <App /> })
  .catch((err) => console.error(err))
  .finally(() => Script.exit())
