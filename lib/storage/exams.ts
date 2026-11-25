import type { Exam } from '@/types'

/** 시험 목록 (docs/03 M4). 지난 시험도 지우지 않고 둔다 — 화면에서만 숨긴다 */
const KEY = 'study-garden:exams'

export function getExams(): Exam[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? (raw as Exam[]) : []
  } catch {
    return []
  }
}

export function saveExams(exams: Exam[]) {
  localStorage.setItem(KEY, JSON.stringify(exams))
}
