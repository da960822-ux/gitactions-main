# Hero 이후 콘텐츠·검수 계획

기준 갱신: 2026-10-21 · 현재 구현 중이며 전체 시각·기능 완료를 뜻하지 않는다.

## 기준과 범위

콘텐츠와 원래 기대 경험의 기준은 [DESIGN](../../design-sessions/post-hero-2026-10-18/DESIGN.ko.md) 및 [EASTER-EGGS v3](../../design-sessions/post-hero-2026-10-18/EASTER-EGGS.ko.md)다. 이 계획은 그 요구를 현재 랜딩 흐름에 연결한다. 원 요구를 폐기하지 않는다.

두 원문은 제안 당시 기록으로 보존한다. DESIGN의 게임→스토리 권장 순서는 아래 현행 흐름으로 조정됐고, EASTER-EGGS의 공동 기능 미구현 설명은 제안 당시 상태다. 현재 구현·검수 범위는 이 문서의 검수 근거를 따른다.

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

- `b59d36c` 이후 비활성 옛 소스 6개/187줄을 정리했다. 현재 앱·preview·scripts·진행 중 Hero 연구에서 호출하지 않는 `shellGeometry`, `arrivalCoveV15`, `poseSpaceV11`, `storyAtriumV19`와 앞 두 helper 전용 테스트를 제거했고 원본 archive·계획·승인 자산은 유지했다. 편지의 시간축·최초 진입 교정까지 반영한 main 76 files/623 tests, post 29/29, TypeScript/Vite/edge build가 통과했다([main](../../output/current-review/implementation-20261021/room-reward-correction/full-integrated-tests.log), [post](../../output/current-review/implementation-20261021/room-reward-correction/post-integrated-tests.log), [build](../../output/current-review/implementation-20261021/room-reward-correction/build-integrated.log)). 최신 기능 검사는 03:59 UTC의 main 23.88초, post 402.76ms, Vite build 7.25초다. Three 0.186.1이 이미 강제 대체하던 그림자 상수도 같은 실효값으로 명시했으며 실제 브라우저에서 해당 경고가 없음을 확인했다. 아래 629/27 기록은 이전 소스 checkpoint의 과거 결과다. [정리 metadata](../../output/current-review/implementation-20261021/room-reward-correction/report.json)의 `inactiveSourceCleanup`에 구분했다. 기존 500kB chunk 경고는 남는다.

- [최신 실제 스페인어 녹화](../review/landing-current-es.mp4)는 source `47ed933f76676f4dff03ac2249b422abe04c2c15`의 **현재 검수용** 기록이다. Chromium/Linux/SwiftShader, 1440×900·DPR1, 48.70초·1.08배속·H.264/yuv420p·무음·무자막이다. Hero 정/역/정, B의 L06 실제 그림/카드/Escape, 갤러리 포인터/Da Vinci 선택, 편지 개봉·원문 5문단/4+4장미·3초 독서·연속 접기·엔딩을 담았다. browser/HTTP 오류 0이다. root는 전체 2초 간격 contact sheet와 실제 인코딩 파일의 36.5/39/42초를 열어 원문·장미·닫힌 봉투를 확인했다. Hero 연구는 이 영상에 통합되지 않았으며 전체 디자인 완료/실GPU 성능 증거가 아니다. 이 영상의 약32–35초에는 당시 **처음 보이는 초대 버튼으로 열 때** 종이 조각/봉투 구도가 어긋나는 문제가 남아 있다. 이후 아래 최초 진입 교정은 이 영상에 아직 반영하지 않았다. 앞선 중간 진입/읽기/닫기 4/5와 이번 최초 진입 검수를 구분한다. [현재 실행 metadata](../../output/current-review/implementation-20261021/spanish-landing-walkthrough/report-current.json)에 source·속도·입력·오류·raw 삭제를 구분했다. 이전 44.53초는 `da2464d` 기록이며 Git 이력으로 구분한다. 아래 5c12 영상은 독립 평가 대상 보존용이다.
- 최초 개봉은 `PostHeroPreview.tsx`의 기존 native smooth scroll과 1.8초 개봉을 함께 시작해 편지 장면을 먼저 화면에 정렬한다. `.58`로 camera/DOM 준비를 앞당긴 임시안은 갤러리 위에 원문을 겹쳐 보여 3/5였으므로 폐기했고 공유 카메라·표시 gate는 기존 `.62`를 유지한다. 같은 native 첫 버튼에서 1440 ES p=.605 / 1920 KO p=.602 → p=.663, 갤러리 완전 퇴장·원문 5문단/단일 DOM·닫기/포커스 복귀를 확인했고 root도 두 PNG를 직접 열었다. 독립 A의 1440 ES 최초 개봉→독서/4+4→연속 닫기는 craft/continuity/personal purpose **각 4/5**, 해당 범위 blocking 없음이다. 개봉 중 q=.065 실제 wheel은 남은 자동정렬을 중단하고 2.1초 뒤 재개하지 않았지만, 이 입력으로 실제 역방향 이동까지 검증한 것은 아니다. [기존 report](../../output/current-review/implementation-20261021/content-audit-v3/report.json)의 `letterStageAlignmentVerification`과 `independentVisualReview.postFlowFollowup.correctionActualFollowup.continuityFinalActual.firstEntryReadiness.alignedConfirm`에 원시 실패·잘못된 runner assertion·범위별 최종 결과를 구분했다. 모바일/전체 Hero·후반 공간의 점수로 확대하지 않는다.


- [실제 스페인어 웹 사용 녹화](../review/landing-5c12f9b-es.mp4)는 source `5c12f9b`의 검수용 기록이다. 1440×900, 46.60초, 1.08배속, 무음·무자막 H.264로 Hero 왕복·B의 실제 낙서/카드·갤러리 hover/선택·편지 열기/읽기/닫기·엔딩을 담았다. 페이지를 재현한 제작 영상이 아니며 원본 녹화의 준비/마지막 대기 시간만 잘랐다. 전체 디자인 합격이나 이후 수정본을 뜻하지 않는다. 아래 `output/` 링크는 작업환경의 로컬 검수 자료다.

- 이전 `b5b2613` 통합 checkpoint는 전체 77 files/620 tests, post 26/26, TypeScript/Vite/edge build 통과다. 편지·모바일·터치 최종 수정 뒤의 [full-test 로그](../../output/current-review/implementation-20261021/full-tests-final.log), [post 검사 로그](../../output/current-review/implementation-20261021/post-tests-final.log), [build 로그](../../output/current-review/implementation-20261021/build-final.log)에 남아 있으며 500 kB 이상 chunk 경고는 유지된다. Hero focused geometry test는 [focused log](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/focused-tests.log)에서 22/22 통과했다. 수학 검사와 화면/성능 평가는 구분한다.
- 현재 Hero의 [joint capture report](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/joint-report.json)은 1920×1080과 1440×900에서 forward/reverse/interruption 뒤 같은 pose를 기록하고 browser/HTTP 오류는 0이다. 직전 실패였던 극단 FOV·macro 접사·닫힌 구멍·B 외곽 rectangle은 이 캡처에서 해결됐다. SwiftShader 캡처에 대한 독립 A 평가는 구도 3/5, 공간 3/5, 목적 4/5이며 1440에서 남성 인물 머리/헤드셋 가장자리가 일부 가려지는 문제가 남았다. 최신 이미지는 [1920 joint](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/1920-joint.png), [1440 joint](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/1440-joint.png)다. 앞서 실패한 `product-report.json` 및 `.2823` macro/`.42` desk 프레임은 최신 평정이 아닌 이전 실패 이력이다. v8 캡처/foliage edge와 v6 inside-only도 역사 이력이다. 실제 GPU 성능은 측정하지 않았다. 승인 원본 I/B/P는 보존한다. 상세 연구는 [Hero brief](HERO-REVISION-BRIEF-20261021.ko.md)와 [failure audit](PROCESS-FAILURE-AUDIT-20261021.ko.md)를 본다.
- 새 갤러리 hover는 완료 기록이 있다: [구현/검수 보고서](../../output/gallery-pointer/REPORT.md). 기존 물체에 0.12 world-unit lift, 축별 최대 4°, 자산·레이아웃·재질 변화 없음, focused tests 2/2, 실제 1920/1440 포인터와 390 터치 및 reduced-motion 검수가 기록됐다. 브라우저는 SwiftShader 소프트웨어 렌더링이다. 이는 랜딩 전체 검수가 아니다.
- 전체 KO 행동 검수는 [native-main-20261020-r4 보고서](../../output/current-review/implementation-20261021/main-local-sixteen-actions/native-main-20261020-r4/report.json)에서 1440×900 한 흐름의 L01–L16 16개 모두 통과했다. 별도 이중언어 확인은 L16의 KO/ES 양면을 spot-check했으며 전체 KO/ES 행동 전수 검수는 아니다. [room-discovery-v1](../../output/current-review/implementation-20261021/room-discovery-v1/report.json)은 desktop 22/22, ES lifecycle, L01 도미노와 exit-final을 통과했고 보고서 오류도 0이다. 과거의 숨김 selector timeout은 이 현재 통과 보고서의 결과가 아니다.
- [content-audit-v2](../../output/current-review/implementation-20261021/content-audit-v2/report.json)는 34개 중 30개 통과, 4개 harness selector 오류로 전체 보고서가 미통과다. 후속 [content-audit-v3](../../output/current-review/implementation-20261021/content-audit-v3/report.json)는 실패 4개 시나리오를 고친 selector로 다시 실행해 L06 그림→카드·locale persistence·feedback/play 경로를 KO/ES 각 한 뷰포트씩 4/4 통과했으며 browser errors/network failures는 0이다. v2의 분류는 테스트 selector 오류이며 제품 hotspot 고장으로 취급하지 않는다. 두 해상도·언어 전체가 모두 통과했다는 의미는 아니다.
- 공동 기능의 최신 결과는 [final-room-discovery-flow/results-r2 보고서](../../output/current-review/implementation-20261021/shared-real/final-room-discovery-flow/results-r2/report.json): 9/9 통과, 두 개의 실제 인증 사용자 컨텍스트/한 host/local backend다. 의도된 재시도 가능한 409 한 건과 offline 검증 중 연결 실패가 포함되며, 두 하드웨어나 cloud 검수는 아니다. R02–R04 시작에는 QA event 주입이 있어, 이 결과만으로 메인 B 물체→관련 발견물→공동 버튼→backend까지의 단일 native 경로를 입증하지 않는다. 해당 연결 경로는 별도 후속 검수한다.
- 후속 메인 native 검수는 R01의 실제 초대/취소, B 진입부터 R02 전달·R03 공동 그림 카드까지 확인했다. R04는 실제 패턴 작성·상대 순서 반복·동의 전체에 동일한 20초가 적용돼 만료되는 문제를 드러냈다. 원문의 20초는 proof 초깃값이며 타이밍 경쟁을 요구하지 않는다. R03/R04 준비만 120초로 바꾸고, R01/R02 20초·세션 1시간/3개 제한·30초 cooldown·700ms start delay·입력/영수증 상한·인증/RLS는 유지했다. 최종 `nativeSolFinal`은 2026-10-21 01:05:46–01:10:59 UTC의 실제 브라우저 한 실행에서 통과했다. 1920 KO·1440 ES의 서로 다른 인증 컨텍스트가 B→L06→L07→R04 맥락으로 들어가 실제 120초 서버 기한과 21.5초 뒤 기여, 양측 반복·동의·확인·시작, 순서대로 재생되는 DOM 패턴 4회와 B 복귀를 확인했다. R03도 같은 실제 세션의 새 라운드에서 21.5초 뒤 상대의 다른 반쪽 그림 기여·양측 동의·카드 합치기·B 초점/스크롤/hash 복귀를 통과했다. 시간 조작·상태 주입·직접 action API 없이 source hash 동일, console/network/HTTP 오류 0건이다. root도 두 결과 PNG를 열었다. 임시 세션은 실제 삭제했고 QA 5212/gateway 55431을 종료한 뒤 main 5173의 HTTP 200을 확인했다. 이전 runner 실패와 20초 UX 실패는 같은 보고서에 보존한다. 라운드 만료를 초대 세션 전체 만료로 잘못 안내하던 분기도 고쳤다. 로컬 한 기기의 두 컨텍스트이며 두 물리 기기·cloud·성능 검수가 아니다.
- 21st.dev MCP 연결은 현재 사용할 수 없다. 공개 페이지/원본을 확인했고 Ruixen 저장소 MIT 수학 일부를 L14 `paperGustHeight`에 적용했다. 현재 main의 L14 종이는 `Details.tsx`에서 128개 면을 투영한 DOM/SVG polygon으로 표시된다. standalone `LocalEventRig.ts`에는 별도 3D 종이 구현이 남아 있지만 현재 main GPU factory는 이를 생성하지 않으므로 main에서 3D mesh를 쓴다고 볼 수 없다. 원래 요청된 네이티브/toy UI는 유지하되 독립 toy catalog는 사용자 지시에 따라 제외했고 2D 표현을 허용했다. 따라서 기능/맥락은 보존했지만 이 세부 항목은 최초의 전체 3D 구성안을 완료한 것이 아니다. 자세한 출처와 범위는 [21st source audit](../../output/current-review/implementation-20261021/21st-source-audit.md)에 있다.
- 같은 표현 범위는 L03에도 적용된다. 기존 `pocket-fold`의 두 기호를 같은 종이의 날개·두 자리·테이블·선택한 승인 게임말로 구성한 DOM/SVG로 개선했다. 별도 3D 미니룸 rig는 제품에서 호출되지 않으며, 16개 실제 행동 통과를 원설계 16개 전체 3D 표현 완료로 확대하지 않는다. 미사용 rig도 원설계 provenance와 테스트가 있어 단순 중복으로 삭제하지 않았다.
- F1의 승인 B crop 화면은 제품 UI에 통합됐고 [F1 browser report](../../output/current-review/implementation-20261021/F1-workstation-integration/report.json)에서 1920/1440·KO/ES 구도/anchor 검사 9/9와 1440 ES reverse-camera 검사가 통과했다. 최신 main 5173의 [root 통합 흐름 기록](../../output/current-review/implementation-20261021/root-integrated-flow/flow-report.json)은 1920×1080 ES 10개 forward/reverse 상태, 원문 5문단, overflow·console·network 오류 0을 기록하고 4개 check 모두 통과했다. 종료화면은 실제 L06 그림 뒤집기와 L09→L01→L15 gem 선택을 거쳐 같은 SVG/Gem 상태를 전체 화면에 정착시켰다. 따라서 이전 optional frame의 미정착 판정은 이 최신 캡처로 보완됐으며, 구형 5175 캡처를 현재 증거로 쓰지 않는다.
- Ending B2D 개별 [ending-room-replacement 보고서](../../output/current-review/implementation-20261021/ending-room-replacement/report.json)는 8개 기능 assertion이 통과했고 console/network 오류도 0이다. 별도 기본 프레임 4개는 1920/1440 KO/ES 각각 보호 영역·overflow 검사에 통과했고, 앞선 선택 프레임은 당시 약 69px 이동 때문에 미정착으로 표시됐다. 그 선택 상태는 위 최신 root 통합 캡처에서 실제 drawing/gem과 함께 settled로 확인됐다. main ending이 화면을 덮으면 `LandingWorldHost`가 GPU stage를 숨긴다. F2용 생성 책상 배경은 계속 output-only이며 product에 복사/통합하지 않았다. R20/wall-volume의 다른 output-only 실패 연구도 product 완료 근거가 아니다. 독립 A의 실제 1440 desktop motion/소프트웨어 5초 측정과 B의 별도 검수는 완료했다. A 25/32(8항목), B 18/28(7항목)는 서로 다른 적용 범위이므로 평균내지 않는다. Hero 공간/구도는 여전히 3/5이며 전체 시각 완료가 아니다. 기존 영상은 위의 5c12f9b 증거다. 실제 hardware GPU 성능 측정도 남아 있다.

### 후속 편지·최종 모바일 확인

- [early-letter-handoff](../../output/current-review/implementation-20261021/early-letter-handoff/README.ko.md): 개봉 직후 빈 판을 보이던 인계 시작을 .70→.62로 옮겨 같은 원문 DOM 한 개를 펼친 종이에 투영했다. 실제 1920 ES·1440 KO에서 클릭/읽기/접기/역행, 원문 5문단과 quad 오차 2px 이내를 확인했다. 초기 원근 미리보기의 작은 글자는 별도 정상 독서 장면을 대신하지 않는다.
- [mobile-post-confirmation](../../output/current-review/implementation-20261021/mobile-post-confirmation/report.json): 마지막 단계 390×844 KO/ES 및 reduced motion에서 F1 가독성, 전체 B 자연 높이 엔딩/그림 회수, 16px 원문, 하단 접기·재열기·장미 힌트·세 방 물체 진입을 확인했다. coarse pointer의 세 진입 영역은 중심을 유지하며 최소 44px다. 이 보고서의 `passed:false`는 당시 L06 뒤집기 실패를 보존한 것으로 아래 후속 결과와 함께 읽는다.
- [L06 실제 입력 진단 및 해결](../../output/current-review/implementation-20261021/mobile-post-confirmation/touch-diagnostic.json)의 `afterFix.passed=true`: KO/ES 자유 터치 그림→카드→그림에서 L06 유지/동일 stroke 보존, 터치·마우스·Enter·Space 각각 한 번 전환을 확인했다. 재배치 뒤 다른 관련 버튼에 전달되던 호환 click을 공통 조상 capture에서 막았다. console/network 0건. pointercancel/영역 밖 release 별도 주입, 실제 휴대폰과 실제 GPU는 미검수다.
- 게임 선택 버튼의 잘못된 이동 화살표와 불필요한 영문 kicker만 제거했다. 실제 게임 진입 화살표, 중앙+7개, 2×4, 조각 크기·색·자산은 그대로다. 승인 I/B/P 원본과 게임/리듬 원본을 교체하지 않았다.

### 실제 봉투·원문 구도 통합 — 2026-10-21 UTC

같은 봉투의 개봉과 독서를 중심에 둔 연구는 독립 A의 정지 구도/읽기 위계/개인적 목적 각각 4/5를 받은 뒤 desktop에 통합했다. 넓은 목재 바닥·받침·펜은 desktop 전체 구간에서 숨겨 재등장하지 않으며, 모바일 기존 지원면은 유지한다. 새로운 장식·광원·이미지·본문·renderer는 추가하지 않았다. 봉투의 실제 불투명 front cap은 DOM 원문과 같은 크림색, 두께/봉인/접힘은 기존 lit material을 유지한다. 단일 원문 article이 정상 17px·1920의 740px/1440의 705px 너비로 개봉 화면 오른쪽에 도착한 뒤 같은 원문이 장미 4+4 독서 위치로 이어진다. 공유 Host는 유효한 본문 높이 cache를 전달하고 Hero/B 경로·postTransform·갤러리는 변경하지 않았다.

[실제 통합 기록](../../output/current-review/implementation-20261021/early-letter-handoff/README.ko.md)의 1920 ES·1440 KO는 단일 원문 5문단, 개봉/독서/접기/재열기, q 중간 반전과 p .78→.69/.60→.663 복원, 오류·overflow 0을 확인했다. 390 KO는 기존 정상 독서 spot-check다. 최초 locator/초기 상태 실행에서 progress 이동이 나왔지만 직전 bbox 기록이 없어 원인을 확정하지 않았다. 후속 **보이는 버튼 중심을 실제 마우스로 클릭한 1920 ES 진단**은 별도 보정 스크롤 없이 q0→q1→q0 전체에서 scrollY 5968/p .663을 유지했다. 계약 pose로 보정했던 초기 검사와 이 native 증거를 구분한다.

최종 소스는 [main 77 files/620 tests](../../output/current-review/implementation-20261021/early-letter-handoff/full-integrated-tests.log), [post 27/27](../../output/current-review/implementation-20261021/early-letter-handoff/post-integrated-tests.log), [TypeScript/Vite/edge build](../../output/current-review/implementation-20261021/early-letter-handoff/build-integrated.log)와 diffcheck를 통과했다. post runner는 기존 npm cache의 tsx를 offline으로 사용했으며 의존성/lockfile 변경은 없다. >500 kB chunk 경고는 남는다. 상단 최신 `da2464d` 실제 녹화는 이 통합과 L06 개선을 포함한다. 이전 중간 영상 사본을 추가하지 않고 같은 현재 파일을 갱신했다. 연구 4/5를 전체 Lusion 공간 모션이나 Hero의 새 점수로 옮기지 않는다.

### 후속 발견물 시각 통합과 모바일 경로 감사

- L03는 독립 A의 정지 후보 구도/위계/개인적 목적 각각 4/5 뒤 기존 선택형 dialog에만 통합했다. [현재 제품 검수](../../output/current-review/implementation-20261021/room-reward-correction/report.json)의 `paperRoomIntegration`은 1920 ES·1440 KO의 펼치기/옆면/접기/재열기·실제 게임말 선택 변경·Escape/X·B focus/scroll 복귀, 390 기존 표현 보호 등 22/22를 기록한다. root도 두 제품 PNG를 직접 확인했다. 상태별 다음 동작 이름과 L06에만 해당하는 그림 보관 문구도 바로잡았다. focused SSR 5/5·TypeScript·빌드 통과이며 전체 랜딩/모션의 4/5를 뜻하지 않는다. 390은 새 SVG를 숨기고 기존 표현을 보존한 범위다. 상단 영상의 source `da2464d` 이후 수정이므로 그 영상에는 이 L03 후속 변경이 없다.
- L03와 공동 준비시간 통합 당시 [전체 78 files/629 tests](../../output/current-review/implementation-20261021/room-reward-correction/full-integrated-tests.log), [post 27/27](../../output/current-review/implementation-20261021/room-reward-correction/post-integrated-tests.log), [TypeScript/Vite/edge build](../../output/current-review/implementation-20261021/room-reward-correction/build-integrated.log)가 통과했다. 새 네 경계 검사는 R03/R04의 늦은 기여 허용·편집으로 기한 무한 연장 불가·120초 만료와 R01/R02의 기존 20초를 확인한 과거 checkpoint 기록이다. 이후 비활성 테스트를 제거하고 편지 endpoint를 고친 소스의 최신 전체 검사는 위 76/623·29/29이다. 과거 checkpoint의 테스트 수와 최신 검사를 구분한다. 실제 backend 검수용 edge도 당시 같은 생성 bundle로 재시작했다. 큰 chunk 경고는 남으며 이 테스트 수를 디자인 점수로 환산하지 않는다.
- L06는 실제 그림·같은 그림 카드가 주인공이 되도록 desktop CSS만 바꿨다. 독립 A의 **집중 작업 구도/위계/개인적 목적 각각 4/5**는 QA 후보 정지 화면에 한정하며 전체 랜딩이나 기본 B 구도 합격이 아니다. 같은 담당자가 `preview.css`의 min-width 761px/L06 스코프 24줄로 통합했다. [실제 통합 보고서](../../output/current-review/implementation-20261021/room-reward-correction/report.json)의 `productIntegration`은 1920 ES·1440 KO 자유 그림→동일 stroke 카드→복귀→X/Escape·B focus/scroll 복원과 390 기존 스타일 유지 총 11/11, 오류/overflow 0을 기록한다. root도 두 제품 PNG를 열고 [production build](../../output/current-review/implementation-20261021/room-reward-correction/build-integrated.log)를 확인했다. TSX·터치 guard·다른 15개·Host·모바일 CSS·원문·갤러리는 변경하지 않았다. 상단 최신 실제 녹화에는 이 CSS 개선이 포함된다.
- [content-audit-v3](../../output/current-review/implementation-20261021/content-audit-v3/report.json)의 `independentVisualReview.correctionReview`는 최초 14개 native 경로 관찰에서 드러난 “성공 문구는 있지만 보이는 보상물이 없음”을 L02 창 열림, L07 같은 막대의 다리 연결, L13 같은 종이 타일의 연속 경로로 고친 정지 화면에서 각각 축별 4/5로 재검토했다. 이는 DOM/SVG/CSS 표현과 해당 정지 구도 평가다. 별도 `localRewardCorrections` 실제 입력은 1440×900 ES에서 L02 자연 균형 뒤 창·승인 토끼 노출, L07 1→3→2 막대 연결, L13 실제 회전 뒤 경로 간격 0을 확인했으며 오류는 없었다. 최초 14경로 기록은 과거 관찰로 보존되며 14개 시각 기능 통과나 지속 모션 검증을 뜻하지 않는다.
- 같은 보고서의 `assetDiscoveries`는 1440×900 ES에서 L05 3·5 도미노, L12 승인 인물과 4쪽 카드 덱→팬, L15 보석/클립/승인 토끼의 슬롯·서랍 상태를 실제 DOM/SVG/CSS 입력 결과로 확인했다. root와 A가 L05 최종 PNG 두 장을 다시 열었고 A는 앞서 3으로 낮췄던 dialog 종합 평가를 4로 정정했다(이전 점수/관찰 이력은 보존). 후속 `flowAndOmittedStateFollowup`에서는 native 입력으로 L05 각도 index 1/2와 L12 2·3쪽을 확인하고, 버튼 행과 `/play?game=domino` 사이 12px 간격, 실제 링크 이동 뒤 ES/KO 선택 언어와 도미노 게임 UI를 확인했다. 이는 asset owner의 후속 입력 검수이며 A의 독립 재실행은 아니다. 1920×1080 KO 검수는 L05 흐름에 한정되고 L12 쪽/전환·L15의 나머지 정지 화면은 1440×900 ES 범위다. 모바일과 전체 3D/Lusion 수준 모션은 미검수다. 논리 소스 통합 당시 01:44 UTC main 629/post 27과 마지막 L05 간격 CSS의 두 viewport·4.07초 build 검수는 과거 기록이며 그 이후 시간축 변경의 통과 근거는 위 최신 623/29 기록을 따른다.
- 같은 보고서의 `desktopEntryFollowup`은 reduced-motion 데스크톱 1440×900 KO/ES에서 언어 전환·저장, feedback 이동/재로드와 각 언어 8개 게임의 선택→`/play?game=…` 진입·선택 게임/언어 재로드 유지를 확인했다. 게임 route는 bounded retry의 ES 8/8·KO 7/8 뒤 KO Da Vinci 단독 native 후속으로 보완되어 split 총 16/16이다. 최초 timeout 기록은 보존했고 원인은 확정하지 않았다. 편지 원문도 각 언어 5문단/hash 열기·접기·재열기를 확인했다. 이는 랜딩에서 lobby로의 route/locale 검사이며 게임 플레이, backend, 모바일, 실제 GPU 성능 검증이 아니다.
- 같은 보고서의 `independentVisualReview.postFlowFollowup`은 편지의 세 결함—열기 전 플랩/버튼 상태 불일치, 원문 종이로의 인계와 봉투 경계 단절, 접은 뒤 빈 판/중복 열기 버튼—을 기록했다. 후속 actual input은 세 endpoint를 개선했지만, 이후 접기 입력이 실제로 약 909px 순간 이동하는 점프와 종이/insert 소유권 불연속을 새로 확인했다. endpoint 개선과 연속 닫기 완료는 별개로 검수했다. 이후 `letterCloseContinuity`에서 owner는 1440 ES·1920 KO 정상 모드와 1440 KO reduced, 휠 중단·재클릭·해시/새 목표 취소를 통과했다. 독립 A도 `correctionActualFollowup.continuityFinalActual`의 실제 1440 ES ordered 영상과 DOM trace에서 같은 원문을 유지한 역행→원래 종이 quad→크림색 접힘→같은 봉투·focus·단일 opener를 확인했다. 이전 즉시 점프·회색 insert는 재현되지 않았고, 편지 범위의 craft/continuity/purpose 각각 4/5다. root도 전후 실제 세 상태와 마지막 연속 표본을 열었다. 전체 사이트·Hero·모바일·실GPU 합격으로 확대하지 않는다.
- 공동 결과 UI는 기존 초대·양측 동의·권한을 보존하고, 두 명이 참여하면 코드/만료 관리만 접으며 한 명일 때는 코드가 바로 보인다. 완료 뒤 새 작성기는 기본 접힌 재시도로 두고 중복 상태 문구를 제거했다. 같은 [shared 실제 보고서](../../output/current-review/implementation-20261021/shared-real/final-room-discovery-flow/results-r2/report.json)의 `nativeSharedUiCorrectionAttempts`에서 R04의 실제 양패턴·동의·확인·4회 재생·재시도·B 복귀가 통과했다. 그 시도의 R03 selector 중단은 그대로 failed로 보존한다. 별도 `nativeSharedUiR03Followup`은 02:00:26–02:04:43 UTC, 두 실제 인증 컨텍스트에서 R03 첫 카드와 다른 roundId의 실제 재시도 카드·초안 초기화·세션 삭제·양쪽 B focus/scroll/hash 복귀를 통과했다. 중첩 summary 2개/직계 1개와 빈 초안의 disabled clear를 잘못 가정한 runner 실패도 보존하며 제품 오류로 합산하지 않는다. 후속 오류 0, 시작/끝 source hash 동일, root도 최종 카드 PNG를 열었다. 이 두 실행을 단일 전체 배치 성공으로 합치지 않는다. QA 5212/gateway 55431 종료 후 main 5173 HTTP 200과 기존 Docker 다섯 개 보존을 확인했다. 로컬 한 기기의 두 컨텍스트이며 실제 두 기기·cloud 검수는 아니다.
- 모바일 경로 감사는 [content-audit-v3](../../output/current-review/implementation-20261021/content-audit-v3/report.json)의 `mobileFollowup.coverageSummary`에 실제 attempt/check를 매핑했다. 390×844 KO/ES 각각 8개 `/play?game=…` 경로·query·언어 전달, 최상단 feedback 진입/복귀를 확인했다. KO의 마지막 재시도 4개 boundingBox timeout을 포함한 raw 실패는 보존하며 **단일 배치 전체 통과가 아니다**. 실제 성공 증거는 이전 같은 검수의 native tap/route에 연결했다.
- **모바일 게임 플레이에는 기존 제한이 남는다.** `src/core/display.ts`는 `desktop || gameId === 'jaipur'`이며, `PlayApp.tsx`는 7개 게임 선택/시작을 비활성화한다. `git blame`의 `fbdec480`(2026-10-11)과 게임 수정 기준 `df087fc`에도 같은 필터/KO·ES 안내가 있다. 따라서 위 경로/언어 성공은 8개 모바일 플레이 성공이 아니며, 이번 랜딩의 회귀와도 구분한다. 실제 두 사용자 플레이와 실물 휴대폰은 이번 감사 대상이 아니다.

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
