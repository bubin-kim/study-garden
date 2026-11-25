#!/usr/bin/env node
// docs/03 M2 — 달성 꽃 시나리오 검증 + 스크린샷.
//   node m2-flowers.mjs [--base=http://localhost:3210] [--seasons=spring,summer,autumn,winter]
// 시드: 이번 달 지난 날 5일 달성(3·7·12·18·22일 — 오늘 이전만), 10일은 미달성(핵심 1/2),
//       오늘은 핵심 1개 미완료 → 체크해서 "피어나는 순간"을 본다.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const BASE = arg('base', 'http://localhost:3210')
const SEASONS = arg('seasons', 'spring,summer,autumn,winter').split(',')
const OUT = join(here, 'screenshots', 'm2')
mkdirSync(OUT, { recursive: true })

const now = new Date()
const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayOf = (n) => key(new Date(now.getFullYear(), now.getMonth(), n))
const today = key(now)
const ACH_DAYS = [3, 7, 12, 18, 22].filter((n) => n < now.getDate())
const MISS_DAY = 10 < now.getDate() ? 10 : null

let seq = 0
const T = (date, title, core, done) => ({
  id: `s${++seq}`, date, title, core, done, createdAt: `2026-01-01T00:00:${String(seq).padStart(2, '0')}Z`,
})
const tasks = [
  ...ACH_DAYS.flatMap((n) => [T(dayOf(n), '선형대수 문제 풀기', true, true), T(dayOf(n), '영단어 외우기', true, true), T(dayOf(n), '메일 답장', false, false)]),
  ...(MISS_DAY ? [T(dayOf(MISS_DAY), '통계 과제', true, true), T(dayOf(MISS_DAY), '실험 보고서', true, false)] : []),
  T(today, '전공 강의 복습', true, false),
]
const sessions = Array.from({ length: 14 }, (_, i) => ({
  id: `seed-${i}`,
  completedAt: new Date(now.getFullYear(), now.getMonth(), Math.min(i + 1, now.getDate()), 9).toISOString(),
  durationMin: 60,
}))

const checks = []
const check = (name, ok, detail = '') => {
  checks.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}
const browser = await chromium.launch({ channel: 'chrome', headless: true })
let errors = 0

async function open(scheme, reducedMotion = 'no-preference') {
  const ctx = await browser.newContext({ colorScheme: scheme, reducedMotion, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => {
    errors++
    console.error(`[${scheme}] page error: ${e.message}`)
  })
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
      errors++
      console.error(`[${scheme}] console: ${m.text()}`)
    }
  })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  if ((await page.title()) !== 'Study Garden') throw new Error('다른 앱이 떠 있음')
  await page.evaluate(([s, t]) => {
    localStorage.setItem('study-garden:sessions', s)
    localStorage.setItem('study-garden:tasks', t)
  }, [JSON.stringify(sessions), JSON.stringify(tasks)])
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  return { ctx, page }
}
const flowers = (page) => page.locator('svg[aria-label="정원"] [data-goal-flower]').count()
const gardenShot = (page, file) => page.locator('svg[aria-label="정원"]').first().screenshot({ path: join(OUT, file) })

for (const scheme of ['light', 'dark']) {
  // 1. 홈: 지난 달성일만큼 꽃 + 캡션
  const { ctx, page } = await open(scheme)
  const n = ACH_DAYS.length
  check(`[${scheme}] 홈 정원 꽃 ${n}송이 (미달성일 제외)`, (await flowers(page)) === n, `DOM ${await flowers(page)}`)
  check(`[${scheme}] 홈 캡션 '꽃 ${n}송이'`, await page.getByText(`꽃 ${n}송이`).isVisible())

  // 2. 피어나는 순간: 오늘 마지막 핵심 체크
  await page.getByRole('button', { name: /오늘의 목표/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('checkbox', { name: '전공 강의 복습 완료' }).click()
  // 캡션 교체는 mode="wait": 이전 문구 0.35s 퇴장 후 등장 → 새 문구는 ~430ms부터 (실측)
  await page.waitForTimeout(900)
  check(`[${scheme}] 달성 순간 안내 문구`, await page.getByText('오늘의 목표를 모두 가꿨어요 · 꽃 한 송이가 피었어요').isVisible())
  check(`[${scheme}] 꽃 ${n + 1}송이로 증가`, (await flowers(page)) === n + 1)
  await page.screenshot({ path: join(OUT, `home-bloom-${scheme}.png`) })
  await page.waitForTimeout(4100)
  check(`[${scheme}] 4.2초 뒤 캡션 복귀`, await page.getByText(`꽃 ${n + 1}송이`).isVisible())

  // 3. 체크 해제하면 꽃 사라짐 → 다시 체크해도 안내는 다시 뜸(전이 기준)
  await page.getByRole('checkbox', { name: '전공 강의 복습 완료' }).click()
  await page.waitForTimeout(300)
  check(`[${scheme}] 체크 해제 → 꽃 ${n}송이로 복귀`, (await flowers(page)) === n)
  await page.getByRole('checkbox', { name: '전공 강의 복습 완료' }).click()
  await page.waitForTimeout(300)

  // 4. 기록: 캘린더 표시 + 지난 날 읽기 전용 목록
  await page.goto(BASE + '/records', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const marks = await page.locator('button[aria-label$="목표 달성"]').count()
  check(`[${scheme}] 캘린더 달성 표시 ${n + 1}칸`, marks === n + 1, `${marks}칸`)
  check(`[${scheme}] 기록 정원 꽃 ${n + 1}송이`, (await flowers(page)) === n + 1)
  if (ACH_DAYS.length) {
    await page.locator(`button[aria-label^="${now.getMonth() + 1}월 ${ACH_DAYS[0]}일"]`).click()
    await page.waitForTimeout(400)
    check(`[${scheme}] 달성한 날 선택 → '목표를 모두 가꾼 날이에요'`, await page.getByText('목표를 모두 가꾼 날이에요').isVisible())
    check(`[${scheme}] 지난 날 목록에 체크 버튼 없음 (읽기 전용)`, (await page.getByRole('checkbox').count()) === 0)
  }
  if (MISS_DAY) {
    await page.locator(`button[aria-label^="${now.getMonth() + 1}월 ${MISS_DAY}일"]`).click()
    await page.waitForTimeout(400)
    check(`[${scheme}] 미달성일 → '그날의 목표 · 1/2'`, await page.getByText('그날의 목표 · 1/2').isVisible())
  }
  await page.screenshot({ path: join(OUT, `records-${scheme}.png`), fullPage: true })

  // 5. 4계절 정원 (홈)
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  for (const season of SEASONS) {
    await page.evaluate((s) => (document.documentElement.dataset.season = s), season)
    await page.waitForTimeout(700)
    await gardenShot(page, `garden-${season}-${scheme}.png`)
  }
  await ctx.close()

  // 6. reduced-motion: 꽃이 등장 애니메이션 없이 바로 제자리, 흔들림 꺼짐
  const rm = await open(scheme, 'reduce')
  const first = rm.page.locator('svg[aria-label="정원"] [data-goal-flower]').first()
  const scale = await first.evaluate((g) => g.firstElementChild?.getAttribute('style') ?? '')
  const sway = await first.evaluate((g) => getComputedStyle(g.querySelector('.plant-sway')).animationName)
  check(`[${scheme}] reduced-motion: 흔들림 none`, sway === 'none', `animationName=${sway}`)
  check(`[${scheme}] reduced-motion: 등장 transform 없음/완료`, !/scale\(0/.test(scale), `style="${scale}"`)
  await rm.ctx.close()
}
await browser.close()
const failed = checks.filter((c) => !c).length
console.log(`\n${checks.length - failed}/${checks.length} 통과 · 콘솔 에러 ${errors}건`)
process.exit(failed || errors ? 2 : 0)
