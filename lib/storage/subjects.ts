import type { Subject } from '@/types'

/** 과목 목록 (docs/03 M3) */
const KEY = 'study-garden:subjects'

export function getSubjects(): Subject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? (raw as Subject[]) : []
  } catch {
    return []
  }
}

export function saveSubjects(subjects: Subject[]) {
  localStorage.setItem(KEY, JSON.stringify(subjects))
}
