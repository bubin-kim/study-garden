@AGENTS.md

# Study Garden

공부 타이머 앱. 집중 세션을 완료하면 정원에 식물이 심어지고, 누적 공부 시간으로 자란다.
**사용자가 "공부 앱을 켰다"가 아니라 "내 정원을 돌보러 왔다"고 느끼게 하는 것이 최우선 원칙이다.**

## 하드 룰 (유지보수 모드 — V1 출시 완료 2026-07-13)

- **V1 기능 개발은 종료됐다.** 명백한 버그 수정만 기본 허용이고, 기능·디자인 변경은
  사용자 승인 후에만 한다. V2 후보는 README "향후 계획"에 기록되어 있다 — 착수하게 되면
  design-doc 스킬(설계 문서 → 승인 → 구현)로 시작한다.
- 감성 기준: **Apple의 정돈됨 + Forest/Finch/동물의 숲 사이의 따뜻함.** 절대 어린아이용 앱처럼 만들지 않는다 — 20대 대학생이 자연스럽게 쓸 수준의 귀여움까지만.
- 애니메이션은 잔잔하게. "가끔 등장"이 기본값이고, 공부에 방해되면 실패다.
- 커밋은 요청받았을 때만 한다.

## 스택 · 구조

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · framer-motion · zustand · lucide-react. 백엔드 없음 — 모든 데이터는 localStorage.

```
app/            페이지 3개: / (정원+타이머), /records (통계·캘린더), /forest (레벨·업적)
  template.tsx  페이지 전환 (fade + rise). 헤더는 layout에 있어 전환에서 제외
  globals.css   디자인 시스템 전체가 여기 있음 (아래 참조)
components/     garden/ (SVG 정원), timer/, home/, records/, ui/ (Button, Sheet, GrowthJourney)
stores/         zustand: session-store(세션 기록), timer-store(타이머), ui-store(시트 열림)
lib/            순수 함수만: garden.ts(세션→식물 배치), level.ts(8레벨), stats.ts, time.ts, season.ts, achievements.ts
lib/storage/    localStorage repository. 키: 'study-garden:sessions', 'study-garden:duration',
                'study-garden:season' (계절 고정 — 키 없음이 자동)
```

폰트는 Pretendard (layout.tsx에서 CDN 링크). 레이아웃은 `max-w-2xl` 중앙 정렬 모바일 우선.

설계 문서: docs/01_season-picker.md (계절 테마 선택 — 자동 기본, 원하면 고정. 2026-07-14 구현 완료)
· docs/02_pwa.md (PWA 설치 — manifest+아이콘, 서비스 워커 없음. 2026-07-15 구현 완료)

## 디자인 시스템 — 토큰이 유일한 진실

`app/globals.css`의 CSS 변수가 전부다. 파이프라인: **CSS 변수(계절·다크별 값) → `@theme inline` 매핑 → Tailwind 유틸리티**.

- 색: `bg-surface` `text-ink` `text-muted` `border-line` `bg-primary` `text-on-primary` `bg-primary-soft` `text-accent`
- 그림자: `shadow-card` `shadow-float` `shadow-sheet` `shadow-btn` / 오버레이: `bg-[var(--scrim)]`
- 라운드: 카드는 항상 `rounded-card` (20px)
- 식물 전용: `--stem --leaf --petal --petal-2 --core --trunk --canopy --canopy-2 --ground --ground-2` (SVG fill에서 `var(--...)`로 직접 사용)

**금지: 컴포넌트에 hex 색, `rgba(...)` 그림자, `rounded-[20px]` 같은 하드코딩.** 새 색이 필요하면 globals.css에 변수를 추가하고 라이트 4계절 + 다크 4계절 모두에 값을 정의한 뒤 유틸리티로 쓴다. (유일한 예외: 흰색 하이라이트 같은 진짜 불변 색.)

### 다크모드 계약 (틀리기 쉬움 — 그대로 따를 것)

- 구조: 라이트 기본 블록(`:root, html[data-season="spring"]` + 계절 3블록) 뒤에 `@media (prefers-color-scheme: dark)` 안에 같은 구조가 한 번 더 온다.
- **다크 base 블록(`:root, html[data-season="spring"]`)은 라이트 계절 블록이 건드리는 모든 변수를 반드시 덮어써야 한다.** 하나라도 빠지면 다른 계절의 라이트 값이 다크에 샌다 (캐스케이드 순서로 동작하는 구조).
- 다크는 명도 반전이 아니라 "채도 낮춘 계절 톤의 웜/쿨 다크". 순수 블랙·순수 그레이 금지.
- `--on-primary`: 라이트=흰색, 다크=진한 잉크. primary 배경 위 글자는 항상 `text-on-primary`.
- 확인은 DevTools → Rendering → Emulate prefers-color-scheme.

## 정원 SVG · 애니메이션 규칙

- 정원 viewBox는 `0 0 800 250`. 지면 곡선은 `Garden.tsx`의 `groundTopY(x)`. 식물은 뿌리가 `(0,0)`인 좌표계로 그리고 translate/scale로 배치한다.
- 식물 그리기: fill/stroke는 반드시 팔레트 변수. 새 장식은 배경 요소로 — 투명도 0.3~0.65, 식물보다 눈에 띄면 안 된다.
- **무한 반복 애니메이션은 CSS keyframes** (`plant-sway`, `amb-*`, `glow-breathe` — globals.css). 식물 수십 개가 동시에 움직이므로 framer-motion 무한 루프 금지.
  - 흔들림 진폭은 `--sway-a` CSS 변수로 개체별 조절. 단계별 값은 `Plant.tsx`의 `SWAY` 테이블.
- **등장·스프링·상태 전환은 framer-motion** (개화, 버튼 바운스, 시트, 페이지 전환).
- 계절 입자(벚꽃잎·반딧불·낙엽·눈송이)는 **넷 다 DOM에 렌더하고 CSS `html[data-season=...]`로 하나만 표시**한다. JS로 계절 분기하지 않는다 (하이드레이션 안전).
- 모든 장식 애니메이션은 `prefers-reduced-motion: reduce`에서 꺼져야 한다 (globals.css 마지막 블록에 추가).

## 하이드레이션 안전 (SSG라서 어김)

- 렌더 중 `Math.random()`, `Date.now()` 기반 분기 금지. 시각적 변형이 필요하면 `lib/garden.ts`의 `hashCode(id)`처럼 데이터에서 결정적으로 유도한다.
- 계절은 `SeasonProvider`가 클라이언트에서 `html`에 `data-season`을 찍는다. 계절별 표현 차이는 전부 CSS 선택자로 처리한다.
- localStorage 읽기는 store의 `hydrate()`에서만. 컴포넌트는 `hydrated` 플래그로 첫 페인트 문구(엠티 스테이트 등)를 게이트한다.

## 카피 톤

따뜻한 해요체. 정원 어휘로 말한다 — "기록이 없습니다"가 아니라 "이 달의 정원은 조용히 쉬었어요". 명령·경고 톤 금지. 이모지는 코드/UI에 넣지 않는다(일러스트는 SVG로 직접 그린다).

## 검증 방법

1. `npx next build` — 통과 필수.
2. **눈으로 확인 필수.** dev 서버는 **전용 고정 포트 :3210**을 쓴다 (`npm run dev`에 -p 3210 내장).
   다른 프로젝트들이 :3000/:3100을 옮겨 다니며 차지하므로, localStorage(=origin 단위) 데이터가
   섞이거나 사라져 보이는 사고를 막기 위해 이 포트를 study-garden 전용으로 예약한다.
   이미 떠 있으면 그걸 쓴다 (같은 프로젝트 dev 서버는 두 개 못 띄움).
   **실사용 데이터는 배포판(https://study-garden-omega.vercel.app — main 푸시 시 자동 배포)에 있다.**
3. 스크린샷은 **`.claude/skills/run-study-garden/` 스킬 사용** — 시드·다크·계절·집중 중
   상태까지 명령 하나로 찍는다. 세부는 그 SKILL.md 참조. (수동 시드가 필요하면 키는
   `study-garden:sessions`, 형식 `{id, completedAt(ISO), durationMin}[]`.)
4. 다크모드는 playwright `colorScheme: 'dark'` 또는 DevTools 에뮬레이션. 계절은 콘솔에서 `document.documentElement.dataset.season = 'spring'`.

## 작업 품질 기준

**전역 규칙(`~/.claude/CLAUDE.md`)을 따른다.** 핵심만 요약하면: 검증 없이 "된다" 금지 ·
완료 보고에 증거(출력·스크린샷) 첨부 · 보고는 결론 먼저 · 모호하면 질문.
(다른 컴퓨터에서 이 저장소를 열어 전역 규칙이 없으면 위 한 줄이 최소 기준이다.)

## 완료의 정의 — 끝내기 전 체크

- [ ] `npx next build` 통과
- [ ] 라이트·다크 모두 스크린샷으로 직접 봤다 (바뀐 화면 전부)
- [ ] 계절 관련 변경이면 4계절 × 라이트/다크 = 8조합에 값이 있다
- [ ] 하드코딩 색·그림자·라운드 없음 (`grep -rn "rgba\|#[0-9a-f]\{6\}" components/ app/*.tsx`로 확인)
- [ ] 무한 애니메이션은 CSS이고 reduced-motion에서 꺼진다
- [ ] 새 카피가 해요체 정원 톤이다
- [ ] 기능을 추가하지 않았다
