#!/usr/bin/env node
// docs/03 M5 — 월간 정리 카드 + PNG 내보내기 시나리오 검증 + 스크린샷.
//   node m5-summary.mjs [--base=http://localhost:3210]
// (측정 계획 4의 글자 방식 비교 결과 PNG는 screenshots/m5/measure/에 보존 — 비교용 훅은 결정 후 제거)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { check, dateKey as key, finish, gotoApp, launch, openPage, outDir, seen } from './lib.mjs'

const OUT = outDir('m5')

const now = new Date()
const at = (day, h = 9) => new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate()), h).toISOString()
const subjects = [
  { id: 'math', name: '선형대수', species: 0 },
  { id: 'eng', name: '영어', species: 3 },
  { id: 'phy', name: '물리', species: 2 },
]
// 선형대수 300 · 영어 180 · 물리 90 · 과목 없음 150 = 720분, 공부한 날 = 서로 다른 날짜 수
const sessions = [
  ...[1, 2, 3, 5, 6].map((d, i) => ({ id: `m${i}`, completedAt: at(d), durationMin: 60, subjectId: 'math' })),
  ...[2, 4, 7].map((d, i) => ({ id: `e${i}`, completedAt: at(d, 14), durationMin: 60, subjectId: 'eng' })),
  ...[8, 9].map((d, i) => ({ id: `p${i}`, completedAt: at(d), durationMin: 45, subjectId: 'phy' })),
  ...[10, 11, 12].map((d, i) => ({ id: `n${i}`, completedAt: at(d), durationMin: 50 })),
  // 지난달 세션은 빠져야 한다
  { id: 'prev', completedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15, 9).toISOString(), durationMin: 600, subjectId: 'math' },
]
const studyDays = new Set(sessions.filter((s) => s.id !== 'prev').map((s) => key(new Date(s.completedAt)))).size
const T = (n, id) => ({ id, date: key(new Date(now.getFullYear(), now.getMonth(), n)), title: '핵심', core: true, done: true, createdAt: '2026-01-01T00:00:00Z' })
const tasks = [3, 7].filter((n) => n < now.getDate()).map((n, i) => T(n, `t${i}`))

const browser = await launch()

for (const scheme of ['light', 'dark']) {
  const { ctx, page } = await openPage(browser, scheme, { acceptDownloads: true })
  await gotoApp(page, '/records')
  await page.evaluate(([s, t, sub]) => {
    localStorage.clear()
    localStorage.setItem('study-garden:sessions', s)
    localStorage.setItem('study-garden:tasks', t)
    localStorage.setItem('study-garden:subjects', sub)
  }, [JSON.stringify(sessions), JSON.stringify(tasks), JSON.stringify(subjects)])
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const card = page.getByRole('region', { name: '한 달 정리' })
  check(`[${scheme}] 정리 카드 보임`, await seen(card))
  const txt = await card.innerText()
  check(`[${scheme}] 가꾼 시간 12시간 (지난달 제외)`, txt.includes('12시간'), txt.split('\n').slice(0, 4).join(' | '))
  check(`[${scheme}] 공부한 날 ${studyDays}일`, txt.includes(`${studyDays}일`))
  check(`[${scheme}] 목표 꽃 ${tasks.length}송이`, txt.includes(`${tasks.length}송이`))
  check(`[${scheme}] 과목 순서 선형대수→영어→물리→과목 없이`, /선형대수[\s\S]*영어[\s\S]*물리[\s\S]*과목 없이/.test(txt))
  check(`[${scheme}] 비율 합 100 (42·25·12·21 — 최대 나머지)`, txt.includes('5시간 · 42%') && txt.includes('3시간 · 25%') && txt.includes('1시간 30분 · 12%') && txt.includes('2시간 30분 · 21%'), (txt.match(/\d+%/g) ?? []).join(','))
  await card.scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(OUT, `01-records-card-${scheme}.png`), fullPage: true })

  // 저장: 공유 불가 환경 → 다운로드
  await page.evaluate(() => {
    navigator.canShare = () => false
  })
  const [dl] = await Promise.all([page.waitForEvent('download'), card.getByRole('button', { name: '이미지로 저장' }).click()])
  const file = join(OUT, `02-export-${scheme}.png`)
  await dl.saveAs(file)
  const png = readFileSync(file)
  const w = png.readUInt32BE(16)
  const h = png.readUInt32BE(20)
  check(`[${scheme}] PNG 다운로드 (${dl.suggestedFilename()})`, png.subarray(1, 4).toString() === 'PNG' && /^study-garden-\d{4}-\d{2}\.png$/.test(dl.suggestedFilename()), `${w}×${h}`)
  check(`[${scheme}] '이미지로 저장했어요' 안내`, await seen(page.getByText('이미지로 저장했어요')))

  // 공유 가능 환경 → navigator.share에 PNG 파일 1개
  await page.evaluate(() => {
    navigator.canShare = () => true
    navigator.share = async (d) => {
      window.__shared = d.files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
    }
  })
  await card.getByRole('button', { name: '이미지로 저장' }).click()
  await page.waitForTimeout(1500)
  const shared = await page.evaluate(() => window.__shared)
  check(`[${scheme}] 공유 가능하면 share()로 PNG 1개`, shared?.length === 1 && shared[0].type === 'image/png' && shared[0].size > 10000, JSON.stringify(shared))

  await ctx.close()
}

// 지난달·빈 달: 세션 없는 달은 카드 없음
{
  const { ctx, page } = await openPage(browser)
  await gotoApp(page, '/records')
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  check('기록 없는 달 → 정리 카드 없음', (await page.getByRole('region', { name: '한 달 정리' }).count()) === 0)
  await ctx.close()
}
await finish(browser)
