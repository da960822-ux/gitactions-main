# 데스크톱 홈페이지 연결 — 검증용 부분 인계

**전체 고도화 완료본이 아니다. main merge·배포·운영 DB 변경은 하지 않았다.** 기존 실제 체크아웃의 work/51a9ee3는 유지하고 별도 `home-integration-20261011` 브랜치에 저장했다. 도시 그림 재제작/승인, 귀족 원본 전달과 공개 승인, 건의사항 최종 톤 조정, 운영 두 기기 연결이 남아 있다.

## 변경과 보존

승인된 pass4 성능 히어로(ee50a228)를 실제 데스크톱 `/`에 연결했다. 기존 1024px/fine-pointer 경계를 재사용하고 작은 화면에서는 원래 Landing을 쓴다. `dos-language`, KO/ES 편지와 실제 `/play?game=<id>` 링크, `/feedback` 최상단 메뉴 링크만 추가했고 본문 대형 건의사항 섹션은 넣지 않았다. 기존 건의사항 내부 Mami/Papi 멘트와 작은 화면 접근은 유지한다. 이전 `#games`/`#papi-letter` 주소를 연결했다. preview CSS의 전역 reset을 `.rd-page`로 제한해 게임/건의사항 화면에 영향을 주지 않는다.

중앙 커플·문구·구도·어두운 배경·로즈골드 곡선을 유지한다. 기존 3D 하트를 로즈골드/핑크/펄로 재질 변경하고 같은 지오메트리의 PNG를 내보냈다. 작은 하트4/별16/주변부 투명 성운 PNG/가끔 유성/짧은 커서 입자를 추가했다. 런타임 성운 필터나 새 3D 배경 엔진은 없다. 입자는 750ms 간격·650ms 수명·최대8개이고 인물/문구/버튼에서 발생하지 않는다. 사용자 일시정지·축소 모션·화면 밖/숨김 정지를 지원한다. WebGL 실패 시 히어로와 게임 전시에 실제 승인된 장면의 PNG를 쓴다.

원본 커플 WebP SHA256: `72a0010ae5960d33e62b4678715bfd1df71e3d8f743248c69eeb4c5c1c55b318`. 사진을 재생성하거나 교체하지 않았다. 원본 Rhythm SWF도 변경하지 않았다.

게임 브랜치8c90594는 b37c10b까지의 선행 개선을 요구한다. 51a9ee3 공통 조상에서 3-way merge하고 충돌을 문맥별 해결했다. f0c6d01/5f7e75d/1c20ea3는 조상으로 유지된다. CatchmindTable/테스트/CSS와 MarblePawn/테스트는 기존 완료본을 보존했다. 단일주제 엔진에 세그먼트 호환 검증만 합쳤고 새 테스트의 설정 전제를 단일주제 계약에 맞췄다. 부루마블 최신 상세/서사/영수증과 기존 서버 확정 이동 시간표를 합쳤다. 사건 표시/음향이 두 시간표에서 중복 실행되지 않도록 Board가 제공하는 사건을 Stage가 우선 표시한다. 생성 Edge 엔진은 통합된 소스에서 다시 빌드했다.

**사용자가 새 단순 SVG 도시/랜드마크를 시각 품질 후퇴로 반려했다.** 현재 검증용 게임 화면에 들어 있는 임시 SVG와 도시 경로를 최종 시각 개선으로 승인/완료 처리하지 않는다. 기존 광주/산토도밍고 WebP 및 기존 자산은 보존한다. 새 고품질 도시 자산과 베를린/마이애미 교체안은 게임 담당 브랜치와 사용자 시각 승인을 기다린다.

## 백업과 복원

연결 전 `/workspace/backups/home-before-connect-20261011T203250Z`에 전체772개 파일, SHA256 manifest, 모든 기존 Git refs bundle, 상태/diff, `RESTORE.md`를 저장했다. 전체 archive member를 다시 읽어 원본 manifest와 비교했다.

- archive bytes: 70,448,089
- archive SHA256: `593047a7e6a0d963865385615db229603db0353dcb084493477cad402a62f26a`
- 연결 전 actual checkout: 51a9ee3acf6a93cc899ab67e0911f6a6e91f996d, clean

백업/환경 설정은 공개 GitHub에 올리지 않는다. 원래 홈페이지로 복원할 때 별도 디렉터리에 archive를 풀거나 bundle에서 복제한다. 게임 개선 커밋을 reset/delete하는 복원 방식은 사용하지 않는다. 새 원격 브랜치 확인 전 환경을 종료하지 않는다.

## 실제 검수

통합 중 누락된 React import/CSS 괄호를 발견·수정했다. 수정 전 Luna의 Marble crash 증거와 수정 후 결과를 구분해 보존했다. 게임 통합 단계 Vitest52파일/461테스트 통과 후 건의사항0e27e947까지 합쳐 **53파일/470테스트**, TypeScript/Vite/Edge 빌드 통과. 기존 Three chunk580.6KB 경고는 남는다.

Chromium 1440×900 production root에서 KO/ES 저장·reload·편지 열기/닫기·전시 Jaipur 선택→실제 lobby의 Jaipur·뒤로가기·/feedback 진입을 확인했다. 축소 모션/입자 수명·cap·중앙 보호/일시정지/화면 밖 정지/8개 게임의 WebGL 없는 PNG 전시와 실제 링크/SPA deep route도 assert로 확인했다. 재현: `PLAYWRIGHT_MODULE=<installed playwright index.mjs> PLAYWRIGHT_EXECUTABLE_PATH=<chromium> HOME_UI_URL=http://127.0.0.1:5233 node scripts/verify-home-integration.mjs`. 검수 출력은 기본 `output/home-integration`이고 Git에 넣지 않는다.

승인 ee50a228와 장식 추가 production root를 같은 SwiftShader Chromium 프로세스/1440×900/DPR1/6.5초/50ms 동일 포인터 입력/ABBA 순서로 비교했다. 측정 중 screencast/trace 없음. 전:27.97/29.37 unique rAF/sec, 후:25.22/25.19. 두 경우 median33.3~33.4ms/p9550.1ms, 히어로 GL color-clear0. 새 입자 최대4개가 실제 관측됐다. 평균 cadence 약12.1% 감소. **GPU 표시 FPS나 실기기 성능 수치가 아니다.** 투명 PNG와 네 개 별 twinkle/커서 입자의 비용이 있으므로 실제 PC 확인이 필요하다.

Luna(gpt-6-luna)는 독립 KO/ES Chromium contexts에서 UI로 방 생성·초대·선택·행동·peer reload를 검수한다. 최신 우선 재검수에서 Marble은 다른 pawn 선택→roll→Madrid 도착, Da Vinci는 양쪽 초기 준비→뽑기4→5·상대 숨김 타일5 확인, page/console errors0. 나머지 Catchmind/Domino/Jaipur/Splendor/Minhwatu도 유효 행동·peer refresh/reload·errors0을 확인했다. 부루마블1440×900/1280×800에서 하단 스크롤 가능, 가로 overflow0px. 조커 배치/Rhythm 포커스 추가 검수는 진행 중이다. 로컬 SQL/RLS/authority fixture에는 Supabase Auth/PostgREST/Realtime가 없다. 수동 갱신 성공을 운영 실시간 성공으로 부르지 않는다. 원본 Rhythm은 single-player SWF이고 두 좌석 행동 동기화를 추가/검증하지 않는다.

## 전체 체크리스트의 남은 항목

| 작업 | 현재 상태 |
| --- | --- |
| 승인 히어로·게임 전시·KO/ES 편지의 실제 홈 연결 | 구현/production UI 검증, 별도 브랜치 보존 |
| 7개 게임 고도화·자산·연출·번역 | 임시 코드 병합; 새 도시 그림 승인·추가 게임 SHA·전수 완수표 대기 |
| 귀족2장 | 승인된 원본 bytes/공개 승인 대기; 임의 그림 대체 금지 |
| Luna 두 세션 | 7개 게임 실제행동·분리contexts 재검수 통과, 짧은 높이 스크롤 확인; 조커/Rhythm 추가 검수 진행 |
| 건의사항 | 최상단 /feedback 링크만.47df2c4b+0e27e947 원문/기존 접근 보존해 임시 통합; 추가 톤 SHA 대기 |
| 실제 둘만의 연결/운영 권한 | 로컬 fixture 검증만; 지정 Supabase 설정·운영 migration·Auth/RLS·Realtime·실제2기기 검증 미실행 |

건의사항 로컬 HTTP/PGlite SQL-backed Chromium 검수 **39/39**, uncaught errors0. 독립 p1/p2 계정·reload 저장·p1 상태 변경·p2 작성·제3자 거부·동시 중복제출·응답 유실 후 같은 UUID 재시도·원문 멘트·기존 작은 화면 접근까지 확인했다. Supabase Auth/PostgREST/Realtime/운영 cron 자체 검증은 아니다.

새 건의사항 migration0005는 직접 insert를 회수하고 submit RPC를 사용하므로 신규 프런트와 같이 적용해야 한다. 운영 Auth/DB/cron 변경은 이 브랜치 작업에서 실행하지 않는다. 기존 초대 링크는 실명 allowlist가 아니며 비어 있는 두 번째 좌석을 링크 소지 첫 인증 사용자가 차지할 수 있다는 한계가 있다.

## 적용한 다운로드 스킬과 이전 계획

모두 저장소 안 경로라 새 환경에서도 읽을 수 있다. 전체 엔진 컬렉션을 무조건 실행하거나 React를 다른 엔진으로 이전하지 않는다.

- `.agents/skills/router/SKILL.md`, `gamedev-router/SKILL.md`: 기존 React/DOM/SVG/WebAudio 게임과 Three0.186.1 전시 범위 구분.
- `.agents/skills/ponytail/SKILL.md`: root/Luna full, 최소 완전 변경/실제 assert/보안 보존.
- `.agents/skills/game-ui-ux/SKILL.md`: 판·행동·영수증 가독성, KO/ES 긴 문자열, 화면 흐름/포커스.
- `.agents/skills/create-game-assets/SKILL.md`: 승인 원본/가족별 자산/크기·알파/실제 화면 검수, 반려 자산 완료 금지.
- `.agents/skills/save-systems/SKILL.md`: 기존 판 인덱스/좌석/저장 schema/version 보존.
- `.agents/skills/card-game/SKILL.md`: 카드 비용·영역·정보 노출 계약 참고. 새 카드 규칙으로 바꾸지 않음.
- `.agents/skills/emil-animate/SKILL.md`, `threejs-scene-setup/SKILL.md`, `threejs-materials-lighting/SKILL.md`: 승인 히어로 보존, transform/opacity, 기존 재질/좌표/cleanup.
- 기존 계획: `docs/GAME-QUALITY-PLAN.md`, `docs/GAME-UPGRADE-VALIDATION.ko.md`, `docs/MARBLE-VISUAL-PLAN.ko.md`, `docs/marble-world-art.md`, `docs/DESKTOP-GAMES-HANDOFF-2026-10-11.ko.md`. 계획과 타 브랜치 과거 통과 수치를 이번 통합 검증으로 바꾸어 쓰지 않는다.
