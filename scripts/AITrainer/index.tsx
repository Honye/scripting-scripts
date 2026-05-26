import {
  Navigation,
  NavigationStack,
  Script,
  Tab,
  TabView,
  VStack,
  useEffect,
  useMemo,
  useState,
} from 'scripting'
import type { WrongEntry } from './types'
import { EXAM_MAX_SCORE } from './data'
import { loadExamScore, loadWrongBook, saveWrongBook } from './store'
import { theme } from './theme'
import { i18n } from './i18n'
import { PracticeView } from './views/PracticeView'

function App() {
  const [wrongBook, setWrongBook] = useState<WrongEntry[]>(() => loadWrongBook())
  // 任何 tf/single/multi Tab 的进度变更都会 bump 这个计数器，
  // 触发 examScore 重新读取 Storage。
  const [scoreVersion, setScoreVersion] = useState(0)
  const bumpExamScore = () => setScoreVersion((v) => v + 1)
  const examScore = useMemo(() => loadExamScore(), [scoreVersion])

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
        <Tab title={i18n.tabs.tf} systemImage="checkmark.circle">
          <NavigationStack>
            <PracticeView
              mode="tf"
              wrongBook={wrongBook}
              setWrongBook={setWrongBook}
              examScore={examScore}
              examMax={EXAM_MAX_SCORE}
              onExamProgressChanged={bumpExamScore}
            />
          </NavigationStack>
        </Tab>
        <Tab title={i18n.tabs.single} systemImage="list.bullet">
          <NavigationStack>
            <PracticeView
              mode="single"
              wrongBook={wrongBook}
              setWrongBook={setWrongBook}
              examScore={examScore}
              examMax={EXAM_MAX_SCORE}
              onExamProgressChanged={bumpExamScore}
            />
          </NavigationStack>
        </Tab>
        <Tab title={i18n.tabs.multi} systemImage="square.stack">
          <NavigationStack>
            <PracticeView
              mode="multi"
              wrongBook={wrongBook}
              setWrongBook={setWrongBook}
              examScore={examScore}
              examMax={EXAM_MAX_SCORE}
              onExamProgressChanged={bumpExamScore}
            />
          </NavigationStack>
        </Tab>
        <Tab title={i18n.tabs.wrong} systemImage="bookmark.fill">
          <NavigationStack>
            <PracticeView
              mode="wrong"
              wrongBook={wrongBook}
              setWrongBook={setWrongBook}
              examScore={examScore}
              examMax={EXAM_MAX_SCORE}
              onExamProgressChanged={bumpExamScore}
            />
          </NavigationStack>
        </Tab>
      </TabView>
    </VStack>
  )
}

async function main() {
  await Navigation.present({ element: <App /> })
  Script.exit()
}

main()
