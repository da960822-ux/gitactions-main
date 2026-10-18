# 후반부 인수·폴리시 기록 (2026-10-18)

## 읽고 인수한 것

- 프로젝트 AGENTS.md 및 Ponytail full, 로컬 Taste `redesign-existing-projects`와 Emil `animate` 본문.
- Hero `preserved-work/2026-10-18/gate0-final-review-20261018/PLAN.ko.md`, `REQUIREMENTS-TRACE.ko.md` 전체 및 `a-approved-character-room-analysis/TECHNICAL-DESIGN.ko.md`.
- 기존 후반부 Scene/PostHeroPreview/Details/interaction과 EASTER-EGGS v3. 과거 계획의 승인 대기 문구를 현재 사용자의 구현 지시보다 우선하지 않음.
- 부모가 제공한 baseline 1440 play·ending을 직접 열어 제목과 소품의 겹침, 한정된 원화/봉투 구도를 확인.

## 실제 코드 변경

- 기존 Three surface/카메라/봉투 factory를 재사용. play제목의 좌측 safe-zone을 확보하고 저울 소품을 오른쪽으로 옮김. 승인 기존 컷아웃의 픽셀을 바꾸지 않고 보조 위치/크기 변경. ending의 전체 분홍을 따뜻한 중성 재질로 조정.
- 편지 버튼의 강제 center 스크롤이 수동 개봉을 취소하던 경로 제거. 열린 정도와 별개로 목표 상태를 반전해 도중 닫기/열기 가능. Escape 닫기와 opener focus 복원 추가. 수동 상태를 역스크롤에서도 유지.
- `PostHeroPreview`에 optional `embedded`, `language`, `onLanguageChange`, `portraitSrc`, `gallery` 추가. embed에서는 중복 intro/h1/nav/status를 제거. scroll pose 검색을 자신의 host 범위로 제한. bounded sticky world와 독립 모바일 구도 유지.
- preview/details CSS를 `.post-hero-preview` 아래로 제한해 제품 페이지의 폰트/버튼/리셋 오염을 차단. 독립 preview의 body margin만 main.tsx에서 설정.
- AssetPlayground의 그림자 투사·7말 레일·2조커 독립 셔터·2귀족 종이 pop-up·4장 flipbook·7말 장식 선택/기기 저장 추가. 실제 선택/위치/가림/펼침 상태가 바뀌며 게임 상태/API에 쓰지 않음. 이미지는 source 경로를 참조하고 새 얼굴/그림을 만들지 않음. 이 부분은 CSS/DOM standee이며 Three 모델/물리 rig라고 주장하지 않음.
- 저장된 pawn 선택이 기존 효과/도장 설정 저장으로 지워지지 않도록 기존 단일 preference key의 검증·merge 확장.

## 자산의 실제 의미

- 7말은 `/images/marble/premium/pawns/`의 lisyeon, sali-suli, astronaut-rose-heart, maltipoo, ragdoll, panda, chinchilla.
- 흑 조커=waterfront / 백 조커=indoor. 사진은 contain으로 얼굴 crop/변형 없이 사용.
- 실제 `doctor-noble-portrait.webp`, `hanbok-noble-frontal.webp` 픽셀을 열어 확인하니 각 그림은 Lisbeth 1인이다. 이전 문서의 ‘커플 귀족’과 실물의 차이를 그대로 보고한다. 인물을 추가해 커플 그림으로 재생성하지 않았다.
- 새 승인 게임방/우주 Hero/video 적용은 부모 소유 경로의 작업이며 여기서 했다고 보고하지 않는다.

## 직접 검수와 미확인

- build 및 6개 의미 있는 기존 단위 검사 통과. manual reverse 보존/pawn 범위검사 추가. letter 원문은 `../../src/copy/home` import 그대로이며 원문 파일을 수정하지 않음.
- 1920 ES play 폴리시 캡처를 실제 Chromium에서 만들고 직접 열어 제목/얼굴/소품 분리 확인. 이후 재검수 스크립트가 software GPU 경합과 HMR 중 open 대기에서 timeout: 이는 통과가 아니다.
- 최종 브라우저 증거는 `/workspace/scratch/post-polish/report.json`과 PNG. 실패/중단 결과도 그대로 남긴다. 후속 실행으로 결과를 갱신할 수 있다.
- 현재 preview publicDir에는 최신 게임 자산이 없어 AssetPlayground의 정상 네트워크/최종 구도 검수는 게임 브랜치 안전 통합 후 필요. 자산을 별도 복사해 source가 다른 제품처럼 만들지 않았다.
- 원문 설계의 L04 등 실제 Three 조명/standee rig 및 세부 종이 rig의 전량 구현 완료를 선언하지 않음. 이번 6개는 기능하는 local standee interaction이다. 기존 16계열 전체가 설계의 물리 디테일까지 동일하게 완성됐다는 의미가 아니다.
- 원격 공동 4계열은 구현/제공 UI가 없으며 backend나 두 사람 연결을 가장하지 않는다. 게임 코어/API/rhythm/letter 원문 변경 없음. main 병합/배포/푸시 수행 없음.

## 단일 월드 통합용 추출

부모 요청에 따라 기존 Scene 기하를 중복하지 않고 `createPostHeroCollection`으로 추출했다. standalone `PostHeroScene`도 이 factory만 사용한다. factory는 renderer/scene/camera를 만들거나 소유하지 않는다. `root` 그룹 아래 기하·광원·directional target이 있으며 부모가 root 위치를 설정할 수 있다. `update(...,{ownCamera:false})`는 local camera position/target을 반환한다. 부모가 자신의 camera를 최종 배치한 뒤 `projectPaper()`를 호출해야 실제 projection과 DOM 모서리가 일치한다. `applyAtmosphere()`는 활성 구간에서만 PMREM/fog/exposure를 공통 scene에 적용한다. `dispose()`는 자기 geometry/material/texture/PMREM만 해제한다.

PostHeroPreview의 `renderScene=false` / `onSceneState` / `externalSceneReady`로 부모는 원문·개봉 controller만 재사용하면서 추가 renderer를 만들지 않을 수 있다. 이 모드에서는 자체 world/배경 DOM도 출력하지 않는다. 공통 canvas를 보이게 할 wrapper background와 전체 Hero→story 카메라 연결은 부모가 담당한다.

기존 scene의 장식 torus 두 개가 겹친 반지처럼 보여 청혼 연상을 피하도록 제거했다. 별도 이스터에그의 렌즈/인장은 유지했다. 추출 직후 build/6개 tests 재통과. 3 viewport 브라우저 회귀 결과는 위 증거 디렉터리에 다시 수집한다.

## 이번 최종 검수 결과

- factory 추출 후에도 1920×1080 ES / 1440×900 KO / 390×844 ES의 개봉·도중 반전·Escape/focus·직접 원문·정/역 방향 전환 후 cameraZ 동일 복원 및 reduced-motion 원문 hash 진입을 모두 통과했다. 12 PNG, JS 오류 0. 이는 독립 wrapper 검수이며 부모의 전체 단일월드 연결 검수와 구분한다.
- 1920 play/open/read/ending, 1440 play, 390 open/read/ending PNG를 직접 열어 제목·인물·원문 가독성을 확인했다. 최종 열린 봉투 PNG에서 장식 반지 제거도 확인했다. 모바일 독립 canvas의 봉투·인물 구도는 보조적 크기이며 최종 전체 아트 디렉션 합격을 의미하지 않는다.
- 새 6종 로컬 상호작용은 별도의 Chromium WebGL-disabled 환경에서 1440/390으로 검수했다. 정확한 승인 이미지 bytes는 `/workspace/game-review/public`에서 Playwright route fulfillment로 제공했다(제품 복사 없음). 그림자 slider, 7말 레일 선택, 흑/백 셔터의 실제 사진 노출, 귀족 카드 개봉·교체, flipbook 앞뒤 경계, 장식 선택의 localStorage 기록, 이미지 naturalWidth>0, 가로 overflow 없음, JS 오류0 확인. 증거는 `local-assets/report.json`과 PNG 4장. 1440 사진/390 pop-up을 직접 열어 얼굴 contain 및 버튼 잘림 없음을 확인했다.
- 이 fixture 검수는 최종 제품의 자산 네트워크 합격이 아니다. 부모가 게임 브랜치를 통합한 뒤 요청 경로를 다시 검수해야 한다. 본 세션에 실제 GPU 프레임 성능·원격 공동 이벤트·원어민 말투 검증을 완료하지 않았다.

## 승인 캐릭터 RGB + 별도 opacity mask 인계

부모의 후속 요청에 따라 `PostHeroState` / `PostHeroPreview` / `onSceneState`에 optional `portraitMaskSrc`를 추가했다. RGB source는 수정하지 않고 `MeshBasicMaterial.map`에 그대로 유지하며, grayscale mask는 `NoColorSpace`의 `alphaMap`으로만 쓴다. source 이미지의 원래 width/height로 geometry 비율을 계산한다. mask가 주어졌을 때는 RGB와 mask가 모두 준비되기 전까지 portrait group을 표시하지 않으며, 실패를 onFailure에 알린다. 새 texture도 collection dispose에서 해제한다. mask가 없으면 기존 승인 cutout 계약을 유지한다.

공통 host는 처음 collection을 만들 때 `portraitSrc=/images/approved-couple-room/approved-character-reference.png`, `portraitMaskSrc=/images/approved-couple-room/character-opacity-mask.png`를 전달한다. collection은 초기 identity textures를 고정하며 매프레임 update로 다시 로드하거나 재생성하지 않는다. standalone wrapper에서 두 source prop이 바뀌면 수명주기에 맞춰 collection을 dispose/recreate한다.

이전 3 viewport 회귀는 기존 승인 cutout으로 수행한 결과다. 새 standing RGB+mask를 적용한 부모의 전체 단일월드 화면·alpha edge·크기·좌표·역행 검수는 별도로 필요하며 이전 결과가 이를 대신하지 않는다. 앉은 게임방 승인 원본은 이 변경에서 수정하지 않았다.

## 공통 host의 단일 frame clock

`onRegisterFrame?: (tick: ((now: number) => void) | null) => void`를 추가했다. hook이 주어지면 component는 편지 q용 RAF를 만들지 않고 자신의 tick을 등록하며 cleanup에서 null로 해제한다. 부모의 유일한 RAF가 같은 timestamp로 tick을 호출한다. scroll/resize도 별도 RAF를 예약하지 않고 다음 host tick에서 자신의 host 범위 측정을 실행한다. hook이 없는 독립 preview는 기존 자체 clock을 유지한다. 부모 callback은 안정적인 참조로 전달하며 unmount 후에는 tick을 호출하지 않는다.

clock 변경 이후 build/기존 6개 tests 재확인. 이 변경의 통합 host 단일 RAF 실행 검수는 부모가 수행한다.
