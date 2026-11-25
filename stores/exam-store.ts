import { create } from 'zustand'
import type { Exam } from '@/types'
import { canAddExam } from '@/lib/dday'
import { getExams, saveExams } from '@/lib/storage/exams'
import { dateKey } from '@/lib/time'

export const MAX_EXAM_NAME = 12

interface ExamState {
  exams: Exam[]
  hydrated: boolean
  hydrate(): void
  add(name: string, date: string): void
  remove(id: string): void
}

export const useExamStore = create<ExamState>((set, get) => {
  const commit = (next: Exam[]) => {
    saveExams(next)
    set({ exams: next })
  }
  return {
    exams: [],
    hydrated: false,
    hydrate: () => set({ exams: getExams(), hydrated: true }),
    add: (name, date) => {
      const trimmed = name.trim().slice(0, MAX_EXAM_NAME)
      const today = dateKey(new Date())
      const all = get().exams
      // 지난 날짜는 받지 않는다 (입력의 min만으로는 직접 타이핑을 못 막는다)
      if (!trimmed || !date || date < today || !canAddExam(all, today)) return
      commit([...all, { id: crypto.randomUUID(), name: trimmed, date }])
    },
    remove: (id) => commit(get().exams.filter((e) => e.id !== id)),
  }
})
