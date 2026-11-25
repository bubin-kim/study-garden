/**
 * docs/03 M2 골든 케이스 G — 2026-11-25 사용자 승인 표 그대로.
 * 기대값을 바꾸려면 사용자 승인부터 (전역 규칙: 채점 기준은 사람이 검수).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getGoalFlowers } from './garden.ts'

const DATES = ['2026-11-03', '2026-11-07', '2026-11-12', '2026-11-18', '2026-11-22']

test('G1 [] → []', () => {
  assert.deepEqual(getGoalFlowers([]), [])
})
test('G2 같은 입력 두 번 → 결과 동일', () => {
  assert.deepEqual(getGoalFlowers(DATES), getGoalFlowers(DATES))
})
test('G3 순서를 섞어도 G2와 동일', () => {
  const shuffled = [DATES[3], DATES[0], DATES[4], DATES[2], DATES[1]]
  assert.deepEqual(getGoalFlowers(shuffled), getGoalFlowers(DATES))
})
test('G4 31개 — x ∈ [0,1), tilt ∈ [-1,1)', () => {
  const all = Array.from({ length: 31 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`)
  for (const f of getGoalFlowers(all)) {
    assert.ok(f.x >= 0 && f.x < 1, `x=${f.x}`)
    assert.ok(f.tilt >= -1 && f.tilt < 1, `tilt=${f.tilt}`)
  }
})
test('G5 뒤 날짜 추가 → 기존 꽃 위치 불변', () => {
  const before = getGoalFlowers(DATES)
  const after = getGoalFlowers([...DATES, '2026-11-28'])
  assert.deepEqual(after.slice(0, before.length), before)
})
