---
name: run-study-garden
description: Study Garden을 실제 브라우저로 확인 — dev 서버에 접속해 라이트/다크 × 홈·기록·숲 스크린샷을 찍는다. 엠티 스테이트, 집중 중 상태, 계절 강제(봄·가을·겨울 입자 확인)도 지원. "실행해서 보여줘", "스크린샷 찍어줘", "다크모드 확인", "계절 바꿔서 확인" 요청과 UI 변경 후 완료 보고 전 검증에 사용.
---

UI를 바꿨으면 빌드 통과만으로 "된다"고 하지 않는다 — 이 스킬로 실제 렌더링을
눈으로 확인한 뒤 완료라고 보고한다 (CLAUDE.md "완료의 정의").

## 전제

- **dev 서버가 :3000에 떠 있어야 한다.** 이 스킬은 서버를 켜지 않는다.
  보통 사용자가 이미 켜 둔다 (`lsof -i :3000 -sTCP:LISTEN`으로 확인).
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

## Gotchas

- 시드 키는 `study-garden:sessions`, 형식은 `{id, completedAt(ISO), durationMin}[]`.
  집중 시간 설정 키는 `study-garden:duration`.
- 식물 성장은 "심은 뒤 누적 시간"이라 시드 14개×60분이면 나무~새싹이 골고루 나온다.
  시드 개수를 줄이면 나무가 안 나온다 (tree는 심은 뒤 540분 필요).
- `--running` 스크린샷은 디밍 트랜지션이 2초라 클릭 후 2.5초 기다린다 — 줄이면
  디밍이 덜 된 상태가 찍힌다.
- 전체 페이지 캡처(fullPage)라 이미지 세로가 길다. 특정 컴포넌트만 필요하면
  스크립트의 `page.screenshot`을 `page.locator(...).screenshot`으로 바꿔 쓴다
  (정원만: `svg[aria-label="정원"]`).
