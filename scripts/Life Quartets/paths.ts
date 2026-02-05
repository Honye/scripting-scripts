import { Path } from 'scripting'
import { Script } from 'scripting'

export const root = Path.join(
  FileManager.appGroupDocumentsDirectory,
  Script.name
)

export const dirImages = Path.join(root, 'images')
