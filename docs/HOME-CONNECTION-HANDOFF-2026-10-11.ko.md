# 데스크톱 홈페이지 연결 — 검증용 부분 인계

**2026-10-12 최신 랜딩 상태:** 아래 기존 PNG 모션·이전 영상·성능은 과거 기록이다. WIP137b539 이후 통합 Three scene의 네 시각 결함을 로컬에서 수정하고, 실제1440/1280 UI4그룹·helper2테스트·빌드를 통과했다. 동일 경로 전후24.1초 영상과 비녹화 ABBA 자료는 비공개 로컬에 보존한다. 현재software 렌더 제출은평균12.96회/초로 실기기 부드러움과 부모 최종영상 승인은 남았다. 새 코드 push·배포는 하지 않는다. owner-only Drive 영상 업로드는 자동승인검토가 거절해 외부전달되지 않았다. 정확한 범위/파일/검증/한계는 `UNIFIED-SPACE-REVIEW-2026-10-12.ko.md`, 요약은qa JSON의`unifiedSpace`를 먼저 읽는다. 최신게임6a4d21f 통합은 이번landing범위에서 미뤘다.

**전체 고도화 완료본이 아니다. main merge·배포·운영 DB 변경은 하지 않았다.** 기존 실제 체크아웃의 work/51a9ee3는 유지하고 별도 `home-integration-20261011` 브랜치에 저장했다. 도시·말·건물의 게임 연결, 개인 자산의 비공개 전달/주입, 운영 두 기기 연결이 남아 있다. 건의사항 최신 디자인1a288c215까지 통합했다.

## 변경과 보존

승인된 pass4 성능 히어로(ee50a228)를 실제 데스크톱 `/`에 연결했다. 기존 1024px/fine-pointer 경계를 재사용하고 작은 화면에서는 원래 Landing을 쓴다. `dos-language`, KO/ES 편지와 실제 `/play?game=<id>` 링크, `/feedback` 최상단 메뉴 링크만 추가했고 본문 대형 건의사항 섹션은 넣지 않았다. 기존 건의사항 내부 Mami/Papi 멘트와 작은 화면 접근은 유지한다. 이전 `#games`/`#papi-letter` 주소를 연결했다. preview CSS의 전역 reset을 `.rd-page`로 제한해 게임/건의사항 화면에 영향을 주지 않는다.

중앙 커플·문구·구도·어두운 배경·로즈골드 곡선을 유지한다. 기존 3D 하트를 로즈골드/핑크/펄로 재질 변경하고 같은 지오메트리의 PNG를 내보냈다. 작은 하트4/별16/주변부 투명 성운 PNG/가끔 유성/짧은 커서 입자를 추가했다. 런타임 성운 필터나 새 3D 배경 엔진은 없다. 입자는 750ms 간격·650ms 수명·최대8개이고 인물/문구/버튼에서 발생하지 않는다. 사용자 일시정지·축소 모션·화면 밖/숨김 정지를 지원한다. WebGL 실패 시 히어로와 게임 전시에 실제 승인된 장면의 PNG를 쓴다.

원본 커플 WebP SHA256: `72a0010ae5960d33e62b4678715bfd1df71e3d8f743248c69eeb4c5c1c55b318`. 사진을 재생성하거나 교체하지 않았다. 원본 Rhythm SWF도 변경하지 않았다.

### 실제 모션 구현과 관찰의 출처

부모 세션이 [Lusion 2023 녹화](https://www.landing.love/sites/lusion/)의 첫 약108초를 확인해 전달했다. 22.6–23.7초는 **같은 작은 이미지**의 윤곽이 휘고 펼쳐지며 내용이 바뀌는 전환이다. 59.5–61초는 기울어진 화면이 커지며 내부 공간으로 이어지고,64–65초는 글자와 인물이 반대 깊이로 움직이며,95–96.5초는 프레임 복귀·인물 전경 이동·유리 같은 조각 분리가 관찰됐다. 이 실행 환경에서 최신 Lusion 전체 화면이나 원본 셰이더를 직접 검사하지 않았다. 현재 공식 사이트의 부모 시각 검사는 WebGL 초기화 오류로 막혔다.

승인된 중앙 커플과 고정 글자·8개 게임 전시를 유지하면서 다음 동작을 실제로 적용했다.

- 하드웨어 선택 분기: 하트3개의 X/Y/Z 회전 주기와 깊이가 독립적이다. 로즈골드는 metalness.8/roughness.28, 분홍은 .08/.62의 부드러운 satin 재질이다. 고정 key light[-4,6,8] 아래 회전으로 하이라이트가 바뀐다. 원본 커플 알파 깊이 마스크로 뒤쪽 하트와 곡선이 인물 뒤로 가린다.
- 소프트웨어 폴백: 같은 지오메트리와 고정 광원으로 만든 앞면 포즈 PNG3장을 제한적으로 섞는다. 작은 Z 회전·이동만 추가하며 PNG의 뒷면이나 연속3D 회전을 흉내내지 않는다. 원본 인물은 재생성하지 않고 DOM에서 최대4px/2px만 움직인다. 별2px·주변 하트10px의 다른 깊이를 사용하고 성운은 고정 위치에서 세 단계의 은은한 밝기만 바뀐다.
- 가까운 하트의 반발은 최대14px이고 포인터가 떠나면 약700ms에 원위치로 돌아온다. 첫 스크롤에서 인물은 최대2.5% 뒤로 물러나고 같은 곡선 끝의 얇은 SVG 선과 빛점이 게임 영역 가장자리까지 이어져 멈춘다. 버튼 위를 가로지르지 않는다.
- 기존 장미 한 송이의 줄기/꽃을 **같은 원본 이미지 두 마스크**로 분리해 줄기는 종이·봉투 뒤, 꽃은 앞에 놓았다. 기존 편지는18점 CSS clip-path 윤곽을 곡면에서 직사각형으로900ms에 펼친다. 글자 자체는 휘지 않고 열린 본문은 평평하다. 이는 윤곽 마스크 전환이며 Lusion 원본의 mesh/shader나 이미지 내용 morph를 재현했다고 주장하지 않는다.
- 하드웨어에서도 페이지 canvas는 동시에 최대1개다. 히어로가 화면 밖이면 해제하고 전시 canvas만 사용할 수 있다. 일시정지·숨김에서는 실제 setAnimationLoop(null), context loss에서는 PNG 복구. 소프트웨어 모드는 canvas0개다. 곡선/장미는 scroll당 한 번의 rAF만 요청한다.

내용은 실제 둘의 놀이 서사다. 도미니카 복귀 후 한국 리듬 사이트가 열리지 않았던 일, 영어 단어 추측의 제한, Catchmind에서만 한국어/스페인어 정답·번역 채팅을 연결한 이유, 아직 전달하지 못한 실제 장미와 먼저 놓은 디지털 장미를 썼다. 실제 왕복 경로와 공식 교제 시작일2025-04-04를 표기했다. 프로포즈 비유는 높은 모션 품질 목표로만 받아들였으며 결혼 약속/꾸며낸 추억을 추가하지 않았다.

게임 브랜치8c90594는 b37c10b까지의 선행 개선을 요구한다. 51a9ee3 공통 조상에서 3-way merge하고 충돌을 문맥별 해결했다. f0c6d01/5f7e75d/1c20ea3는 조상으로 유지된다. CatchmindTable/테스트/CSS와 MarblePawn/테스트는 기존 완료본을 보존했다. 단일주제 엔진에 세그먼트 호환 검증만 합쳤고 새 테스트의 설정 전제를 단일주제 계약에 맞췄다. 부루마블 최신 상세/서사/영수증과 기존 서버 확정 이동 시간표를 합쳤다. 사건 표시/음향이 두 시간표에서 중복 실행되지 않도록 Board가 제공하는 사건을 Stage가 우선 표시한다. 생성 Edge 엔진은 통합된 소스에서 다시 빌드했다.

**사용자가 새 단순 SVG 도시/랜드마크를 시각 품질 후퇴로 반려했다.** 현재 검증용 게임 화면에 들어 있는 임시 SVG와 도시 경로를 최종 시각 개선으로 승인/완료 처리하지 않는다. 기존 광주/산토도밍고 WebP 및 기존 자산은 보존한다. 새 고품질 도시 자산과 베를린/마이애미 교체안은 게임 담당 브랜치와 사용자 시각 승인을 기다린다.

## 백업과 복원

연결 전 `/workspace/backups/home-before-connect-20261011T203250Z`에 전체772개 파일, SHA256 manifest, 모든 기존 Git refs bundle, 상태/diff, `RESTORE.md`를 저장했다. 전체 archive member를 다시 읽어 원본 manifest와 비교했다.

- archive bytes: 70,448,089
- archive SHA256: `593047a7e6a0d963865385615db229603db0353dcb084493477cad402a62f26a`
- 772개 파일의 SHA256이 원래51a9ee3 Git blob과도 전부 일치함을 확인했다. 따라서 별도 브랜치의 원격 조상에 연결 전 원본 소스 전체가 보존된다.
- 연결 전 actual checkout: 51a9ee3acf6a93cc899ab67e0911f6a6e91f996d, clean

백업/환경 설정은 공개 GitHub에 올리지 않는다. 원래 홈페이지로 복원할 때 별도 디렉터리에 archive를 풀거나 bundle에서 복제한다. 게임 개선 커밋을 reset/delete하는 복원 방식은 사용하지 않는다. 새 원격 브랜치 확인 전 환경을 종료하지 않는다.

## 실제 검수

통합 중 누락된 React import/CSS 괄호를 발견·수정했다. 수정 전 Luna의 Marble crash 증거와 수정 후 결과를 구분해 보존했다. 게임 통합 단계 Vitest52파일/461테스트 통과 후 건의사항0e27e947까지 합쳐 **53파일/471테스트**, TypeScript/Vite/Edge 빌드 통과. 기존 Three chunk582.17KB 경고는 남는다.

Chromium 1440×900 production root에서 KO/ES 저장·reload·편지 열기/닫기·전시 Jaipur 선택→실제 lobby의 Jaipur·뒤로가기·/feedback 진입을 확인했다. 축소 모션/입자 수명·cap·중앙 보호/일시정지/화면 밖 정지/8개 게임의 WebGL 없는 PNG 전시와 실제 링크/SPA deep route도 assert로 확인했다. 재현: `PLAYWRIGHT_MODULE=<installed playwright index.mjs> PLAYWRIGHT_EXECUTABLE_PATH=<chromium> HOME_UI_URL=http://127.0.0.1:5233 node scripts/verify-home-integration.mjs`. 검수 출력은 기본 `output/home-integration`이고 Git에 넣지 않는다.

승인 ee50a228와 최신 production root를 동일 SwiftShader Chromium/1440×900/DPR1/6.5초/50ms 포인터/ABBA로 비교했다. 측정 중 screencast·trace는 없었다. 이전 unique rAF/sec28.58/28.28, 최신22.14/22.13으로 평균 cadence 약22.1% 감소했고 두 경우 hero GL color-clear0이다. 전체 화면 깊이 레이어와 연속 포즈 혼합은 더 느려 반려하고 작은 오브젝트/포인터 포즈만 남겼다. **GPU 표시 FPS가 아니며 실기기 성능은 미검증이다.** 소프트웨어 렌더링 비용은 남아 있고 상용 수준의 부드러움이 입증됐다는 뜻이 아니다. 녹화 중 속도와 이 비녹화 측정을 혼동하지 않는다.

Luna(gpt-6-luna)는 독립 KO/ES Chromium contexts에서 UI로 방 생성·초대·선택·행동·peer reload를 검수한다. 최신 우선 재검수에서 Marble은 다른 pawn 선택→roll→Madrid 도착, Da Vinci는 양쪽 초기 준비→뽑기4→5·상대 숨김 타일5 확인, page/console errors0. 나머지 Catchmind/Domino/Jaipur/Splendor/Minhwatu도 유효 행동·peer refresh/reload·errors0을 확인했다. 부루마블1440×900/1280×800에서 하단 스크롤 가능, 가로 overflow0px. 최종8게임 batch page/console errors0. 추가 표본3에서 p2 초기 조커 빈 칸 선택/배치/준비 뒤 행동까지 실제 진행했다. Rhythm은 실제 플레이어 클릭/포커스 후 두 좌석 ArrowUp/Space wrapper 피드백을 확인했다. 로컬 SQL/RLS/authority fixture에는 Supabase Auth/PostgREST/Realtime가 없다. 수동 갱신 성공을 운영 실시간 성공으로 부르지 않는다. 원본 Rhythm은 single-player SWF이고 두 좌석 행동 동기화를 추가/검증하지 않는다.

## 전체 체크리스트의 남은 항목

| 작업 | 현재 상태 |
| --- | --- |
| 승인 히어로·게임 전시·KO/ES 편지의 실제 홈 연결 | 구현/production UI 검증, 별도 브랜치 보존 |
| Lusion 연구 후 실제 모션 | 위 재질/독립 축/반발/깊이/윤곽/앞뒤 전환 구현, desktop2크기·축소 모션·context loss 로컬 검증. 실기기 성능·사용자 최종 시각 승인 별도 |
| 7개 게임 고도화·자산·연출·번역 | 임시 코드 병합; 새 도시 그림 승인·추가 게임 SHA·전수 완수표 대기 |
| 새 조커2개·귀족2장 | 개인 자산은 공개 업로드 금지. 부모가 Library 전달/비공개 주입 구조를 조율하며 통합 bytes는 아직 없음 |
| Luna 두 세션 | 8개 실제UI·분리contexts 재검수/초기 조커 배치/짧은 높이 스크롤 확인; 승리까지 전체 분기·Rhythm 전체 플레이 미실행 |
| 건의사항 | 최상단 /feedback 링크만.47df2c4b+0e27e947+최신 디자인1a288c215까지 통합; 개인 멘트·기존 작은 화면 접근 보존 |
| 실제 둘만의 연결/운영 권한 | 로컬 fixture 검증만; 지정 Supabase 설정·운영 migration·Auth/RLS·Realtime·실제2기기 검증 미실행 |

건의사항0e27e947의 통합 로컬 HTTP/PGlite SQL-backed Chromium 검수는 **39/39**, uncaught errors0였다. 최신 디자인1a288c215의 통합 재검수는 **45/45**, uncaught errors0. 독립 p1/p2 계정·reload 저장·p1 상태 변경·p2 작성·제3자 거부·동시 중복제출·응답 유실 후 같은 UUID 재시도·원문 멘트·기존 작은 화면 접근(800/768/390px)을 확인했다. 내용란 바로 아래의 실패/저장 안내와 실패 초안 유지, 키보드 포커스도 실제 UI에서 통과했다. Supabase Auth/PostgREST/Realtime/운영 cron 자체 검증은 아니다.

최신 모션+건의사항 디자인+힌트 공백 회귀 수정 뒤 **53파일/471테스트**, TypeScript/Vite/Edge 빌드, 기존 홈5개 UI/effects 그룹 및 신규 전환4개 그룹을 모두 다시 통과했다. 신규 검수는1440×900/1280×800 두 화면의 실제 production 캡처, 주변 별/하트의 반대 방향 깊이와 성운의 은은한 빛 반응, 선의 버튼 비침 없음, 게임 진입 시 빛점 정지, 원래8게임 선택 유지, 상단 건의 링크1개뿐임, KO/ES 편지 전체 표시/휠로 푸터 도달, 같은 장미 원본의 앞뒤 마스크, 축소 모션 정지를 assert했다. WebGL 분기에서는 정지/화면 밖 동안 실제 hero GL clear 호출 수가300ms 동안 그대로인 것과 재진입 재시작/context loss PNG 복구를 확인했다. WebGL 선택 분기를 강제했지만 실제 GPU는 SwiftShader이고 실기기 성능 증거가 아니다.

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

요약 증거는 `docs/qa/home-integration-20261011.json`. 실제 PNG/원시측정/상세 Luna 증거는 이 실행 환경의 `/workspace/home-integration-deliverables-20261011`에 보존하며 공개 Git에는 넣지 않았다. 홈/편지 캡처는 실제 production 렌더, 게임 캡처는 로컬 SQL fixture 렌더다. 최종 세션8게임 행동 성공은 전체승리·희귀분기·시각 승인·운영 연결 성공과 구분한다.

## 재개와 새 개인 자산의 경계

연결 정상 확인 후 최신 미커밋1077파일도 `/workspace/backups/home-resume-20261011T214708Z`에 별도 저장하고 archive 파일별 SHA와 모든 refs bundle을 검증했다. archive SHA256은 `ec56662269e01b17fdbd94f219b9eed75aeb000e2a522765152b0b60b4145d23`이다. 이는 로컬 안전 복구본이며 공개 업로드하지 않는다.

부모가 전달한 게임 후속 로컬1feaca317cd63aa2a4cc9da9aaec6c41cd497819는 이 Git 객체에 없고, 해당 환경의 공개 push 자동 승인 검토가 거절됐다고 전달받았다. 이 코드의 push를 다른 경로로 대신하거나 완료 처리하지 않는다. 새 도시/6캐릭터/3단계 건물·항공 자산의 최종 bytes도 아직 통합하지 않았다. 실제 수령 후 source/bytes/픽셀/적용/두 사람 검증을 따로 표시한다.

새 다빈치 캐리커처의 사진 근거는 부모가 확인한 야간 해변 음료 사진과 실내 벽화 셀카다. 결과 Library ID는 부모로부터 전달받았다. 정확한 원본 사진 경로/ID는 아직 전달되지 않았다. 정상 Library materialization을 각 새 결과에 한 번 시도했지만 모두 download failed로 로컬 bytes0이다. 반복 재시도나 다른 다운로드 경로를 사용하지 않았다. 새 캐리커처·귀족은 공개 Git에 넣지 않고 비공개 전달 및 주입 구조를 사용한다. 기존 캐리커처를 새 사진 기반 제작물로 바꾸어 부르지 않는다.

비공개 로컬 `/workspace/home-integration-deliverables-20261011/pawn-reference-export/{maltipoo,panda,chinchilla}.svg`는 기존1c20ea3 런타임 inline SVG의120×150 참조 내보내기다. 새 최종6캐릭터가 아니며 runtime은 여전히 원래 컴포넌트를 쓴다. 생성 스크립트와 비공개 로컬 manifest에 원본 commit/SHA/저장 슬롯 매핑을 남겼다. 공개 소스에는 내보내기 스크립트만 포함하며 이미지를 새 게임 자산 전달 우회로 쓰지 않는다.

현재 소스 확인 결과 Catchmind에는 실제 지우개 버튼이 있고 Domino에는 시작 타일 선택 후 실제 첫 타일 버튼이 있으므로 이 둘을 없는 기능으로 취급하지 않았다. DaVinci의 도움말 준비 버튼 이름은 실제 KO/ES 버튼으로 맞췄다. Catchmind 힌트의 KO 공백 보존은 엔진에서 수정하고 상대에게 answer/hand가 노출되지 않는 회귀 테스트를 추가했다.

게임 최종 통합 이전 반복 인게임 검수는 미뤘다. 현재 통과 수치는 최종 게임 자산·전체 승리·운영 실시간·실기기 성능 승인으로 확대하지 않는다.

## 새 녹화 전달

- [실제 홈 모션18.47초](https://drive.google.com/file/d/1uHQdB5HoCLLt8vuF4nrWiFVpPTgyx68O/view?usp=drivesdk): 접근/이탈·14px 반발·첫 스크롤·곡선의 게임 도착·KO/ES 편지와 장미·확인된 날짜 푸터. 소프트웨어 PNG 폴백 화면이다.
- [WebGL 동작 확인14.70초](https://drive.google.com/file/d/1FhiJ1JsTyhwkRf43QVF-b738UuIg-5dR/view?usp=drivesdk):3개 하트의 독립 축·고정광원·마스크/포인터 복귀. 강제로 하드웨어 선택 분기를 사용했으나 실제 GPU는 동일 소프트웨어 렌더러이며 PC 성능 녹화가 아니다.

두 파일 업로드 후 metadata를 다시 읽어 파일 크기와 공유 false·owner 권한 하나뿐임을 확인했다. 공개 공유를 추가하지 않았다. `scripts/record-home-motion.mjs`는 실제 CDP JPEG 간격을 보존하고 CFR30에서 프레임을 반복한다. 보간/공백 제거/속도 변경은 없다. 오류0이고 원시 캡처 타임스탬프·단계별 관측·실제 중간 프레임은 비공개 로컬 산출물로 남긴다.

최신 코드 원본 커밋: `305255a3f17572beda972e997ebc407b29d8cfbe`.32개 게임 PNG의 정상 Library 전달 실패와 공개 승인 답변 대기는 별도 차단이며, 이 브랜치에는 그 bytes를 넣지 않았다. 부모가 전한 공개 asset 브랜치의 blob을 가져와 올리는 우회도 하지 않았다.

### 후속 공개 승인 후32PNG 수령

위 공개 승인 대기 상태는 이후 명시적 승인으로 해소됐다. `assets/premium-marble-20261011`의 정확한 원격 SHA `ccec83d87fac6ad1a65dd2b900dec8870ef1c71b`를 fetch했다. 도시24/건물2/캐릭터6 원본 PNG32개, 총52,604,560bytes의 SHA256·Git blob SHA·바이트 크기가 manifest와 전부 일치한다. 원본은 `/workspace/premium-marble-assets-ccec83d`에서 분리 보존했다. 래그돌/아파트/광주 원본 픽셀을 실제로 봤다. 이는 개인 사진·조커·귀족 전달 승인이 아니고, 아직 게임 runtime 연결이나 최종 인게임 확인의 증거도 아니다. 최신 게임 코드의 별도 push 차단은 해소됐다고 전달받지 않았다. 살리·술리 추가 캐릭터는 이32개에 없다.

### 런타임 자산 준비 완료·게임 컴포넌트 연결은 별도

32개 원본에서 `public/images/marble/premium/{cities,buildings,pawns}/*.webp`를 준비했다. 도시·건물 최대512px, 말 최대256px, WebP quality92/alpha 유지, 유효 알파 경계의2.5% 여백 crop이다. 원본 PNG는 건드리지 않았다.52,604,560→2,206,982bytes로95.8% 줄었다. source/derived SHA·crop·치수·크기는 같은 폴더 manifest에 있다.32개 RGBA decode·빌드 복사 bytes·별도 브라우저 URL decode를 확인하며 source 및 runtime contact sheet 실제 픽셀도 봤다.

재현: `python3 scripts/optimize-marble-assets.py <수령한-source-root> public/images/marble/premium`. Pillow가 필요하며 새 런타임 의존성은 없다. 현재 `MarblePropertyArt.tsx`/`MarblePawn.tsx`/도시·말 엔진은 별도 게임 구현 담당 소유여서 중복 편집하지 않았다. 새 게임코드 통합 때 `/images/marble/premium/cities/<source-name>.webp`, `buildings/stage1-house.webp`, `stage2-apartment.webp`, `pawns/<source-name>.webp`로 연결하면 된다. 현재 게임 화면이 이 파일을 사용한다고 주장하지 않는다. 도시군/칸 인덱스/저장 ID 매핑·3단계 크기·말2개 겹침·6캐릭터 선택과 추가 반려견은 게임 담당 구현 및 최종 Luna 검수에 남아 있다.

## 랜딩 후속 정교화 — 실제 프레임 확인 후 반영

최신 구현은 `f805a19f5e64346682687a14e7c611faa2bfe2f4`다. 개봉의 중간 프레임을 고정 가림으로 취급하지 않았고 최종 종이 위치·봉투 높이는 그대로다. KO/ES 두 desktop 크기에서 본문·서명 글자 영역이 실제 봉투 면에 가리지 않는지 추가로 검사했다. 열린 편지의 안내는 현재 상태에 맞는 자연스러운 문장으로 바뀐다. 정적128px 종이 결, 두께/가장자리, 서로 다른 접힌 면의 명암, SVG 접힘선과 접촉 그림자를 추가해 원래 장미와 재질을 맞췄다.

커플/글자/색/곡선은 유지하고 하트3개는6–10% 줄였다. 로즈골드와 펄의 과한 광택을 낮췄으며 기존 회전의 포인터 반응과 제한된 앞면 PNG 포즈 혼합을 더 분명하게 했다. 기존 하트 반발14px 상한과 얼굴4px 이동은 유지한다. 성운은 고정한 채.52/.55/.58 밝기로 조정하고 별은 개수 그대로1px와 밝기만 올렸다. 원본 성운의 중앙 영역은 알파0임을 확인해 얼굴에 색을 덮지 않는다.

현재 홈 기본5그룹과 강화된 모션4그룹, 빌드 통과. 게임 구현 파일 변경0. 녹화는 각 하트 접근/이탈·좌우 이동과 KO/ES 최종 편지를 명확히 포함한다. 마지막 정적 장면도 원래 캡처 시간만큼 보존하고 출력 영상 길이를80ms 이내로 검증했다. 이전18.47/14.70초 영상은 앞 단계의 기록이며 최신 확인용은 아래 두 파일이다.

- [정교화 실제 홈29.77초](https://drive.google.com/file/d/1Fzt9CQezdIH5hVsxZ8uPRsjqMZJZOGSR/view?usp=drivesdk)
- [정교화 WebGL 동작 확인35.23초](https://drive.google.com/file/d/1BOFt2lqOijR6nX4uh_z3-snmnksE20qG/view?usp=drivesdk)

두 파일의 소유자 권한 하나와 shared false·크기를 업로드 후 다시 확인했다. 현재 비녹화 ABBA 비교는 이전 단순 히어로29.98/30.58회/초, 정교화22.29/22.58회/초로 약25.9% 낮다. 이는 software rAF cadence이고 실제GPU FPS가 아니다. 다른 시점의 ac25936 측정과 단순 비교해 이번 수정의 성능 향상/퇴보라고 단정하지 않는다. 실기기 부드러움과 사용자 최종 시각 승인은 남아 있다.

실제 source/현재 화면/녹화 중간 프레임/검증 범위를 `docs/LANDING-POLISH-REVIEW-2026-10-11.ko.md`에 정리했다. 게임 담당의 컴포넌트와 규칙은 이 정교화에서 중복 편집하지 않았다.
