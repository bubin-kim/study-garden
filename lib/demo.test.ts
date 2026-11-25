/**
 * docs/04 M1 골든 케이스 K — 2026-11-25 사용자 승인 표 그대로 (측정 1 후보 B).
 * 기대값을 바꾸려면 사용자 승인부터 (전역 규칙: 채점 기준은 사람이 검수).
 * 시각은 로컬(TZ=Asia/Seoul — npm test에서 고정) 기준.
 */
import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { demoGarden } from './demo.ts'
import { getGardenPlants } from './garden.ts'

const localKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

test('K1 두 번 호출해도 같은 결과', () => {
  assert.deepEqual(demoGarden(), demoGarden())
})
test('K2 현재 시각과 무관 — 2026-12-01, 2027-06-15', async () => {
  const base = demoGarden()
  for (const now of ['2026-12-01T09:00:00+09:00', '2027-06-15T21:00:00+09:00']) {
    mock.timers.enable({ apis: ['Date'], now: new Date(now) })
    try {
      assert.deepEqual(demoGarden(), base)
      // 모듈 최상위에서 날짜를 읽는 경우도 잡도록, 가짜 시계 아래에서 모듈을 새로 불러 한 번 더 본다
      // (2026-11-26 변형 검사: 최상위 `new Date().getFullYear()`는 위 호출만으로는 통과했다)
      const fresh = (await import(`./demo.ts?k2=${encodeURIComponent(now)}`)) as typeof import('./demo.ts')
      assert.deepEqual(fresh.demoGarden(), base)
    } finally {
      mock.timers.reset()
    }
  }
})
test('K3 2026년 11월, 모든 세션이 그달 안', () => {
  const g = demoGarden()
  assert.equal(g.year, 2026)
  assert.equal(g.month, 10)
  assert.ok(g.sessions.every((s) => localKey(s.completedAt).startsWith('2026-11-')))
})
test('K4 세션 17 · 공부한 날 17 · 690분', () => {
  const { sessions } = demoGarden()
  assert.equal(sessions.length, 17)
  assert.equal(new Set(sessions.map((s) => localKey(s.completedAt))).size, 17)
  assert.equal(sessions.reduce((a, s) => a + s.durationMin, 0), 690)
})
test('K5 단계 새싹 3 · 잎 4 · 꽃 6 · 나무 4', () => {
  const g = demoGarden()
  const plants = getGardenPlants(g.sessions, g.year, g.month)
  const n = (stage: string) => plants.filter((p) => p.stage === stage).length
  assert.deepEqual([n('sprout'), n('leaf'), n('flower'), n('tree')], [3, 4, 6, 4])
})
test('K6 과목 4개(종 0~3), 꽃·나무에 종 0~3 모두', () => {
  const g = demoGarden()
  assert.deepEqual(g.subjects.map((s) => s.species), [0, 1, 2, 3])
  const sp = (id: string | undefined) => g.subjects.find((s) => s.id === id)?.species ?? null
  const plants = getGardenPlants(g.sessions, g.year, g.month, sp)
  const shown = new Set(plants.filter((p) => p.stage === 'flower' || p.stage === 'tree').map((p) => p.species))
  for (const s of [0, 1, 2, 3]) assert.ok(shown.has(s as 0 | 1 | 2 | 3), `종 ${s}`)
})
test('K7 목표 꽃 8송이 — 2·4·8·11·16·19·22·26일, 모두 공부한 날', () => {
  const g = demoGarden()
  assert.deepEqual(
    g.achieved,
    [2, 4, 8, 11, 16, 19, 22, 26].map((d) => `2026-11-${String(d).padStart(2, '0')}`),
  )
  const studied = new Set(g.sessions.map((s) => localKey(s.completedAt)))
  assert.ok(g.achieved.every((d) => studied.has(d)))
})
test('K8 세션 id 고유 · demo- 접두사', () => {
  const ids = demoGarden().sessions.map((s) => s.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.every((id) => id.startsWith('demo-')))
})
