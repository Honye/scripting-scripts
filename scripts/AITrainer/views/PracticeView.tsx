import {
  Button,
  HStack,
  Image,
  Menu,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useEffect,
  useMemo,
  useState,
} from 'scripting'
import type { Mode, ModeProgress, Question, WrongEntry } from '../types'
import { getQuestionById, getQuestionsByType } from '../data'
import {
  addWrongIfMissing,
  applyWrongAnswer,
  clearAnswer,
  loadProgress,
  recordAnswer,
  resetProgress,
  saveProgress,
  saveWrongBook,
  setIndex,
} from '../store'
import { theme } from '../theme'
import { i18n } from '../i18n'
import { QuestionCard } from './QuestionCard'

type Props = {
  mode: Mode
  wrongBook: WrongEntry[]
  setWrongBook: (book: WrongEntry[]) => void
  examScore: number
  examMax: number
  onExamProgressChanged: () => void
}

function questionsForMode(mode: Mode, wrongBook: WrongEntry[]): Question[] {
  if (mode === 'wrong') {
    const out: Question[] = []
    for (const entry of wrongBook) {
      const q = getQuestionById(entry.id)
      if (q) out.push(q)
    }
    return out
  }
  return getQuestionsByType(mode)
}

export function PracticeView({
  mode,
  wrongBook,
  setWrongBook,
  examScore,
  examMax,
  onExamProgressChanged,
}: Props) {
  const [progress, setProgress] = useState<ModeProgress>(() => loadProgress(mode))
  const [picked, setPicked] = useState<string[]>([])
  // 错题本模式下，若当前题答对后达成「连对 2 次」需移除，先暂存到这里，
  // 等用户点「下一题」时再做实际的移除 + 清理 answered，避免 questions 数组
  // 立刻 shift 导致 currentQuestion 在用户还没移动到下一题前就变了。
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

  // 题目切换时重置选中态
  useEffect(() => {
    setPicked([])
  }, [progress.index, mode])

  // 进度变更后同步写入 Storage，并把局部状态也更新一遍。
  // 这里特地用同步写入而非 useEffect，避免某些情况下父组件重渲染
  // 引发 PracticeView 重新挂载时，useState 的 loadProgress 读到的是
  // useEffect 还没来得及写入的旧数据。
  const commitProgress = (next: ModeProgress) => {
    setProgress(next)
    saveProgress(mode, next)
    // 错题本 Tab 的答题不计入本轮模拟考试得分，无需通知 App 重算。
    if (mode !== 'wrong') onExamProgressChanged()
  }
  const commitWrongBook = (next: WrongEntry[]) => {
    setWrongBook(next)
    saveWrongBook(next)
  }

  const questions = useMemo(
    () => questionsForMode(mode, wrongBook),
    [mode, wrongBook]
  )

  const total = questions.length
  const answeredCount = Object.keys(progress.answered).length
  const correctCount = Object.values(progress.answered).filter((a) => a.correct).length
  const accuracy =
    answeredCount === 0
      ? i18n.stat.none
      : `${Math.round((correctCount / answeredCount) * 100)}%`

  const currentIndex = progress.index
  const atEnd = currentIndex >= total
  const currentQuestion = atEnd ? undefined : questions[currentIndex]
  const currentAnswered = currentQuestion
    ? progress.answered[currentQuestion.id]
    : undefined

  const handleRedo = () => {
    commitProgress(resetProgress())
    setPicked([])
    setPendingRemoveId(null)
  }

  const handleTogglePick = (key: string) => {
    if (!currentQuestion) return
    if (currentQuestion.type === 'multi') {
      setPicked((cur) =>
        cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]
      )
      return
    }
    // 单选/判断：立即判分
    submit([key])
  }

  const submit = (pickedKeys: string[]) => {
    if (!currentQuestion) return
    const correct = setsEqual(pickedKeys, currentQuestion.answer)
    const record = { picked: pickedKeys, correct }
    commitProgress(recordAnswer(progress, currentQuestion.id, record))
    setPicked(pickedKeys)

    if (mode === 'wrong') {
      const entry = wrongBook.find((e) => e.id === currentQuestion.id)
      if (!entry) return
      if (!correct) {
        // 立即把 streak 重置为 0（不影响 questions 顺序，所以不会触发 shift 问题）
        const { book } = applyWrongAnswer(wrongBook, currentQuestion.id, false)
        commitWrongBook(book)
        return
      }
      // 答对：判断是否到达移除阈值
      const { book, removed } = applyWrongAnswer(wrongBook, currentQuestion.id, true)
      if (removed) {
        // 延后到 handleNext 里再实际写入 wrongBook + 清理 answered，
        // 避免现在就 shift questions 数组
        setPendingRemoveId(currentQuestion.id)
      } else {
        commitWrongBook(book)
      }
    } else if (!correct) {
      commitWrongBook(addWrongIfMissing(wrongBook, currentQuestion.id))
    }
  }

  const handleNext = () => {
    if (mode === 'wrong' && pendingRemoveId) {
      const id = pendingRemoveId
      // 移除错题本里的这题
      commitWrongBook(wrongBook.filter((e) => e.id !== id))
      // 清理它的 answered 历史，并保持 index 不变（后面的题会前移到当前 index）
      commitProgress(clearAnswer(progress, id))
      setPendingRemoveId(null)
      return
    }
    commitProgress(setIndex(progress, progress.index + 1))
  }

  return (
    <VStack
      background={theme.bg}
      navigationTitle={i18n.tabs[mode]}
      toolbar={{
        topBarTrailing: (
          <Menu
            title=""
            systemImage="ellipsis.circle"
          >
            <Button key="redo" action={handleRedo}>
              <Text>{i18n.actions.redo}</Text>
            </Button>
          </Menu>
        ),
      }}
    >
      <StatBar
        answered={answeredCount}
        total={total}
        accuracy={accuracy}
        examScore={examScore}
        examMax={examMax}
      />
      <ScrollView>
        <VStack
          spacing={12}
          padding={{ horizontal: 16, top: 12, bottom: 24 }}
          frame={{ maxWidth: 'infinity' }}
        >
          <Body
            mode={mode}
            total={total}
            atEnd={atEnd}
            currentQuestion={currentQuestion}
            currentAnswered={currentAnswered}
            picked={picked}
            onTogglePick={handleTogglePick}
            onSubmit={() => submit(picked)}
            onNext={handleNext}
            onRedo={handleRedo}
            correctCount={correctCount}
            answeredCount={answeredCount}
          />
        </VStack>
      </ScrollView>
    </VStack>
  )
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sb = new Set(b)
  for (const x of a) if (!sb.has(x)) return false
  return true
}

type StatProps = {
  answered: number
  total: number
  accuracy: string
  examScore: number
  examMax: number
}

function StatBar({ answered, total, accuracy, examScore, examMax }: StatProps) {
  return (
    <VStack
      spacing={4}
      padding={{ horizontal: 16, vertical: 10 }}
      background={theme.panel}
      frame={{ maxWidth: 'infinity' }}
    >
      <HStack spacing={12} frame={{ maxWidth: 'infinity' }}>
        <Text font={13} foregroundStyle={theme.muted}>
          {`${i18n.stat.answered} ${answered} ${i18n.stat.of} ${total}`}
        </Text>
        <Spacer />
        <Text font={13} fontWeight="bold" foregroundStyle={theme.accent}>
          {`${i18n.stat.accuracy} ${accuracy}`}
        </Text>
      </HStack>
      <HStack frame={{ maxWidth: 'infinity' }}>
        <Text font={12} foregroundStyle={theme.muted}>
          {`${i18n.stat.examScore} ${formatScore(examScore)} / ${formatScore(examMax)}`}
        </Text>
        <Spacer />
      </HStack>
    </VStack>
  )
}

function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

type BodyArgs = {
  mode: Mode
  total: number
  atEnd: boolean
  currentQuestion?: Question
  currentAnswered?: { picked: string[]; correct: boolean }
  picked: string[]
  onTogglePick: (key: string) => void
  onSubmit: () => void
  onNext: () => void
  onRedo: () => void
  correctCount: number
  answeredCount: number
}

function Body(props: BodyArgs) {
  const {
    mode,
    total,
    atEnd,
    currentQuestion,
    currentAnswered,
    picked,
    onTogglePick,
    onSubmit,
    onNext,
    onRedo,
    correctCount,
    answeredCount,
  } = props

  if (mode === 'wrong' && total === 0) {
    return (
      <VStack
        spacing={8}
        padding={32}
        frame={{ maxWidth: 'infinity', minHeight: 200 }}
      >
        <Image systemName="checkmark.seal.fill" />
        <Text font={15} foregroundStyle={theme.muted}>
          {i18n.empty.wrongBook}
        </Text>
      </VStack>
    )
  }

  if (atEnd || !currentQuestion) {
    const acc =
      answeredCount === 0
        ? '—'
        : `${Math.round((correctCount / Math.max(answeredCount, 1)) * 100)}%`
    return (
      <VStack
        spacing={12}
        padding={24}
        background={theme.panel}
        cornerRadius={12}
        frame={{ maxWidth: 'infinity' }}
      >
        <Text font={18} fontWeight="bold" foregroundStyle={theme.ink}>
          {i18n.finish.title(i18n.tabs[mode])}
        </Text>
        <Text font={14} foregroundStyle={theme.muted}>
          {i18n.finish.summary(correctCount, Math.max(answeredCount, total), acc)}
        </Text>
        <Button action={onRedo}>
          <Text
            font={15}
            fontWeight="bold"
            foregroundStyle={theme.panel}
            padding={{ horizontal: 16, vertical: 10 }}
            background={theme.accent}
            cornerRadius={8}
          >
            {i18n.actions.restart}
          </Text>
        </Button>
      </VStack>
    )
  }

  const revealed = currentAnswered != null
  const isMulti = currentQuestion.type === 'multi'
  const canSubmit = isMulti && !revealed && picked.length > 0

  return (
    <VStack spacing={12} frame={{ maxWidth: 'infinity' }}>
      <QuestionCard
        question={currentQuestion}
        picked={picked}
        answered={currentAnswered}
        onTogglePick={onTogglePick}
      />
      <HStack frame={{ maxWidth: 'infinity' }}>
        <Spacer />
        {revealed ? (
          <Button action={onNext}>
            <Text
              font={15}
              fontWeight="bold"
              foregroundStyle={theme.panel}
              padding={{ horizontal: 20, vertical: 10 }}
              background={theme.accent}
              cornerRadius={8}
            >
              {i18n.actions.next}
            </Text>
          </Button>
        ) : isMulti ? (
          <Button action={() => { if (!canSubmit) return; onSubmit() }}>
            <Text
              font={15}
              fontWeight="bold"
              foregroundStyle={theme.panel}
              padding={{ horizontal: 20, vertical: 10 }}
              background={canSubmit ? theme.accent : theme.muted}
              cornerRadius={8}
            >
              {i18n.actions.submit}
            </Text>
          </Button>
        ) : null}
      </HStack>
    </VStack>
  )
}
