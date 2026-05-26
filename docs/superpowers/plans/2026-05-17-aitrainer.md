# AITrainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `第5部分_人工智能训练师_3级_理论知识模拟试卷_交互版.html` 的 190 道题做成一款 Scripting iOS 应用，支持判断/单选/多选/错题本四个 Tab、实时判分、错题连对两次移除、退出保留进度。

**Architecture:** TabView × 4 共用同一个 `PracticeView`（接 `mode` prop），每个 Tab 维护独立的 `ModeProgress`（`{ index, answered }`），全局共享一个 `wrongBook: WrongEntry[]`。所有状态通过 `Storage.get/set` 持久化。判分逻辑：单选/判断点选立即判，多选需「提交」按钮。

**Tech Stack:** Scripting 框架 (TypeScript + TSX，`createElement`/`Fragment` JSX 工厂)、`Storage` API、`VStack`/`HStack`/`TabView`/`NavigationStack`/`ScrollView`/`Button`/`Text`/`Image`/`Menu` 组件。

**约定：**
- 项目无单元测试框架（`package.json` 中 `test` 是占位）。"验证步骤" 一律使用 `pnpm exec tsc --noEmit -p tsconfig.json` 进行类型检查 + 代码 review。
- 提交粒度：每个 Task 一个提交。提交不要带 `Co-Authored-By` 行（沿用仓库现有 commit 风格，看 `git log --oneline -5`）。
- 沿用现有目录风格 (Epical/Calendar)：每个 view 独立文件，常量集中在 `theme.ts` / `i18n.ts`。

**参考资料：** 设计规范 `docs/superpowers/specs/2026-05-17-aitrainer-design.md`。题目源数据已抽取到 `/tmp/aitrainer_questions.json`（190 条）。

---

## Task 1: 基础类型与元数据

**Files:**
- Modify: `scripts/AITrainer/script.json`
- Create: `scripts/AITrainer/types.ts`
- Create: `scripts/AITrainer/theme.ts`
- Create: `scripts/AITrainer/i18n.ts`

- [ ] **Step 1: 更新 `script.json` 名称与描述**

修改 `scripts/AITrainer/script.json`，把 `localizedNames` 和 `localizedDescriptions` 的 `zh` 与 `en` 字段填上：

```json
{
  "localizedNames" : {
    "en" : "AI Trainer Exam",
    "it" : "",
    "zh" : "AI训练师题库",
    "pt" : "",
    "de" : "",
    "es" : "",
    "ja" : "",
    "fr" : "",
    "ru" : ""
  },
  "localizedDescriptions" : {
    "en" : "Practice questions for the Level-3 AI Trainer exam.",
    "it" : "",
    "zh" : "人工智能训练师三级理论知识模拟试卷练习。",
    "pt" : "",
    "de" : "",
    "es" : "",
    "ja" : "",
    "fr" : "",
    "ru" : ""
  },
  ...
}
```

其余字段（`icon`、`version`、`name`、`color`、`entry`、`author` 等）保持不变。

- [ ] **Step 2: 创建 `scripts/AITrainer/types.ts`**

```ts
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
```

- [ ] **Step 3: 创建 `scripts/AITrainer/theme.ts`**

```ts
import type { Color } from 'scripting'

export const theme = {
  bg: '#f7f7f4' as Color,
  panel: '#ffffff' as Color,
  ink: '#202522' as Color,
  muted: '#66706a' as Color,
  line: '#dadfd8' as Color,
  accent: '#14746f' as Color,
  accentSoft: '#e4f3f1' as Color,
  ok: '#18794e' as Color,
  okSoft: '#e6f4ec' as Color,
  bad: '#b42318' as Color,
  badSoft: '#fde9e7' as Color,
  warn: '#9a6700' as Color,
} as const
```

- [ ] **Step 4: 创建 `scripts/AITrainer/i18n.ts`**

```ts
import type { Mode } from './types'

export const i18n = {
  appTitle: 'AI 训练师题库',
  tabs: {
    tf: '判断题',
    single: '单选题',
    multi: '多选题',
    wrong: '错题本',
  } as Record<Mode, string>,
  stat: {
    answered: '已答',
    accuracy: '正确率',
    total: '共',
    of: '/',
    none: '—',
  },
  actions: {
    submit: '提交',
    next: '下一题',
    finish: '完成',
    redo: '重做本类',
    restart: '重新开始',
  },
  feedback: {
    correct: '回答正确',
    wrong: '回答错误',
    correctAnswer: '正确答案：',
  },
  empty: {
    wrongBook: '暂无错题，继续加油',
  },
  finish: {
    title: (modeLabel: string) => `已完成「${modeLabel}」`,
    summary: (correct: number, total: number, acc: string) =>
      `共 ${total} 题，答对 ${correct} 题，正确率 ${acc}`,
  },
} as const
```

- [ ] **Step 5: 类型检查**

Run: `cd /Users/jun/work/scripting-scripts && pnpm exec tsc --noEmit -p tsconfig.json`
Expected: 退出码 0，无错误输出（已存在的其它脚本若有 warning 也可忽略，但必须没有来自 `scripts/AITrainer/` 的错误）。

- [ ] **Step 6: 提交**

```bash
git add scripts/AITrainer/script.json scripts/AITrainer/types.ts scripts/AITrainer/theme.ts scripts/AITrainer/i18n.ts
git commit -m "AITrainer: scaffold types, theme, i18n"
```

---

## Task 2: 题库数据 `data.ts`

**Files:**
- Create: `scripts/AITrainer/data.ts`

题源已经预处理为 JSON 数组放在 `/tmp/aitrainer_questions.json`（190 条，约 85 KB）。本任务把它包装成 TS 模块。

- [ ] **Step 1: 生成 `data.ts`**

在 shell 中执行以下命令（一条命令完成生成）：

```bash
{
  echo "import type { Question } from './types'"
  echo ""
  echo "export const QUESTIONS: Question[] = "
  cat /tmp/aitrainer_questions.json
  echo ""
} > /Users/jun/work/scripting-scripts/scripts/AITrainer/data.ts
```

如果 `/tmp/aitrainer_questions.json` 不存在，先重新生成：

```bash
python3 << 'PYEOF'
import json, re
with open('/Users/jun/Downloads/4-04-05-05_3_20250701/第5部分_人工智能训练师_3级_理论知识模拟试卷_交互版.html') as f:
    html = f.read()
m = re.search(r'<script id="exam-data" type="application/json">(.*?)</script>', html, re.S)
data = json.loads(m.group(1))
with open('/tmp/aitrainer_questions.json', 'w') as f:
    json.dump(data['questions'], f, ensure_ascii=False, indent=2)
PYEOF
```

- [ ] **Step 2: 添加按类型筛选的便捷导出**

在 `data.ts` 末尾追加：

```ts

import type { QType } from './types'

export function getQuestionsByType(type: QType): Question[] {
  return QUESTIONS.filter((q) => q.type === type)
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id)
}
```

注意：`import type { Question }` 已在文件顶部，第二个 `import type` 单独写一行没问题。

- [ ] **Step 3: 验证条数**

Run:
```bash
node -e "const m = require('/Users/jun/work/scripting-scripts/scripts/AITrainer/data.ts'.replace(/\.ts$/, ''))" 2>&1 || true
# 用 grep 验证条数
grep -c '"id":' /Users/jun/work/scripting-scripts/scripts/AITrainer/data.ts
```
Expected: `190`

按类型计数：
```bash
grep -c '"type": "tf"' /Users/jun/work/scripting-scripts/scripts/AITrainer/data.ts
grep -c '"type": "single"' /Users/jun/work/scripting-scripts/scripts/AITrainer/data.ts
grep -c '"type": "multi"' /Users/jun/work/scripting-scripts/scripts/AITrainer/data.ts
```
Expected: `40` / `140` / `10`

- [ ] **Step 4: 类型检查**

Run: `cd /Users/jun/work/scripting-scripts && pnpm exec tsc --noEmit -p tsconfig.json`
Expected: 退出码 0。

- [ ] **Step 5: 提交**

```bash
git add scripts/AITrainer/data.ts
git commit -m "AITrainer: add 190 questions data module"
```

---

## Task 3: 持久化层 `store.ts`

**Files:**
- Create: `scripts/AITrainer/store.ts`

封装所有 `Storage.get/set` 调用与错题本的 streak 逻辑。

- [ ] **Step 1: 创建 `store.ts` 骨架**

```ts
import type { Mode, ModeProgress, WrongEntry, AnswerRecord } from './types'

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
```

- [ ] **Step 2: 添加错题本变更纯函数**

在 `store.ts` 追加：

```ts
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
```

- [ ] **Step 3: 添加 answered 工具**

在 `store.ts` 追加：

```ts
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
```

- [ ] **Step 4: 类型检查**

Run: `cd /Users/jun/work/scripting-scripts && pnpm exec tsc --noEmit -p tsconfig.json`
Expected: 退出码 0。

- [ ] **Step 5: 提交**

```bash
git add scripts/AITrainer/store.ts
git commit -m "AITrainer: add progress and wrong-book store"
```

---

## Task 4: 题目卡片 `views/QuestionCard.tsx`

**Files:**
- Create: `scripts/AITrainer/views/QuestionCard.tsx`

纯展示组件：根据 props 渲染题目、选项、判定状态。所有状态由父组件传入。

- [ ] **Step 1: 创建 `views/QuestionCard.tsx`**

```tsx
import { Button, HStack, Text, VStack } from 'scripting'
import type { Color } from 'scripting'
import type { AnswerRecord, Question } from '../types'
import { theme } from '../theme'
import { i18n } from '../i18n'

type Props = {
  question: Question
  picked: string[]
  answered?: AnswerRecord
  onTogglePick: (key: string) => void
}

export function QuestionCard({ question, picked, answered, onTogglePick }: Props) {
  const revealed = answered != null
  const correctSet = new Set(question.answer)
  const pickedSet = new Set(revealed ? answered!.picked : picked)

  const typeLabel = i18n.tabs[question.type]

  return (
    <VStack
      alignment="leading"
      spacing={12}
      padding={16}
      background={theme.panel}
      cornerRadius={12}
      frame={{ maxWidth: 'infinity' }}
    >
      <HStack spacing={8}>
        <Text
          font={12}
          fontWeight="bold"
          foregroundStyle={theme.accent}
          padding={{ horizontal: 8, vertical: 2 }}
          background={theme.accentSoft}
          cornerRadius={6}
        >
          {typeLabel}
        </Text>
        <Text font={12} foregroundStyle={theme.muted}>
          {`第 ${question.number} 题 · ${question.points} 分`}
        </Text>
      </HStack>

      <Text font={16} fontWeight="medium" foregroundStyle={theme.ink}>
        {question.prompt}
      </Text>

      <VStack alignment="leading" spacing={8} frame={{ maxWidth: 'infinity' }}>
        {question.options.map((opt) => {
          const isPicked = pickedSet.has(opt.key)
          const isCorrect = correctSet.has(opt.key)

          let bg: Color = theme.panel
          let fg: Color = theme.ink
          let border: Color = theme.line

          if (revealed) {
            if (isCorrect) {
              bg = theme.okSoft
              fg = theme.ok
              border = theme.ok
            } else if (isPicked) {
              bg = theme.badSoft
              fg = theme.bad
              border = theme.bad
            }
          } else if (isPicked) {
            border = theme.accent
            bg = theme.accentSoft
            fg = theme.accent
          }

          return (
            <Button
              key={opt.key}
              action={() => {
                if (revealed) return
                onTogglePick(opt.key)
              }}
              buttonStyle="plain"
            >
              <HStack
                spacing={10}
                padding={{ horizontal: 12, vertical: 10 }}
                frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                background={bg}
                cornerRadius={8}
                overlay={{
                  content: (
                    <VStack
                      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
                      cornerRadius={8}
                      stroke={{ shapeStyle: border, lineWidth: 1 }}
                    />
                  ),
                }}
              >
                <Text font={14} fontWeight="bold" foregroundStyle={fg}>
                  {opt.key}
                </Text>
                <Text
                  font={14}
                  foregroundStyle={fg}
                  frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                >
                  {opt.text}
                </Text>
              </HStack>
            </Button>
          )
        })}
      </VStack>

      {revealed && (
        <VStack alignment="leading" spacing={4}>
          <Text
            font={13}
            fontWeight="bold"
            foregroundStyle={answered!.correct ? theme.ok : theme.bad}
          >
            {answered!.correct ? i18n.feedback.correct : i18n.feedback.wrong}
          </Text>
          {!answered!.correct && (
            <Text font={13} foregroundStyle={theme.muted}>
              {i18n.feedback.correctAnswer + question.answer.join('、')}
            </Text>
          )}
        </VStack>
      )}
    </VStack>
  )
}
```

注意 `stroke` 与 `overlay` 的写法参考自 `scripts/Epical/components.tsx` 已有的卡片样式；如果当前 Scripting 版本不支持上面写法，把 `overlay` 改为更朴素的 `border`/`padding` 调整即可（这层只是视觉细节，不影响逻辑）。

- [ ] **Step 2: 类型检查**

Run: `cd /Users/jun/work/scripting-scripts && pnpm exec tsc --noEmit -p tsconfig.json`
Expected: 退出码 0。如果出现 `overlay` 不可用的报错，把 `overlay={{...}}` 整个删掉（保留 `cornerRadius` + 颜色区分已足够），重新跑类型检查。

- [ ] **Step 3: 提交**

```bash
git add scripts/AITrainer/views/QuestionCard.tsx
git commit -m "AITrainer: add QuestionCard view"
```

---

## Task 5: 做题主界面 `views/PracticeView.tsx`

**Files:**
- Create: `scripts/AITrainer/views/PracticeView.tsx`

容纳一个 Tab 的全部状态：进度、选中态、判分触发、统计、错题本联动、完成态、重做。

- [ ] **Step 1: 创建 `views/PracticeView.tsx` 骨架与 hook**

```tsx
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
import { QUESTIONS, getQuestionById, getQuestionsByType } from '../data'
import {
  addWrongIfMissing,
  applyWrongAnswer,
  clearAnswer,
  loadProgress,
  loadWrongBook,
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

export function PracticeView({ mode, wrongBook, setWrongBook }: Props) {
  const [progress, setProgress] = useState<ModeProgress>(() => loadProgress(mode))
  const [picked, setPicked] = useState<string[]>([])
  // 错题本模式下，若当前题答对后达成「连对 2 次」需移除，先暂存到这里，
  // 等用户点「下一题」时再做实际的移除 + 清理 answered，避免 questions 数组
  // 立刻 shift 导致 currentQuestion 在用户还没移动到下一题前就变了。
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

  // 持久化进度
  useEffect(() => {
    saveProgress(mode, progress)
  }, [mode, progress])

  // 题目切换时重置选中态
  useEffect(() => {
    setPicked([])
  }, [progress.index, mode])

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
    setProgress(resetProgress())
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
    setProgress(recordAnswer(progress, currentQuestion.id, record))
    setPicked(pickedKeys)

    if (mode === 'wrong') {
      const entry = wrongBook.find((e) => e.id === currentQuestion.id)
      if (!entry) return
      if (!correct) {
        // 立即把 streak 重置为 0（不影响 questions 顺序，所以不会触发 shift 问题）
        const { book } = applyWrongAnswer(wrongBook, currentQuestion.id, false)
        setWrongBook(book)
        return
      }
      // 答对：判断是否到达移除阈值
      if (entry.streak + 1 >= 2) {
        // 延后到 handleNext 里再移除，避免现在就 shift
        setPendingRemoveId(currentQuestion.id)
      } else {
        const { book } = applyWrongAnswer(wrongBook, currentQuestion.id, true)
        setWrongBook(book)
      }
    } else if (!correct) {
      setWrongBook(addWrongIfMissing(wrongBook, currentQuestion.id))
    }
  }

  const handleNext = () => {
    if (mode === 'wrong' && pendingRemoveId) {
      const id = pendingRemoveId
      // 移除错题本里的这题
      setWrongBook(wrongBook.filter((e) => e.id !== id))
      // 清理它的 answered 历史，并保持 index 不变（后面的题会前移到当前 index）
      setProgress(clearAnswer(progress, id))
      setPendingRemoveId(null)
      return
    }
    setProgress((p) => setIndex(p, p.index + 1))
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
            actions={[
              <Button key="redo" action={handleRedo}>
                <Text>{i18n.actions.redo}</Text>
              </Button>,
            ]}
          />
        ),
      }}
    >
      <StatBar
        answered={answeredCount}
        total={total}
        accuracy={accuracy}
      />
      <ScrollView>
        <VStack
          spacing={12}
          padding={{ horizontal: 16, top: 12, bottom: 24 }}
          frame={{ maxWidth: 'infinity' }}
        >
          {renderBody({
            mode,
            total,
            atEnd,
            currentQuestion,
            currentAnswered,
            picked,
            onTogglePick: handleTogglePick,
            onSubmit: () => submit(picked),
            onNext: handleNext,
            onRedo: handleRedo,
            correctCount,
            answeredCount,
          })}
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
```

- [ ] **Step 2: 添加 `StatBar` 与 `renderBody` 辅助**

把以下追加到 `views/PracticeView.tsx` 末尾：

```tsx
type StatProps = {
  answered: number
  total: number
  accuracy: string
}

function StatBar({ answered, total, accuracy }: StatProps) {
  return (
    <HStack
      spacing={12}
      padding={{ horizontal: 16, vertical: 10 }}
      background={theme.panel}
      frame={{ maxWidth: 'infinity' }}
    >
      <Text font={13} foregroundStyle={theme.muted}>
        {`${i18n.stat.answered} ${answered} ${i18n.stat.of} ${total}`}
      </Text>
      <Spacer />
      <Text font={13} fontWeight="bold" foregroundStyle={theme.accent}>
        {`${i18n.stat.accuracy} ${accuracy}`}
      </Text>
    </HStack>
  )
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

function renderBody(args: BodyArgs) {
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
  } = args

  if (mode === 'wrong' && total === 0) {
    return (
      <VStack
        spacing={8}
        padding={32}
        frame={{ maxWidth: 'infinity', minHeight: 200 }}
      >
        <Image systemName="checkmark.seal.fill" foregroundStyle={theme.accent} />
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
          <Button action={onSubmit} disabled={!canSubmit}>
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
```

- [ ] **Step 3: 类型检查**

Run: `cd /Users/jun/work/scripting-scripts && pnpm exec tsc --noEmit -p tsconfig.json`
Expected: 退出码 0。

如果出现 `Menu` 的 props 不匹配错误，参考 `scripts/Epical/` 现有 Menu 用法做调整（或简化为不使用 Menu，直接放一个 `Button` 在 `topBarTrailing`，点击就直接 `handleRedo`）。

如果出现 `disabled` 不在 `Button` props 上：去掉 `disabled={!canSubmit}`，逻辑里用 `if (!canSubmit) return` 守卫即可。

如果出现 `Image foregroundStyle` 错误，删掉 `foregroundStyle={theme.accent}` 那一项。

- [ ] **Step 4: 提交**

```bash
git add scripts/AITrainer/views/PracticeView.tsx
git commit -m "AITrainer: add PracticeView with stats and quiz flow"
```

---

## Task 6: 应用入口 `index.tsx`

**Files:**
- Modify: `scripts/AITrainer/index.tsx`

把 4 个 Tab 装配起来。`wrongBook` 状态提升到根，便于跨 Tab 联动。

- [ ] **Step 1: 写入 `index.tsx`**

```tsx
import {
  Navigation,
  NavigationStack,
  Script,
  Tab,
  TabView,
  VStack,
  useEffect,
  useState,
} from 'scripting'
import type { Mode, WrongEntry } from './types'
import { loadWrongBook, saveWrongBook } from './store'
import { theme } from './theme'
import { i18n } from './i18n'
import { PracticeView } from './views/PracticeView'

const TABS: { mode: Mode; systemImage: string }[] = [
  { mode: 'tf', systemImage: 'checkmark.circle' },
  { mode: 'single', systemImage: 'list.bullet' },
  { mode: 'multi', systemImage: 'square.stack' },
  { mode: 'wrong', systemImage: 'bookmark.fill' },
]

function App() {
  const [wrongBook, setWrongBook] = useState<WrongEntry[]>(() => loadWrongBook())

  useEffect(() => {
    saveWrongBook(wrongBook)
  }, [wrongBook])

  return (
    <VStack
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      background={theme.bg}
      tint={theme.accent}
    >
      <TabView>
        {TABS.map(({ mode, systemImage }) => (
          <Tab key={mode} title={i18n.tabs[mode]} systemImage={systemImage}>
            <NavigationStack>
              <PracticeView
                mode={mode}
                wrongBook={wrongBook}
                setWrongBook={setWrongBook}
              />
            </NavigationStack>
          </Tab>
        ))}
      </TabView>
    </VStack>
  )
}

async function main() {
  await Navigation.present({ element: <App /> })
  Script.exit()
}

main()
```

- [ ] **Step 2: 类型检查**

Run: `cd /Users/jun/work/scripting-scripts && pnpm exec tsc --noEmit -p tsconfig.json`
Expected: 退出码 0。

如果 `Tab` 的 children 在 map 中报 key 警告，没关系（TS 不会抓 React key warning）。如果 `TabView` 不接受数组 children，把 4 个 `<Tab>` 展开手写出来（牺牲一点 DRY 换通过编译）。

- [ ] **Step 3: 提交**

```bash
git add scripts/AITrainer/index.tsx
git commit -m "AITrainer: wire up TabView entry"
```

---

## Task 7: 端到端验收

**Files:**
- 无新增；本任务是手动验证 + 修复 + 最终提交。

由于 Scripting 应用必须在 iOS 上运行，本任务的验证步骤是设备上的手动验收。执行者需把脚本同步到 Scripting App 并按以下清单逐项打钩。

- [ ] **Step 1: 同步并启动**

按仓库 README 指引，使用 `pnpm start`（`scripting-cli`）把 `scripts/AITrainer/` 同步到 Scripting App，然后在 App 中打开 `AI训练师题库`。

- [ ] **Step 2: 验收 - 判断题 Tab**

操作 & 期望：
- 打开应用，默认在「判断题」Tab
- 顶部 stat 显示 `已答 0 / 40`、`正确率 —`
- 显示「第 1 题」题干和「√ 正确 / × 错误」两个选项
- 点击其中一个：立即变红/绿，正确答案标绿，下方显示「正确答案：…」或「回答正确」
- 出现「下一题」按钮，点击进入第 2 题
- 此时 stat 应更新为 `已答 1 / 40`、正确率 0% 或 100%

- [ ] **Step 3: 验收 - 单选题 Tab**

切到「单选题」Tab，期望行为同上（题量 140）。

- [ ] **Step 4: 验收 - 多选题 Tab**

- 切到「多选题」Tab
- 显示第 1 题及 A-E 选项
- 点击选项：仅切换选中态（加蓝边框），不立即判定
- 选 0 项时「提交」按钮禁用/置灰
- 选 ≥1 项后「提交」按钮可用
- 点击「提交」：判定（正确选项标绿、错选标红），出现「下一题」

- [ ] **Step 5: 验收 - 错题本**

- 在判断/单选/多选 Tab 故意答错若干题
- 切到「错题本」Tab，看到刚才答错的题按加入顺序排列
- 在错题本中答对一题：streak=1，「下一题」继续；再次回到该题答对：该题应从列表移除并自动前移
- 在错题本中答错：streak 重置，下次仍需连对 2 次
- 把错题本做空后，回到错题本 Tab 应显示「暂无错题，继续加油」

- [ ] **Step 6: 验收 - 持久化**

- 任意 Tab 答到中间，关掉 Scripting App，重新打开脚本
- 各 Tab 都应回到上次的位置，已答的题保留判定结果
- 错题本列表保留

- [ ] **Step 7: 验收 - 重做**

- 在某 Tab 右上角菜单点「重做本类」
- 进度归零（stat 重置为 0），从第 1 题开始
- 错题本不受影响

- [ ] **Step 8: 验收 - 完成态**

- 在判断题 Tab 一路下一题到 40 题做完
- 应显示完成视图：「已完成『判断题』」+ 统计 + 「重新开始」按钮
- 点击「重新开始」回到第 1 题

- [ ] **Step 9: 修复发现的问题**

如果以上任何一项不通过：
1. 在本仓库中定位相应文件
2. 修复（最小改动）
3. 每修复一个独立问题做一次提交：`git commit -m "AITrainer: fix <something>"`
4. 重新跑相关验收步骤

- [ ] **Step 10: 终态确认**

Run:
```bash
cd /Users/jun/work/scripting-scripts && pnpm exec tsc --noEmit -p tsconfig.json
git status
git log --oneline -10
```

Expected:
- `tsc` 退出码 0
- `git status` 干净（除原本的 `.vscode/` 未跟踪文件）
- `git log` 看到 7-8 个 AITrainer 开头的提交

任务结束。
