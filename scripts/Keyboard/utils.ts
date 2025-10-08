import { Alphabet } from './constansts/symbols'

export function getChars(text: string, font: string) {
  if (font === "Standard") {
    return text
  }

  return text
    .split('')
    .map((char) => {
      const map: any = Alphabet[font as keyof typeof Alphabet]
      return map[char] || map[char.toUpperCase()] || char
    })
    .join('')
}
