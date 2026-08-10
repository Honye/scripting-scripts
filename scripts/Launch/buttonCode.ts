import { fetch, Notification, Path, Script, Widget } from 'scripting'
import { AppItem, BUTTONS_PATH, getButtonCodePath } from './constants'

/**
 * A "button" app item runs plain JavaScript authored by the user. The code
 * lives in Launch's own App Group folder (`BUTTONS_PATH`), keyed by item id, so
 * both the main app and the widget extension can read and run it without
 * involving the Scripting script library.
 */

export const DEFAULT_BUTTON_CODE = `// Write your button logic here. Top-level await is supported.
//
// Injected: fetch, Path, Script, Widget, Notification, context
// Globals:  FileManager, Dialog, Safari, Clipboard, Pasteboard, Photos,
//           Device, Storage, ... (everything available to a normal script)
//
// context = { item, env } — env is "index" when run from the app,
// "app_intents" when run from a widget tap. There is no UI host in the widget
// extension, so prefer Notification or side effects over Dialog there.

await Notification.schedule({
  title: 'Hello Scripting!'
})
`

export type ButtonContext = {
  item?: AppItem
  env: typeof Script.env
}

export function readButtonCode(id: string) {
  const path = getButtonCodePath(id)
  if (!FileManager.existsSync(path)) return DEFAULT_BUTTON_CODE
  try {
    return FileManager.readAsStringSync(path)
  } catch (e) {
    console.error(e)
    return DEFAULT_BUTTON_CODE
  }
}

export function saveButtonCode(id: string, code: string) {
  if (!FileManager.existsSync(BUTTONS_PATH)) {
    FileManager.createDirectorySync(BUTTONS_PATH, true)
  }
  FileManager.writeAsStringSync(getButtonCodePath(id), code)
}

/** Removes code files whose owning app item no longer exists. */
export function pruneButtonCode(keepIds: string[]) {
  if (!FileManager.existsSync(BUTTONS_PATH)) return
  try {
    const keep = new Set(keepIds)
    for (const file of FileManager.readDirectorySync(BUTTONS_PATH)) {
      if (!file.endsWith('.js')) continue
      if (keep.has(file.slice(0, -3))) continue
      FileManager.removeSync(Path.join(BUTTONS_PATH, file))
    }
  } catch (e) {
    console.error(e)
  }
}

/**
 * Runs the code inside an async arrow, so the user can use top-level `await`.
 * The body is evaluated in the global scope, which makes the ambient globals
 * (FileManager, Dialog, Safari, ...) directly reachable; the handful of APIs
 * that normally come from `import ... from 'scripting'` are injected as named
 * parameters instead.
 *
 * The `async` wrapper has to live inside this source string rather than in a
 * real `async function` literal here: Scripting transpiles this file, and a
 * downlevelled literal would make `Object.getPrototypeOf(async function(){})
 * .constructor` resolve to plain `Function`, whose body cannot contain `await`.
 * Text handed to `Function` is parsed by the engine as-is, so `async` survives.
 */
export async function runButtonCode(code: string, context: ButtonContext) {
  let fn: (...args: any[]) => any
  try {
    fn = new Function(
      'fetch',
      'Path',
      'Script',
      'Widget',
      'Notification',
      'context',
      `return (async () => {\n${code}\n})()`
    ) as any
  } catch (e) {
    // Either a syntax error in the user's code, or a runtime that forbids
    // building functions from source. Both are worth surfacing verbatim.
    throw new Error(`Failed to compile button code: ${e}`)
  }

  await fn(fetch, Path, Script, Widget, Notification, context)
}

export async function runButtonById(id: string, context: ButtonContext) {
  await runButtonCode(readButtonCode(id), context)
}
