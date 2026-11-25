#!/usr/bin/env node
// docs/03 M1 — 오늘의 목표 체크리스트 시나리오 검증 + 스크린샷.
// 시드는 첫 방문에 한 번만 넣는다(addInitScript 아님) — 새로고침 후 유지를 확인하기 위해.
//   node m1-goals.mjs [--base=http://localhost:3210]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice(7) ?? 'http://localhost:3210'
const OUT = join(here, 'screenshots', 'm1')
mkdirSync(OUT, { recursive: true })

const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const now = new Date()
const today = key(now)
const yesterday = key(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

const sessions = Array.from({ length: 14 }, (_, i) => ({
  id: `seed-${i}`,
  completedAt: new Date(now.getFullYear(), now.getMonth(), Math.min(i + 1, now.getDate()), 9).toISOString(),
  durationMin: 60,
}))
const yTasks = [
  { id: 'y1', date: yesterday, title: '선형대수 3장 문제 풀기', core: true, done: false, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'y2', date: yesterday, title: '영단어 Day 12', core: false, done: false, createdAt: '2026-01-01T00:00:01Z' },
  { id: 'y3', date: yesterday, title: '끝낸 일', core: false, done: true, createdAt: '2026-01-01T00:00:02Z' },
]

const checks = []
const check = (name, ok, detail = '') => {
  checks.push({ name, ok })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
let errors = 0

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => (errors++, console.error(`[${scheme}] page error: ${e.message}`)))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
      errors++
      console.error(`[${scheme}] console: ${m.text()}`)
    }
  })
  const shot = async (name) => {
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(OUT, `${name}-${scheme}.png`), fullPage: true })
  }
  const card = page.locator('section', { has: page.getByRole('button', { name: /오늘의 목표/ }) })
  const header = page.getByRole('button', { name: /오늘의 목표/ })
  const startBottom = async () => {
    const b = await page.getByRole('button', { name: '집중 시작' }).boundingBox()
    return Math.round(b.y + b.height)
  }

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  if ((await page.title()) !== 'Study Garden') throw new Error('다른 앱이 떠 있음')
  await page.evaluate(
    ([s, t]) => {
      localStorage.setItem('study-garden:sessions', s)
      localStorage.setItem('study-garden:tasks', t)
    },
    [JSON.stringify(sessions), JSON.stringify(yTasks)],
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  // 1. 접힘 기본 + 빈 오늘
  check(`[${scheme}] 접힘 상태 요약 문구`, (await header.innerText()).includes('오늘 가꿀 목표를 적어 보세요'))
  const sbCollapsed = await startBottom()
  check(`[${scheme}] 접힘: 집중 시작 버튼 첫 화면 안`, sbCollapsed <= 844, `버튼 하단 y=${sbCollapsed} / 뷰포트 844`)
  await shot('01-collapsed-empty')

  // 2. 펼침 → 어제 남은 할 일 가져오기 (미완료 2개만)
  await header.click()
  await page.waitForTimeout(400)
  const carryBtn = page.getByRole('button', { name: /어제 남은 할 일 2개 가져오기/ })
  check(`[${scheme}] 가져오기 버튼에 미완료 2개 표시`, await carryBtn.isVisible())
  await shot('02-expanded-empty')
  await carryBtn.click()
  await page.waitForTimeout(300)
  check(`[${scheme}] 가져온 뒤 오늘 항목 2개`, (await card.getByRole('checkbox').count()) === 2)
  check(`[${scheme}] 가져온 뒤 버튼 사라짐`, (await page.getByRole('button', { name: /가져오기/ }).count()) === 0)

  // 3. 할 일 추가 3개 → 8개 상태까지 만들기 전 3개짜리 스냅샷
  const input = page.getByRole('textbox', { name: '새 할 일' })
  for (const t of ['통계학 과제 2번', '전공 강의 복습']) {
    await input.fill(t)
    await input.press('Enter')
  }
  await page.waitForTimeout(300)
  check(`[${scheme}] 추가 후 항목 4개`, (await card.getByRole('checkbox').count()) === 4)
  check(`[${scheme}] 핵심 0개 안내 문구`, await page.getByText('별을 눌러 오늘 꼭 해낼').isVisible())

  // 4. 핵심 2개 지정
  const stars = card.getByRole('button', { name: '핵심 목표로 정하기' })
  await stars.nth(0).click()
  await card.getByRole('button', { name: '핵심 목표로 정하기' }).nth(1).click()
  await page.waitForTimeout(300)
  check(`[${scheme}] 핵심 2개 → 요약 '핵심 0/2'`, (await header.innerText()).includes('핵심 0/2'))
  await shot('03-core-0of2')

  // 5. 핵심 1개 완료
  const coreRows = card.locator('li', { has: page.getByRole('button', { name: '핵심 목표에서 빼기' }) })
  await coreRows.nth(0).getByRole('checkbox').click()
  await page.waitForTimeout(300)
  check(`[${scheme}] 핵심 1개 완료 → '핵심 1/2'`, (await header.innerText()).includes('핵심 1/2'))

  // 6. 핵심 3개 한도
  await card.getByRole('button', { name: '핵심 목표로 정하기' }).nth(0).click()
  await page.waitForTimeout(200)
  const remaining = card.getByRole('button', { name: '핵심 목표로 정하기' })
  const disabledAll = await remaining.evaluateAll((els) => els.length > 0 && els.every((e) => e.disabled))
  check(`[${scheme}] 핵심 3개면 나머지 별 비활성`, disabledAll)
  await shot('04-core-full')

  // 7. 핵심 모두 완료 → 달성
  for (let i = 0; i < 3; i++) {
    const row = card.locator('li', { has: page.getByRole('button', { name: '핵심 목표에서 빼기' }) }).nth(i)
    const cb = row.getByRole('checkbox')
    if ((await cb.getAttribute('aria-checked')) !== 'true') await cb.click()
  }
  await page.waitForTimeout(300)
  check(`[${scheme}] 핵심 모두 완료 → 달성 문구`, (await header.innerText()).includes('핵심 목표를 모두 가꿨어요'))
  await shot('05-achieved')

  // 8. 새로고침 후 유지
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  check(`[${scheme}] 새로고침 후 달성 상태 유지`, (await header.innerText()).includes('핵심 목표를 모두 가꿨어요'))
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('study-garden:tasks')))
  const yStill = stored.filter((t) => t.id.startsWith('y')).length
  check(`[${scheme}] 어제 원본 3개 그대로 (복사)`, yStill === 3)
  check(`[${scheme}] 오늘 항목 저장 4개`, stored.filter((t) => t.date === today).length === 4)

  // 9. 측정 계획 3 — 8개 상태에서 버튼 위치
  await header.click()
  await page.waitForTimeout(400)
  for (const t of ['과외 준비', '독서 30쪽', '실험 보고서 초안', '메일 답장']) {
    await input.fill(t)
    await input.press('Enter')
  }
  await page.waitForTimeout(300)
  const sbExpanded8 = await startBottom()
  check(`[${scheme}] 펼침 8개: 집중 시작 버튼 첫 화면 안`, sbExpanded8 <= 844, `버튼 하단 y=${sbExpanded8}`)
  await shot('06-expanded-8')

  await ctx.close()
}
await browser.close()

const failed = checks.filter((c) => !c.ok).length
console.log(`\n${checks.length - failed}/${checks.length} 통과 · 콘솔 에러 ${errors}건`)
process.exit(failed || errors ? 2 : 0)
