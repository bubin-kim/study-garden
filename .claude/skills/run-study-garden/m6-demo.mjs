#!/usr/bin/env node
// docs/04 M2 — 예시 정원 구경하기 시나리오 (S1~S9, 2026-11-25 사용자 승인 표) + 스크린샷.
//   node m6-demo.mjs [--base=http://localhost:3210]
import { join } from 'node:path'
import { check, dateKey, finish, gotoApp, launch, openPage, outDir, seen, seed } from './lib.mjs'

const OUT = outDir('m6')
const today = dateKey(new Date())
const browser = await launch()

const snapshot = (page) =>
  page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])))

for (const scheme of ['light', 'dark']) {
  const { ctx, page } = await openPage(browser, scheme)
  const demoBtn = page.getByRole('button', { name: '예시 정원 구경하기' })
  const dialog = page.getByRole('dialog')
  const bottom = async (loc) => {
    const b = await loc.boundingBox()
    return Math.round(b.y + b.height)
  }
  const open = async () => {
    await demoBtn.click()
    await dialog.locator('svg[aria-label="정원"]').waitFor()
    await page.waitForTimeout(700)
  }

  // S1 빈 저장소 첫 방문 → 버튼 실제로 보임, 버튼·집중 시작 모두 첫 화면 안
  await gotoApp(page)
  await seed(page, {}, 1500)
  const bb = await bottom(demoBtn)
  const sb = await bottom(page.getByRole('button', { name: '집중 시작' }))
  check(`[${scheme}] S1 버튼 보임 · 첫 화면 안`, (await seen(demoBtn)) && bb <= 844 && sb <= 844, `버튼 하단 ${bb}, 집중 시작 하단 ${sb} / 844`)
  await page.screenshot({ path: join(OUT, `01-home-empty-${scheme}.png`) })

  // S2 시트 정원: 과목 식물 17그루, 목표 꽃 8송이
  await open()
  const plants = await dialog.locator('svg[aria-label="정원"] [data-species]').count()
  const flowers = await dialog.locator('svg[aria-label="정원"] [data-goal-flower]').count()
  check(`[${scheme}] S2 시트 정원 17그루 · 목표 꽃 8송이`, plants === 17 && flowers === 8, `${plants}그루 · ${flowers}송이`)

  // S3 시트 글자
  const txt = await dialog.innerText()
  const S3 = ['17그루 · 꽃 8송이', '11시간 30분', '17일', '8송이', '물리', '선형대수', '영어', '경제학']
  const missing = S3.filter((t) => !txt.includes(t))
  check(`[${scheme}] S3 캡션·숫자·과목 4개`, missing.length === 0, missing.length ? `없음: ${missing.join(', ')}` : '')
  await page.screenshot({ path: join(OUT, `02-sheet-${scheme}.png`) })
  await page.evaluate(() => (document.documentElement.dataset.season = 'winter'))
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT, `03-sheet-winter-${scheme}.png`) })
  await page.evaluate(() => delete document.documentElement.dataset.season)

  // S4 닫기: 버튼, 스크림
  await page.getByRole('button', { name: '내 정원 가꾸러 가기' }).click()
  await page.waitForTimeout(600)
  const closedByButton = (await dialog.count()) === 0
  await open()
  await page.mouse.click(195, 40)
  await page.waitForTimeout(600)
  check(`[${scheme}] S4 '내 정원 가꾸러 가기'·스크림으로 닫힘`, closedByButton && (await dialog.count()) === 0)

  // S5 데이터 무변경 — 집중 시간 45분·할 일 1개를 둔 상태에서 열고 닫아도 localStorage 그대로
  await seed(page, {
    duration: 45,
    tasks: [{ id: 'k1', date: today, title: '영어 단어', core: false, done: false, createdAt: '2026-01-01T00:00:00Z' }],
  }, 1500)
  const before = await snapshot(page)
  await open()
  await page.getByRole('button', { name: '내 정원 가꾸러 가기' }).click()
  await page.waitForTimeout(600)
  const after = await snapshot(page)
  check(
    `[${scheme}] S5 열고 닫아도 localStorage 그대로 · 홈은 빈 정원`,
    before === after && before.includes('study-garden:duration') && (await seen(page.getByText('정원이 첫 씨앗을 기다리고 있어요'))),
    `키 ${JSON.parse(before).length}개`,
  )

  // S6 세션 1개 → 버튼 없음
  await seed(page, { sessions: [{ id: 'one', completedAt: new Date().toISOString(), durationMin: 30 }] }, 1500)
  check(`[${scheme}] S6 세션 1개면 버튼 없음`, (await demoBtn.count()) === 0)

  // S7 집중 중 → 버튼 없음
  await seed(page, {}, 1500)
  await page.getByRole('button', { name: '집중 시작' }).click()
  await page.waitForTimeout(600)
  check(`[${scheme}] S7 집중 중이면 버튼 없음`, (await demoBtn.count()) === 0)
  await ctx.close()

  // S8 reduced-motion → 시트 정원 흔들림 none
  const rm = await openPage(browser, scheme, { reducedMotion: 'reduce' })
  await gotoApp(rm.page)
  await seed(rm.page, {}, 1500)
  await rm.page.getByRole('button', { name: '예시 정원 구경하기' }).click()
  await rm.page.getByRole('dialog').locator('svg[aria-label="정원"]').waitFor()
  const sway = await rm.page.getByRole('dialog').locator('.plant-sway').evaluateAll((es) => [...new Set(es.map((e) => getComputedStyle(e).animationName))])
  check(`[${scheme}] S8 reduced-motion: 시트 정원 흔들림 none`, sway.length === 1 && sway[0] === 'none', sway.join(','))
  await rm.ctx.close()
}
// S9 콘솔 에러 0 — finish()가 집계해 실패 처리한다
await finish(browser)
