/**
 * docs/03 M5 골든 케이스 J — 2026-11-25 사용자 승인 표 그대로.
 * 기대값을 바꾸려면 사용자 승인부터 (전역 규칙: 채점 기준은 사람이 검수).
 * 시각은 로컬(TZ=Asia/Seoul — npm test에서 고정) 기준.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Session } from '@/types'
import { monthSummary, percentages } from './summary.ts'

let n = 0
const s = (local: string, durationMin: number, subjectId?: string): Session => ({
  id: `s${++n}`,
  completedAt: new Date(local).toISOString(), // 'YYYY-MM-DDTHH:mm' 은 로컬로 해석된다
  durationMin,
  ...(subjectId && { subjectId }),
})
const NOV = [2026, 10] as const

test('J1 세션 없음', () => {
  assert.deepEqual(monthSummary([], ...NOV), { minutes: 0, sessions: 0, studyDays: 0, bySubject: [] })
})
test('J2 달 경계 — 11/30 23:30은 11월, 12/1 00:10은 아님', () => {
  const r = monthSummary([s('2026-11-30T23:30', 30), s('2026-12-01T00:10', 40)], ...NOV)
  assert.equal(r.minutes, 30)
  assert.equal(r.sessions, 1)
})
test('J3 같은 날 2개 + 다른 날 1개 → 공부한 날 2', () => {
  const r = monthSummary([s('2026-11-03T09:00', 30), s('2026-11-03T21:00', 30), s('2026-11-04T09:00', 30)], ...NOV)
  assert.equal(r.studyDays, 2)
})
test('J4 분 많은 순, 과목 없음은 맨 뒤', () => {
  const r = monthSummary(
    [s('2026-11-02T09:00', 90, 'math'), s('2026-11-03T09:00', 60), s('2026-11-04T09:00', 30, 'eng')],
    ...NOV,
  )
  assert.deepEqual(r.bySubject, [
    { subjectId: 'math', minutes: 90 },
    { subjectId: 'eng', minutes: 30 },
    { subjectId: null, minutes: 60 },
  ])
})
test('J5 같은 분이면 그달 먼저 나온 과목', () => {
  const r = monthSummary([s('2026-11-02T09:00', 60, 'eng'), s('2026-11-05T09:00', 60, 'math')], ...NOV)
  assert.deepEqual(r.bySubject.map((x) => x.subjectId), ['eng', 'math'])
})
test('J6 보관 과목은 유지, 없는 id는 과목 없음에 합침', () => {
  const known = new Set(['archived'])
  const r = monthSummary(
    [s('2026-11-02T09:00', 50, 'archived'), s('2026-11-03T09:00', 20, 'ghost'), s('2026-11-04T09:00', 10)],
    ...NOV,
    (id) => known.has(id),
  )
  assert.deepEqual(r.bySubject, [
    { subjectId: 'archived', minutes: 50 },
    { subjectId: null, minutes: 30 },
  ])
})
test('J7 [1,1,1] → [34,33,33]', () => {
  assert.deepEqual(percentages([1, 1, 1]), [34, 33, 33])
})
test('J8 [300,180,90,150] → [42,25,12,21]', () => {
  assert.deepEqual(percentages([300, 180, 90, 150]), [42, 25, 12, 21])
})
test('J9 합 0·빈 배열', () => {
  assert.deepEqual(percentages([0, 0]), [0, 0])
  assert.deepEqual(percentages([]), [])
})
