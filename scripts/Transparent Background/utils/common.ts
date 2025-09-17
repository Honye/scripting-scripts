import { Path, Script } from "scripting"

const root = Script.directory

export const lightDir = Path.join(root, './wallpapers/light')

export const darkDir = Path.join(root, './wallpapers/dark')

export async function callAsyncFn<T>(promise: Promise<T>) {
  return await promise.catch((e) => {
    console.error(e)
    throw e
  })
}

