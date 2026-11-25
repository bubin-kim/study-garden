---
name: run-study-garden
description: Study Garden을 실제 브라우저로 확인 — dev 서버에 접속해 라이트/다크 × 홈·기록·숲 스크린샷을 찍는다. 엠티 스테이트, 집중 중 상태, 계절 강제(봄·가을·겨울 입자 확인)도 지원. "실행해서 보여줘", "스크린샷 찍어줘", "다크모드 확인", "계절 바꿔서 확인" 요청과 UI 변경 후 완료 보고 전 검증에 사용.
---

UI를 바꿨으면 빌드 통과만으로 "된다"고 하지 않는다 — 이 스킬로 실제 렌더링을
눈으로 확인한 뒤 완료라고 보고한다 (CLAUDE.md "완료의 정의").

## 전제

- **dev 서버가 :3210(전용 고정 포트)에 떠 있어야 한다.** 이 스킬은 서버를 켜지 않는다.
  (`lsof -i :3210 -sTCP:LISTEN`으로 확인.) `npm run dev`에 -p 3210이 내장되어 있다.
  Next.js는 같은 프로젝트로 두 번째 dev 서버를 **거부**하므로 절대 새로 띄우려
  하지 말고, 없을 때만 `npm run dev`를 백그라운드로 켠다.
- 최초 1회 셋업 (스킬 폴더에만 설치, 프로젝트 의존성 안 건드림):
  ```bash
  cd .claude/skills/run-study-garden && npm init -y >/dev/null && npm i playwright-core --no-audit --no-fund
  ```
  시스템 Chrome을 쓰므로(`channel: 'chrome'`) Chromium 다운로드 없음.

## 사용

```bash
cd .claude/skills/run-study-garden
node shoot.mjs                              # 기본: 3페이지 × 라이트/다크, 세션 14개 시드
node shoot.mjs --empty --pages=/            # 엠티 스테이트 (시드 없음)
node shoot.mjs --running --pages=/          # 집중 시작 누른 상태 (글로우·디밍·씨앗)
node shoot.mjs --season=spring --pages=/    # 계절 강제 — spring|summer|autumn|winter
node shoot.mjs --schemes=dark --wait=2500   # 다크만, 대기 늘리기
```

결과는 `screenshots/`에 `<페이지>[-상태]-<scheme>.png`. 스크립트가 콘솔 에러를
감지하면 exit code 2 — **에러가 있으면 스크린샷이 예뻐도 실패로 취급한다.**

## 계절 입자 확인 요령

벚꽃잎(5.5s)·낙엽(6s)·눈송이(8~10s)는 주기 애니메이션이라 한 프레임에 안 잡힐 수
있다. `--wait`를 바꿔 2~3장 찍거나, 같은 계절을 두 번 실행해서 확인한다.
반딧불(여름)은 라이트 모드에서 의도적으로 옅다(0.65) — 다크에서 확인.

## 디자인 리뷰 갤러리 (사용자에게 보여줄 때)

스크린샷 여러 장을 사용자에게 보여줄 때는 채팅에 나열하지 말고 HTML 갤러리로
만들어 Artifact로 게시한다:
- 페이지별로 라이트/다크 나란히, base64 데이터 URI로 인라인 (외부 요청 차단됨)
- 같은 아티팩트를 갱신할 때는 **같은 파일 경로로 재게시**해야 URL이 유지된다

## 기능별 시나리오 스크립트

공용 helper는 `lib.mjs` — 인자(`--base=`)·`check()`·에러 감시(`openPage`)·앱 확인(`gotoApp`)·
`seed()`·`readLS()`·`dateKey()`·`finish()`(집계 + exit 2). **"보인다" 검사는 `isVisible()` 대신 항상
`seen(locator)`** — 조상 opacity 1까지 확인한다. 새 시나리오는 m4-dday.mjs를 본보기로 이 helper로 쓴다.

- `node m1-goals.mjs` — docs/03 M1 오늘의 목표: 가져오기·추가·핵심 지정·한도·달성·새로고침 유지를
  라이트/다크로 검사(✓/✗ 출력)하고 `screenshots/m1/`에 단계별 스크린샷. 실패나 콘솔 에러가 있으면 exit 2.
- `node m2-flowers.mjs` — docs/03 M2 달성 꽃: 꽃 개수·캡션·피어나는 순간·체크 해제·캘린더 표시·
  지난 날 읽기 전용·reduced-motion 검사 + `screenshots/m2/`에 4계절 × 라이트/다크 정원.
- `node m3-subjects.mjs` — docs/03 M3 과목: 과목 5개·보관·할 일 과목·무엇을 가꿀까요·복원/tick 두 완료
  경로의 세션 저장·완료 오버레이·종 렌더. `screenshots/m3/`.
- `node m4-dday.mjs` — docs/03 M4 시험 D-day: 없음·지난 날짜·가까운 시험 교체·당일 문구·3개 한도·지우기·지난 시험 숨김. `screenshots/m4/`.
- `node m5-summary.mjs` — docs/03 M5 월간 정리: 합계·공부한 날·과목 순서·비율 합 100·PNG 다운로드·share() 경로·빈 달. `screenshots/m5/`(내보낸 PNG 포함).
- `node env-check.mjs --base=https://study-garden-omega.vercel.app` — 공모전 접속 환경 점검: PC 1280·1440·1920 × 라이트/다크(첫 화면 버튼·가로 스크롤·가운데 정렬) + 인앱 브라우저 UA 흉내 3종. `screenshots/env/`. **UA 흉내는 Chrome 엔진 그대로라 실제 WebView의 저장소·다운로드 차이는 못 잡는다** — 실기기 확인은 별도.
- `node readme-shots.mjs` — README·공모전용 스크린샷을 `docs/screenshots/`에 덮어쓴다. **프로덕션 서버(`next build && npm run start`)로 찍는다** — dev 서버는 좌하단 N 배지가 찍힌다. 시드는 하루 ~30분 연출용.

## Gotchas

- **`shoot.mjs`의 시드는 `addInitScript`라 페이지 이동마다 localStorage를 다시 덮어쓴다.**
  새로고침 후 유지 같은 시나리오는 확인할 수 없다 — 첫 방문에 `page.evaluate`로 한 번만
  시드하는 `m1-goals.mjs` 방식을 쓴다 (2026-11-25).
- **문구가 바뀌는 순간을 검사할 땐 `AnimatePresence mode="wait"` 시간을 더한다.** 홈 캡션은 이전
  문구 0.35s 퇴장 뒤 등장 — 새 문구는 ~430ms부터 보인다. 350ms 검사가 라이트에서만 우연히
  실패한 적 있음 (2026-11-25).
- **`page.clock.install()` 뒤 새로고침을 거듭하면 framer 애니메이션이 opacity 0에 멈춘다** —
  스크린샷이 헤더만 있는 빈 화면이 되는데 `isVisible()`은 opacity를 안 봐서 검사는 통과한다.
  시계는 필요한 단계 직전에만 설치하고, "보인다" 검사는 `lib.mjs`의 `seen()`을 쓴다 (2026-11-25 재현 —
  `main` opacity 0에서 isVisible true / seen false 확인).
- 입력창에 타이핑하면 포커스 때문에 페이지가 스크롤된다. `boundingBox()`의 y는 뷰포트
  기준이라, 스크롤 뒤에 잰 값을 위치 변화로 오해하지 말 것 (2026-11-25 실측).

- **측정 전에 `<title>`이 Study Garden인지 먼저 검증한다.** 이 컴퓨터는 여러 프로젝트의
  dev 서버가 포트를 옮겨 다닌다 — :3210이 아닌 포트를 쓸 일이 생기면 `--base=`로 지정한다.
  (2026-07-15: 포트 혼용 탓에 "정원이 사라졌다" 오인 사고가 있었다. localStorage는 origin
  단위라 포트가 바뀌면 빈 정원이 보인다. 그래서 :3210을 전용 포트로 고정했다.)
- **`next build` 직후 같은 `.next`로 dev를 켜면 Turbopack이 패닉**("Failed to write app
  endpoint … Next.js package not found")하고, HMR이 전면 새로고침 무한 루프를 돌아
  `networkidle`이 영원히 타임아웃된다 (2026-07-13 실측, Next 16.2.10). 증상: 일부 라우트만
  playwright 타임아웃, curl은 200. 해결: dev 중지 → `rm -rf .next` → dev 재시작.
- 시드 키는 `study-garden:sessions`, 형식은 `{id, completedAt(ISO), durationMin}[]`.
  집중 시간 설정 키는 `study-garden:duration`.
- 식물 성장은 "심은 뒤 누적 시간"이라 시드 14개×60분이면 나무~새싹이 골고루 나온다.
  시드 개수를 줄이면 나무가 안 나온다 (tree는 심은 뒤 540분 필요).
- `--running` 스크린샷은 디밍 트랜지션이 2초라 클릭 후 2.5초 기다린다 — 줄이면
  디밍이 덜 된 상태가 찍힌다.
- 전체 페이지 캡처(fullPage)라 이미지 세로가 길다. 특정 컴포넌트만 필요하면
  스크립트의 `page.screenshot`을 `page.locator(...).screenshot`으로 바꿔 쓴다
  (정원만: `svg[aria-label="정원"]`).
