// 시나리오 스크립트 공용 helper (docs/retrospective.md 환경 개선 환류 4).
// m1~m5·readme-shots가 복사해 쓰던 인자·체크·에러 감시·앱 확인·날짜 키를 한곳에 모았다.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const here = dirname(fileURLToPath(import.meta.url))

/** `--key=value` 인자. 없으면 기본값 */
export const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d
export const BASE = arg('base', 'http://localhost:3210')

/** screenshots/<name> 폴더를 만들고 경로를 돌려준다 */
export function outDir(name) {
  const dir = join(here, 'screenshots', name)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** 로컬 날짜 키 'YYYY-MM-DD' (앱의 today와 같은 규칙) */
export const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const checks = []
let errors = 0

/** ✓/✗ 한 줄 출력 + 집계 */
export function check(name, ok, detail = '') {
  checks.push(!!ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

export const launch = () => chromium.launch({ channel: 'chrome', headless: true })

/**
 * 390×844 @2x 모바일 컨텍스트 + 페이지. pageerror·console error를 센다
 * (Failed to load resource — 파비콘 404 등 — 는 앱 문제가 아니라 제외).
 */
export async function openPage(browser, scheme = 'light', opts = {}) {
  const ctx = await browser.newContext({
    colorScheme: scheme,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    ...opts,
  })
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
  return { ctx, page }
}

/** 첫 이동 + 다른 앱이 떠 있지 않은지 확인 (포트 혼용 사고 방지 — SKILL.md Gotchas) */
export async function gotoApp(page, path = '/') {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  if ((await page.title()) !== 'Study Garden') throw new Error(`${BASE}에 Study Garden이 아닌 앱이 떠 있음`)
}

/** localStorage를 비우고 {키 접미사: 값} 시드 후 새로고침. 값은 JSON으로 저장 */
export async function seed(page, data, wait = 1000) {
  await page.evaluate((entries) => {
    localStorage.clear()
    for (const [k, v] of entries) localStorage.setItem(`study-garden:${k}`, v)
  }, Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(wait)
}

export const readLS = (page, k) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(`study-garden:${key}`) ?? 'null'), k)

/**
 * "실제로 보인다" — isVisible()에 조상 opacity 1 확인을 더한다.
 * isVisible()은 opacity를 보지 않아, framer 애니메이션이 opacity 0에 멈춘 빈 화면에서도
 * 통과한 적이 있다 (SKILL.md Gotchas, 2026-11-25). "보임" 검사는 항상 이걸 쓴다.
 */
export async function seen(locator) {
  if (!(await locator.isVisible())) return false
  return locator.evaluate((el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      if (getComputedStyle(e).opacity !== '1') return false
    }
    return true
  })
}

/** 결과 한 줄 + exit code (실패나 콘솔 에러가 있으면 2) */
export async function finish(browser) {
  await browser.close()
  const failed = checks.filter((c) => !c).length
  console.log(`\n${checks.length - failed}/${checks.length} 통과 · 콘솔 에러 ${errors}건`)
  process.exit(failed || errors ? 2 : 0)
}
