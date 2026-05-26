import type { Mode, ModeProgress, WrongEntry, AnswerRecord, QType } from './types'
import { getQuestionById } from './data'

const EXAM_MODES: QType[] = ['tf', 'single', 'multi']

const PROGRESS_KEY = (mode: Mode) => `aitrainer.progress.${mode}`
const WRONG_BOOK_KEY = 'aitrainer.wrongBook'

const emptyProgress = (): ModeProgress => ({ index: 0, answered: {} })

export function loadProgress(mode: Mode): ModeProgress {
  return Storage.get<ModeProgress>(PROGRESS_KEY(mode)) ?? emptyProgress()
}

export function saveProgress(mode: Mode, progress: ModeProgress): void {
  Storage.set(PROGRESS_KEY(mode), progress)
}

export function loadWrongBook(): WrongEntry[] {
  return Storage.get<WrongEntry[]>(WRONG_BOOK_KEY) ?? []
}

export function saveWrongBook(wrongBook: WrongEntry[]): void {
  Storage.set(WRONG_BOOK_KEY, wrongBook)
}

/** 把题加入错题本（若已存在则保持原 streak）。返回新数组。 */
export function addWrongIfMissing(book: WrongEntry[], id: string): WrongEntry[] {
  if (book.some((e) => e.id === id)) return book
  return [...book, { id, streak: 0 }]
}

/**
 * 仅在错题本 Tab 答题时调用：
 * - 答对：streak += 1；若达到 2 则从错题本移除
 * - 答错：streak = 0（保留在错题本）
 * 返回 { book, removed }。removed 表示该题是否被移除。
 */
export function applyWrongAnswer(
  book: WrongEntry[],
  id: string,
  correct: boolean
): { book: WrongEntry[]; removed: boolean } {
  const idx = book.findIndex((e) => e.id === id)
  if (idx < 0) return { book, removed: false }
  const entry = book[idx]
  if (!correct) {
    const next = book.slice()
    next[idx] = { ...entry, streak: 0 }
    return { book: next, removed: false }
  }
  const nextStreak = entry.streak + 1
  if (nextStreak >= 2) {
    const next = book.slice()
    next.splice(idx, 1)
    return { book: next, removed: true }
  }
  const next = book.slice()
  next[idx] = { ...entry, streak: nextStreak }
  return { book: next, removed: false }
}

export function recordAnswer(
  progress: ModeProgress,
  id: string,
  record: AnswerRecord
): ModeProgress {
  return {
    index: progress.index,
    answered: { ...progress.answered, [id]: record },
  }
}

export function clearAnswer(progress: ModeProgress, id: string): ModeProgress {
  if (!(id in progress.answered)) return progress
  const next = { ...progress.answered }
  delete next[id]
  return { index: progress.index, answered: next }
}

export function setIndex(progress: ModeProgress, index: number): ModeProgress {
  return { index, answered: progress.answered }
}

export function resetProgress(): ModeProgress {
  return emptyProgress()
}

/** 累加单个 ModeProgress 中已答对题目的得分。 */
export function scoreOf(progress: ModeProgress): number {
  let score = 0
  for (const id in progress.answered) {
    if (!progress.answered[id].correct) continue
    const q = getQuestionById(id)
    if (q) score += q.points
  }
  return score
}

/** 从 Storage 读取 tf+single+multi 三个 Tab 的累计得分（错题本不计入）。 */
export function loadExamScore(): number {
  let total = 0
  for (const mode of EXAM_MODES) {
    total += scoreOf(loadProgress(mode))
  }
  return total
}
