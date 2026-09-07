import { en } from './strings/en'
import { zh } from './strings/zh'

export const i18n = (() => {
  const locale = Device.systemLocale
  return locale.startsWith('zh') ? zh : en
})()
