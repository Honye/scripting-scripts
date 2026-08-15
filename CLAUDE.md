# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A monorepo of scripts for **Scripting** (https://scripting.fun/), an iOS app that
renders React-like **TSX** to native **SwiftUI**. Each top-level folder under
`scripts/` is one independent, publishable Scripting project. There is no bundler
or build step in the usual sense — code is written in TS/TSX and executed by the
Scripting app's runtime on device.

## Commands

```bash
pnpm install          # install deps (scripting-cli); pnpm is the package manager
pnpm start            # `scripting-cli start --no-auto-open` — starts the local
                      # dev server the Scripting app connects to over the network
```

There is **no test suite** and **no lint command** (`pnpm test` is a stub that
fails). Type-checking happens against the bundled `.d.ts` files via `tsconfig.json`.

To develop: run `pnpm start`, then in the Scripting app open the project and connect
to the dev server. Editing files locally hot-reloads in the app.

## Architecture

### The `scripting` module is virtual

Everything is imported from `'scripting'` (e.g. `import { VStack, Text, Widget } from 'scripting'`).
This module does not exist on disk as runtime code — it is provided by the host app.
Its types live in `dts/scripting.d.ts` (UI components, hooks like `useState`/`useEffect`,
and types), mapped via the `paths` entry in `tsconfig.json`. Ambient global APIs
(`console`, `Storage`, `Device`, `Widget`, `Navigation`, `Script`, `FileManager`,
`Crypto`, `Location`, `Mail`, `Shell`, `Python`, etc. — see the `namespace` declarations)
live in `dts/global.d.ts`. **Treat the `dts/` files as the source of truth for the API**;
do not import from relative paths to reach platform features. The `dts/lib.*.d.ts` files
are just the standard TS lib definitions.

UI is SwiftUI-inspired: `VStack`/`HStack`/`ZStack`, `List`/`Section`, `NavigationStack`,
`Text`, `Button`, `Picker`, `Grid`, etc. JSX is configured with `createElement`/`Fragment`
factories (`tsconfig.json`), not React.

### Per-project structure (`scripts/<Project>/`)

- `script.json` — required manifest: `name`, `version`, `icon` (SF Symbol), `color`,
  `author`, `localizedNames`/`localizedDescriptions`, `entry`, `intentInputTypes`,
  `runInApp`. Defines how the app lists and runs the project.
- Entry files are matched **by filename convention**, each a distinct runtime surface:
  - `index.tsx` — the main app UI. Pattern: `Navigation.present({ element: <App/> })`
    then `Script.exit()` in an async `main()`.
  - `widget.tsx` — Home Screen widget. Pattern: build the view, then `Widget.present(view)`.
  - `intent.tsx` — Share Sheet / shortcut handler; reads `Intent.*Parameter` inputs.
  - `app_intents.tsx` — interactive widget actions via `AppIntentManager.register({...})`
    with an `AppIntentProtocol`; these are invoked from widget buttons.
  - `control_widget_button.tsx`, `keyboard.tsx` — Control Center widgets and custom
    keyboards respectively (see `documentation/control_widget`, `documentation/custom_keyboard`).
- Larger projects organize the rest into `components/`, `views/`, `hooks/`, `store.ts`,
  `theme.ts`, `i18n.ts`, `types.ts`, `api.ts` — plain modules, no framework enforced.

### Cross-surface state

Widgets, app intents, and the main app are **separate executions** that share state
through the global `Storage` API (and `Storage.set`/`get`/`remove`). After mutating
state that a widget reads, call `Widget.reloadAll()` (or `Widget.preview()`) to refresh.

## Conventions

- Formatting (`.prettierrc` / `.editorconfig`): **no semicolons**, **single quotes**
  (double quotes in JSX attributes), 2-space indent, no trailing commas, LF, final newline.
- `.vscode/settings.json` enforces semicolon removal and `braces` JSX attribute completion.
- Reference docs for every API live in `documentation/<feature>/` as `en.md`/`zh.md`.
  Consult these (not external memory) when using an unfamiliar Scripting API.
