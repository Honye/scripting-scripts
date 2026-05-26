export type QType = 'tf' | 'single' | 'multi'

export type Mode = QType | 'wrong'

export type QuestionOption = {
  key: string
  text: string
}

export type Question = {
  id: string
  section: string
  number: number
  type: QType
  prompt: string
  options: QuestionOption[]
  answer: string[]
  points: number
}

export type AnswerRecord = {
  picked: string[]
  correct: boolean
}

export type ModeProgress = {
  index: number
  answered: Record<string, AnswerRecord>
}

export type WrongEntry = {
  id: string
  streak: number
}
