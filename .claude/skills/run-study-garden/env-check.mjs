#!/usr/bin/env node
// 공모전 접속 환경 점검 — PC 폭 3종 × 라이트/다크 + 인앱 브라우저 UA 흉내(모바일).
//   node env-check.mjs [--base=https://study-garden-omega.vercel.app]
// 한계: UA 흉내는 Chrome 엔진 그대로라 실제 WebView(WKWebView·Android WebView)의 저장소·다운로드
// 차이는 재현하지 못한다 — 앱 코드에 UA 분기가 없어 "UA 때문에 깨지는가"만 확인된다. 실기기 확인은 별도.
import { join } from 'node:path'
import { check, finish, gotoApp, launch, openPage, outDir, readLS, seen, seed } from './lib.mjs'

const OUT = outDir('env')
const now = new Date()
const sessions = Array.from({ length: 14 }, (_, i) => ({
  id: `seed-${i}`,
  completedAt: new Date(now.getFullYear(), now.getMonth(), Math.min(i + 1, now.getDate()), 9).toISOString(),
  durationMin: 60,
}))

const browser = await launch()

// 1. PC 폭
for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
  for (const scheme of ['light', 'dark']) {
    const tag = `${w}-${scheme}`
    const { ctx, page } = await openPage(browser, scheme, { viewport: { width: w, height: h }, deviceScaleFactor: 1 })
    await gotoApp(page)
    await seed(page, {}, 1500) // 빈 정원(평가자 첫 방문)
    const startEmpty = await page.getByRole('button', { name: '집중 시작' }).boundingBox()
    check(`[${tag}] 첫 방문: 집중 시작 버튼 첫 화면 안`, startEmpty && startEmpty.y + startEmpty.height <= h, `하단 y=${Math.round(startEmpty.y + startEmpty.height)} / ${h}`)
    check(`[${tag}] 첫 방문: 빈 정원 문구 보임`, await seen(page.getByText('정원이 첫 씨앗을 기다리고 있어요')))
    if (w === 1440) await page.screenshot({ path: join(OUT, `home-empty-${tag}.png`) })

    await seed(page, { sessions }, 1500)
    for (const path of ['/', '/records', '/forest']) {
      if (path !== '/') {
        await page.goto(page.url().replace(/\/[^/]*$/, path), { waitUntil: 'networkidle' })
        await page.waitForTimeout(1500)
      }
      const m = await page.evaluate(() => {
        const main = document.querySelector('main').getBoundingClientRect()
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          mainW: Math.round(main.width),
          centerOff: Math.round(main.left + main.width / 2 - document.documentElement.clientWidth / 2),
        }
      })
      const name = path === '/' ? 'home' : path.slice(1)
      check(`[${tag}] ${name}: 가로 스크롤 없음 · 가운데 정렬`, m.overflow === 0 && Math.abs(m.centerOff) <= 1, `main ${m.mainW}px, 중심 오차 ${m.centerOff}px`)
      if (w === 1440 || (w === 1920 && path === '/')) await page.screenshot({ path: join(OUT, `${name}-${tag}.png`), fullPage: true })
    }
    await ctx.close()
  }
}

// 2. 인앱 브라우저 UA 흉내 (모바일 390×844)
const UAS = {
  kakaotalk: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.8.0',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0',
  naver: 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.0.0)',
}
for (const [name, userAgent] of Object.entries(UAS)) {
  const { ctx, page } = await openPage(browser, 'light', { userAgent })
  await gotoApp(page)
  await seed(page, { sessions }, 1500)
  check(`[${name}] 정원 보임`, await seen(page.locator('svg[aria-label="정원"]').first()))
  await page.reload({ waitUntil: 'networkidle' })
  check(`[${name}] 새로고침 후 기록 유지`, (await readLS(page, 'sessions'))?.length === 14)
  await page.screenshot({ path: join(OUT, `inapp-${name}.png`) })
  await ctx.close()
}

await finish(browser)
