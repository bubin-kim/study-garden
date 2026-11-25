/**
 * docs/03 M3 골든 케이스 H — 2026-11-25 사용자 승인 표 그대로.
 * 기대값을 바꾸려면 사용자 승인부터 (전역 규칙: 채점 기준은 사람이 검수).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SpeciesId, Subject } from '@/types'
import { activeSubjects, freeSpecies, speciesOf } from './subjects.ts'

const sub = (id: string, species: SpeciesId, archived = false): Subject => ({
  id,
  name: id,
  species,
  ...(archived && { archived }),
})

test('H1 과목 없음 → 0', () => {
  assert.equal(freeSpecies([]), 0)
})
test('H2 활성 0,1 → 2', () => {
  assert.equal(freeSpecies([sub('a', 0), sub('b', 1)]), 2)
})
test('H3 활성 0~4 → null', () => {
  assert.equal(freeSpecies([0, 1, 2, 3, 4].map((n) => sub(`s${n}`, n as SpeciesId))), null)
})
test('H4 활성 0~3 + 보관 4 → 4 (보관된 종 재사용)', () => {
  const ss = [...[0, 1, 2, 3].map((n) => sub(`s${n}`, n as SpeciesId)), sub('old', 4, true)]
  assert.equal(freeSpecies(ss), 4)
})
test('H5 id 없음 → null', () => {
  assert.equal(speciesOf([sub('a', 2)], undefined), null)
})
test('H6 없는 id → null', () => {
  assert.equal(speciesOf([sub('a', 2)], 'zzz'), null)
})
test('H7 보관된 과목 id → 그 종', () => {
  assert.equal(speciesOf([sub('old', 3, true)], 'old'), 3)
})
test('H8 활성 2 + 보관 1 → 활성 2개만', () => {
  const ss = [sub('a', 0), sub('b', 1), sub('c', 2, true)]
  assert.deepEqual(activeSubjects(ss).map((s) => s.id), ['a', 'b'])
})
