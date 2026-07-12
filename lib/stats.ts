import type { Session } from '@/types'
import { dateKey } from './time'

export interface DayRecord {
  minutes: number
  count: number
}

export function totalMinutes(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + s.durationMin, 0)
}

/** 날짜별 공부 기록 (key: 'YYYY-MM-DD') */
export function dailyRecords(sessions: Session[]): Map<string, DayRecord> {
  const map = new Map<string, DayRecord>()
  for (const s of sessions) {
    const key = dateKey(new Date(s.completedAt))
    const rec = map.get(key) ?? { minutes: 0, count: 0 }
    rec.minutes += s.durationMin
    rec.count += 1
    map.set(key, rec)
  }
  return map
}

export function minutesToday(sessions: Session[], now = new Date()): number {
  const key = dateKey(now)
  return sessions
    .filter((s) => dateKey(new Date(s.completedAt)) === key)
    .reduce((sum, s) => sum + s.durationMin, 0)
}

/** 이번 주(월요일 시작) 공부 분 */
export function minutesThisWeek(sessions: Session[], now = new Date()): number {
  const day = (now.getDay() + 6) % 7 // 월=0 ... 일=6
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
  return sessions
    .filter((s) => new Date(s.completedAt) >= monday)
    .reduce((sum, s) => sum + s.durationMin, 0)
}

export function minutesInMonth(
  sessions: Session[],
  year: number,
  month: number,
): number {
  return sessions
    .filter((s) => {
      const d = new Date(s.completedAt)
      return d.getFullYear() === year && d.getMonth() === month
    })
    .reduce((sum, s) => sum + s.durationMin, 0)
}
