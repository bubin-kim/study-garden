# 02 — PWA 설치 지원 (manifest · 설치 아이콘)

> 상태: **구현 완료 (M1+M2)** · 2026-07-15

## 배경

실사용 정원은 Vercel 배포판(https://study-garden-omega.vercel.app)에 있는데, 매번
브라우저에서 링크를 타고 들어가야 해서 "공부 시작"까지의 마찰이 크다. README V2
후보였던 PWA를 착수한다. Next 16은 `app/manifest.ts` 파일 컨벤션으로 manifest를
내장 지원하고, 최신 브라우저의 설치 요건은 **유효한 manifest + HTTPS**뿐이다
(서비스 워커 불요 — `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` §6).
배포판이 이미 HTTPS이므로 manifest와 아이콘만 추가하면 된다.

## 목표 / 비목표

**목표** (사용자 환경이 macOS — 1번이 1순위)

- **macOS Chrome에서 주소창 설치 아이콘으로 Dock에 앱처럼 설치**된다 —
  독립 창(standalone), 고유 이름·아이콘.
- (부수 효과) 모바일(안드로이드 Chrome / iOS Safari "홈 화면에 추가")에서도 같은
  manifest로 홈 화면 설치가 된다.
- 설치된 앱 아이콘이 기존 브랜드(새싹 SVG)와 한 몸으로 보인다.

**비목표**

- **서비스 워커·오프라인 캐싱 없음.** 설치 요건이 아니며, 캐시 무효화 복잡도를
  들일 가치가 아직 없다. 오프라인 접속 시 앱이 안 뜨는 것은 수용한다.
- 푸시 알림 없음 (앱 철학: "알림 없음"은 제품 원칙이기도 하다).
- 커스텀 설치 유도 배너/버튼 없음 (`beforeinstallprompt`는 크로스 브라우저가 아니라
  Next 공식 가이드도 비추천).
- macOS 메뉴바 상주 앱 없음 (별도 네이티브 앱 영역).

## 계약

### 새 파일

| 파일 | 내용 |
|---|---|
| `app/manifest.ts` | `MetadataRoute.Manifest` 반환 — name/short_name "Study Garden", lang `ko`, `display: 'standalone'`, `start_url: '/'`, 아이콘 목록, theme/background color |
| `public/icons/icon-192.png` | 설치 아이콘 192×192 (`purpose: any`) |
| `public/icons/icon-512.png` | 512×512 (`purpose: any`) |
| `public/icons/icon-maskable-512.png` | 512×512 full-bleed 배경 + 안전영역(80%) 준수 (`purpose: maskable`) |

- manifest는 Next가 `<link rel="manifest">`를 자동 주입한다 — layout 수정 불필요.
- iOS는 manifest 아이콘 대신 기존 `app/apple-icon.png`(180×180)를 계속 쓴다 — 충돌 없음.
- `theme_color`/`background_color`: manifest는 미디어쿼리를 지원하지 않으므로 라이트
  기준 단일값(globals.css의 봄 라이트 `--surface` 계열). 다크에서 창 프레임이 라이트
  톤인 것은 수용(리스크 참조).
- 기존 계약과의 충돌: 없음 (docs/01과 독립. `viewport.themeColor` 메타는 그대로 유지).

### 아이콘 생성 방식

- 소스는 기존 브랜드 `app/icon.svg` 하나. 스크립트(playwright 렌더)로 PNG를 뽑아
  저장소에 커밋한다 — 빌드 타임 생성 아님(재현성·검토 용이).
- **아이콘 시안은 브랜드 자산이므로 사람 검수를 거친다**: 배경색·여백 시안을
  스크린샷으로 보여주고 승인 후 확정한다 (M1 완료 기준에 포함).

## 마일스톤

- **M1 — manifest·아이콘 구현 + 로컬 검증**: 위 파일 4개 추가.
  완료 기준: `npx next build` 통과 · `/manifest.webmanifest` 응답 확인 ·
  Chrome DevTools Application 패널에서 "installable"(오류 0) 스크린샷 ·
  아이콘 시안 사용자 승인.
- **M2 — 배포 후 실제 설치 검증**: main 푸시(사용자 승인) → Vercel 자동 배포 후
  실제 Chrome에서 설치.
  완료 기준: 주소창 설치 아이콘 → Dock 아이콘·독립 창 실행 스크린샷,
  기존 정원 데이터가 설치된 앱에서 그대로 보임(같은 origin이므로 이론상 보장 —
  실측으로 확인).

## 측정 계획

- maskable 아이콘의 안전영역은 추측하지 않는다 — 시안을 원형/스쿼클 마스크로
  잘라본 미리보기 이미지를 만들어 보여주고 여백을 확정한다.
- theme_color 후보(라이트 `--surface` vs `--primary`)는 설치 창 프레임에 실제로
  적용된 스크린샷 2장을 비교해 사용자가 고른다.

## 알려진 리스크 / 한계

- **오프라인 미지원**: 네트워크가 없으면 설치된 앱도 안 뜬다(데이터는 localStorage에
  안전). → 다음 단계 영향: 불편 피드백이 있으면 V3에서 서비스 워커 검토.
- **다크모드 창 프레임**: manifest theme_color가 단일값이라 다크에서 프레임이 라이트
  톤일 수 있다. → 다음 단계 영향: 없음(수용). 거슬리면 M2에서 실측 후 재논의.
- **iOS는 설치 UI가 다름**: 주소창 버튼이 아니라 공유 → "홈 화면에 추가"를 직접
  눌러야 한다. → 다음 단계 영향: 없음(플랫폼 제약, README에 한 줄 안내 고려).
- **설치는 origin 단위**: 배포 주소가 바뀌면(도메인 연결 등) 재설치가 필요하고
  localStorage도 새 origin으로 이사해야 한다. → 다음 단계 영향: V2의 "도메인 연결"
  착수 시 데이터 이전 계획이 선행 조건이 된다.

## M2 진행 기록 (2026-07-15)

- 배포 완료: 프로덕션에서 manifest·아이콘 200, CDP installability **오류 없음** 확인.
- **함정 1 — GitHub→Vercel 자동 배포 누락**: 전날까지 되던 자동 배포가 이날 푸시
  2건에서 조용히 안 생겼다(GitHub deployments API로 확인). `npx vercel --prod`로
  수동 배포해 해결. 재발하면 Vercel 대시보드에서 Git 연동 점검.
- **함정 2 — 설치 버튼이 조용히 실패**: `~/Applications` 소유자가 root라
  (6/1 INNORIX-EX 설치 여파) Chrome이 앱 심(`Chrome Apps/`)을 못 만들었다.
  증상: 설치 클릭해도 앱 번들·`Web Applications/` 기록이 안 생김.
  해결: `sudo chown -R $(whoami):staff ~/Applications` 후 Chrome 재시작·재설치.
- M2 마감: 권한 수정 후 설치 성공 — `Chrome Apps.localized/Study Garden.app` 생성,
  독립 창 실행(app_mode_loader) 파일시스템으로 확인.

## 문서 연결 (승인 후 반영)

- `CLAUDE.md` 설계 문서 줄에 추가: `docs/02_pwa.md (PWA 설치)`
- `README.md` 향후 계획에서 "PWA" 항목을 완료로 이동 (M2 완료 후).
  겸사겸사 "Vercel 배포" 항목도 이미 완료됐으므로 함께 정리.
