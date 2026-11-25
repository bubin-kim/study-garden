#!/usr/bin/env node
// docs/03 M3 — 과목·식물 종·"무엇을 가꿀까요" 시나리오 검증 + 스크린샷.
//   node m3-subjects.mjs [--base=http://localhost:3210]
import { join } from 'node:path'
import { check, finish, gotoApp, launch, openPage, outDir, seen } from './lib.mjs'

const OUT = outDir('m3')

const browser = await launch()

for (const scheme of ['light', 'dark']) {
  const { ctx, page } = await openPage(browser, scheme)
  const shot = (name, full = true) => page.screenshot({ path: join(OUT, `${name}-${scheme}.png`), fullPage: full })
  const ls = (k) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), k)

  await gotoApp(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  check(`[${scheme}] 과목·할 일 없으면 '무엇을 가꿀까요' 칩 숨김`, (await page.getByRole('button', { name: /무엇을 가꿀까요/ }).count()) === 0)

  // 1. 설정 → 과목 5개 추가 → 한도
  await page.getByRole('button', { name: /분 집중/ }).click()
  await page.waitForTimeout(500)
  const subjInput = page.getByRole('textbox', { name: '새 과목' })
  for (const n of ['수학', '영어', '물리', '경제', '국어']) {
    await subjInput.fill(n)
    await subjInput.press('Enter')
    await page.waitForTimeout(120)
  }
  const subs = await ls('study-garden:subjects')
  check(`[${scheme}] 과목 5개 저장, 종 0~4 고유`, subs.length === 5 && new Set(subs.map((s) => s.species)).size === 5, JSON.stringify(subs.map((s) => s.species)))
  check(`[${scheme}] 5개면 추가 입력 숨김 + 안내`, (await subjInput.count()) === 0 && (await seen(page.getByText('과목은 5개까지 가꿀 수 있어요'))))
  await shot('01-settings-subjects', false)

  // 2. 보관 (두 번 눌러야) → 4개 활성, 새로 추가하면 보관된 종을 다시 쓴다
  const archiveBtn = page.getByRole('button', { name: '보관' }).nth(4)
  await archiveBtn.click()
  check(`[${scheme}] 보관 한 번 → 확인 문구`, await seen(page.getByRole('button', { name: '한 번 더 누르면 보관' })))
  await page.getByRole('button', { name: '한 번 더 누르면 보관' }).click()
  await page.waitForTimeout(200)
  check(`[${scheme}] 보관 후 안내 '보관한 과목의 꽃은…'`, await seen(page.getByText('보관한 과목의 꽃은 정원에 그대로 남아 있어요')))
  await page.getByRole('textbox', { name: '새 과목' }).fill('화학')
  await page.getByRole('textbox', { name: '새 과목' }).press('Enter')
  await page.waitForTimeout(200)
  const subs2 = await ls('study-garden:subjects')
  const chem = subs2.find((s) => s.name === '화학')
  check(`[${scheme}] 보관된 '국어'(종4) 자리를 '화학'이 다시 씀, 국어는 보관 유지`, chem?.species === 4 && subs2.find((s) => s.name === '국어')?.archived === true)
  await page.mouse.click(195, 40) // 스크림 클릭 → 닫기
  await page.waitForTimeout(500)

  // 3. 할 일에 과목 붙이기
  await page.getByRole('button', { name: /오늘의 목표/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('combobox', { name: '새 할 일 과목' }).selectOption({ label: '수학' })
  await page.getByRole('textbox', { name: '새 할 일' }).fill('선형대수 3장')
  await page.getByRole('textbox', { name: '새 할 일' }).press('Enter')
  await page.waitForTimeout(250)
  const math = subs2.find((s) => s.name === '수학')
  let tasks = await ls('study-garden:tasks')
  check(`[${scheme}] 새 할 일에 과목 저장`, tasks[0]?.subjectId === math.id)
  await page.getByRole('combobox', { name: '선형대수 3장 과목' }).selectOption({ label: '영어' })
  await page.waitForTimeout(200)
  tasks = await ls('study-garden:tasks')
  const eng = subs2.find((s) => s.name === '영어')
  check(`[${scheme}] 행에서 과목 변경`, tasks[0]?.subjectId === eng.id)
  await page.getByRole('combobox', { name: '선형대수 3장 과목' }).selectOption({ label: '수학' })
  await page.waitForTimeout(200)
  await shot('02-goals-with-subjects')

  // 4. 무엇을 가꿀까요 → 할 일 선택 → 시작 → 새로고침해도 유지
  await page.getByRole('button', { name: /무엇을 가꿀까요/ }).click()
  await page.waitForTimeout(500)
  await shot('03-focus-picker', false)
  await page.getByRole('dialog').getByRole('button', { name: /선형대수 3장/ }).click()
  await page.waitForTimeout(500)
  check(`[${scheme}] 칩 라벨이 고른 할 일`, await seen(page.getByRole('button', { name: /선형대수 3장/ }).first()))
  await page.getByRole('button', { name: '집중 시작' }).click()
  await page.waitForTimeout(300)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  check(`[${scheme}] 진행 중 새로고침 → 칩에 할 일 유지`, await seen(page.locator('section').filter({ hasText: '일시정지' }).getByText('선형대수 3장')))

  // 5. 자리를 비운 사이 끝남(복원 경로) → 세션에 과목·할 일 저장 + 오버레이에서 할 일 체크
  await page.evaluate(() => {
    const t = JSON.parse(localStorage.getItem('study-garden:timer'))
    t.endAt = Date.now() - 1000
    localStorage.setItem('study-garden:timer', JSON.stringify(t))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const sessions = await ls('study-garden:sessions')
  check(`[${scheme}] 세션에 subjectId·taskId 저장`, sessions.length === 1 && sessions[0].subjectId === math.id && sessions[0].taskId === tasks[0].id)
  const ovCheck = page.getByRole('checkbox', { name: /이 할 일도 마쳤어요/ })
  check(`[${scheme}] 완료 오버레이에 할 일 체크 (opacity 1까지)`, await seen(ovCheck))
  await shot('04-complete-overlay', false)
  await ovCheck.click()
  await page.waitForTimeout(200)
  tasks = await ls('study-garden:tasks')
  check(`[${scheme}] 오버레이 체크 → 할 일 완료`, tasks[0].done === true)
  await page.getByRole('button', { name: '정원으로' }).click()
  await page.waitForTimeout(400)

  // 6. 과목만 고르고 tick 경로로 완료 (새로고침 없이 화면을 켜 둔 채 시간이 다 됨)
  // 가짜 시계는 여기서만: 설치 후 새로고침을 거듭하면 framer 애니메이션이 opacity 0에
  // 멈춘 채 남는다(실측) — 앞 단계 스크린샷이 빈 화면이 됐던 원인.
  await page.clock.install()
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: /무엇을 가꿀까요/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('dialog').getByRole('button', { name: /^영어$/ }).click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: '집중 시작' }).click()
  await page.waitForTimeout(200)
  await page.clock.fastForward('30:05')
  await page.waitForTimeout(1200)
  const s2 = await ls('study-garden:sessions')
  check(`[${scheme}] 과목만 고른 세션 → subjectId만`, s2.length === 2 && s2[1].subjectId === eng.id && s2[1].taskId === undefined)
  check(`[${scheme}] 할 일 없는 세션은 오버레이에 체크 없음`, (await page.getByRole('checkbox', { name: /이 할 일도 마쳤어요/ }).count()) === 0)
  await page.getByRole('button', { name: '정원으로' }).click()

  // 7. 종 렌더 — 꽃 단계까지 키운 시드. 가짜 시계가 없는 새 컨텍스트에서 (6단계 시계가 남으면
  //    애니메이션이 opacity 0에 멈춰 빈 화면이 찍힌다 — 실측)
  const subjSnapshot = await ls('study-garden:subjects')
  await ctx.close()
  const { ctx: ctx2, page: page2 } = await openPage(browser, scheme)
  await gotoApp(page2)
  const now = new Date()
  const at = (d) => new Date(now.getFullYear(), now.getMonth(), d, 9).toISOString()
  const seeded = [
    ...subs2.map((s, i) => ({ id: `sp${i}`, completedAt: at(1 + i), durationMin: 10, subjectId: s.id })),
    { id: 'big', completedAt: at(10), durationMin: 300 },
  ]
  await page2.evaluate(([v, sub]) => {
    localStorage.clear()
    localStorage.setItem('study-garden:sessions', v)
    localStorage.setItem('study-garden:subjects', sub)
  }, [JSON.stringify(seeded), JSON.stringify(subjSnapshot)])
  await page2.reload({ waitUntil: 'networkidle' })
  await page2.waitForTimeout(1500)
  check(`[${scheme}] 정원이 실제로 보임 (opacity 1까지)`, await seen(page2.locator('svg[aria-label="정원"]').first()))
  const species = await page2.locator('svg[aria-label="정원"] [data-species]').evaluateAll((es) => es.map((e) => e.getAttribute('data-species')).sort().join(','))
  check(`[${scheme}] 보관 과목 포함 6세션 → 종 표시 (국어=4, 화학=4)`, species === '0,1,2,3,4,4', species)
  await page2.screenshot({ path: join(OUT, `05-garden-species-${scheme}.png`), fullPage: true })
  await ctx2.close()
}
await finish(browser)
