import type { Exam } from '@/types'

/**
 * 시험 D-day 규칙 (docs/03 M4). 순수 함수만 — `node --test`로 직접 실행되므로
 * 런타임 import 금지 (`import type`만).
 */

export const MAX_EXAMS = 3

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const dayNumber = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** 'YYYY-MM-DD' 사이 날 수 (to − from). 달력 날짜끼리 비교 — 시각·서머타임과 무관 */
export function daysBetween(from: string, to: string): number {
  return Math.round(dayNumber(to) - dayNumber(from))
}

/** 오늘 포함 앞으로의 시험, 날짜순 (같은 날이면 등록 순서). 지난 시험·잘못된 날짜는 빠진다 */
export function upcomingExams(exams: Exam[], today: string): Exam[] {
  return exams
    .filter((e) => DATE_RE.test(e.date) && e.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** 가장 가까운 시험 1개와 남은 날. 없으면 null */
export function nextExam(exams: Exam[], today: string): { exam: Exam; days: number } | null {
  const exam = upcomingExams(exams, today)[0]
  return exam ? { exam, days: daysBetween(today, exam.date) } : null
}

/** 한도는 앞으로의 시험만 센다 — 지난 시험이 자리를 막지 않게 */
export function canAddExam(exams: Exam[], today: string): boolean {
  return upcomingExams(exams, today).length < MAX_EXAMS
}

export function ddayText(name: string, days: number): string {
  return days === 0 ? `오늘은 ${name} 날이에요` : `${name}까지 ${days}일`
}
