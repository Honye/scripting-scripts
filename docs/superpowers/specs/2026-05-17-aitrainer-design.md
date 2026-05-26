# AITrainer — 人工智能训练师三级模拟考试 App 设计

## 背景

`scripts/AITrainer/` 是一个 Scripting (iOS) 脚本应用，源题库来自 `第5部分_人工智能训练师_3级_理论知识模拟试卷_交互版.html`（190 题，3 个题型：40 判断、140 单选、10 多选）。

目标是把题库转化为一款支持「做题 + 实时判分 + 错题本 + 重做」的练习应用。

## 用户故事

- 作为考生，我打开 App 选择某个题型 Tab，立刻开始一次一题地练习。
- 单选/判断我一点选项就知道对错和正确答案；多选我要先选完再点提交。
- 顶部始终能看到我答了多少题、正确率多少。
- 答错的题自动进入「错题本」Tab，我可以专门回炉。
- 错题本里某道题连续答对 2 次后，自动移出错题本。
- 中途退出 App，重新进来能从离开的那题继续；做完一遍后能点「重做」清零。

## 数据结构

```ts
type QType = 'tf' | 'single' | 'multi'
type Mode = QType | 'wrong'

type Question = {
  id: string            // 'tf-1' / 'single-3' / 'multi-2'
  section: string       // '判断题' / '单选题' / '多选题'
  number: number
  type: QType
  prompt: string
  options: { key: string; text: string }[]
  answer: string[]      // 正确 key 列表
  points: number
}

type AnswerRecord = {
  picked: string[]
  correct: boolean
}

type ModeProgress = {
  index: number                              // 当前题序号 (0-based)
  answered: Record<string, AnswerRecord>     // questionId -> 用户答案
}

type WrongEntry = {
  id: string                                 // questionId
  streak: number                             // 错题本连续答对次数，0 或 1；达到 2 时移除
}
```

### Storage Keys

| Key | Value | 说明 |
|---|---|---|
| `aitrainer.progress.tf` | `ModeProgress` | 判断题进度 |
| `aitrainer.progress.single` | `ModeProgress` | 单选题进度 |
| `aitrainer.progress.multi` | `ModeProgress` | 多选题进度 |
| `aitrainer.progress.wrong` | `ModeProgress` | 错题本进度 |
| `aitrainer.wrongBook` | `WrongEntry[]` | 错题本，按加入顺序 |

## 文件结构

```
scripts/AITrainer/
├── index.tsx              # App + TabView 入口
├── script.json            # 元数据（更新 name/description/localizedNames）
├── types.ts               # 类型定义
├── data.ts                # QUESTIONS: Question[]（从 HTML 提取）
├── store.ts               # 进度 / 错题本读写
├── theme.ts               # 颜色常量
├── i18n.ts                # 中文字符串
└── views/
    ├── PracticeView.tsx   # 单 Tab 通用做题界面，接 mode prop
    └── QuestionCard.tsx   # 单题渲染 + 选项点击 + 判分反馈
```

## 视图

### `index.tsx`

```
App
└── TabView
    ├── Tab "判断题" (systemImage: checkmark.circle) → NavigationStack → PracticeView mode="tf"
    ├── Tab "单选题" (systemImage: list.bullet)        → NavigationStack → PracticeView mode="single"
    ├── Tab "多选题" (systemImage: square.stack)        → NavigationStack → PracticeView mode="multi"
    └── Tab "错题本"  (systemImage: bookmark.fill)      → NavigationStack → PracticeView mode="wrong"
```

### `PracticeView`

Props: `{ mode: Mode }`

布局：
- `navigationTitle`: 对应 Tab 名
- `toolbar` (右上): Menu「重做本类」按钮
- 顶部 stat bar (浅色背景卡片)：
  - `已答 X / 总数N`（N 普通题型固定；错题本 N = 当前 `wrongBook.length`，动态变化）
  - `正确率 Z%`（X=0 时显示 `—`）
  - 统计基于本 Tab 的 `progress.answered` 全部记录（不会因错题被移除而丢失统计）
- 主体：当前 `QuestionCard`
- 底部按钮区：
  - 未答 + 多选题：`提交`（禁用直到至少选 1 项）
  - 已答：`下一题`（最后一题文案改为 `已完成 · 重做`）

当错题本为空时（且 `progress.wrong.answered` 也为空），错题本 Tab 主体显示空状态文案：「暂无错题，继续加油」。
当错题本因移除导致 `index >= wrongBook.length` 时，自动进入完成态。

### `QuestionCard`

Props: `{ question, answered?: AnswerRecord, picked: string[], onPick(key), revealed: boolean }`

- 标题行：`[题型] 第 N 题 · X 分`
- 题干 (Text，可换行)
- 选项列表：每个选项是一个 `Button` 包裹的 `HStack`
  - 默认：浅边框白底
  - 未判定 + 多选已选中：蓝边框
  - 已判定 + 是正确答案：绿底白字
  - 已判定 + 用户选错的选项：红底白字
  - 已判定 + 其它选项：灰
- 已判定后下方显示 `正确答案：A、B`（仅当答错时）

## 交互逻辑

### 单选 / 判断 (`type === 'single' || type === 'tf'`)

1. 用户点选项 X
2. `picked = [X]`，立即调用 `submit(picked)`
3. 判分 → 写入 `progress.answered[qid] = { picked, correct }`
4. 若 `correct === false`：调用 `wrongBook.addIfMissing(qid)`
5. 卡片进入「已判定」态，「下一题」按钮显示

### 多选 (`type === 'multi'`)

1. 用户点选项切换 `picked` 数组（toggle）
2. 至少 1 项被选时「提交」按钮可用
3. 用户点「提交」→ 同上判分流程

### 判分

```ts
correct = setEq(picked, question.answer)  // 与正确答案集合完全相同
```

### 错题本累加

- **任何 Tab** 答错某题 → `addIfMissing(qid)`：若不在错题本则插入 `{ id, streak: 0 }`，已在则保持原 streak
- **仅错题本 Tab** 答题影响 streak：
  - 答对 → `streak += 1`；`streak >= 2` 时从 `wrongBook` 移除
  - 答错 → `streak = 0`
- **普通 Tab** 答对错题本里的题：**不**修改 streak（避免在熟悉的题型上下文「假记住」）

### 「重做本类」

- 普通题型：`progress[mode] = { index: 0, answered: {} }`
- 错题本：`progress.wrong = { index: 0, answered: {} }`（错题列表本身不清空）

### 「已完成」状态

- 当 `index >= 题目总数` 时显示完成视图：`恭喜完成 [Tab名]！正确率 Z%`，按钮「重做本类」
- 错题本完成时若列表为空，回到空状态视图

### 「下一题」

- `index += 1`，触发持久化
- 若已到末尾 → 进入完成态

## 题目顺序

- 普通 Tab：按 `data.ts` 中的原始顺序
- 错题本：按 `wrongBook` 数组顺序（加入早的先做）
- 错题本动态变化处理：
  - 答对且 streak 达到 2 → 当前题从 `wrongBook` 移除；同时清掉 `progress.wrong.answered[id]`（这样如果以后再次答错而重新加入，下次还是从 fresh 状态做）；`index` 保持不变（后面的题前移到当前位置）
  - 若同一题答错而本就已在错题本中，**不**重置 `progress.wrong.answered[id]`（保持上次答题历史），仅当 streak 重置为 0

## 持久化时机

每次 `progress`/`wrongBook` 变化都通过 `useEffect` 写入 Storage（参考 Epical 的 `useEffect(() => saveShows(shows), [shows])` 模式）。

## 主题

参考原 HTML：
- 背景 `#f7f7f4`
- 卡片 `#ffffff`
- 主色 `#14746f`（青绿）
- 正确 `#18794e`
- 错误 `#b42318`
- 文字 `#202522` / muted `#66706a`

## i18n

仅 zh-CN：
- 题型标签、按钮文案、空状态、统计标签等抽到 `i18n.ts` 单一对象，便于将来扩展。

## 验收清单

- [ ] 4 个 Tab 可切换，初次进入显示第 1 题
- [ ] 判断/单选点选项立即判分并显示正确项
- [ ] 多选必须点「提交」才判分
- [ ] 顶部正确率随答题实时刷新
- [ ] 答错的题进入错题本 Tab
- [ ] 错题本内连续答对 2 次后该题消失
- [ ] 错题本内中间答错会重置 streak
- [ ] 普通 Tab 答对错题本里的题不影响 streak
- [ ] 退出重进保留进度、错题本、答案历史
- [ ] 完成所有题后可一键「重做本类」
- [ ] 错题本为空时显示友好空状态
