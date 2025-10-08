import { useState } from "scripting"
import { FontConfig } from "../types"

export function useFontConfig() {
  const [config, setConfig] = useState(Storage.get<FontConfig>("config"))

  function setFont(name: string) {
    const next = { ...config, font: name }
    setConfig(next)
    Storage.set("config", next)
  }

  return { config, setFont }
}
