import type { Session } from '@/types'

/**
 * 월간 정원 정리 (docs/03 M5). 순수 함수만 — `node --test`로 직접 실행되므로
 * 런타임 import 금지 (`import type`만).
 */

export interface SubjectShare {
  /** null = 과목 없이 한 세션 (또는 찾을 수 없는 과목) */
  subjectId: string | null
  minutes: number
}

export interface MonthSummary {
  minutes: number
  sessions: number
  /** 공부한 날 수 (로컬 날짜 기준) */
  studyDays: number
  /** 분 많은 순, 같으면 그달 먼저 나온 순. 과목 없음은 항상 맨 뒤 */
  bySubject: SubjectShare[]
}

export function monthSummary(
  sessions: Session[],
  year: number,
  month: number,
  subjectExists: (id: string) => boolean = () => true,
): MonthSummary {
  const inMonth = sessions
    .map((s) => ({ s, d: new Date(s.completedAt) }))
    .filter(({ d }) => d.getFullYear() === year && d.getMonth() === month)
    .sort((a, b) => a.d.getTime() - b.d.getTime())

  const days = new Set<number>()
  const order: (string | null)[] = []
  const minutes = new Map<string | null, number>()
  let total = 0
  for (const { s, d } of inMonth) {
    total += s.durationMin
    days.add(d.getDate())
    const id = s.subjectId && subjectExists(s.subjectId) ? s.subjectId : null
    if (!minutes.has(id)) order.push(id)
    minutes.set(id, (minutes.get(id) ?? 0) + s.durationMin)
  }

  const bySubject = order
    .map((subjectId, i) => ({ subjectId, minutes: minutes.get(subjectId)!, i }))
    .sort(
      (a, b) =>
        Number(a.subjectId === null) - Number(b.subjectId === null) ||
        b.minutes - a.minutes ||
        a.i - b.i,
    )
    .map(({ subjectId, minutes }) => ({ subjectId, minutes }))

  return { minutes: total, sessions: inMonth.length, studyDays: days.size, bySubject }
}

/**
 * 정수 백분율, 합이 정확히 100 (최대 나머지 방식). 나머지가 같으면 앞쪽이 받는다.
 * 합이 0이면 전부 0.
 */
export function percentages(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum <= 0) return values.map(() => 0)
  const raw = values.map((v) => (v / sum) * 100)
  const out = raw.map(Math.floor)
  let left = 100 - out.reduce((a, b) => a + b, 0)
  const byRemainder = raw
    .map((r, i) => ({ i, rem: r - Math.floor(r) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i)
  for (const { i } of byRemainder) {
    if (left <= 0) break
    out[i]++
    left--
  }
  return out
}
