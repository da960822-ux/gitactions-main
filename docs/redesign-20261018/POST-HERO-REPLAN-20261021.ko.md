# Hero 이후 콘텐츠·검수 계획

기준 갱신: 2026-10-21 · 현재 구현 중이며 전체 시각·기능 완료를 뜻하지 않는다.

## 기준과 범위

콘텐츠와 원래 기대 경험의 기준은 [DESIGN](../../design-sessions/post-hero-2026-10-18/DESIGN.ko.md) 및 [EASTER-EGGS v3](../../design-sessions/post-hero-2026-10-18/EASTER-EGGS.ko.md)다. 이 계획은 그 요구를 현재 랜딩 흐름에 연결한다. 원 요구를 폐기하지 않는다.

기본 흐름은 **승인 I → 승인 B 게임방 → 확인된 거리/제작 동기를 담은 하나의 이야기 → 보호된 8게임 갤러리 → 같은 봉투 열기와 원문 읽기 → 짧은 엔딩**이다. `#games`, `#papi-letter`, 기존 게임 경로와 편지의 직접 접근은 언제나 가능하다. 게임 갤러리 뒤에 독립 toy-table/list 장면을 두지 않는다. 이는 이스터에그가 아니다.

L01–L16은 삭제하지 않는다. B의 실제 물체에서 선택해 여는 발견물과 관련 맥락의 세부 행동으로 보존한다. 기본 화면은 전체 16개 목록, 번호 표식, 진행률, 별도 실험실이나 강제 순회를 보여주지 않는다. 현재 기본 진입 후보는 B 안의 L04 토끼, L09 사진, L06 노트북 세 물체다. 선택 시에만 해당 물체의 관련 detail/dialog를 열고, 닫기/Escape로 같은 맥락에 돌아온다. 나머지 기능도 요구된 그래프와 관련 물체에서 발견 가능해야 한다. `.30`/`.45`는 한 거리 이야기 안의 내부 앵커일 뿐 별도 F2/table 구간이 아니다.

R01–R04 공동 기능은 맥락별 opt-in이다. 인증을 강제하지 않고, 각 사람의 동의 전에 공동 기능을 시작하지 않는다. 단독 열람·편지·게임 이용은 기존처럼 로그인 없이 가능하다. 권한·초대·RLS·free-tier 보호는 그대로 둔다.

## 요구 보존표

아래 ID와 의미는 원 [EASTER-EGGS v3](../../design-sessions/post-hero-2026-10-18/EASTER-EGGS.ko.md)의 요구를 추적하기 위한 것이다. 배치·UI 구조는 바뀔 수 있지만 행동, 결과, 접근성 대안과 종료 경로를 제거하지 않는다.

| ID | 발견 맥락과 보존할 결과 |
|---|---|
| L01 | 도미노를 맞추고 연쇄해 서랍을 연다. 장식은 L15에서도 접근한다. |
| L02 | 받침을 기울여 구슬을 홈에 안착시킨다. 단계 버튼 대안을 둔다. |
| L03 | 접힌 면을 선택해 같은 표면의 작은 방 변형을 본다. |
| L04 | 토끼와 빛을 선택해 승인 말의 조명/그림자 변화를 본다. |
| L05 | 렌즈 각도를 맞춰 문양을 게임 아이콘으로 정렬한다. |
| L06 | 직접 그린 흔적을 뒤집어 같은 공간의 카드 결과로 본다. 저장/전송은 자동화하지 않는다. |
| L07 | 무음 신호 순서를 입력하고 막대가 다리로 이어지는 결과를 본다. |
| L08 | 선택한 승인 말을 레일로 이동해 앞뒤 원근과 가림을 본다. |
| L09 | 카드 보관칸 셔터를 열어 승인 사진을 본다. 원본과 얼굴 crop을 보존한다. |
| L10 | 승인 카드를 받침에서 세워 앞/옆을 본다. 확인되지 않은 개인 이력은 덧붙이지 않는다. |
| L11 | 핵심 봉인과 분리된 밀랍 샘플을 누르고 복원한다. |
| L12 | 작은 책의 네 장을 넘겨 승인 말의 준비/타일/카드 구도를 본다. |
| L13 | 종이 세 조각을 맞춰 같은 표면의 길을 완성한다. 편지 잠금에 쓰지 않는다. |
| L14 | 바람으로 종이를 들고 아래 장식을 발견한 뒤 같은 자리에 놓는다. |
| L15 | 말·보석·clip을 정해진 자리에 두고 명시 선택으로 복원한다. L01 없이도 접근한다. |
| L16 | 고정 초대말의 KO/ES 양면을 본다. 편지 원문과 분리한다. |

| ID | 선택 맥락과 공동일 때만 생기는 결과 |
|---|---|
| R01 | 봉투 옆 opt-in, 양측 동의 뒤 같은 개봉 사건. 읽는 속도·언어·카메라는 각자 소유한다. |
| R02 | 장식 맥락에서 ID 제안, 상대 수락 시 같은 물체가 공유 경로로 이동한다. |
| R03 | L06의 양측 그림 영역이 한 카드가 된다. 작성자 구분과 세션 범위를 표시한다. |
| R04 | 리듬 물체에서 짧은 신호를 교대로 주고받는다. 경쟁·마이크·상업 음악 녹음은 없다. |

각 행동은 포인터 외 키보드/터치 대안, 명시 종료와 복구 가능한 초기 상태를 가진다. hover만으로 숨기지 않는다. 무음·효과 off·reduced motion에서도 같은 내용과 도달 가능한 정적 결과를 제공한다.

## 원문·게임·페이지 경계

편지 `landingCopy.ko/es`의 주소·제목·`letterBody[0..4]`·서명 literal은 그대로 사용한다. 원문은 DOM에 한 번만 두고 요약·분할 재작성·이스터에그 삽입을 금한다. `#papi-letter`와 reduced-motion 즉시 읽기는 공개된 독서 상태로 간다. 언어 변경은 `dos-language`의 `ko/es`, 문서 언어 `ko/es-DO`를 유지하고 열린 상태·선택 게임·독서 위치를 보존한다.

랜딩은 짧은 실제 제작 동기, 8개 게임 선택, 같은 봉투와 편지, 엔딩을 제공한다. 게임 규칙/초대/점수는 `/play?game=<id>`, `/play`, `/room/:id` 맥락에서 제공하고 아이디어 입력은 별도 `/feedback`에 둔다. Catchmind 번역 설명을 모든 게임의 공통 기능처럼 소개하지 않는다. 기존 여덟 ID와 각 링크, 갤러리 자산·색·크기·2×4 선택 배치, Leonardo/Splendor를 보호한다. 승인 게임 결과 아트는 실제 게임의 실제 결과에만 쓴다.

확인된 이야기 사실은 한국/도미니카, 언어 불편, 도미니카에서 한국 리듬게임에 접속하기 어려워 함께 놀 공간을 만들었다는 동기, 2025-04-04 시작일이다. 새 카피는 초안이며 실제 발언·원어민 검수라고 표시하지 않는다. 가짜 대화·여행·청혼·서약을 만들지 않고, 기존 편지는 이야기 카피와 분리한다.

## 역할, 검수 순서와 완료 기준

담당은 Sol: 시각/모션/자산 및 자체 검토, Luna: 명확한 기능 요구와 콘텐츠 인벤토리/DOM 감사, root: 공유 카메라·host·통합 및 독립 검수다. 소유권을 유지하며 실패 횟수로 자동 교체하지 않는다. 같은 담당자가 관찰 프레임·측정·잘못된 지시 전제를 고쳐 같은 조건에서 재검수한다.

1920×1080 후 1440×900 KO/ES 데스크톱을 먼저 확인하고 모바일은 마지막에 390×844 및 필요한 768 폭으로 검수한다. 입력·직접 링크·역방향/재진입·focus 복귀·언어 전환·오류와 네트워크 실패를 실제 DOM/브라우저에서 확인한다. 실제 GPU와 SwiftShader를 구분한다. 점수는 새 UI에 대해 다시 매긴다. 최초 A 평가 14/25는 기준점이며 목표는 각 5점 영역 최소 4점이다. Nielsen 27/40은 별도 척도다. 과거 UI 흐름 점수를 새 UI 결과로 옮기지 않는다.

| 영역 | 통과에 필요한 실제 증거 |
|---|---|
| 핵심 흐름 | 승인 B에서 거리 이야기, 보호된 전체 갤러리, 같은 봉투 개봉/원문, 엔딩까지 forward·reverse·직접 링크 확인 |
| L01–L16 | `native-main-20261020-r4`에서 1440×900 KO로 16개 실제 행동을 한 흐름에서 모두 완료했다. 포함 항목에는 L01 도미노 밀기, L06 그림 카드, L16 KO/ES 양면 확인이 있다. 이는 단일 KO 세션의 행동 확인이며 전체 이중언어 검수나 시각 합격을 뜻하지 않는다. |
| R01–R04 | 실제 두 사용자/두 기기의 동의·결과·취소·만료·재접속. 로컬 실제 backend 검수 9/9는 두 개의 인증 컨텍스트와 한 host에서 통과했다. 실제 두 하드웨어나 hosted/cloud backend 검증으로 과장하지 않는다. |
| 편지/갤러리 | 두 언어 원문 literal, hash 직접 열기·닫기·재열기, 8개 링크와 보호된 시각 구조, focus/접근성 확인 |
| 모션/레이아웃 | 실제 viewport·언어·시작/중간/끝·역행·오류를 기록하고 합격/미검수 범위를 분리 |

## 현재 증거와 남은 작업

- [실제 스페인어 웹 사용 녹화](../review/landing-5c12f9b-es.mp4)는 source `5c12f9b`의 검수용 기록이다. 1440×900, 46.60초, 1.08배속, 무음·무자막 H.264로 Hero 왕복·B의 실제 낙서/카드·갤러리 hover/선택·편지 열기/읽기/닫기·엔딩을 담았다. 페이지를 재현한 제작 영상이 아니며 원본 녹화의 준비/마지막 대기 시간만 잘랐다. 전체 디자인 합격이나 이후 수정본을 뜻하지 않는다. 아래 `output/` 링크는 작업환경의 로컬 검수 자료다.

- 현재 frozen source의 통합 checkpoint는 전체 77 files/620 tests, post 26/26, TypeScript/Vite/edge build 통과다. 편지·모바일·터치 최종 수정 뒤의 [full-test 로그](../../output/current-review/implementation-20261021/full-tests-final.log), [post 검사 로그](../../output/current-review/implementation-20261021/post-tests-final.log), [build 로그](../../output/current-review/implementation-20261021/build-final.log)에 남아 있으며 500 kB 이상 chunk 경고는 유지된다. Hero focused geometry test는 [focused log](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/focused-tests.log)에서 22/22 통과했다. 수학 검사와 화면/성능 평가는 구분한다.
- 현재 Hero의 [joint capture report](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/joint-report.json)은 1920×1080과 1440×900에서 forward/reverse/interruption 뒤 같은 pose를 기록하고 browser/HTTP 오류는 0이다. 직전 실패였던 극단 FOV·macro 접사·닫힌 구멍·B 외곽 rectangle은 이 캡처에서 해결됐다. SwiftShader 캡처에 대한 독립 A 평가는 구도 3/5, 공간 3/5, 목적 4/5이며 1440에서 남성 인물 머리/헤드셋 가장자리가 일부 가려지는 문제가 남았다. 최신 이미지는 [1920 joint](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/1920-joint.png), [1440 joint](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/1440-joint.png)다. 앞서 실패한 `product-report.json` 및 `.2823` macro/`.42` desk 프레임은 최신 평정이 아닌 이전 실패 이력이다. v8 캡처/foliage edge와 v6 inside-only도 역사 이력이다. 실제 GPU 성능은 측정하지 않았다. 승인 원본 I/B/P는 보존한다. 상세 연구는 [Hero brief](HERO-REVISION-BRIEF-20261021.ko.md)와 [failure audit](PROCESS-FAILURE-AUDIT-20261021.ko.md)를 본다.
- 새 갤러리 hover는 완료 기록이 있다: [구현/검수 보고서](../../output/gallery-pointer/REPORT.md). 기존 물체에 0.12 world-unit lift, 축별 최대 4°, 자산·레이아웃·재질 변화 없음, focused tests 2/2, 실제 1920/1440 포인터와 390 터치 및 reduced-motion 검수가 기록됐다. 브라우저는 SwiftShader 소프트웨어 렌더링이다. 이는 랜딩 전체 검수가 아니다.
- 전체 KO 행동 검수는 [native-main-20261020-r4 보고서](../../output/current-review/implementation-20261021/main-local-sixteen-actions/native-main-20261020-r4/report.json)에서 1440×900 한 흐름의 L01–L16 16개 모두 통과했다. 별도 이중언어 확인은 L16의 KO/ES 양면을 spot-check했으며 전체 KO/ES 행동 전수 검수는 아니다. [room-discovery-v1](../../output/current-review/implementation-20261021/room-discovery-v1/report.json)은 desktop 22/22, ES lifecycle, L01 도미노와 exit-final을 통과했고 보고서 오류도 0이다. 과거의 숨김 selector timeout은 이 현재 통과 보고서의 결과가 아니다.
- [content-audit-v2](../../output/current-review/implementation-20261021/content-audit-v2/report.json)는 34개 중 30개 통과, 4개 harness selector 오류로 전체 보고서가 미통과다. 후속 [content-audit-v3](../../output/current-review/implementation-20261021/content-audit-v3/report.json)는 실패 4개 시나리오를 고친 selector로 다시 실행해 L06 그림→카드·locale persistence·feedback/play 경로를 KO/ES 각 한 뷰포트씩 4/4 통과했으며 browser errors/network failures는 0이다. v2의 분류는 테스트 selector 오류이며 제품 hotspot 고장으로 취급하지 않는다. 두 해상도·언어 전체가 모두 통과했다는 의미는 아니다.
- 공동 기능의 최신 결과는 [final-room-discovery-flow/results-r2 보고서](../../output/current-review/implementation-20261021/shared-real/final-room-discovery-flow/results-r2/report.json): 9/9 통과, 두 개의 실제 인증 사용자 컨텍스트/한 host/local backend다. 의도된 재시도 가능한 409 한 건과 offline 검증 중 연결 실패가 포함되며, 두 하드웨어나 cloud 검수는 아니다.
- 21st.dev MCP 연결은 현재 사용할 수 없다. 공개 페이지/원본을 확인했고 Ruixen 저장소 MIT 수학 일부를 L14 `paperGustHeight`에 적용했다. 현재 main의 L14 종이는 `Details.tsx`에서 128개 면을 투영한 DOM/SVG polygon으로 표시된다. standalone `LocalEventRig.ts`에는 별도 3D 종이 구현이 남아 있지만 현재 main GPU factory는 이를 생성하지 않으므로 main에서 3D mesh를 쓴다고 볼 수 없다. 원래 요청된 네이티브/toy UI는 유지하되 독립 toy catalog는 사용자 지시에 따라 제외했고 2D 표현을 허용했다. 따라서 기능/맥락은 보존했지만 이 세부 항목은 최초의 전체 3D 구성안을 완료한 것이 아니다. 자세한 출처와 범위는 [21st source audit](../../output/current-review/implementation-20261021/21st-source-audit.md)에 있다.
- F1의 승인 B crop 화면은 제품 UI에 통합됐고 [F1 browser report](../../output/current-review/implementation-20261021/F1-workstation-integration/report.json)에서 1920/1440·KO/ES 구도/anchor 검사 9/9와 1440 ES reverse-camera 검사가 통과했다. 최신 main 5173의 [root 통합 흐름 기록](../../output/current-review/implementation-20261021/root-integrated-flow/flow-report.json)은 1920×1080 ES 10개 forward/reverse 상태, 원문 5문단, overflow·console·network 오류 0을 기록하고 4개 check 모두 통과했다. 종료화면은 실제 L06 그림 뒤집기와 L09→L01→L15 gem 선택을 거쳐 같은 SVG/Gem 상태를 전체 화면에 정착시켰다. 따라서 이전 optional frame의 미정착 판정은 이 최신 캡처로 보완됐으며, 구형 5175 캡처를 현재 증거로 쓰지 않는다.
- Ending B2D 개별 [ending-room-replacement 보고서](../../output/current-review/implementation-20261021/ending-room-replacement/report.json)는 8개 기능 assertion이 통과했고 console/network 오류도 0이다. 별도 기본 프레임 4개는 1920/1440 KO/ES 각각 보호 영역·overflow 검사에 통과했고, 앞선 선택 프레임은 당시 약 69px 이동 때문에 미정착으로 표시됐다. 그 선택 상태는 위 최신 root 통합 캡처에서 실제 drawing/gem과 함께 settled로 확인됐다. main ending이 화면을 덮으면 `LandingWorldHost`가 GPU stage를 숨긴다. F2용 생성 책상 배경은 계속 output-only이며 product에 복사/통합하지 않았다. R20/wall-volume의 다른 output-only 실패 연구도 product 완료 근거가 아니다. 독립 A의 실제 1440 desktop motion/소프트웨어 5초 측정과 B의 별도 검수는 완료했다. A 25/32(8항목), B 18/28(7항목)는 서로 다른 적용 범위이므로 평균내지 않는다. Hero 공간/구도는 여전히 3/5이며 전체 시각 완료가 아니다. 기존 영상은 위의 5c12f9b 증거다. 실제 hardware GPU 성능 측정도 남아 있다.

### 후속 편지·최종 모바일 확인

- [early-letter-handoff](../../output/current-review/implementation-20261021/early-letter-handoff/README.ko.md): 개봉 직후 빈 판을 보이던 인계 시작을 .70→.62로 옮겨 같은 원문 DOM 한 개를 펼친 종이에 투영했다. 실제 1920 ES·1440 KO에서 클릭/읽기/접기/역행, 원문 5문단과 quad 오차 2px 이내를 확인했다. 초기 원근 미리보기의 작은 글자는 별도 정상 독서 장면을 대신하지 않는다.
- [mobile-post-confirmation](../../output/current-review/implementation-20261021/mobile-post-confirmation/report.json): 마지막 단계 390×844 KO/ES 및 reduced motion에서 F1 가독성, 전체 B 자연 높이 엔딩/그림 회수, 16px 원문, 하단 접기·재열기·장미 힌트·세 방 물체 진입을 확인했다. coarse pointer의 세 진입 영역은 중심을 유지하며 최소 44px다. 이 보고서의 `passed:false`는 당시 L06 뒤집기 실패를 보존한 것으로 아래 후속 결과와 함께 읽는다.
- [L06 실제 입력 진단 및 해결](../../output/current-review/implementation-20261021/mobile-post-confirmation/touch-diagnostic.json)의 `afterFix.passed=true`: KO/ES 자유 터치 그림→카드→그림에서 L06 유지/동일 stroke 보존, 터치·마우스·Enter·Space 각각 한 번 전환을 확인했다. 재배치 뒤 다른 관련 버튼에 전달되던 호환 click을 공통 조상 capture에서 막았다. console/network 0건. pointercancel/영역 밖 release 별도 주입, 실제 휴대폰과 실제 GPU는 미검수다.
- 게임 선택 버튼의 잘못된 이동 화살표와 불필요한 영문 kicker만 제거했다. 실제 게임 진입 화살표, 중앙+7개, 2×4, 조각 크기·색·자산은 그대로다. 승인 I/B/P 원본과 게임/리듬 원본을 교체하지 않았다.

### 게임·원본 보존 대조 (소스/Git 읽기 전용)

| 범위 | 실제 확인 | 한계 |
|---|---|---|
| 게임 규칙·콘텐츠 | `src/games/**`는 gamefix 조상 `df087fc85b35edc5e14eb3a196fc0fc60f86dc33`부터 현재 `HEAD b5b2b1ad8316520e43c403f45568fc8f8b743e8e`까지 diff 0, 그 뒤 worktree도 변경 0 | 브라우저에서 게임 플레이를 실행하지 않음 |
| 공유 core/Supabase | gamefix 이후 18개 shared-event 관련 변경(client/server/state, tests, edge function, 세 migrations)이 있지만 현재 `HEAD` 이후 worktree diff는 0 | 게임 규칙 트리 변경과 구분되는 추가 공동 기능이며, 이 표는 통합 동작을 검증하지 않음 |
| Rhythm 원본 | `public/rhythm`은 gamefix 이후 및 현재 worktree에서 변경 0. `Music14.swf` SHA-256 `2fb5b17c83fb466a0ccd8dc2318d40bdea42d597229163170a4a0afb6e0dc3b4`, `Music_RES.swf` `53499afd89b5eebde8ea99d9bcb5cb3dd5fb83d1faaa96d77eaaa802b3a6a071`; Ruffle 런타임과 라이선스 파일도 보존 | 원본 플레이어의 런타임 성공은 확인하지 않음 |
| 승인 이미지 | 우주 I `public/images/our-universe-scene.webp` SHA-256 `29747b92c13babd57938f064c9e5a6a94339594e6adafe342e18d0e25a3114e9`, 게임방 B PNG `public/images/approved-couple-room/approved-couple-gaming-room.png` `a569e1a1ed8c21fffb7a11cc7065816a0882fdaaba3e1a4bcd65dc241681eb26`, 인물 P `public/images/approved-couple-room/approved-character-reference.png` `ccabcdcc074d7f8840360c1cd5671a024d8c0336f6c7241e44cfb40e89b36f31`; 모두 현재 `HEAD`와 동일하고 `HEAD` 이후 변경 없음 | I/B/P 모두 보호된 기존 원본이며, 정합성은 hash/source 검사다 |
| 편지 원문 | `letterhome.ts`라는 tracked 파일은 없음. gamefix 이후 `src/copy/home.ts` 변경은 hero/moments 카피에 한정되고 편지 주소·제목·5문단·서명 literal은 그대로다. 현재 `HEAD` 이후 변경도 없음 | source 검사이며 브라우저 DOM 검수는 아님 |
| 선택·언어·Catchmind | `src/games/catalog.ts`와 `src/core/types.ts`의 8 ID (`davinci`, `catchmind`, `domino`, `jaipur`, `splendor`, `minhwatu`, `marble`, `rhythm`) 일치. `GameGallery`는 `/play?game=<id>`로 연결하고 `PlayApp`이 query의 ID를 읽음. `Landing`은 `dos-language` ko/es를 읽고 씀. `src/core/client.ts`의 추측 호출은 `gameId === 'catchmind'`로 제한되고 답 검사는 ko/es 답과 alias를 NFC·소문자·trim 정규화함; `src/core/authority.ts`의 채팅 허용도 Catchmind 한정임 | 고정 소스 경로와 호출 연결만 확인; 실제 링크 클릭/언어 전환은 브라우저에서 확인하지 않음 |

## 구현 안전 경계와 정리

기존 React/TypeScript, DOM/SVG/CSS, 직접 Three/GSAP와 상태/helper를 우선한다. 새 renderer, animation library, 복제 controller를 추가하지 않는다. 공유 renderer/scene/camera/resize/dispose/RAF는 단일 owner만 변경한다. WebGL 실패에서도 DOM 게임 링크·편지와 명확한 갤러리 상태를 유지하고 이를 시네마틱 통과로 부르지 않는다.

불필요 코드는 실제 진입 경로, 동적 import, 테스트/fixture, 자산 참조와 파일 소유권을 확인한 뒤에만 제거한다. 이름이 오래돼 보인다는 이유만으로 삭제하지 않는다. L01–L16의 helper/입력/검증, R01–R04의 인증·동의·RLS/free-tier, 원문, 여덟 게임·route, 승인 원본/provenance와 검수 증거는 보존한다. 중복 백업·동일 경로 사본을 새로 만들지 말고 기존 작업물에서 검증·정리한다. 최근 scratch 정리는 10,725개 동일경로 SHA 중복 파일(논리 크기 6,114,665,835 bytes)을 정리했으며 새 백업을 만들지 않았다.

완료를 선언하기 전에는 최신 source revision과 해당 browser evidence를 맞춘다. 현재 기존 Hero 브랜치에 같은 브랜치 commit/push는 허용된다. main 병합과 배포는 이 계획의 일부가 아니며 별도 승인 없이 진행하지 않는다.
