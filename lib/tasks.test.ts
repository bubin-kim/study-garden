/**
 * docs/03 M1 골든 케이스 — 2026-11-25 사용자 승인 표 그대로 (+A4 추가 승인).
 * 기대값을 바꾸려면 사용자 승인부터 (전역 규칙: 채점 기준은 사람이 검수).
 * 실행: npm test  (TZ=Asia/Seoul 고정 — A3가 타임존에 의존)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Task } from '@/types'
import { dateKey } from './time.ts'
import { achievedDates, canMarkCore, carryOver, isDayAchieved, isEditable } from './tasks.ts'

const TODAY = '2026-11-25'
const YESTERDAY = '2026-11-24'

let seq = 0
function task(p: Partial<Task> & { date: string }): Task {
  seq++
  return {
    id: `t${seq}`,
    title: `할 일 ${seq}`,
    core: false,
    done: false,
    createdAt: '2026-11-25T00:00:00.000Z',
    ...p,
  }
}

// A. dateKey — 로컬 날짜
test('A1 현지 23:59는 그날', () => {
  assert.equal(dateKey(new Date(2026, 10, 25, 23, 59)), '2026-11-25')
})
test('A2 현지 00:00은 다음 날', () => {
  assert.equal(dateKey(new Date(2026, 10, 26, 0, 0)), '2026-11-26')
})
test('A3 KST 23:30 (UTC 14:30)은 2026-11-25', () => {
  assert.equal(dateKey(new Date('2026-11-25T14:30:00Z')), '2026-11-25')
})
// A4 — 2026-11-25 추가 승인: A3은 UTC와 날짜가 같아 구분력이 없어서, UTC로는 전날인 경우를 둔다
test('A4 KST 11-26 08:30 (UTC 11-25 23:30)은 2026-11-26', () => {
  assert.equal(dateKey(new Date('2026-11-25T23:30:00Z')), '2026-11-26')
})

// B. isDayAchieved
test('B1 할 일 없음 → false', () => {
  assert.equal(isDayAchieved([], TODAY), false)
})
test('B2 일반 3개 완료, 핵심 0개 → false', () => {
  const ts = [1, 2, 3].map(() => task({ date: TODAY, done: true }))
  assert.equal(isDayAchieved(ts, TODAY), false)
})
test('B3 핵심 1개 완료 → true', () => {
  assert.equal(isDayAchieved([task({ date: TODAY, core: true, done: true })], TODAY), true)
})
test('B4 핵심 3개 중 2개 완료 → false', () => {
  const ts = [
    task({ date: TODAY, core: true, done: true }),
    task({ date: TODAY, core: true, done: true }),
    task({ date: TODAY, core: true, done: false }),
  ]
  assert.equal(isDayAchieved(ts, TODAY), false)
})
test('B5 핵심 3개 완료 + 일반 5개 미완료 → true', () => {
  const ts = [
    ...[1, 2, 3].map(() => task({ date: TODAY, core: true, done: true })),
    ...[1, 2, 3, 4, 5].map(() => task({ date: TODAY })),
  ]
  assert.equal(isDayAchieved(ts, TODAY), true)
})
test('B6 다른 날짜의 미완료 핵심은 무시 → true', () => {
  const ts = [
    task({ date: TODAY, core: true, done: true }),
    task({ date: YESTERDAY, core: true, done: false }),
  ]
  assert.equal(isDayAchieved(ts, TODAY), true)
})

// C. isEditable
test('C1 오늘 → true', () => {
  assert.equal(isEditable(task({ date: TODAY }), TODAY), true)
})
test('C2 어제 → false', () => {
  assert.equal(isEditable(task({ date: YESTERDAY }), TODAY), false)
})
test('C3 내일 → false', () => {
  assert.equal(isEditable(task({ date: '2026-11-26' }), TODAY), false)
})

// D. canMarkCore
test('D1 핵심 0개 → true', () => {
  assert.equal(canMarkCore([], TODAY), true)
})
test('D2 핵심 2개 → true', () => {
  const ts = [1, 2].map(() => task({ date: TODAY, core: true }))
  assert.equal(canMarkCore(ts, TODAY), true)
})
test('D3 핵심 3개 → false', () => {
  const ts = [1, 2, 3].map(() => task({ date: TODAY, core: true }))
  assert.equal(canMarkCore(ts, TODAY), false)
})
test('D4 오늘 핵심 2 + 어제 핵심 3 → true', () => {
  const ts = [
    ...[1, 2].map(() => task({ date: TODAY, core: true })),
    ...[1, 2, 3].map(() => task({ date: YESTERDAY, core: true })),
  ]
  assert.equal(canMarkCore(ts, TODAY), true)
})

// E. carryOver
function fixtureE() {
  return [
    task({ id: 'y1', date: YESTERDAY, title: '수학 문제집', subjectId: 's-math', core: true }),
    task({ id: 'y2', date: YESTERDAY, title: '영단어' }),
    task({ id: 'y3', date: YESTERDAY, title: '끝낸 일', done: true }),
  ]
}
const NOW = '2026-11-25T01:00:00.000Z'
const ids = () => {
  let n = 0
  return () => `new${++n}`
}

test('E1 어제 미완료 2개를 오늘로 복사 (핵심 해제·미완료, 제목·과목 유지)', () => {
  const out = carryOver(fixtureE(), TODAY, ids(), NOW)
  assert.deepEqual(out, [
    {
      id: 'new1',
      date: TODAY,
      title: '수학 문제집',
      subjectId: 's-math',
      core: false,
      done: false,
      createdAt: NOW,
      carriedFrom: 'y1',
    },
    {
      id: 'new2',
      date: TODAY,
      title: '영단어',
      core: false,
      done: false,
      createdAt: NOW,
      carriedFrom: 'y2',
    },
  ])
})
test('E2 어제 없음, 그제 미완료 있음 → 빈 목록', () => {
  const ts = [task({ date: '2026-11-23', title: '그제 할 일' })]
  assert.deepEqual(carryOver(ts, TODAY, ids(), NOW), [])
})
test('E3 E1 직후 다시 누르면 → 빈 목록', () => {
  const before = fixtureE()
  const after = [...before, ...carryOver(before, TODAY, ids(), NOW)]
  assert.deepEqual(carryOver(after, TODAY, ids(), NOW), [])
})
test('E4 가져온 뒤에도 어제 데이터는 그대로 (복사)', () => {
  const before = fixtureE()
  const snapshot = structuredClone(before)
  const after = [...before, ...carryOver(before, TODAY, ids(), NOW)]
  assert.deepEqual(after.filter((t) => t.date === YESTERDAY), snapshot)
})

// F. achievedDates — docs/03 M2 골든 (2026-11-25 승인)
test('F1 할 일 없음 → []', () => {
  assert.deepEqual(achievedDates([], 2026, 10), [])
})
test('F2 11-03 달성, 11-10 핵심 1/2 → [11-03]', () => {
  const ts = [
    task({ date: '2026-11-03', core: true, done: true }),
    task({ date: '2026-11-10', core: true, done: true }),
    task({ date: '2026-11-10', core: true, done: false }),
  ]
  assert.deepEqual(achievedDates(ts, 2026, 10), ['2026-11-03'])
})
test('F3 10-31·11-15·12-01 달성 → 그달만 [11-15]', () => {
  const ts = ['2026-10-31', '2026-11-15', '2026-12-01'].map((date) =>
    task({ date, core: true, done: true }),
  )
  assert.deepEqual(achievedDates(ts, 2026, 10), ['2026-11-15'])
})
test('F4 입력 순서 11-20, 11-05 → 날짜순', () => {
  const ts = ['2026-11-20', '2026-11-05'].map((date) => task({ date, core: true, done: true }))
  assert.deepEqual(achievedDates(ts, 2026, 10), ['2026-11-05', '2026-11-20'])
})
test('F5 같은 날 핵심 3개 → 날짜 한 번', () => {
  const ts = [1, 2, 3].map(() => task({ date: '2026-11-08', core: true, done: true }))
  assert.deepEqual(achievedDates(ts, 2026, 10), ['2026-11-08'])
})
