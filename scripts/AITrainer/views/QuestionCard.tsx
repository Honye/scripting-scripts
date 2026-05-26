import { Button, HStack, RoundedRectangle, Text, VStack } from 'scripting'
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
  const pickedSet = new Set(revealed ? answered.picked : picked)

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
          {i18n.question.meta(question.number, question.points)}
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
                padding={{ horizontal: 14, vertical: 14 }}
                frame={{ maxWidth: 'infinity', alignment: 'leading' }}
                background={bg}
                cornerRadius={8}
                overlay={
                  <RoundedRectangle
                    cornerRadius={8}
                    stroke={{
                      shapeStyle: border,
                      strokeStyle: { lineWidth: 1 },
                    }}
                  />
                }
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

      {answered && (
        <VStack alignment="leading" spacing={4}>
          <Text
            font={13}
            fontWeight="bold"
            foregroundStyle={answered.correct ? theme.ok : theme.bad}
          >
            {answered.correct ? i18n.feedback.correct : i18n.feedback.wrong}
          </Text>
          {!answered.correct && (
            <Text font={13} foregroundStyle={theme.muted}>
              {i18n.feedback.correctAnswer + question.answer.join('、')}
            </Text>
          )}
        </VStack>
      )}
    </VStack>
  )
}
