# 초기 밝은 화면과 이미지 팝인 수정

제품 코드/게임 통합 기준: `e44f5690314ad9d1785d3662ca1c07375e5fb003`. 랜딩 수정 `54e270b`, 게임 델타 `7b3a19d2f2dd1248b28e4a9e975fd4c50037ce5e`를 함께 포함한다. 이전 검토본 e7bd1fc의 구도·문구·원본 이미지·게임 규칙을 유지한다.

## 원인 확인과 최소 수정

영상만으로 navigation 문제를 단정하지 않았다. 브라우저에서 세 상태를 분리했다. React 모듈을 보류하고 외부 CSS가 없는 HTML을 표시하면 html/body/root가 transparent여서 기본 흰 캔버스가 보였다. stylesheet만 로드하면 `:root`의 `#f6f3ed`가 적용됐다. 실제 홈→건의사항 SPA 이동에서 lazy 모듈을 보류해도 같은 아이보리 root가 기존 loading-screen 아래에 보였다. 초기 HTML에는 critical 배경이 없었다. theme-color의 밝은 값은 화면 전체 배경의 직접 원인으로 보지 않는다.

index.html에 html/body/root의 즉시 적용되는 `#130e17` 배경과 같은 글자색을 넣고, tokens.css의 실제 root 배경도 일치시켰다. 기존 대기 문구 색만 어두운 배경에서 읽히도록 맞췄다. 기존 스피너는 그대로이며 새 스피너·전체 로딩 gate는 추가하지 않았다. 공통 기존 글꼴3개를 preload해 초기 font swap을 줄인다. 다른 페이지에서 불필요한 커플 이미지 다운로드를 만들지 않도록 전역 이미지 preload는 추가하지 않았다.

인물·폴라로이드·봉투는 각 이미지가 load/decode된 뒤 기존 고정 위치에서 등장한다. 카드 그림도 실제 쓰는 atlas/커버/SVG가 decode되면 짧게 fade한다. 이미지가 늦어도 본문·놀이 버튼·편지 버튼·게임 링크는 기다리지 않는다. 제목/버튼/히어로/카드의 기존 박스를 유지하며 이미지 위치·얼굴·파일 bytes를 바꾸지 않는다. 실패한 이미지도 native alt/fallback과 기존 조작을 막지 않는다. 모션 축소와 사용자 정지는 유지한다.

## 실제 검증

- HTML-only, CSS-loaded-before-React, SPA lazy fallback 세 조건 모두 html/body/root RGB(19,14,23). 전후 정지 pixels도 직접 확인했다.
- 이전 캐시 재진입 영상과 같은 native reload를 다시 녹화했다. 0.1초 간격/96×60 분석에서 이전0.4–0.8초의5개 샘플은 전체 밝은 화면이었다. 새 영상42개 샘플에서는 밝은 빈 프레임0개, 최대 밝은 pixel 비율2.22%. 이 숫자는 검사한 영상 조건의 결과이며 모든 기기 보증이 아니다.
- 의도적으로 커플/atlas 응답을 보류한 검수에서 본문·버튼은 사용 가능했고 별도 loader0개였다. decode 이후 입장 애니메이션은 currentTime0/opacity0에서 시작했다. 제목·버튼·히어로·첫 카드 박스의 좌표/크기는 전후 동일했다.
- 정상 네트워크의 냉시작 PerformanceObserver layout-shift 합0. 강제 지연 조건과 구분한다.
- 기존 홈 UI9그룹 성공: 1440/1280/1366 KO/ES, 편지 초점·Escape·정착 크기·실제 입장/건의사항 이동, 모션 정지 및 모션 축소. 기존 작은 홈 fallback도 검사했다. 게임 모바일 작업은 하지 않았다.
- 전체 Vitest55파일/492테스트와 TypeScript/Vite/Edge 빌드 성공. PlayApp502.04KB chunk 경고는 유지된다.

냉시작6.1초/캐시 재진입4.2초 실제 녹화는 제품 코드e44f569에서 촬영했다. 강제 seek·속도 변경·보간이 없다. MP430fps는 캡처된 프레임 복제이며 실기기30fps 보증이 아니다.

## 게임 델타 및 재접속 회귀

42d0f7e→7b3a19d의 **세 파일만** 적용했다: PlayApp.tsx, online-fixture.mjs, LUNA-FINAL 문서. 랜딩과 부모의 private-art env override·기본 크기·테스트·문서를 덮어쓰지 않았다.

이 통합본의 production frontend(별도 로컬 fixture build)와 현재 PGlite SQL/RLS/권한 엔진, HMR 없는 독립 KO/ES Chromium 두 세션에서 추가 재검증했다. 네트워크 offline 동안 캔버스 node와 timeOrigin이 유지됐다. 서로 다른 두 선의 재시도 후 동일한 고유 stroke ID2개, 색 #2f655b/#ce6990, 굵기4/12, 각7점이 양쪽 snapshot에서 일치했다. 상대 캔버스 실제 그림12,292픽셀을 확인했다. ES 정답→다음 라운드2의 실제 UI 제시어 선택 후 양쪽 strokes[]와 빈 캔버스0픽셀로 오래된 선 차단을 확인했다. 오프라인 구간 screenshot은 찍지 않았다. 첫 검수의 다음 라운드 assertion은 비동기 action 완료 전 상태를 읽어 실패해, 완료 조건을 기다린 후 재실행했다. 제품 코드를 바꾸어 실패를 숨기지 않았다.

게임 전체를 완주 인증하지 않는다. child의 도미노·스플렌더 전체 경기/합의 재시작과 Catchmind의 지정 분기 검수는 [범위표](reviews/LUNA-FINAL-2026-10-12.ko.md)를 따른다. 자이푸르·다빈치·부루마블·민화투의 미실행 범위와 운영 Supabase/실기기 한계를 보존한다. 리듬 원작은 변경하지 않았다.

main·강제 push·배포·운영 DB 변경은 하지 않는다. 승인된 home-integration-20261011에 일반 fast-forward로 게시한다.
