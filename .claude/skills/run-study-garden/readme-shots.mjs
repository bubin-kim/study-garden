#!/usr/bin/env node
// README·공모전 자료용 스크린샷 (docs/03 M6). 한 달 실사용처럼 보이는 시드로 찍는다.
//   node readme-shots.mjs [--base=http://localhost:3210] [--out=../../../docs/screenshots]
// 시드는 데모용이며 골든 케이스가 아니다. 하루 30분 안팎의 가벼운 달로 맞췄다 — 하루 1시간 이상이면
// 이른 식물이 대부분 나무가 되어 과목 꽃색이 거의 안 보인다(2026-11-25 실측: 26시간 달 → 28그루 중 꽃 4~5).
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { arg, BASE, dateKey as key, finish, gotoApp, here, launch, openPage } from './lib.mjs'

const OUT = resolve(here, arg('out', '../../../docs/screenshots'))
mkdirSync(OUT, { recursive: true })

const now = new Date()
const day = (n) => new Date(now.getFullYear(), now.getMonth(), n)
const plus = (n) => key(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n))
const today = key(now)

const subjects = [
  { id: 'la', name: '선형대수', species: 0 },
  { id: 'en', name: '영어', species: 3 },
  { id: 'ph', name: '물리', species: 2 },
  { id: 'ec', name: '경제학', species: 1 },
]
const rot = ['la', 'en', 'ph', 'la', 'ec', undefined, 'en', 'la', 'ph', 'ec']
const sessions = []
for (let d = 1; d < now.getDate(); d++) {
  if (d % 7 === 0) continue // 쉬는 날
  const count = d % 5 === 0 ? 2 : 1
  for (let k = 0; k < count; k++) {
    const sid = rot[(d * 2 + k) % rot.length]
    sessions.push({
      id: `r${d}-${k}`,
      completedAt: new Date(day(d).getTime() + (10 + k * 5) * 3600e3).toISOString(),
      durationMin: [30, 25, 30, 45][(d + k) % 4],
      ...(sid && { subjectId: sid }),
    })
  }
}
let seq = 0
const T = (date, title, core, done, subjectId) => ({
  id: `t${++seq}`, date, title, core, done, createdAt: `2026-01-01T00:00:${String(seq).padStart(2, '0')}Z`,
  ...(subjectId && { subjectId }),
})
const achieved = [2, 4, 8, 11, 15, 18, 22].filter((n) => n < now.getDate())
const tasks = [
  ...achieved.flatMap((n) => [T(key(day(n)), '문제 풀이', true, true, 'la'), T(key(day(n)), '단어 복습', true, true, 'en')]),
  T(today, '선형대수 5장 연습문제', true, true, 'la'),
  T(today, '영어 리딩 2지문', true, false, 'en'),
  T(today, '물리 실험 보고서 초안', false, false, 'ph'),
]
const exams = [{ id: 'x1', name: '기말고사', date: plus(18) }]

const browser = await launch()

// --seasons: 홈(자란 정원)만 4계절 × 라이트/다크로 → home-<계절>-<scheme>.png (공모전 대표 이미지용)
if (process.argv.includes('--seasons')) {
  for (const scheme of ['light', 'dark']) {
    const { ctx, page } = await openPage(browser, scheme)
    await gotoApp(page)
    await page.evaluate(([s, t, sub, ex]) => {
      localStorage.clear()
      localStorage.setItem('study-garden:sessions', s)
      localStorage.setItem('study-garden:tasks', t)
      localStorage.setItem('study-garden:subjects', sub)
      localStorage.setItem('study-garden:exams', ex)
    }, [JSON.stringify(sessions), JSON.stringify(tasks), JSON.stringify(subjects), JSON.stringify(exams)])
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      await page.evaluate((s) => (document.documentElement.dataset.season = s), season)
      await page.waitForTimeout(2500) // 계절 입자가 프레임에 들어올 시간
      await page.screenshot({ path: join(OUT, `home-${season}-${scheme}.png`) })
    }
    await ctx.close()
  }
  console.log(`저장: ${OUT} (4계절 × 라이트/다크)`)
  await finish(browser)
}

for (const scheme of ['light', 'dark']) {
  const { ctx, page } = await openPage(browser, scheme, { acceptDownloads: true })
  await gotoApp(page)
  await page.evaluate(([s, t, sub, ex]) => {
    localStorage.clear()
    localStorage.setItem('study-garden:sessions', s)
    localStorage.setItem('study-garden:tasks', t)
    localStorage.setItem('study-garden:subjects', sub)
    localStorage.setItem('study-garden:exams', ex)
  }, [JSON.stringify(sessions), JSON.stringify(tasks), JSON.stringify(subjects), JSON.stringify(exams)])
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: join(OUT, `home-${scheme}.png`) })

  // 오늘의 목표 펼침
  await page.getByRole('button', { name: /오늘의 목표/ }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(OUT, `goals-${scheme}.png`), fullPage: true })
  await page.getByRole('button', { name: /오늘의 목표/ }).click()
  await page.waitForTimeout(400)

  // 무엇을 가꿀까요
  await page.getByRole('button', { name: /무엇을 가꿀까요/ }).click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT, `focus-picker-${scheme}.png`) })
  await page.getByRole('dialog').getByRole('button', { name: /영어 리딩/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: '집중 시작' }).click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: join(OUT, `home-running-${scheme}.png`) })
  // 진행 중 타이머를 저장소에서 지우고 새로고침 → 대기 상태로 (포기 확인 UI를 거치지 않음)
  await page.evaluate(() => localStorage.removeItem('study-garden:timer'))
  await page.reload({ waitUntil: 'networkidle' })

  // 기록 + 정리 카드 + 내보낸 PNG
  await page.goto(BASE + '/records', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: join(OUT, `records-${scheme}.png`), fullPage: true })
  const card = page.getByRole('region', { name: '한 달 정리' })
  await card.scrollIntoViewIfNeeded()
  await card.screenshot({ path: join(OUT, `summary-card-${scheme}.png`) })
  await page.evaluate(() => (navigator.canShare = () => false))
  const [dl] = await Promise.all([page.waitForEvent('download'), card.getByRole('button', { name: '이미지로 저장' }).click()])
  await dl.saveAs(join(OUT, `summary-export-${scheme}.png`))

  // 숲
  await page.goto(BASE + '/forest', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: join(OUT, `forest-${scheme}.png`), fullPage: true })

  // 설정 — 과목·시험
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: /분 집중/ }).click()
  await page.waitForTimeout(600)
  await page.mouse.move(5, 5) // 호버 자국 없이
  await page.getByRole('dialog').getByText('기말고사').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, `settings-${scheme}.png`) })
  await ctx.close()
}
// 첫 방문(엠티 스테이트)
{
  const { ctx, page } = await openPage(browser, 'light')
  await gotoApp(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: join(OUT, 'home-empty-light.png') })
  await ctx.close()
}
console.log(`저장: ${OUT}`)
await finish(browser)
