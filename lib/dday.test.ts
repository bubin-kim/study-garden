/**
 * docs/03 M4 골든 케이스 I — 2026-11-25 사용자 승인 표 그대로.
 * 기대값을 바꾸려면 사용자 승인부터 (전역 규칙: 채점 기준은 사람이 검수).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Exam } from '@/types'
import { canAddExam, ddayText, nextExam } from './dday.ts'

const T = '2026-11-25'
const ex = (id: string, date: string, name = '기말고사'): Exam => ({ id, name, date })

test('I1 당일 → 0일 · 당일 문구', () => {
  const r = nextExam([ex('a', '2026-11-25')], T)
  assert.equal(r?.days, 0)
  assert.equal(ddayText(r!.exam.name, r!.days), '오늘은 기말고사 날이에요')
})
test('I2 내일 → 1일 · "기말고사까지 1일"', () => {
  const r = nextExam([ex('a', '2026-11-26')], T)
  assert.equal(r?.days, 1)
  assert.equal(ddayText(r!.exam.name, r!.days), '기말고사까지 1일')
})
test('I3 지난 시험만 → null', () => {
  assert.equal(nextExam([ex('a', '2026-11-24')], T), null)
})
test('I4 시험 없음 → null', () => {
  assert.equal(nextExam([], T), null)
})
test('I5 여러 개 중 가장 가까운 앞으로의 시험', () => {
  const r = nextExam([ex('a', '2026-12-10'), ex('b', '2026-12-03'), ex('c', '2026-11-20')], T)
  assert.equal(r?.exam.date, '2026-12-03')
  assert.equal(r?.days, 8)
})
test('I6 연말 → 연초 1일', () => {
  assert.equal(nextExam([ex('a', '2027-01-01')], '2026-12-31')?.days, 1)
})
test('I7 윤년 2/28 → 3/1 2일', () => {
  assert.equal(nextExam([ex('a', '2028-03-01')], '2028-02-28')?.days, 2)
})
test('I8 앞으로의 시험 3개 → 추가 불가', () => {
  assert.equal(canAddExam([ex('a', '2026-12-01'), ex('b', '2026-12-02'), ex('c', '2026-11-25')], T), false)
})
test('I9 앞으로 2개 + 지난 2개 → 추가 가능', () => {
  const es = [ex('a', '2026-12-01'), ex('b', '2026-12-02'), ex('c', '2026-11-01'), ex('d', '2026-11-24')]
  assert.equal(canAddExam(es, T), true)
})
test('I10 같은 날 → 먼저 등록한 것', () => {
  assert.equal(nextExam([ex('A', '2026-12-05'), ex('B', '2026-12-05')], T)?.exam.id, 'A')
})
test('I11 잘못된 날짜는 무시', () => {
  assert.equal(nextExam([ex('bad', ''), ex('ok', '2026-12-01')], T)?.exam.id, 'ok')
})
