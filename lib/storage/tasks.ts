import type { Task } from '@/types'

/** 오늘의 목표 체크리스트 (docs/03). 전체 배열을 통째로 저장한다 — 연간 수백 KB 수준. */
const KEY = 'study-garden:tasks'

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? (raw as Task[]) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(KEY, JSON.stringify(tasks))
}
