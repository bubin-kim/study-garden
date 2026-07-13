#!/usr/bin/env node
// Study Garden 스크린샷 하네스.
// dev 서버(:3000)가 떠 있어야 한다 — 이 스크립트는 서버를 켜지 않는다 (SKILL.md 참조).
//
// 사용 예:
//   node shoot.mjs                                  # 3페이지 × 라이트/다크, 시드 포함
//   node shoot.mjs --pages=/ --schemes=dark         # 홈 다크만
//   node shoot.mjs --empty                          # 시드 없이 (엠티 스테이트)
//   node shoot.mjs --season=spring --pages=/        # 계절 강제 (벚꽃잎 확인)
//   node shoot.mjs --running --pages=/              # 집중 시작 누른 상태
//   node shoot.mjs --out=shots --wait=2500          # 출력 폴더/대기시간 조절
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)

const BASE = args.base ?? 'http://localhost:3000'
const PAGES = String(args.pages ?? '/,/records,/forest').split(',')
const SCHEMES = String(args.schemes ?? 'light,dark').split(',')
const WAIT = Number(args.wait ?? 1800) // 등장 애니메이션 + 계절 입자가 프레임에 들어올 시간
const OUT = join(here, String(args.out ?? 'screenshots'))
mkdirSync(OUT, { recursive: true })

// 이번 달 날짜로 세션 14개 시드 (60분씩 → 나무/꽃/잎/새싹 골고루)
function seedScript() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const sessions = Array.from({ length: 14 }, (_, i) => ({
    id: `seed-${i}`,
    completedAt: `${y}-${m}-${String(i + 1).padStart(2, '0')}T0${i % 10}:30:00.000Z`,
    durationMin: 60,
  }))
  return `localStorage.setItem('study-garden:sessions', ${JSON.stringify(JSON.stringify(sessions))})`
}

const pageName = (p) => (p === '/' ? 'home' : p.replace(/\//g, ''))

const res = await fetch(BASE).catch(() => null)
if (!res?.ok) {
  console.error(`✗ ${BASE} 응답 없음 — dev 서버를 먼저 켜세요 (npm run dev). 이미 떠 있다면 포트 확인.`)
  process.exit(1)
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
let errors = 0

for (const scheme of SCHEMES) {
  const ctx = await browser.newContext({
    colorScheme: scheme,
    viewport: { width: 430, height: 900 },
    deviceScaleFactor: 2,
  })
  if (!args.empty) await ctx.addInitScript(seedScript())
  const page = await ctx.newPage()
  // favicon 404(파비콘 없음, 앱 문제 아님)는 무시하고 실제 에러만 센다
  page.on('pageerror', (err) => {
    errors++
    console.error(`[${scheme}] page error: ${err.message}`)
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) {
      errors++
      console.error(`[${scheme}] console error: ${msg.text()}`)
    }
  })
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('favicon')) {
      errors++
      console.error(`[${scheme}] HTTP ${r.status()}: ${r.url()}`)
    }
  })

  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    if (args.season) {
      await page.evaluate((s) => {
        document.documentElement.dataset.season = s
      }, String(args.season))
    }
    await page.waitForTimeout(WAIT)
    const suffix = args.empty ? '-empty' : args.season ? `-${args.season}` : ''
    const file = join(OUT, `${pageName(path)}${suffix}-${scheme}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log(`✓ ${file}`)
  }

  if (args.running) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: '집중 시작' }).click()
    await page.waitForTimeout(2500) // 디밍 트랜지션(2s) 완료 대기
    const file = join(OUT, `home-running-${scheme}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log(`✓ ${file}`)
  }

  await ctx.close()
}

await browser.close()
console.log(errors ? `done — 콘솔 에러 ${errors}건 (위 로그 확인)` : 'done — 콘솔 에러 없음')
process.exit(errors ? 2 : 0)
