# 랜딩 구현 자기검토: 원래 계획과 현재 상태

기준일: 2026-10-18  
범위: 원래 계획·후반 설계와 현재 소스의 대조. 초안은 정적 감사이며, 이번 원복의 실제 브라우저 결과는 아래 별도 추기한다.

**최신 총괄 시각 판정: 전체 랜딩 불합격.** 아래 구현·테스트 실적은 이 판정을 뒤집지 않는다. 사용자가 실제 영상을 보고 지적한 뒤 새로운 비주얼 수정을 중단했다. 공동 이벤트는 별도 기능 검증만 계속하며, 현재 화면은 배포·완성 대상으로 승인하지 않는다.

## 읽은 원문과 판정 원칙

대조한 문서는 `preserved-work/2026-10-18/gate0-final-review-20261018/PLAN.ko.md`, `REQUIREMENTS-TRACE.ko.md`, `preserved-work/2026-10-18/gate1-assets-r8/a-approved-character-room-analysis/TECHNICAL-DESIGN.ko.md`, `design-sessions/post-hero-2026-10-18/DESIGN.ko.md`, `EASTER-EGGS.ko.md`다. 현재 동작은 주로 `src/landing/Landing.tsx`, `LandingWorldHost.tsx`, `AcrossHero.tsx`, `PostHeroComposition.ts`, `post-hero-preview/src/PostHeroPreview.tsx`, `Details.tsx`, `LocalEventRig.ts`, `src/landing/gallery/GameGallery.tsx`, `src/app/App.tsx`, `FeedbackRoute.tsx`에서 확인했다.

코드에 경로·상태·UI가 있다는 사실은 그 기능의 브라우저 검수나 시각 통과를 뜻하지 않는다. 아래에서는 **소스상 존재**, **기록된 실제 브라우저 확인**, **미완료/미검수**를 나눈다. 이 검토 중 코드·이미지·브라우저 상태는 바꾸지 않았다.

자료 범위의 한계: 인계 기록에서 언급된 초기 대화 원문 0–13 자료는 저장소에서 찾지 못했다. 위 보존 계획·요구사항 추적표·기술 설계와 현재 세션의 사용자 지시를 대조했으며, 찾지 못한 원문까지 읽었다고 주장하지 않는다.

## 원래 요구한 전체 흐름과 현재 구현

| 구간 | 원래 계획의 요구 | 현재 소스에서 확인되는 구현 | 검증 상태 및 차이 |
|---|---|---|---|
| Hero와 진입 | 승인 커플 원화를 중심에 두고, 같은 접힌 표면이 변형되며 실제 공간 안으로 카메라가 들어가는 장면. 정방향·역방향·포인터·복귀를 실제 영상으로 확인. (PLAN §3–6, §13; DESIGN 연속성 및 S0–S7) | `AcrossHero`는 Hero 카피·CTA를 제공하고 `LandingWorldHost`가 단일 Three renderer/scroll clock, `previewSpaceV19`를 연결한다. 별도 scene pose, surface morph, room bridge가 소스에 있다. | root의 현재 상태 보고는 S1 전환 자체검수 FAIL1·중단이다. 기존 독립 BLOCK도 유지한다. 이 문서에서 새 시각판정은 하지 않는다. 구현 존재와 통과는 다르다. |
| 거리·이야기 | 거리 → 접힌 표면 이동 → 놀이 테이블 → 편지 개봉/읽기 → 엔딩. 거리·언어·게임 접근 어려움과 만든 동기를 사실 범위에서 설명. (PLAN 현재 지시 및 §6; DESIGN S1–S7) | `PostHeroPreview`에는 거리(`.10`), 첫 story moment(`copy.moments[0]`), Catchmind/번역(`copy.moments[1]`), play-table, 아이디어 링크(`copy.moments[2]`), 편지 초대, 편지, 엔딩이 별도 DOM section으로 있다. | 현재 소스에 기존 세 `moments` 항목이 모두 연결돼 있다. 그러나 원래 storyboard의 S02 약 240vh, S03 약 180vh 등 장면별 구성과 현재 `.chapter` 92svh 기본값 및 별도 88/104/128svh 설정은 동일한 구현 계약이 아니다. 브라우저에서 총 페이지 길이를 측정하지 않았으므로 “페이지 전체가 실제로 몇 배 짧다”는 수치 판정은 미확정이다. |
| 게임 갤러리 | 여덟 게임 선택을 유지하고, 선택·고유 시각물·실제 `/play?game=...` 진입을 제공. 일반 카드 grid로 퇴보하지 않으며 기능을 보존. (PLAN §6 S04, §8, §13 V04/V07) | `GameGallery`는 3D stage, 선택 상태 캡션, 8개 DOM 선택 버튼, 선택 게임의 `/play?game=${selected}` 링크를 제공한다. `LandingWorldHost`는 같은 페이지의 `#games` 구간과 gallery selection을 연결한다. | 여덟 선택의 소스 연결은 확인했다. 현재 사용자의 범위는 **이전 갤러리 전체 원복**이다: 6개 원 정의/helper, `#0c080e`, 390px stage, 중앙 항목+7 ellipse, 2x4 선택지. 여섯 정의의 아홉 source check 통과와 factory SHA `1df86d06…e5f5087`은 `/workspace/scratch/game-art-n-study/user-six-revert-source-check.json`에 있다. Leonardo 초상과 사용자 Splendor 커버, 두 현재 cover image는 유지한다. 색·배치 원복 후 실제 ES 1920×1080 8장, 1440×900 3장을 남겼다. 두 해상도에서 8개 선택의 캡션·목적지 일치를 확인했다. root는 다빈치·도미노·스플렌더 1920과 스플렌더 1440 원본을 직접 열어 복귀를 확인했다. 이것은 원복 검수이며 새 디자인 승인이나 전체 게임 플레이 검수가 아니다. |
| 장난·이스터에그 | EASTER-EGGS v3는 로컬 16개 L01–L16과 인증 원격 공동 4개 R01–R04를 요구한다. 이벤트별 다른 작동, 실제 보상, 언어·접근성, 종료/역복귀 조건을 정의한다. 12개 UI 카드나 callback 개수는 요구 목록을 대신하지 않는다. | `Details.tsx`의 `localEventIds` 선택 UI에는 16개 ID/이름이 있고, 개별 DOM 입력 및 `LocalEventRig.ts` 3D prop 반응이 구현돼 있다. `PostHeroPreview`의 “작은 장난들” disclosure는 `detailsOpen=false`로 시작하며 클릭해야 상세 섹션을 렌더한다. Host는 `localEvent`를 composition으로 전달한다. | 열여섯 항목이 소스에 있다는 것은 실제 개별 16개 시각/기능 QA 완료를 뜻하지 않는다. root의 현재 인계상 로컬 16개는 모두 실제 검수되지 않았다. 인증 원격 4개도 실제 2인·2기기 QA 미완료다. 관련 local migration/테스트 파일의 존재만으로 edge/client/realtime/deployment 기능을 완료 처리할 수 없다. |
| 편지 | 같은 장면에서 실제로 열고 읽는 편지, 원문 5문단/주소/제목/서명 보존, 닫기·키보드·역행 지원. DESIGN은 같은 종이/봉투/표면의 공간 연속을 요구. | `PostHeroPreview`는 `#papi-letter`와 단일 DOM article에 `landingCopy` 원문을 렌더한다. 열기·접기, Escape, 읽기 링크가 있다. 장미 의미는 별도 두 버튼의 클릭/키보드 힌트다. | Sol 독립검수 H의 MAIN 5260 보고 `/workspace/scratch/rose-h-qa/mandatory-flow-summary.json`은 KO/ES × 1920/1440 네 경우의 필수 장미 hint interaction 통과와 정상 종료를 기록한다. 이는 해당 상호작용 범위만 통과하며 전체 편지 연속성·전체 랜딩 디자인 통과가 아니다. `src/copy/home.ts`의 Catchmind moment는 기준 f818b85에서 변경됐다. root가 대조한 편지 address/title/body/signature 값은 그대로다. |
| 엔딩·피드백 | 엔딩에서 첫 공간을 회수하고 선택 게임/피드백으로 연결. `/feedback` 보호. (PLAN §6 S06, §8, §13 V09) | PostHeroPreview의 ending에는 날짜, 선택 게임 진입 버튼, `/feedback` 링크가 있다. 별도의 `FeedbackRoute`는 아이디어 생성/초대 공간/목록 화면을 소유한다. `App.tsx`에서 `/feedback`은 Landing과 별도 route다. | 종료 구도 전체 브라우저 증거는 현재 완료로 보고하지 않는다. 피드백은 별도 아이디어 수집 route이며, 공개 게시판/일반 메시지 게시판으로 구현됐다는 근거는 없다. 온라인 feedback 처리와 별개로 일반 board를 새로 만들었다고도 말할 수 없다. |

## 계획의 공간·물체 계약을 소스와 대조

DESIGN v2는 거리→같은 접힌 표면의 통과→놀이 테이블→같은 봉투 접근/개봉→DOM 편지 읽기→실제 dolly-out 엔딩으로 이어지는 물체 계보를 요구했다. 특히 S2의 한 `64×32` grid/폭10·깊이7 표면은 양쪽 lobe를 .2→1.4→0으로 접고, S5의 envelope/body/flap/seal/insert는 S6 읽기와 S7 회수까지 동일한 물체·재질로 이어진다. S7은 열린 편지·봉투·도미노·커플 그림이 같은 테이블에 놓였음을 dolly-out으로 다시 보여야 한다. 이것은 일반 장면 나열이나 큰 JPG 확대만으로 충족되지 않는다.

현재 코드에서 확인되는 대응과 차이는 다음과 같다.

| 계획 항목 | 소스에서 확인되는 사실 | 결론/증거 한계 |
|---|---|---|
| S1 거리 | `PostHeroPreview`에는 한국·도미니카 카피/국기 UI가 있고 `data-pose` `.10` 지점이 있다. Hero 진입과 room bridge는 `LandingWorldHost`/`previewSpaceV19`가 별도 소유한다. | 거리 콘텐츠의 존재는 확인된다. root의 현재 운영 기록은 S1 전환 visual FAIL1·pause다. 해당 실패의 추가 기술 원인은 이 정적 감사에서 추정하지 않는다. |
| S2 같은 64×32 접힘 표면 | `PostHeroComposition.ts`는 `PlaneGeometry(1,1,192,128)`으로 `POST_SHARED_FOLDING_SURFACE`를 만들고, vertex를 `x=u*35`, `z=v*32-10`으로 늘려 뒤쪽/둘레 높이를 계산한다. | 같은 PostHero composition 내부에 공유 시트가 있는 것은 확인되지만, DESIGN의 64×32 grid/폭10·깊이7/lobe .2→1.4→0 계약과 수치·pose가 다르다. 이것만으로 시각 실패 원인을 단정하지 않는다. |
| S5 동일 봉투 | `LetterCollection.ts`는 별도의 `letter-collection` group 및 `letter-envelope`, flap/seal/insert mesh를 생성한다. `AcrossHero.tsx`의 Hero DOM에는 envelope object가 없고 Hero world는 `previewSpaceV19`에서 만든다. | 편지 개봉 mesh가 존재한다. 하지만 소스만으로 Hero부터 이어지는 **동일 envelope object identity**는 확인되지 않는다. 한 canvas/scene 공유는 같은 mesh identity의 증거가 아니다. |
| S6 실제 읽기 | `PostHeroPreview.tsx`는 `landingCopy`의 주소·제목·5문단·서명을 DOM article로 그린다. | H의 실제 MAIN 5260 scope report는 링크 클릭 후 reading `p=.883`, `opening=1`, 원문 DOM 존재와 KO/ES × 두 viewport의 rose-hint flow를 기록한다. 편지 읽기와 그 상호작용에 대한 제한 증거이며 전체 S5/S7 연속성 pass는 아니다. |
| S7 dolly-out/같은 table 회수 | `PostHeroComposition.ts`에는 p=.94–1 ending pose와 portrait print, paper toys, desk/surface가 있다. `PostHeroPreview.tsx`에는 종료 카피·선택 게임 CTA·피드백 링크가 있다. | 대상물이 같은 scene source 안에 있는 것은 확인된다. 지정된 실제 dolly-out 전체 장면, 물체 관계 및 끝 hold가 보인다는 browser/independent-review 증거는 아직 없다. |

따라서 과거의 거절된 녹화·시안은 이 요건의 승인 증거로 다시 쓰지 않는다. `docs/redesign-20261018/review-scope.json`의 `invalidEvidence`도 `output/landing-final`을 거절된 옛 제안 녹화로 지정한다. 현재 증거는 별도 scope report와 실제 원본 캡처가 명시된 경우에만 그 범위에 한해 인용한다.

## 왜 한 페이지에서 짧고 합쳐진 듯 보일 수 있는가

**소스에서 확인되는 구조적 이유:** 현재 Hero, story, gallery, details, letter, ending은 한 `/` 문서에서 아래로 이어진다. `LandingWorldHost`는 이를 하나의 canvas/scroll clock에 묶는다. 사용자는 게임 갤러리·스토리·편지를 같은 랜딩 스크롤에서 만난다. 이는 섹션 통합이지 게임 실행 페이지와 편지, 피드백 route를 하나의 기능으로 합친 것은 아니다. 게임 버튼은 별도 `/play?game=...`로 이동하고 피드백은 별도 `/feedback` route다.

이스터에그 상세는 기본 화면에서 닫혀 있고, 사용자가 “작은 장난들” 버튼을 누른 뒤에야 상세 섹션이 나타난다. 이 때문에 첫 스크롤/기본 상태에서 개별 놀이가 적게 보이는 것은 코드로 확인되는 노출 조건이다. 원래 DESIGN도 보조 이벤트를 별도 목록으로 두라고 했으므로 접힘 자체가 기능 삭제를 증명하지는 않는다. 다만 목록 안의 16개가 전부 실제 동작·기능·시각 검수됐다는 뜻도 아니다.

기존 계획은 S02/S03/S04 각 장면에 독립적인 시각 진행 길이, 실제 공간 전환, 갤러리 정착을 요구했다. 현재 구현은 여러 DOM section과 data-pose marker를 한 progress에 매핑하고, 일부 CSS min-height를 viewport 단위로 설정한다. 실제 DOM 총 높이·scroll time·장면별 노출·사용자 체감은 브라우저 측정 전에는 확정할 수 없다.

**확인된 과정상 실수:** root는 사용자가 요청하지 않은 palette/layout 교체와, 서로 다른 art tone이 섞인 상태에서 반복 patch를 이어간 것을 문제로 인정했다. 현재 사용자는 색 배치까지 원상 복구하라고 지시했다. 따라서 여섯 구 정의의 source 복원과 별도로 어두운 `#0c080e` 배경, 390px stage, 중앙+7 ellipse, 2×4 선택지의 시각 복귀를 실행했다. 실제 화면 증거는 아래 원복 검수 추기를 따른다.

**아직 확인되지 않은 원인:** 위 과정상 실수 외에, 전체 페이지의 주관적 짧음/이상함을 특정 CSS 한 줄·카메라 경로·성능 문제 하나로 설명할 근거는 없다. 재현 가능한 browser recording과 단계별 높이/시간, 실제 캡처 없이 원인을 단정하지 않는다. 이 문서는 새로운 디자인이나 수정 순서를 제안하지 않는다.

## 실제 게임·편지·게시판 경계

- `/`는 Hero, story, gallery, letter, ending을 보유하는 하나의 랜딩 route다. 섹션들이 연속되어 있지만 각 섹션의 코드와 상태는 구분되어 있다.
- 8개 게임은 랜딩 갤러리에서 선택한다. 선택 UI와 `/play?game=<id>` 실행 경로는 다르다. `App.tsx`는 `/play`/다른 게임 path를 게임 앱으로 넘긴다.
- 편지는 `/` 안의 `#papi-letter` DOM 영역이다. 별도 게임 상태/게시판 안에 합쳐져 있지 않다.
- `/feedback`은 아이디어/기능/게임 제안 및 불편을 둘이 공유하는 피드백 route다. `FeedbackRoute`는 space 초대/생성 및 목록을 연결하고, `FeedbackPage`는 항목 입력·상태를 표시한다. 소스는 일반 공개 게시판 구현을 보여주지 않는다. feedback online mode의 실제 원격/2기기 동작은 이 검토에서 실행하지 않았고 현재 remote R01–R04 완료 여부와 혼동하지 않는다.

## 자산·영상과 게임 결과 반응의 별도 현황

- 현재 `public/motion`에는 MP4 9개가 있다. 현재 랜딩 런타임 `LandingWorldHost.tsx`에서 직접 넘기는 것은 `folded-playhouse-lightwell.mp4`와 `folded-playhouse-gift-edge-v18.mp4` 두 경로다. 파일이 보존돼 있다는 사실과 모든 전달 영상을 실제 랜딩에서 사용했다는 주장은 다르다. 나머지의 직접 연결은 확인되지 않았으며 ‘전달 자산 모두 적용 완료’라고 보고할 수 없다. 이번 브라우저 녹화는 이러한 MP4를 이어 붙여 실시간 구현처럼 꾸민 영상이 아니다.
- 승패 반응 자산 `result-lisbeth-wins.png`, `result-yeonseok-wins.png`와 마스크는 존재하고, `PlayApp.tsx`가 `CoupleResultMoment.tsx`를 실제 결과에 연결한다. 임의 랜덤 승패가 아니라 두 플레이어 이름이 `Yeonseok/연석`, `Lisbeth/리스벳`으로 식별되고 실제 승자가 있는 조건에서만 표시한다. 리듬은 제외하며, 팀 도미노는 두 사람이 같은 승리팀이면 경쟁 반응을 띄우지 않는다. 이번 랜딩 영상은 게임을 끝까지 플레이하지 않으므로 이 결과 화면의 실제 재검수 증거가 아니다.
- 보조 날짜 계열의 테이블 밑 04·04, 도미노 뒷면 날짜, 플랩 안감, 4월 화투/달력 변형은 원래 EASTER-EGGS의 세부 요구다. 현재 확인된 날짜 DOM과 장미 4+4 힌트만으로 그 세부 계열까지 모두 구현됐다고 셀 수 없다. 각 위치의 자산·상태·실제 화면 매핑은 미확인이다.

## 로컬 16 / 원격 4 요구의 소스 매핑

아래는 `Details.tsx`의 16 ID와 EASTER-EGGS 표제의 기계적 대응이다. “UI/logic 존재”는 source reading이며 독립 시각 통과가 아니다.

| 요구 ID | 현재 소스에서 보이는 UI/logic | 남은 구분 |
|---|---|---|
| L01 | domino 연결·놓기·넘기기·서랍 제어 | 실제 3D 보상/브라우저 QA 미완료 |
| L02 | 균형 tray/ball 입력과 상태 | 기능/모션/접근성 실제 QA 미완료 |
| L03 | 종이 pocket 펼침/시점 control | 실제 동일 surface와 공간 증거 미검수 |
| L04 | 게임말 선택·빛 각도·shadow rig | 승인 자산/시각 효과 전체 QA 미완료 |
| L05 | 3단 prism angle과 Domino 링크 | 시점 발견 보상 시각 QA 미완료 |
| L06 | 낙서/도형 입력·지우기·카드 뒤집기 | 세션 범위/키보드·터치 QA 미완료 |
| L07 | 3-bar 신호 입력/순서 맞추기 | 전체 상태와 복귀 QA 미완료 |
| L08 | 선택말 rail pose | 실제 카메라/말 경로 QA 미완료 |
| L09 | 두 승인 사진 shutter controls | 사진 노출/자산 보존의 전체 QA 미완료 |
| L10 | 커플 noble 선택·paper popup control | 최신 승인 자산 및 side view 전체 QA 미완료 |
| L11 | wax stamp 선택·press effect | 핵심 편지 seal과 분리된 동작의 QA 미완료 |
| L12 | 네 단계 flipbook controls | 장면별 동작·사용성 QA 미완료 |
| L13 | 세 종이 조각 회전/길 완성 control | 공간 변화/직접 통로 전체 QA 미완료 |
| L14 | 바람/종이 lift controls | 실제 물성·역정착 QA 미완료 |
| L15 | pawn/gem/clip 장식 선택·저장 | 재방문 복원 및 장식 결과 QA 미완료 |
| L16 | KO/ES phrase card flip | 언어 상태/접근성 실제 QA 미완료 |
| R01–R04 | 별도 2인 협동 명세 및 관련 DB migration/test 흔적 | 인증/edge-client/realtime/deploy 및 실제 2인·2기기 QA 미완료; 현재 기능으로 광고하면 안 됨 |

## 완료/미완료의 현재 경계

- 여섯 게임의 이전 정의/helper 복원은 `/workspace/scratch/game-art-n-study/user-six-revert-source-check.json`의 9개 source check가 true이고 factory SHA-256 `1df86d06bd53d2bebd15193b4895e8218fc9fe1a7264761b5c41b86c6e5f5087`로 기록됐다. 이는 palette/layout의 실제 화면 통과가 아니다.
- Leonardo 초상과 사용자가 준 Splendor cover는 유지 대상이며 두 현재 cover image는 변경되지 않았다.
- palette/layout 및 6개 자산 원복은 구현·빌드와 제한된 실제 데스크톱 화면 확인을 마쳤다. 새 디자인/전체 랜딩 완료를 의미하지 않는다.
- Hero S1 transition은 현재 root 인계에서 자체/시각검수 FAIL1로 중단 상태다. 원래 승인된 B 게임방 정적 구도와 scoped pass는 전체 이동/연결 통과가 아니다.
- 로컬 16개 이벤트는 전체 브라우저 QA가 끝나지 않았고, 원격 4개는 인증된 두 사용자·두 기기 QA가 없다.
- 장미 힌트 필수 상호작용만 H 보고 4/4 범위에서 통과했다. 전체 story→gallery→letter→ending 시각 승인으로 확대하지 않는다.
- 전체 landing의 디자인 완료와 mobile responsive 검수는 미완료다. 모바일은 마지막 우선순위다. 영상은 최신 요청에 따라 **실제 페이지를 처음부터 끝까지 사용하는 1분 이내 기록**으로 변경됐으며, 디자인 통과 증거와는 구분한다.

## 총괄 담당자의 자기 피드백: 왜 결과가 나빠졌는가

| 실패 | 확인된 판단·작업 방식 | 결과와 책임 | 이번 처리 / 남은 것 |
|---|---|---|---|
| 좋아했던 갤러리까지 바꿈 | 기존 중앙 대표 오브젝트 구성을 개선해 달라는 요청을 자산·배경·캡션·선택 배치까지 교체하는 범위로 확장했다. | 보존해야 할 장점과 새 실험을 함께 바꿔 사용자가 비교할 기준을 잃게 했다. 총괄의 범위 관리 실패다. | 기존 `24a6ec6`의 색·구조·배치와 6개 자산을 복원하고, 명시적으로 유지하라는 다빈치·스플렌더만 예외로 둔다. |
| Hero와 후반의 톤 단절 | 어두운 Hero 뒤 밝은 크림 배경을 적용하면서 전체 스크롤에서 이어지는 색·명도·소재를 먼저 검수하지 않았다. | 독립 장면에서는 그럴듯한 선택이어도 이어 보면 극단적으로 다른 사이트처럼 보이게 했다. 사용자에게 승인받은 색 전환도 아니었다. | 크림 갤러리 실험과 외부 CSS 덮어쓰기를 제거했다. 전체 공간 연결은 여전히 미승인이다. |
| 게임을 알아보기 어려운 자산 | 게임별 대표성보다 새 조형물 제작을 앞세웠고, 기존 스플렌더 표지처럼 이미 있던 명확한 원본도 먼저 활용하지 않았다. | 게임 선택에 필요한 식별성과 자산 간 일관성을 떨어뜨렸다. 새로 만들었다는 사실을 개선의 근거로 삼을 수 없다. | 추가 생성·큐레이션을 중단하고 원본을 복원했다. 남겨 둔 두 이미지도 브라우저에서 확인한다. |
| 작은 방·가림 문제의 반복 | 공간의 최종 카메라·스케일·화면 점유율을 먼저 고정하지 않은 채 개별 가림과 경계를 반복 보정했다. | 물체 충돌이 줄어도 전체 구도가 나아졌다고 할 수 없었다. 사용자가 지적한 ‘빈 상자 안 작은 이미지’ 문제를 객체 수정으로 해결하려던 접근이 잘못됐다. | 승인 B 정적 구도를 기준으로 삼되, 이동 중 커튼 같은 표면·하단 늘어짐 등 전환 실패는 해결됐다고 쓰지 않는다. |
| 테스트와 시각 완료의 혼동 | 소스·상태·테스트 통과 이후 실제 주요 구도 비교가 늦었고, 실패한 연결 구조를 다음 담당자가 이어받는 일이 반복됐다. | 구현량과 통과 테스트가 늘어도 사용자가 보는 품질은 개선되지 않을 수 있었다. 담당 교체만으로 구조적 문제는 해결되지 않는다. | 기능 검사·실제 화면·사용자 승인 상태를 별도로 기록한다. 이번 영상도 현황 공개이며 완료 선언이 아니다. |
| 미완성 이벤트와 문서의 간격 | 로컬 UI/상태와 DB 기반부터 존재하고, 모든 로컬 이벤트의 실제 검수와 원격 공동 이벤트의 client/인증/realtime 연결은 끝나지 않았다. | 목록의 개수만 맞춰도 기획한 경험이 구현됐다는 오해를 만들 수 있었다. | 위 16개/4개 표에서 코드 존재와 미검수를 구분했다. 원격 4개는 현재 사용 가능한 기능으로 소개하지 않는다. |

이 원인들은 스킬 미설치나 특정 모델 하나의 탓으로 돌릴 문제가 아니다. 총괄이 범위, 공유 공간 설계, 승인 기준과 실제 화면 검수를 일관되게 관리하지 못한 문제다. 반면 개별 프레임의 정확한 수학적 원인은 실제 재현·소스 추적 없이 단정하지 않는다.

미완료의 이유도 구분해야 한다. 원격 4개는 사용자 승인이 없어서 막힌 일이 아니라, DB 기반 이후의 인증·클라이언트·실시간 연결과 2기기 검수를 아직 끝내지 않은 일이다. 모바일은 사용자가 마지막 순서로 지정해 의도적으로 후순위다. Hero 연결은 시각 검수 실패가 남아 중단된 일이며, 기능 테스트가 통과해도 완료할 수 없다. 로컬 16개 전체 검수는 구현 항목 수에 비해 실제 화면 확인이 뒤처진 총괄 실행 문제다. 이들을 모두 ‘검수 대기’라는 같은 표현으로 덮어서는 안 된다.

## 핵심 자기검토 결론

사용자의 “게임, 편지, 게시판을 다 합쳤느냐”는 질문에 대한 정확한 답은 **랜딩에서 story·게임 선택·편지를 한 스크롤 경험으로 엮었지만, 게임 실행은 `/play`로, 아이디어 게시/피드백은 `/feedback`으로 분리돼 있다. 일반 게시판을 구현한 것은 아니다**다. “페이지가 짧고 이상하다”의 확정 가능한 부분은 상세 장난 메뉴가 접혀 있다는 점, 그리고 현재 장면 높이/배치가 원래 storyboard 길이와 일치한다고 증명되지 않았다는 점이다. palette/layout을 승인 없이 바꾼 과정은 인정된 실수이며 사용자가 전체 원복을 지시했다. 원복의 실제 데스크톱 증거는 남겼다. 나머지 전체 landing의 디자인 통과는 여전히 미완료다.

이 문서는 소스와 기록을 대조한 현황 설명이며, 브라우저 검수 결과나 새 디자인 승인서가 아니다.

## 이번 원복의 실제 확인 기록

- 동결 작업본: `/workspace/scratch/gallery-user-rollback-dark/source-manifest.json`, `http://localhost:5284/`. 현재 소스 19개 해시가 동결 작업본과 일치함을 root가 재확인했다. 기존 브랜치에서 작업했으며 main 병합·배포는 하지 않았다.
- TypeScript·프로덕션 빌드 통과, 갤러리 범위 테스트 2파일/3개 통과. 예전 갤러리 CSS는 `24a6ec6`과 바이트 단위 일치한다. 이 결과로 전체 랜딩이 통과했다고 주장하지 않는다.
- 실제 Chromium/SwiftShader, DPR 1, ES 1920×1080 8선택/8장, 1440×900 8선택/3장. 캡션과 `/play?game=...` 링크는 선택과 일치했다. root는 개별 원본 4장과 8게임 contact sheet를 직접 열어 어두운 색·기존 배치·복원 자산을 확인했다.
- 원본 캡처 및 실행 기록: `/workspace/scratch/gallery-rollback-capture-final/captures/gallery-rollback-report.json`. KO 신규 context는 영상 기록을 우선해 중단했다. 이 중단으로 driver에 page/context closed 오류가 남았으며, KO 재검수 완료나 제품 오류로 바꾸어 해석하지 않는다. 전체 배치는 이 제한 때문에 `completed=false`다.
- 실제 게임 플레이 완료·원격 2인·모바일은 이번 원복 검사에 포함하지 않았다. 소프트웨어 렌더링을 실제 GPU 성능으로 보고하지 않는다.

## 영상에서 직접 확인한 시각 실패와 전달 기록

실제 브라우저 3회 기록을 사용해 `output/current-review/landing-rollback-walkthrough-es.mp4`를 만들었다. 1920×1080, H.264, 25fps 컨테이너, 57.96초, 구간별 1.2–3배속이며 자막·음악·가상 3D 영상·프레임 보간은 없다. 이는 녹화 파일의 사양이지 GPU가 25fps로 작동했다는 측정이 아니다. 첫 자동화의 클릭/스크롤 실패는 원본 보고에 보존했고, 같은 동결 페이지에서 실제 hit-tested 클릭으로 게임 8개와 로컬 16개 조작·편지·엔딩을 보완 녹화했다. 대기 구간을 잘라 시간 순서로 편집했으므로 하나의 연속 무편집 세션이라고 주장하지 않는다.

작업환경 파일 링크로 다운로드할 수 없다는 사용자 보고 이후, MP4 실파일을 사용자 Google Drive에 업로드했다: [58초 영상 보기·다운로드](https://drive.google.com/file/d/1CT_hTFvJmn0wsYoCXf5T9ew93waVTz4Q/view?usp=drivesdk). 공동 이벤트 신규 통합 **전**의 원복 작업본이며, 최신 1분 이내 요청을 따른다. 이전 10초 목표를 별도 미완료 조건으로 남기지 않는다.

root는 최종 영상의 32구간 contact sheet, 개별 Hero·독서·엔딩 원본 프레임을 직접 확인했다.

| 영역 | 실제 보이는 문제 | 판정 / 원인 구분 |
|---|---|---|
| Hero→게임방→후반 | 이동 중 원화와 우주가 서로 다른 판처럼 보이는 구간이 남는다. | S1 전환 미승인·불합격을 유지한다. 같은 canvas라는 사실은 공간 연속성 증거가 아니다. 정확한 shader/카메라 원인 수정은 아직 끝나지 않았다. |
| 로컬 16개 | 공개 조작 UI가 검수 패널처럼 보이고, 작은 버튼·크림 패널과 배경 소품이 별개로 놓인다. 캐릭터 상단/오른쪽이 잘리는 구도가 반복된다. | 조작 성공과 별개로 제품 시각 품질 불합격이다. 원래 작은 발견을 공간에 통합한다는 요구를 컨트롤 목록으로 소화한 결과다. |
| 편지 접근·복귀 | 봉투·캐릭터의 화면 점유율과 가림이 불안정하다. 보완 녹화에서 `letter-open`으로 이름 붙인 첫 토글은 실제 `opening=0`으로 끝나, 이미 열린 상태를 닫은 동작이었다. | 드라이버가 예외 없이 실행됐다는 것만으로 개봉 성공이라고 보고하면 안 됐다. 실제 DOM 독서는 확인했으나 전체 개봉 모션 통과는 아니다. |
| 장미 4+4 | 현재 동결 독서 프레임에서 양옆 장미가 보이지 않는다. 왼쪽 힌트 버튼 클릭 기록만 있다. | 과거 H/5260의 힌트 검사 4/4를 현재 전체 장미 시각 통과로 확대할 수 없다. 현재 프레임의 회귀 원인은 실제 computed style/위치 확인이 필요하다. |
| 엔딩 | 커플과 봉투는 보이나, 빈 공간과 평면 소품이 두드러지고 앞 장면의 같은 테이블을 회수하는 연출이 설득되지 않는다. | 원래 S7 dolly-out의 시각 합격을 충족했다고 할 수 없다. |

이번 원복은 갤러리의 기존 자산·색·배치를 복귀시킨 작업이다. 이 제한된 복구로 후반 전체의 위 문제를 해결했다고 표현하지 않는다. 새로운 조명·장식으로 결함을 가리는 수정도 하지 않는다.
