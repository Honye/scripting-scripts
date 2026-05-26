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
    examScore: '本轮得分',
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
  question: {
    meta: (n: number, points: number) => `第 ${n} 题 · ${points} 分`,
  },
} as const
