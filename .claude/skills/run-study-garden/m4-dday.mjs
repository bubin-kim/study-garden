#!/usr/bin/env node
// docs/03 M4 — 시험 D-day 시나리오 검증 + 스크린샷.
//   node m4-dday.mjs [--base=http://localhost:3210]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice(7) ?? 'http://localhost:3210'
const OUT = join(here, 'screenshots', 'm4')
mkdirSync(OUT, { recursive: true })

const now = new Date()
const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plus = (n) => key(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n))
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

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
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
  const ls = (k) => page.evaluate((x) => JSON.parse(localStorage.getItem(x) ?? 'null'), k)
  const ddayLine = page.locator('main section p').filter({ hasText: /까지 \d+일$|날이에요$/ })
  const ddayText = async () => ((await ddayLine.count()) ? (await ddayLine.first().innerText()).trim() : null)
  const openSettings = async () => {
    await page.getByRole('button', { name: /분 집중/ }).click()
    await page.waitForTimeout(500)
  }
  const closeSettings = async () => {
    await page.mouse.click(195, 40)
    await page.waitForTimeout(500)
  }
  const addExam = async (name, date) => {
    await page.getByRole('textbox', { name: '새 시험 이름' }).fill(name)
    await page.getByLabel('새 시험 날짜').fill(date)
    await page.getByRole('button', { name: '시험 추가' }).click()
    await page.waitForTimeout(200)
  }

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  if ((await page.title()) !== 'Study Garden') throw new Error('다른 앱이 떠 있음')
  await page.evaluate((s) => {
    localStorage.clear()
    localStorage.setItem('study-garden:sessions', s)
  }, JSON.stringify(sessions))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const startBottom = async () => {
    const b = await page.getByRole('button', { name: '집중 시작' }).boundingBox()
    return Math.round(b.y + b.height)
  }
  const sbBefore = await startBottom()

  // 1. 시험 없음 → 줄 없음
  check(`[${scheme}] 시험 없음 → D-day 줄 없음`, (await ddayText()) === null)

  // 2. 지난 날짜는 추가 버튼 비활성
  await openSettings()
  await page.getByRole('textbox', { name: '새 시험 이름' }).fill('지난 시험')
  await page.getByLabel('새 시험 날짜').fill(plus(-1))
  check(`[${scheme}] 지난 날짜 → 추가 버튼 비활성`, await page.getByRole('button', { name: '시험 추가' }).isDisabled())

  // 3. 12일 뒤 기말고사 추가
  await addExam('기말고사', plus(12))
  check(`[${scheme}] 시험 저장`, (await ls('study-garden:exams'))?.length === 1)
  check(`[${scheme}] 설정 목록 '12일 남음'`, await page.getByText(/12일 남음/).isVisible())
  await closeSettings()
  check(`[${scheme}] 홈 '기말고사까지 12일'`, (await ddayText()) === '기말고사까지 12일', String(await ddayText()))
  const sbAfter = await startBottom()
  check(`[${scheme}] D-day 줄이 생겨도 집중 시작 버튼 첫 화면 안`, sbAfter <= 844, `하단 y ${sbBefore} → ${sbAfter}`)
  await page.screenshot({ path: join(OUT, `01-home-dday-${scheme}.png`) })

  // 4. 내일 시험 추가 → 가장 가까운 것으로 바뀜
  await openSettings()
  await addExam('중간 발표', plus(1))
  await closeSettings()
  check(`[${scheme}] 더 가까운 시험으로 교체 '중간 발표까지 1일'`, (await ddayText()) === '중간 발표까지 1일', String(await ddayText()))

  // 5. 오늘 시험 → 당일 문구, 3개면 입력 숨김
  await openSettings()
  await addExam('모의고사', plus(0))
  check(`[${scheme}] 3개면 입력 숨김 + 안내`, (await page.getByRole('textbox', { name: '새 시험 이름' }).count()) === 0 && (await page.getByText('시험은 3개까지 적어 둘 수 있어요').isVisible()))
  await page.getByText('시험은 3개까지').scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(OUT, `02-settings-exams-${scheme}.png`) })
  await closeSettings()
  check(`[${scheme}] 당일 '오늘은 모의고사 날이에요'`, (await ddayText()) === '오늘은 모의고사 날이에요', String(await ddayText()))
  await page.screenshot({ path: join(OUT, `03-home-today-${scheme}.png`) })

  // 6. 지우기 → 입력 다시 보임, 다음 시험으로
  await openSettings()
  await page.getByRole('button', { name: '모의고사 지우기' }).click()
  await page.waitForTimeout(200)
  check(`[${scheme}] 지우면 입력 다시 보임`, await page.getByRole('textbox', { name: '새 시험 이름' }).isVisible())
  await closeSettings()
  check(`[${scheme}] 지운 뒤 '중간 발표까지 1일'`, (await ddayText()) === '중간 발표까지 1일')

  // 7. 지난 시험만 있음 (시드) → 줄 없음, 설정에도 안 보이고, 데이터는 남아 있음 · 한도는 지난 시험을 세지 않음
  await page.evaluate((v) => localStorage.setItem('study-garden:exams', v), JSON.stringify([
    { id: 'p1', name: '지난 퀴즈', date: plus(-3) },
    { id: 'p2', name: '지난 실기', date: plus(-1) },
    { id: 'p3', name: '작년 시험', date: plus(-400) },
  ]))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  check(`[${scheme}] 지난 시험만 → D-day 줄 없음`, (await ddayText()) === null)
  await openSettings()
  check(`[${scheme}] 지난 시험은 설정 목록에서도 숨김`, (await page.getByText('지난 퀴즈').count()) === 0)
  check(`[${scheme}] 지난 시험 3개여도 추가 가능 (한도는 앞으로의 시험만)`, await page.getByRole('textbox', { name: '새 시험 이름' }).isVisible())
  await closeSettings()
  check(`[${scheme}] 지난 시험 데이터 유지`, (await ls('study-garden:exams')).length === 3)

  await ctx.close()
}
await browser.close()
const failed = checks.filter((c) => !c).length
console.log(`\n${checks.length - failed}/${checks.length} 통과 · 콘솔 에러 ${errors}건`)
process.exit(failed || errors ? 2 : 0)
