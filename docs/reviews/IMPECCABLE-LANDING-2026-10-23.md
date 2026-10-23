# 공식 스킬 재점검·수정·재검수 — 2026-10-23 UTC (이전 검수 포함)

> 최신 상태 — 2026-10-23 UTC: 이번 승인 B 방 소품 인터랙션·유성 증량 결과는 문서 끝 「승인 B 공부방·게임방의 소품 반응과 유성 증량」에 기록한다. 과거 점수와 PASS는 현재 사이트 전체의 승인 점수가 아니다. 실제 데스크톱 검수와 보존 범위, 미검수 범위를 구분한다.

시작 소스 `921bac645d99ab0d7f54e00211b220695b422fd0`, 기존 `redesign/folded-playhouse-depth-r8-20261018` 브랜치. 승인된 우주 Hero/B 게임방, 인물, 8개 게임, 원문 편지, 두 언어, 실제 서명·장미·건의사항을 보존했다. 원본 main 병합·공개 audience 전환·새 영상·모바일 전수 검수는 하지 않았다. 이 문서는 시점별 재점검 기록이다. 최신 상태는 맨 위와 문서 끝에 구분했다. [이전 체크포인트 기록](https://github.com/da960822-ux/gitactions-main/blob/921bac645d99ab0d7f54e00211b220695b422fd0/docs/reviews/IMPECCABLE-LANDING-2026-10-23.md)은 Git 이력에 남긴다.

## 무엇을 실제 실행했나

이전에는 선정한 지침을 적용했지만 모든 평가 워크플로를 완료한 것은 아니었다. 이번에는 설치된 **144개 SKILL.md를 분류**하고, 관련 평가·자문 본문 17종과 필수 참조를 읽었다. 144개 전부를 실행했다는 뜻은 아니다. 파일별 경로·해시·역할·실행 조건은 [전체 인벤토리](assets/impeccable-landing/full-skill-review/skill-inventory.json)에 있다. 제품 목적과 충돌하는 게임 엔진 이식·무작위 새 디자인·영상 제작 지침은 제외했다.

| 순서 | 실제 수행한 워크플로 | 결과 / 한계 |
|---|---|---|
|1|Impeccable `critique`: A는 디자인을 독립 평가, 완료 후에만 B의 detector/브라우저 결과 공개|같은 Nielsen 10항목, 29/40 → 31/40. B 결과를 본 뒤 A의 기준점수를 고치지 않음|
|2|Impeccable `audit`: 접근성·성능·테마·구현 무결성|9/16 → 11/16. 반응형 항목 N/A로 분모에서 제외. 후속 기술 검증은 수정 담당 루나 + 루트 감독이며 새 독립 전체 감사를 가장하지 않음|
|3|`ponytail-review` 및 `ponytail-audit`|현재 변경과 상위 앱/데이터 경로를 분리 검토. 저장소 예외와 도시 PNG 전송량 확인. 숫자 점수 없는 스킬에 점수를 만들지 않음|
|4|`design-taste-frontend` 공식 inspector + critique, `taste-redesign`|1440/1920을 출력 폴더별로 실제 실행하고 전후 모든 inspector 이미지 열람. 엄격 상한 적용 6.0/10 FAIL 유지. 불리한 규칙을 숨기는 allow 옵션 사용 안 함|
|5|`emil-design-eng` UI review|Before / After / Why 표, 키보드 즉시 반영·표정 중간 겹침·공간 전달을 평가. 임의 종합 점수 없음|
|6|`review-animations`, `improve-animations`, `find-animation-opportunities`|실제 입력 빈도·이유·방향 전환·중간 자세·접근성을 검사. M01–M07 계획 작성 후 구현·재검수. Block → 해당 7개 수정 범위 Approve. 전체 미술 합격과 구분|
|7|`animation-performance`, `performance-optimization`, GSAP 성능 지침, Motion 오프라인 성능 지침|실제 렌더/React commit/layout read/전송량 측정. 아래 수치 참조. SwiftShader를 실제 GPU 성능으로 해석하지 않음|
|8|`break-ui`|실제 FeedbackPage/PartnerPact 데이터 fixture: 비어 있음·오류·로딩·긴 문장·서명/이름·1,000개 게시글. 1,000개 무제한 DOM을 25개씩 확장하도록 수정. 실제 25→50 및 원본 1,000개 유지 검증|
|9|Impeccable `shape/layout/bolder/typeset/clarify/harden/extract/animate/optimize/polish` 중 진단에 맞는 지침|각 담당자가 실제 본문을 읽고 아래 소유 파일에 적용. 새 콘셉트로 교체하거나 조명·장식으로 구조 결함을 덮지 않음|

MotionScore는 Motion+ hosted MCP가 없어 **실행 불가 / 점수 없음**이다. `overdrive`의 새 콘셉트 선택 워크숍과 `live`의 사용자 선택 변형 워크숍은 실행했다고 주장하지 않는다. 실제 브라우저 비교/수정은 했다. Taste 전체 기본 gate의 모바일·film 항목은 사용자 제외 범위여서 생략했다. inspector의 1920 기본 높이는 1200px이며 이를 1080px로 표시하지 않았다. 별도 인간 시각 검수는 정확히 1920×1080과 1440×900이다.

## 전체 수정 배치 점수와 판정 — 추가 하트 장면 개편 전

| Nielsen 항목 | 전 | 후 |
|---|---:|---:|
|상태 표시|3|3|
|현실과의 대응|4|4|
|사용자 제어|3|3|
|일관성|2|3|
|오류 예방|3|3|
|알아보기 쉬움|3|3|
|효율성|3|3|
|시각적 간결함|2|3|
|오류 복구|3|3|
|안내|3|3|
|**합계 /40**|**29**|**31**|

기술 점검은 접근성 **2→3**, 성능 **2→2**, 테마 **2→2**, 구현 무결성 **3→4**, 합계 **9→11/16**이다. 개선된 기능 경로의 제한적 점수이며 WCAG 인증·전체 저장소 완벽성 점수가 아니다.

추가 하트 장면 개편 전 공식 Taste 엄격 판정은 **6.0→6.0/10, FAIL**이다. 원시 inspector는 전 8 FAIL/11 WARN, 후 1440은 8/11, 1920은 7/11이다. 시계 도시명을 kicker로, WebGL 봉투를 빈 구역으로, 승인된 하트·분위기 그라디언트·Baby 강조를 일반 금지 패턴으로 보는 경고를 실제 화면과 구분했다. 승인 예외를 이유로 원시 불합격을 합격으로 바꾸지 않았다. 시각·사용성 31/40과 Taste 엄격 상한은 서로 다른 평가다.

강점은 실제 InterPals/서툰 시작/첫날 12시간 이야기, 두 언어와 시차 기능, 원문 편지에서 직접 서명·장미·다시 읽기로 이어지는 실제 사용자 흐름이다. 첫 방문자는 Hero 포즈 컷을 공간 이동보다 장면 교체로 느낄 수 있다. 키보드 이용자의 서명 후 위치 손실은 수정했고, 움직임 감소 이용자는 실제 설정 변경 때 새 동작이 즉시 정착하는 것을 확인했다. 느린 네트워크 이용자에게 큰 전송량은 여전히 문제다.

## 발견 → 실제 수정 → 브라우저 증거

| 발견 | 적용 스킬 / 소유 파일 | 실제 변경과 직접 검수 |
|---|---|---|
|A1/M01: 인물 사라짐·얼굴 위 우주 RGB 겹침|camera-systems, threejs-scene-setup, GSAP ScrollTrigger/React, Impeccable layout/animate; `heroRoomJourney.ts/test`, 루트 진단 metadata|서 있는 원본을 .24까지 불투명 유지하고 앉은 B 원본으로 명시적 포즈 컷. B 원본 RGB/기존 semantic mask로 전경을 보호하고 실제 indexed 우주 메시를 B 뒤로 후퇴. 전체 이미지 alpha 혼합 제거. 전·역·재반전, .239/.241/.28/.35/.39/.50 실제 완료 frame/fence 확인|
|첫 재검수에서 새 책상 절단선/마스크 구멍|같은 Hero 담당에게 원인·프롬프트 피드백, 새 담당으로 회피 안 함|새 재질이 기존 outpaint shader를 빠뜨리고 UV를 잘랐던 원인 수정. 원본 shader/uniform 계승, 승인 외곽 행 유지, coverage 개선. 마지막 양 데스크톱 12장 직접 열람: 하단 선·구멍 해결. **포즈 컷/곡선 열림의 미술적 한계는 남음**|
|A2/M06: 작고 어두운 비선택 조각·정지 중 계속 렌더|ThreeUI 초점/깊이 원리, game-ui-ux, optimize, GSAP 성능; GalleryCollection/StudioScene/GameGallery/CSS|주변 크기 .7→1.1, 비이미지 재질만 밝게. 기존 대표 2.6·원래 조각·Splendor/DaVinci 유지. 실제 8개 선택·href·hover/raycast·focus 설명·즉시 키보드·빠른 역전환 검증. 정지 후 루프 종료, 입력 때 재개|
|A3/A4: 반복되는 좌우 분할·큰 빈 공간·줄바꿈|layout/bolder/typeset/craft-floor/Taste; FirstConversation, StoryChapters, story-time/CSS, 초대문 선택자|InterPals 3개 beat와 실제 trigger 중심 정렬, 간격 축소. 시차는 전체 폭 제목→두 도시→슬라이더→짧은 footer. KO 마지막 ‘좋겠어.’ 유지, ES 대결 제목 두 줄. 두 크기 8장 열람, 13h/날짜·Home/End·선택시각·역방향 검증. 원문 편지는 수정 안 함|
|B1/B3/B5: 서명 경계 대비·포커스 손실·최소 글자 안내 없음|harden/clarify/polish; PartnerPact/CSS|서명 패드/텍스트 경계 대비 6.70:1/7.54:1. 2–40자 안내/1자 오류·aria-invalid. 서명 후 실제 문서 서명+확인에 focus, Escape→인형 opener 복귀|
|B2: 저장소 차단 시 빈 페이지|Ponytail/harden; App, FeedbackRoute, browserStorage/helper/test|선호 저장소 예외 보호. 실제 production 재검수에서 Supabase SDK top-level debug 읽기가 먼저 실패하는 추가 원인 발견. App이 lazy chunk 전에 저장소 불가를 감지해 실제 안내/재시도/홈/게임 경로 제공. 마지막 차단 테스트: FeedbackRoute chunk 요청 0, pageerror 0. 저장 성공을 가장하지 않음|
|Break UI: 게시글 1,000개 모두 DOM 생성|Ponytail/optimize; FeedbackPage/test/CSS|25개씩 표시·더 보기. 실제 25→50, 남은 수 975→950, 저장 fixture는 1,000개 유지. API 데이터 삭제/서버 query 축소로 주장하지 않음|
|M02/M03: 실시간 움직임 감소 누락·키보드 hover 애니메이션|Motion 오프라인 접근성, Emil animate; live reduced hook, CountryCompanions, StoryTimeInteraction, Pact, room CSS|실제 visible/greet 중 설정 변경→정착/identity transform. 재활성화 후 키보드 Enter 즉시 반영. 방 hint는 실제 Tab 즉시, reduced pointer hover도 즉시 보임|
|M04/M05/M07: 종이 강제 layout·광범위 React 갱신·겹친 얼굴|animation-performance/GSAP performance/Emil; PostHeroPreview, LandingWorldHost, duel CSS|종이 자연 layout을 ResizeObserver로 cache, shared host도 cache 사용. 정확한 실수 상태는 ref로 전달하고 React는 의미 경계만 갱신. 표정 이미지 crossfade를 없애 두 눈 겹침 제거. 실제 중간 접기→재열기, 직접 그린 서명→장미→일반 다시 읽기 검증|
|B4/B6: 큰 도시 PNG·반복 UI 색 값|optimize/extract; city asset, pact CSS|도시 PNG 2,852,299→WebP 2,092,858 bytes, decoded RGB 완전 동일 확인. 공용 public PNG 제거, 생성 원본 보존. 반복 서명 accent/ink만 두 scoped token으로 통합. 594개 색 literal 전체를 결함으로 취급하지 않음|

게임 갤러리 최종 최소 주변 높이는 1440에서 **76.80px**, 1920에서 **92.16px**; 대표와의 최소 간격은 **52.66/63.19px**, 주변 간격은 **10.87/13.04px**이다. 네이티브 `/#games` 복원과 메뉴 클릭은 실제 heading top108px / 메뉴 하단64px, 8개 선택 모두 노출했다. 초기 raw-scroll 캡처의 제목 잘림은 scroll-margin을 우회한 harness 문제여서 불필요한 CSS 수정을 하지 않았다.

## 실제 측정

- 111개 개봉 외부 tick의 React commit **110→7**, 마지막 정확한 opening=1 유지. 100개 진행률 표본은 **4 commit**. standalone의 기존 연속 동작은 유지.
- 종이 pose callback 60회에서 `offsetHeight` 읽기 **120→0**. 공유 host도 같은 cache 사용. 중간 접기·재열기 후 자연 높이 **838px** 복원, 고정 height 제거.
- 갤러리 정지 2.1초 동안 실제 renderer count: **24→24**(1440), **23→23**(1920). 다음 포인터 입력으로 렌더 재개/선택 성공.
- 같은 fresh production preview `/#games` 경로: **33,572,762→32,816,261 encoded bytes**, **41→42 requests**, pageerrors **0**. 새 semantic mask 때문에 요청은 1개 증가. 헤더 포함 전송량이며 개발 runtime 포함 39.9MB 값과 섞지 않았다.
- 원본 DaVinci JPEG 5,328,969 bytes 유지. decoded RGB가 동일한 lossless WebP가 8,033,862 bytes로 더 커서 채택하지 않고 임시 후보를 제거했다. 큰 전체 payload와 약 1.016MB 미압축 Landing chunk는 남은 P2다.

실행 환경: Linux `/usr/bin/chromium` headless, DPR1, ANGLE **SwiftShader 소프트웨어 렌더링**, localhost 및 병렬 검수. 실기기 GPU FPS·실사용자 Web Vitals가 아니다. 검증 결과: **Vitest 88개 파일/678개 테스트, production build 통과**, Node projection/collection 별도 4개 통과, scoped CLI 표준/layout/type 검사 `[]`, diff 검사 통과. 번들의 기존 큰 chunk 및 Motion use-client 경고는 남아 있다.

## 전후 실제 화면

보고서용 JPG는 캡처를 압축한 것이며 제품 원화를 수정한 것이 아니다. 대상을 고정한 정지 비교와 실제 사용자 경로 검증을 함께 사용했다.

| 영역 | 수정 전 | 최종 |
|---|---|---|
|Hero p=.35|[얼굴 혼합](assets/impeccable-landing/full-skill-review/hero-before.jpg)|[불투명 전경·하단 경계 수정](assets/impeccable-landing/full-skill-review/hero-after.jpg)|
|게임 갤러리|[이전](assets/impeccable-landing/full-skill-review/gallery-before.jpg)|[동일 대표 선택](assets/impeccable-landing/full-skill-review/gallery-after.jpg)|
|시차 구성|[좌우 반복](assets/impeccable-landing/full-skill-review/time-before.jpg)|[전체 폭 도시 쌍](assets/impeccable-landing/full-skill-review/time-after.jpg)|
|서명|[이전 경계](assets/impeccable-landing/full-skill-review/signature-before.jpg)|[경계·입력 안내 개선](assets/impeccable-landing/full-skill-review/signature-after.jpg)|

[Hero p=.39 최종 곡선 열림](assets/impeccable-landing/full-skill-review/hero-reveal-after.jpg)은 남은 비평도 확인할 수 있게 보존했다. 강점만 골라 전체 합격으로 포장하지 않았다.

## 남은 문제와 구체적인 다음 방향

1. **P2 미술:** .24 포즈 컷과 .39 곡선 열림이 눈에 띈다. 물리적 메시·카메라 이동은 실제지만, 승인 B는 일러스트이고 인물/방이 완전한 3D로 재구축된 것은 아니다. Lusion 수준의 자연스러운 공간 변환으로 승인하지 않는다. 다음 미술 검토는 새 효과 추가보다 같은 B 구도에 맞춘 포즈 연결/전환 silhouette의 정지 중간 구도 비교가 우선이다.
2. **P2 성능:** 약32.82MB payload. 승인 인물 원본을 훼손하는 무단 저해상도 교체 대신 미사용 outcome/companions의 근접 로딩과 실제 사용 크기별 파생본을 별도 검증해야 한다. 픽셀 보존 조건 안에서 도시만 개선했고 전체 미디어 최적화를 끝냈다고 하지 않는다.
3. **P3 서사/테마:** InterPals 초반은 연결선 중심으로 여전히 얇다. 가짜 대화·시각·기억을 만들지 않았다. 현재 두 scoped 색 token은 전역 테마 정리가 아니다.

Motion 추가 후보 O1(서명 확인 피드백), O2(발견물 dialog 입장)는 선택적 제안으로 기록했으며, 모션 개수를 늘리기 위해 corrective 7개에 묶어 자동 추가하지 않았다. 자주 쓰는 게임 키보드·원문 편지 문장·무한 갤러리 회전은 새 애니메이션 후보에서 제외했다.

## 검증 한계·보존·실행 기록

모바일/터치, 실물 기기·Safari·스크린리더 음성, 실제 GPU, 8개 게임 내부 전수 플레이, 외부 Supabase 운영 설정/멀티플레이 실시간 운영은 검수하지 않았다. 로컬 fixture만 썼으며 온라인 게시글을 보내지 않았다. SQL/API/게임 엔진/리듬타파/편지 원문은 변경하지 않았다. 익명 RPC의 운영 quota 노출은 실제 운영 설정을 못 봤으므로 **조건부 확인 항목**이며 현재 생산 장애나 확인된 보안 결함으로 주장하지 않았다.

원래 PRODUCT/DESIGN의 430px 축약 Hero·카드 atlas 등 낡은 landing 지침을 최신 사용자 승인으로 바로잡았고 게임별 요구는 보존했다. ThreeUI Community MIT 출처·기존 적용 범위는 [THIRD_PARTY_NOTICES](../../THIRD_PARTY_NOTICES.md)를 유지한다. Kexsio/ThreeUI 카탈로그를 복사하거나 새 라이브러리를 설치하지 않았다. Remotion/HyperFrames 영상은 사용하지 않았다.

Critique target `src-landing-landing-tsx`, ignore 없음. A/B 독립 baseline 후 순차 병합, 표준 CLI/실제 browser injection 및 screenshot 검증을 구분했다. 로컬 headless 검수라 사용자 브라우저의 Human overlay를 표시했다고 주장하지 않는다. 첫 통합 재검수 한 건은 허용된 App 교정 중 HMR로 무효화되어 제품 통과 증거로 쓰지 않았고, 마지막 고정 source에서 필요한 suffix를 다시 확인했다. 서버와 임시 본문은 정리한다. 전체 디자인 합격을 선언하지 않으며 남은 Priority Issue는 열린 상태로 기록한다.


## 사용자 추가 피드백 — InterPals 장면 강화와 남은 마감

사용자가 선 중심의 표현을 알아보기 어렵다고 지적해 별도의 실제 장면 개편을 승인했다. 위 전체 점수 31/40은 이 추가 개편 전 고정 평가이며, 새 장면을 넣었다는 이유로 전체 점수를 올리지 않는다. 후속 검수는 해당 장면의 의미·읽기·상호작용을 독립적으로 확인한다.

Sol은 Taste, Impeccable bolder/layout/animate/delight, GSAP React/ScrollTrigger, Motion의 실제 지침과 기존 ThreeUI/Kexsio 검토 기록을 읽고 첫 만남 전용 파일만 수정했다. 루나는 원화·라이선스·사용 가능한 작은 인물 표현의 경로/크기와 스킬을 대조해 전달했다. 새로 인물을 생성하지 않고 승인 원화의 두 얼굴을 식별 요소로 사용한다. ThreeUI/Kexsio는 로컬 변형·고정된 기준점·단계별 구도라는 참고 원리이며 새 유료 소스/미디어를 복사했다는 뜻이 아니다.

새 시각 서사는 InterPals에서 시작한 두 반쪽 하트 → 내 쪽 선의 서툰 굽음 → 하나로 이어진 하트와 12시간의 상대적 표시다. 포인터가 중앙에 가까워지면 양쪽이 조금 끌리고 벗어남/취소/해제 시 원위치로 돌아온다. GSAP은 스크롤에 따른 SVG 형태/상태를, Motion은 별도 그룹의 작은 포인터 반응만 소유한다. 같은 속성을 서로 덮어쓰지 않고 무한 루프·새 미니게임·가짜 채팅·첫 대화 날짜/시각을 만들지 않았다.

독립 A의 초기 6개 일반/2개 cold-reduced 화면 검수는 큰 하트와 두 인물의 의미·사실·방향 복원을 확인했지만, 도시명과 선의 겹침·숨은 캡션·1920 끝점 틈을 P2로 돌려보냈다. 같은 담당자가 원인과 개선 프롬프트를 받아 교정했다. 통과 숫자를 맞추려고 담당자를 바꾸거나 기존 전체 점수를 재산정하지 않는다.

루나는 별도 명확한 마감도 수행했다. Pact의 hover를 fine pointer에 한정하고 모든 입력의 active는 즉시 반영한다. reduced 상태의 inert 도착 문구만 숨기고 주 Hero 제목/게임/편지 링크는 보존한다. 세 편지 진입은 ‘봉투 열어보기 / 바로 읽기 / 연결해서 같이 열기’, ‘Abrir el sobre / Leerla directamente / Abrirla juntos en una sala’로 목적을 구분했다. 원문 편지는 바꾸지 않았다. 1440×900 production 양 언어 검수에서 주 Hero 노출·inert display:none·문구·실제 Pact hover와 mouse/Space active 0s, pageerror0, 관련 7개 테스트를 확인했다. 이 검수는 물리 터치나 모바일 테스트가 아니다.

공식 critique 스냅샷은 `.impeccable/critique/2026-10-22T22-18-26Z__src-landing-landing-tsx.md`에 기록했다. 추이는 **31/40 → 21/32 → 29/40 → 31/40**이며 분모가 달라 전체를 같은 척도의 개선선으로 읽지 않는다. 임시 본문은 삭제했고 남은 Priority Issue 때문에 열린 상태로 둔다. 질문은 기존 승인 범위가 명확해 반복하지 않았다.


**추가 장면 최종 검수: 양 데스크톱 통과.** 독립 A는 마지막 두 화면을 직접 열어 제목/시각물 top96px와 메뉴 하단64px 사이32px 여유, 맞닿은 하트 끝, 도시명 여백, 한 개의 정상 캡션을 확인했다. 초기 하트 끊김은 불필요한 dash tween/array를 삭제하고 형태 변화만 남겨 해결했다. 시간 표시는 큰 흰 점 대신 작고 평평한 12개 inlay로 정리했다. Sticky 여유는 grid 바깥 padding이 실제 row를 늘리지 못하던 원인을 확인하고 같은96px을 story row 내부로 옮겼다. 전체 문장/beat 중심은 유지한다.

이전 live reduced 복귀 harness timeout은 통과 증거로 쓰지 않았다. 마지막 고정 소스의 양 크기 상태·포인터 원상복귀·역방향·cold reduced 검증과 독립 A의 terminal 재검수로 범위를 구분했다. [독립 최종 피드백](assets/impeccable-landing/full-skill-review/story-heart-review.md) / [검수 데이터](assets/impeccable-landing/full-skill-review/story-heart-review.json).

[이전 선 중심 장면](assets/impeccable-landing/full-skill-review/story-thread-before.jpg) → [첫 연락](assets/impeccable-landing/full-skill-review/story-heart-contact.jpg) → [서툰 시작](assets/impeccable-landing/full-skill-review/story-heart-awkward.jpg) → [이어진 하트·12시간](assets/impeccable-landing/full-skill-review/story-heart-complete.jpg). [1920 움직임 감소 화면](assets/impeccable-landing/full-skill-review/story-heart-reduced.jpg)도 비교한다.

추가 작업 후 최종 **88개 파일/680개 테스트 및 production build 통과**. 마지막 CSS 교정은 두 terminal frame으로 재검수했다. 최종 fresh production 전송량은 **32,816,998 bytes /42requests /pageerrors0**이며 위 주요 수정 배치 측정과의737bytes 차이는 별도로 기록한다. 새 외부 미디어·런타임 의존성은 추가하지 않았다. 기존 본인 전용 Site만 업데이트하며 공개 audience/원본 main은 바꾸지 않는다.


## 추가 재점검 — 새·장미 동작의 자연스러움 (2026-10-22)

이전의 상태 복원·키보드·종료 장면 통과를 모든 중간 프레임의 자연스러움까지 검증한 것으로 확대하면 안 된다. 사용자 지적에 따라 Sol 구현 담당과 독립 Sol 검수, Luna의 스킬 사용 이력 대조를 분리했다. 이번 검수는 **소스·기존 실제 화면·새 오프라인 SVG 렌더**에 한정되며 새 브라우저 재생은 실행하지 못했다. localhost 서버는 listen EPERM, Chromium은 시작 단계에서 종료되어 우회하지 않았다.

| 스킬 | 실제 확인한 적용 범위 |
|---|---|
| [bolder](../../.agents/skills/impeccable/reference/bolder.md) | 기존 InterPals 시각 서사의 강화에 지침을 적용했다. 이번 새·장미 교정은 강도를 더하는 작업보다 궤적·관절·접점을 바로잡는 작업이다. |
| [overdrive](../../.agents/skills/impeccable/reference/overdrive.md) | 정식 워크숍은 실행하지 않았다. 2~3개 방향 제안과 사용자 선택 절차를 완료했다고 주장하지 않는다. 필요한 자연스러움 교정을 위해 별도 콘셉트 워크숍을 기계적으로 추가하지 않았다. |
| [animate](../../.agents/skills/impeccable/reference/animate.md) + [delight](../../.agents/skills/impeccable/reference/delight.md) | 의미가 읽히는 접근·접촉·전달과 신속한 취소/복귀를 기준으로 실제 교정했다. 개별 명령을 실행했다는 의미가 아니라 읽은 지침을 구현과 검수에 적용한 것이다. |
| [Emil animate](../../.agents/skills/emil-animate/SKILL.md) + [review-animations](../../.agents/skills/review-animations/SKILL.md) | 구현과 독립 검수에 적용했다. 새는 기존 Motion의 단일 진행률, 장미는 기존 GSAP의 순방향 타임라인을 사용한다. 새 라이브러리·새 인물·추가 장식으로 결함을 덮지 않는다. |

새의 기존 다중 왕복 경로와 구간별 감속을 단일 진행률의 얕은 접근 곡선으로 바꿨다. 원앙은 이동하지 않고 작게 기울며, 벌새가 접근 거리를 담당한다. 포인터로 떨어질 때도 스크롤 복귀와 같은 220ms를 적용하고 현재 진행률에서 다시 목표를 잡는다. 위치 연속성을 확인했으며 속도 연속성이나 실제 빠른 연타를 검증했다고 주장하지 않는다. 날개는 어깨 기준을 고정하고 원근 레이어를 먼 날개→몸→가까운 날개로 바꿨다. 큰 궤적 하트는 도착 시 작은 하트로 교체했다. 원본 자산과 새의 의미 설명·언어·섹션 범위·키보드/동작 줄이기 처리는 보존한다.

독립 검수는 새의 M2(복잡한 궤적)/M3(느린 복귀)를 **기계적 수정 확인**으로 판정했다. 110ms 날갯짓의 시각적 떨림, 빠른 방향 전환의 느낌, 실제 페이지의 가림은 브라우저 재생 검수 전까지 열린 항목이다. 이전 전체 점수 31/40을 갱신하거나 자연스러움 최종 합격으로 바꾸지 않는다.

[새 오프라인 자세 렌더](assets/impeccable-landing/full-skill-review/motion-correction/birds-offline-poses.png) / [독립 baseline](assets/impeccable-landing/full-skill-review/motion-correction/independent-baseline.md) / [새 교정 후 독립 검수](assets/impeccable-landing/full-skill-review/motion-correction/birds-independent-after.md). 자세 렌더는 동일 소스 SVG를 librsvg로 렌더한 정지 그림이며 실제 페이지 캡처나 재생 영상이 아니다.


장미는 가짜 손목 연결·색상 키 필터·손 모양 교체와 큰 팔 회전을 제거했다. 원래 펼친 손으로 건네고, 그녀는 팔꿈치를 기준으로 8° 움직여 받으며 보조 팔은 유지한다. 같은 줄기의 두 접점은 약44.37px 떨어져 있어 주먹이 겹치지 않는다. 1.20~1.85초 접촉 유지, 1.65초 소유 전환 후 손이 물러난다. 재생 버튼은 시작 자세로 명시적으로 초기화하고 순방향으로 재생하여 받았던 꽃을 역재생으로 빼앗지 않는다. 실제로 렌더하지 않는 가상 ‘손가락 닫기/놓기’ 값도 삭제했으며, 손가락 애니메이션까지 만들었다고 주장하지 않는다. 키보드 즉시 완료, 콜백 1회 보호, 원본 정적 대체, 언어와 서명 여부에 따른 문구는 유지했다. 원화 파일·얼굴·몸·의상·배경과 게임/API는 수정하지 않았다.

**장미 M1 시각 결함은 아직 BLOCK이다.** [수정 후 접촉 확대](assets/impeccable-landing/full-skill-review/motion-correction/rose-offline-contact.png)에서 원본의 머리카락 뒤에 가려졌던 받는 팔 안쪽 윤곽과 공여자 손가락의 가림 경계가 남는다. [최종 보유 자세](assets/impeccable-landing/full-skill-review/motion-correction/rose-offline-held.png)는 더 깨끗하지만 중간 결함의 대체 증거가 아니다. 루트와 구현자가 실제 오프라인 그림을 열어 확인했다. 소매 틈·겹친 주먹·큰 삼각형 팔 틈은 교정했으나 남은 윤곽을 조명·블러로 가리지 않는다. 다음 미술 작업은 **원화와 같은 그림체의 완전한 공여자 팔/펼친 손과 받는 팔/손 레이어** 두 개다. 해당 팔만 사용하고 원래 인물 얼굴/몸/옷은 유지해야 한다.

이를 위해 원본 received.png를 참조한 투명 팔 atlas 생성을 실제 시도했으나 이미지 도구가 HTTP400 `Unknown parameter: reasoning`을 반환했다. 해당 매개변수는 호출에 지정하지 않았다. 생성 자산은 없으며 성공했다고 보고하거나 접근 제한을 우회하지 않았다. 추가 장식 대신 필요한 해부학적 원본 레이어 확보가 남았다.

고정 소스 검증: **Vitest 88개 파일/684개 테스트, TypeScript 포함 production build, diff 검사 통과**. 테스트는 양 접점·꽃 소유 전환의 연속성·관절 길이·정상 범위·언어/서명 조건과 단일 꽃을 검증한다. 테스트 수학이 실제 해부학·타이밍을 보증하지 않는다. 빌드의 기존 Motion use-client 및 큰 chunk 경고는 남는다. 새 의존성은 없다.

이번 변경은 **미완료 검토용 후보**다. 새 브라우저 검수·사이트 배포·모바일 검수·영상·실제 GPU 성능 측정을 실행했다고 주장하지 않는다. 현재 확인용 Site는 이전 c566a898 버전이며, 이 미검수 후보를 최종본으로 게시하지 않았다. GitHub는 기존 redesign 브랜치에만 안전하게 보존하며 main 병합/강제 push/새 중복 브랜치는 하지 않는다. 로컬 Git 네트워크도 차단되어, native GitHub connector를 사용한 원격 보존과 로컬 ref 동기화 여부는 구분한다.

독립 Sol은 최종 9개 손 확대 자세와 시작/끝 전체를 직접 열어 **M1 BLOCK 유지, M4 역재생 제거 확인**으로 판정했다. 받는 손은 시작부터 닫힌 원화이므로, 코드의 donor/recipient 소유 이름만으로 ‘건네기→받기’가 명확히 읽힌다고 단정할 수 없다. 이 의미 전달도 실제 재생에서 검증해야 한다. 새의 M2/M3은 기계적 교정 확인, 전체 모션의 자연스러움은 미승인이다.

[이 배치의 독립 최종 검수](assets/impeccable-landing/full-skill-review/motion-correction/independent-after.md). 전체 판정은 **BLOCK / 미완료 후보**다.

## 전체 수정 승인 후 병렬 교정 — 2026-10-23

이 절은 위의 과거 버전 검수와 구분하는 후속 기록이다. 과거 브라우저 PASS와 31/40은 현재 변경본의 시각 승인으로 재사용하지 않는다. 이번에는 실제 소스에서 추출한 오프라인 렌더를 루트와 독립 Sol이 열어 교정했으며, 현재 실행 환경에서 새 브라우저 재생은 불가능하다. 사용자 요청대로 모바일 검수와 영상은 제외했다.

역할은 Sol의 Hero 공간·새 관절·InterPals 구성·장미 전달, Luna의 공개 참고 자료 전달 및 자산 연결 대조, 독립 Sol의 소스/그림 재검수로 나눴다. 각 담당자는 Ponytail과 업무에 맞는 실제 설치 지침을 읽었다. Hero에는 Impeccable shape/layout/craft-floor, camera-systems/threejs-scene-setup, GSAP React/ScrollTrigger를 적용했다. 이야기에는 Taste와 Impeccable bolder/layout/animate, GSAP timeline/React/ScrollTrigger 및 Motion을 적용했다. 새·장미에는 Impeccable animate/delight와 Emil animate/review-animations를 적용했다. 스킬을 읽거나 테스트가 통과했다는 이유로 시각 합격을 선언하지 않는다. overdrive 정식 워크숍을 실행했다고 주장하지 않는다.

Luna는 공개 ThreeUI Community의 MIT 소스(MengTo/threeui, 68802d5)에서 glassToggleScene의 카메라 거리 기반 구도 보존 원리를 Hero 담당에게, character-filmstrip의 깊이·초점·활성 상태 관계를 이야기 담당에게 전달했다. 후자는 이야기 장면을 캐러셀로 바꾸라는 의미가 아니다. Kexsio의 공개 카탈로그와 Jelly fish draft/Dot Creature는 시각 참고로만 확인했다. 내부 구현·재사용 허가를 확인하지 못한 유료 소스를 복사하지 않았고 새 라이브러리를 설치하지 않았다.

### 직접 확인한 수정과 재작업 사유

- InterPals: 게임방 사진 사각형을 없애고 승인 RGB와 실제 alpha matte로 두 인물을 분리했다. 광주·산토도밍고, 무례했던 시작, 첫날 12시간 연속 연락을 보존했다. 큰 하트 배경과 큰 12 지표를 제거하고 인물의 접근, 서툰 선, 마지막 작은 하트로 바꿨다. GSAP은 스크롤 형태와 구성을, Motion은 별도 포인터 응답 그룹만 소유한다. 독립 검수가 지적한 설명용 figure의 불필요한 Tab 정지점·focus 이동도 제거했다. 가짜 채팅·시각·날짜를 추가하지 않았다.
- 새: 원래 머리·부리·눈 픽셀을 보존하고 새 clean torso, 근경/원경 날개, 꼬리 레이어를 사용한다. 고정 접힌 날개와 움직이는 날개가 겹치던 결함을 독립 검수에서 해소 확인했다. 원앙은 발 기준을 유지하며 짧게 답하고, 벌새는 현재 진행률에서 접근·복귀한다. 꼬리는 몸의 기울기에 반대로 움직인다. 확대 시 어깨 레이어 경계는 남으며 360ms 반복 리듬의 자연스러움은 실제 재생 전 미승인이다. 이미지 실패 시 원본 정적 새로 전환하고 인사 동작을 중지하도록 보완했다.
- 장미: image_gen이 이번에는 정상 작동해 인물 전체가 아닌 팔·손만 새로 만들었다. 첫 atlas로 팔의 결손과 손가락 조각은 제거했지만, 독립 검수는 처음부터 여자가 꽃을 소유한 것처럼 보이는 문제와 팔꿈치/소매 접합을 지적했다. 이를 수학적인 owner 전환으로 덮지 않고 남자의 파지손·여자의 열린손 자산으로 교정했다. 남자는 원래 팔을 소매부터 손목까지 단일 부품으로 재사용하여 이중 전완·팔꿈치 틈을 제거했다. 여자 소매에 섞여 움직이던 navy 조각을 실제 피부/옷 경계로 분리했다. 시작에는 남자가 쥐고 여자는 열린 손으로 떨어져 있으며, 끝에는 여자가 쥐고 남자는 손을 연다. 손가락 배열을 섞던 가로 wipe·반투명 겹침을 없애고 파지한 손과 잎 뒤에서 한 개의 불투명 손 자세만 교체한다. 교체 직후 작은 손가락 가장자리는 드러나며 완전한 가림·연속 손가락 굽힘을 구현했다고 주장하지 않는다. 손목의 사각 경계는 제거했으나 작은 색차는 남는다. 원본 얼굴·의상 파일 보존과 최종 렌더의 RGB 동일성은 별개의 주장이다.
- Hero: 수직 이동 후보는 쌓인 배너와 떠 있는 발, 첫 수평 후보는 이중 인물과 늘어난 전면판 때문에 제외했다. 해당 실험 코드는 통합 소스에 남기지 않았다. 정면 원화에는 옆으로 이동할 때 드러날 면이 없어 측면 이동을 폐기했다. 최종 소스는 기존 Hero의 실제 전경 alpha를 원본 RGB에 적용한 깊이 mesh와 짧은 카메라 이동으로 정면 B를 연결한다. 새 벽·장식 가림판은 없다. 시험 생성한 재질 atlas는 최종 구현에 쓰지 않아 public에서 제외했다. 교체는 원본 전경이 화면을 가리는 구간에만 있으며 인물을 휘거나 섞지 않는다. q.10의 밝은 조각은 alpha 경계와 B 뒤에 잘못 놓였던 cleanplate 깊이를 바로잡아 제거했다. 동작 줄이기는 정지 Universe→정지 B로 즉시 교체하며 live 변경도 반영한다. 승인 Universe와 B 원본·후반부 카메라 등록은 보존했다. 이는 완전한 3D 실내 모델이 아닌 실제 카메라/깊이 mesh를 이용한 2.5D 전환이다. 구조 통합은 허용됐으나 연속 리듬의 브라우저 승인은 남았다.

중간 통합 검증은 88개 파일/688개 테스트와 TypeScript 포함 production build가 통과했다. 이후 진행 중인 손 자세·Hero 작업의 최종 검증은 이 숫자에 포함하지 않는다. 기존 Motion use-client 및 큰 chunk 경고는 남는다.

GitHub 쓰기는 사용자 전체 승인 이후 정상 connector 호출에서도 `MCP tool call requires approval, but approval policy is never`로 차단됐다. 이는 자동 심사 반려라는 뜻이 아니라 실행 환경의 승인 정책 제한이다. 원격 ref를 옮기거나 main/공개 audience를 변경하지 않았다. 현재 Site의 기존 버전을 새 소스로 업데이트했다고 주장하지 않는다. 로컬 소스·생성 자산·오프라인 근거와 원격 보존·실제 배포를 구분한다.

최신 오프라인 비교 근거: [Hero 8개 구도](assets/impeccable-landing/full-skill-review/motion-correction/hero-foreground-handoff.jpg), [새 자세](assets/impeccable-landing/full-skill-review/motion-correction/birds-repaired-poses.webp), [새 관절](assets/impeccable-landing/full-skill-review/motion-correction/birds-repaired-joints.webp), [InterPals 세 구도](assets/impeccable-landing/full-skill-review/motion-correction/story-cutout-after.webp). 실제 소스와 자산을 투영/래스터화한 그림이며 브라우저 캡처가 아니다. 비교 그림만 lossless WebP로 인코딩했고 원본 자산은 변경하지 않았다.

[장미 최종 손 확대 비교](assets/impeccable-landing/full-skill-review/motion-correction/rose-handover-after.webp). 원본 팔 재사용·파지/열린손·접촉·보유의 소스 렌더다. 실제 재생에서 손 자세 교체의 느낌과 손목의 작은 색차는 열린 검수 항목이다.

무손실 인코딩: Hero의 기존 마스크는 사용하는 alpha만 정확히 보존한 89,798byte PNG로, 기존 cleanplate는 디코딩 RGBA가 같은 1,845,442byte WebP로 참조한다. 원본 두 파일은 보존했다. 이 두 전환 텍스처의 원시 후보 합계4,580,740bytes →1,935,240bytes이며 실제 브라우저 전송량·FPS 비교가 아니다. 새의 활성 벌새 PNG 합계도1,619,859bytes로 기존 body/wing 합계보다21.3% 작다. 제작용 새 atlas와 미사용 Hero 재질 atlas는 public에서 제외했다.

### 최종 소스 검증과 남은 판정

전체 통합 검사 **88개 파일/690개 테스트**와 production build가 통과했다. 이후 마지막 손 자세 교체·무손실 참조 변경은 관련 **4개 파일/21개 테스트**, TypeScript 포함 production build, diff 검사로 다시 확인했다. 최종 dist에 제작용 벌새 atlas·미사용 Hero 연결부 atlas가 들어가지 않는 것도 확인했다. 게임/API/편지 원문을 수정하지 않았다. 기존 Motion use-client/큰 chunk 경고는 남아 있다.

독립 Sol은 Hero의 큰 벽·옆면 패널·중복 인물·꽃의 밝은 틈 제거, 새의 고정 접힌 날개 중복 제거, 장미의 파지 의미·팔꿈치 틈·이중 팔·사각 소매·두 손가락 배열 혼합 교정을 실제 소스 렌더에서 확인했다. **장미 교체 직후 손가락 윗 윤곽이 나타나는 작은 포즈 전환과 손목의 색차는 남는다.** Hero 접사의 머무름, 새의 360ms 리듬과 이 손 교체가 실제 속도에서 자연스러운지는 새 브라우저 검수 전 미승인이다. 전체 사이트 점수나 4/5 합격을 새로 부여하지 않았다.

최종 코드 파일 SHA256(커밋 SHA가 아님):

- `src/landing/cinematic/folded/heroRoomJourney.ts`: `5c7406c27284aad3d351af40f852eeac4dfbd8242044b941419bf4493b795e35`
- `src/landing/FirstConversation.tsx`: `a642b3b81081ecbb8baa1703221f4ed44168f9fcd3732ddc4095d65ae7a83aee`
- `post-hero-preview/src/CountryCompanions.tsx`: `540bd64e58b9f9a4bfdc0d0065e5b245d4f06992eb5cd9b57ba4b951d91b1833`
- `post-hero-preview/src/RoseGiftFinale.tsx`: `645740de40b1bb9657b247988afd5ccdb47c8d1f097fbf45b14cf936fba0a75b`

로컬 HEAD는 c566a898이며 기존 원격 d070d48의 보존된 변경분과 이번 수정이 작업 트리에 있다. 원격 최신 ref는 d070d48로 재확인했다. 원격 쓰기 제한 때문에 새 커밋 계보를 임의로 만들거나 중복 브랜치를 생성하지 않았다. 사이트 v8은 기존 버전이며 이번 소스·빌드의 배포는 미실행이다. 새 브라우저·콘솔/네트워크·실제 GPU·8개 게임 전수 플레이는 확인하지 못했다. 모바일과 영상은 사용자 제외 범위다.


## 후속 실제 브라우저 재개 · UpFork / Shaders 무료 소스 적용

이 절부터는 위의 환경 차단 기록을 현재 상태로 사용하지 않는다. 2026-10-23 새 실행 환경에서 정상 네트워크·로컬 서버·Chromium 실행을 확인했다. 기존 원격 브랜치 d070d48을 fetch했고, 작업 파일의 바이트를 보존한 채 로컬 계보/인덱스를 해당 원격 HEAD와 동기화했다. main 변경·force push·중복 브랜치 생성은 없다. 기존 Site의 v9가 이미 성공 배포된 상태임도 확인했으며, 이번 소스의 배포 여부는 아래 후속 기록으로 구분한다.

### 무료 범위와 실제 적용 결정

- UpFork 공식 카탈로그/registry 19개를 대조했다. priceMicros=0만으로 무료로 판단하지 않았다. MIT 3개, Standard 16개이며, 공개 카탈로그의 Free/Pro와 무계정 설치 안내를 함께 확인했다. 무료 MIT Border Beam Button의 공개 원본을 직접 읽고 기존 게임 시작 링크 한 곳에만 적용한다. Crowdwall은 커뮤니티 사진 기능으로 목적에 맞지 않고, Interactive SaaS Hero는 승인 Hero를 대체하므로 제외한다. Perspective Cards 등 Pro/Standard 자산은 가져오지 않는다.
- UpFork 원본 registry revision 1 SHA256: `9f9126b344e0f06d985ba902b43b6bd4c0fff647819e84dc2a0741deffb12527`. 실제 도입한 것은 SVG 실측 둘레/pathLength, 일정 속도 dash, 겹침을 보정한 tail opacity, pointer RAF 갱신이다. Next.js·아이콘·폼 상태·자석 이동·입자·깜박임은 필요 없으므로 도입하지 않았다. 별도 UI 의존성을 설치하지 않았다.
- Shaders 엔진·200개 기본 컴포넌트와 React bindings는 MIT지만 완성 프리셋/섹션은 별도 Pro 조건이다. 기본 Satin/BrushedMetal/Heart/Paper/CursorRipples/FlowField를 현 화면과 대조했다. 인물을 왜곡하지 않는 첫 대화의 공유 표면에 기본 Satin만 선택했다. 새 하트·cursor ripples·foil 서명 canvas를 중복 추가하지 않는다. 실제 서명은 읽을 수 있는 SVG 잉크로 유지한다.
- 공식 `npx --yes shaders connect --no-auth --yes`를 실제 실행했다. `shaders` 4.0.5, React 설정, 공식 로컬 skill이 설치됐다. 로그인·Pro·외부 편집기 연결은 하지 않았다. 참고 upstream commit `eb3df5cedc826008be8e1037c1182e649037c74a`. 라이선스는 THIRD_PARTY_NOTICES.md에 포함한다.
- 역할: Luna는 무료/유료·라이선스·효과 적합성 대조, Sol은 각각 UpFork CTA와 Satin 재질 구현, 별도 Sol은 읽기 전용 실제 브라우저 재검수. Ponytail, 공식 Shaders SKILL, Impeccable animate/delight/optimize, Emil animate/review-animations의 관련 지침을 업무별 적용한다.

### 이번 실제 검수와 범위

실제 로컬 Chromium, 1440×900 KO / 1920×1080 es-DO. renderer는 ANGLE Vulkan SwiftShader(software)이며 실 GPU 성능 수치로 보고하지 않는다. Hero 정·역 전환과 B 도착, 새 포인터/키보드 인사 및 section 경계, 시간 키보드 입력, 편지→실제 서명→저장→접기→장미→다시읽기를 실제 실행했다. 초기 pageerror/console error/requestfailed/HTTP≥400은 모두 0이다. 새가 다음 시간 section에 누출되지 않음을 경계 재측정으로 확인했다. 편지 접기 scroll delta=0이다.

독립 검수에서 발견한 InterPals 우측 인물 하단의 얇은 수평 절단선은 인물 원본 좌표 안에서 y500→640 알파를 부드럽게 끝내고, y660 crop 전에 투명한 여유를 남겨 수정했다. 같은 두 해상도에서 실제 절단선 제거를 확인했다. 보호 얼굴 crop은 baseline 대비 변경 0px이며 원본 RGB/matte 파일은 바꾸지 않았다. 이것은 사이트 전체 미술 최종 합격과 구분한다.

원시 실행 근거·스크립트·전체 캡처는 `output/current-review/shader-integration/`에 있다. 대표 전후 캡처만 아래에 보존한다. 모바일·영상은 사용자 요청으로 제외한다. 실제 GPU 성능과 8개 게임 전체 플레이는 이번 디자인 배치의 검수 범위가 아니다.


### 통합 중 발견하여 보류한 실패

UpFork CTA는 1440 KO와 1920 es-DO에서 hover/leave/cancel·정적 keyboard focus·reduced toggle·offscreen·hidden 이벤트·선택 8개×양언어 href/label·Ctrl 새탭·Enter 라우팅을 실제 실행해 통과했다. 중간 HMR 실행 중 1920 언어 assertion이 한 번 실패했으므로 그 실행을 숨기지 않고 원시 보고서에 남겼으며, 소스 동결 후 같은 검사를 다시 실행해 통과했다.

첫 native Satin 후보는 기본/adapter-null·cold reduced·WebGPU API 없음 조건의 두 해상도 6개 fallback 검사를 통과했지만, software WebGPU에서 **통합 실패**했다. 첫 1440에서는 ready와 canvas 생성이 확인돼도 5초 전후 화면이 동일했다. 재진입·탭 숨김 복귀에서 `device-lost`와 shared WebGL context loss가 나왔으며, 같은 브라우저의 다음 context에도 실패가 이어졌다. 오류 없는 콘솔이나 `onReady`만으로 실제 시각/수명 주기를 통과시킬 수 없다는 근거다.

따라서 이 후보를 완성으로 게시하지 않고, SVG foreignObject 안의 canvas 합성과 offscreen/hidden마다 renderer를 정리·재생성하던 수명을 교정한다. 라이브러리 내부의 공유 기본 device를 직접 destroy한 것으로 단정하지 않으며, 실제 관측은 device-lost와 context loss다. 다음 검수는 HTML host 안에서 실제 소재 픽셀 변화, viewport별 fresh browser, 한 세션 안에서의 반복 진입, 숨김/복귀, reduced 변경, WebGPU queue activity와 기존 WebGL context 보존을 함께 확인한다. queue submit 수는 동작/정지 증거이며 FPS나 하드웨어 성능이 아니다.


### Native 검수 결과와 최종 구현 방식 변경

keep-mounted HTML host로 수명을 수정한 뒤 software WebGPU의 visible submit 증가·offscreen/hidden/reduced submit Δ0·재진입은 확인했지만, 두 해상도 모두 5초 간격 화면 픽셀 변화가 0이었다. 낮은 투명도 때문인지 배제하려고 테스트 CSS에서 소재/host opacity를 1로 올리고 SVG fallback을 숨겨도 단색/무변화였다. 다른 무료 기본 FlowingGradient 제어 실험도 같았고 1920에서 device-lost가 재현됐다. 따라서 queue 활동이나 ready 상태를 ‘소재 애니메이션 구현 성공’으로 보고하지 않는다. `in.uv` warning과 실패의 인과는 증명하지 못했으며 upstream 버그라고 단정하지 않는다.

사용자 승인 콘셉트·기존 renderer와 실제 출력 품질을 우선하여, native runtime 후보는 배포에서 제거한다. `shaders`/TypeGPU 추가 의존성과 사용하지 않는 config를 삭제했고 공식 설치 스킬·skills-lock provenance는 유지한다. 최종 소재는 MIT 공개 FlowingGradient의 domain warp·quad blend·fold highlight 및 필요한 noise primitive를 기존 Three.js의 작은 2D ShaderMaterial로 이식한다. 새 Three/R3F나 별도 WebGPU 엔진 설치는 없다. 이는 native Shader 컴포넌트 적용과 구분되는 **공개 코드 이식**이며, 공식 스킬의 ‘기본 컴포넌트 우선’ 경로를 실제로 먼저 시도한 후 시각/안정성 실패 근거에 따라 선택한 프로젝트 통합 방식이다. 원본과 픽셀 동일한 복제라고 주장하지 않는다.

소재의 noise primitive까지 확인하여 MaterialX/OSL 계보의 Sony Pictures Imageworks BSD 조건과 MaterialX Apache-2.0 전문도 THIRD_PARTY_NOTICES.md에 포함했다. 무료 공개 저장소의 최상위 MIT만 보고 하위 출처 표시를 생략하지 않는다. 설치·배포에 MaterialX runtime을 추가하지 않았다.


### 최종 동결본 검수 결과

- 실제 Chromium 1440×900 KO / 1920×1080 es-DO: default opacity에서 5초 간격 소재 변화 105,274 / 141,017px, 변화 bbox는 공유 표면 안이다. native 후보의 단색/0px 결과와 다르다. 같은 scroll/composition에서 효과 canvas만 숨긴 남녀 얼굴 내부 40×40 샘플은 두 해상도 모두 변화 0px/max RGB Δ0이다. 이는 샘플 검수이며 화면 전체 인물 RGB 동일성을 주장하는 것은 아니다.
- 소재는 기존 Three.js만 사용하고 별도 runtime 의존성을 추가하지 않는다. 720px 폭/DPR1, 최대 초당 30 draw 제한을 둔다. visible에서 실제 renderCount 증가, offscreen·hidden 이벤트·reduced에서 Δ0, 재진입·복귀 정상. 이 수치는 scheduler 동작 확인이며 측정 FPS나 실제 GPU 성능이 아니다.
- 소재 canvas에만 실제 context-loss를 주입하면 정적 fallback과 loop 정지를 유지했고 공유 Hero WebGL context는 정상이다. 별도 cold-reduced는 소재 canvas를 만들지 않았고, 소재 context 생성 거부에도 본문·원본 SVG·입력 흐름을 보존했다.
- 두 해상도에서 CTA hover/정적 keyboard focus와 실제 서명→서류 표시→접기→장미→다시 읽기 재확인 통과. 8개 게임×두 언어의 선택 링크/문구, Ctrl 새탭과 Enter 라우팅은 앞선 동결 CTA 검사에서 통과했다. 모든 게임 전체 플레이를 다시 수행한 것은 아니다.
- 일반 실행의 pageerror/console error/HTTP≥400/requestfailed=0. 소프트웨어 캡처의 ReadPixels stall 경고는 남았다. 강제 context-loss 테스트의 Context Lost 로그, 생성 거부 테스트의 예상 Three context error 1건을 정상 실행 오류와 혼동하지 않는다.
- 최종 소스 전체 88파일/690테스트, production build, diff 검사를 통과했다. 빌드의 기존 Motion use-client/큰 chunk 경고는 남는다. Landing chunk 약 1,042.68KB / gzip312.65KB이며 native 후보의 별도 725KB gzip chunk는 제거됐다. 이 payload 기록을 실제 GPU/FPS 개선치로 보고하지 않는다.

[실제 검수 JSON·소스 해시](assets/impeccable-landing/full-skill-review/motion-correction/browser-integration.json), [InterPals 전](assets/impeccable-landing/full-skill-review/motion-correction/baseline-1440-inter-twelve.webp) / [잘림선 교정 후](assets/impeccable-landing/full-skill-review/motion-correction/after-1440-intrinsic-fade.webp), [최종 소재 1440](assets/impeccable-landing/full-skill-review/motion-correction/final-1440-normal-material-later.webp) / [1920](assets/impeccable-landing/full-skill-review/motion-correction/final-1920-normal-material-later.webp), [게임 CTA hover](assets/impeccable-landing/full-skill-review/motion-correction/after-1920-cta-hover.webp) / [정적 키보드 포커스](assets/impeccable-landing/full-skill-review/motion-correction/after-1920-cta-keyboard.webp).

남은 범위: 실제 하드웨어 GPU 성능, 전체 8게임 플레이, 모바일·영상은 이번 검수에 포함하지 않았다. Hero 접사의 긴 머무름·새의 반복 박자·장미 손 교체의 미세한 pose pop을 이번 소재 추가만으로 해결했다고 주장하지 않는다. 사이트 전체 4/5 또는 미술 최종 승인 점수를 새로 부여하지 않는다. 이 배치는 추가 무료 효과의 적합성·실제 출력·보호 기능·브라우저 통합 검수를 완료한 것이다.


### 원격 동시 변경의 안전한 통합

최종 fetch에서 같은 Hero 브랜치가 d070d48→23acf84로 전진한 것을 확인했다. 기존 원격에는 초대 링크를 `/play?room=...`로 만들고 static host에서 직접 새로고침을 처리하는 변경, 안전한 storage 접근, route tests가 추가돼 있었다. 내 시각 작업 커밋 0f8d937과 다른 파일의 변경이므로 원격 브랜치를 정상 merge(e82d0b1)하여 양쪽 이력을 보존했다. 프로젝트 main을 대상으로 merge/deploy하지 않았고 force push나 중복 브랜치를 만들지 않았다.

통합 소스의 전체 **89파일/704테스트**와 production build, diff 검사가 통과했다. 새 build-static-routes 단계와 라이선스 산출물도 포함한다. 앞서 검수한 시각 구현 7파일의 해시는 통합 후에도 동일하다. 선택 게임·언어·direct room·건의사항 경로는 독립 브라우저에서 좁게 재확인하며, 외부 방 생성/참여나 게임 전체 플레이로 범위를 부풀리지 않는다.

통합 후 실제 경로 재확인 통과: 1440 KO Jaipur / 1920 es-DO Minhwatu 선택이 해당 `/play?game=...` lobby와 언어로 이어졌고, 두 viewport의 `/play?room=qa-route-only-20261023` 직접 접속은 landing 대신 정확한 room code의 join-card를 표시했다. 기존 메뉴의 `/feedback` 진입도 두 언어 정상이다. 외부 방 생성·참여·POST는 0, page/console/network 오류 0이다. 검수 JSON에 통합 후 경로 증거를 추가했다.


## 초기 우주 Hero와 전체 인터랙션 재작업 — 2026-10-23 UTC

기준 소스 ec0bc89, 구현 6c36f59. 사용자 요청은 초기 승인 우주 사진을 더 화려하고 입력에 반응하게 하고, 새와 랜딩의 어색한 모션을 다시 만드는 것이다. 승인된 인물·원화 RGB·B 도착 화면·게임방 카메라·8게임·언어·원문 편지·서명 문서·장미 흐름을 다른 콘셉트로 교체하지 않았다. 모바일과 녹화는 사용자 제외 범위다.

### 실제 읽고 적용한 지침과 분담

- Sol Hero: Impeccable bolder/overdrive/animate/delight, Emil animate/review-animations, shader-programming/Three scene·materials, GSAP performance. 루트가 기존 공유 렌더러·카메라 호스트에 통합했다. overdrive의 대담한 기존 콘셉트 개선 원리를 적용했으며 새 콘셉트 워크숍 전체를 수행한 것은 아니다.
- Sol 새: Emil review-animations/STANDARDS/animate, Impeccable animate/delight/polish, Motion. 별도 프레임 반복을 몸 중심의 유한 인사 동작으로 대체했다.
- Sol 후반 인터랙션/장미: Emil review-animations/animate, Impeccable animate/delight/polish, GSAP timeline/performance와 Motion의 역할 분리. 서명과 편지의 실제 focus/scroll/keyboard 계약을 유지했다.
- Luna: 설치된 지침과 각 모션 소유자·호출 경로를 정리하고 ThreeUI MIT Community 소스를 확인해 Hero 담당에게 참고 위치를 전달했다. 루트는 Kexsio 공개 Components와 Interactive Aurora Nebula Background 페이지도 확인했다. 이번 Hero GLSL은 자체 구현이며 ThreeUI/Kexsio 코드를 복사하거나 라이선스 불명 자산을 가져오지 않았다. 기존 UpFork CTA와 Shaders 공개 커널의 라이선스·범위는 앞 절과 같다.
- 독립 Sol 검수: 담당 구현 소스를 수정하지 않고 실제 Chromium의 전후 프레임·입력·시간·오류·소스 해시를 확인했다. 루트도 선택된 실제 결과 이미지를 열어 확인했다. 이번 범위에 새 전체 사이트 점수나 4/5 합격 점수를 만들지 않았다.

### Before / After / Why

| 대상 / 발견 | 실제 수정 | 수정 이유와 검수 |
|---|---|---|
|초기 Hero 사진이 입력에 충분히 반응하지 않음|원래 은하 방향을 따라 로즈골드·핑크 필라멘트, 세 깊이 별, 드문 유성. 포인터에 별/빛 반응, 누를 때 모이고 놓을 때 기존 빛이 퍼짐|별도 canvas/엔진/RAF가 아닌 기존 Three 렌더러. 원본 인물보다 뒤, 열린 오른쪽 하늘에 배치. 인물이나 텍스트를 빛으로 덮지 않음. 진입 progress .055까지 종료하여 게임방 전환에 추가 오브젝트가 남지 않음|
|새의 독립 360ms 반복과 얇은 막대처럼 접히는 날개, 지나치게 빠른 복귀|몸의 이동·기울임이 먼저, 어깨 축의 넓은 날개와 꼬리가 지연 추종. 인사 후 정지. 왕복은 같은 질량감의 감쇠 운동, 재입력은 현재 속도/위치에서 전환|idle/hold 반복 제거, 빠른 재입력·역전환·hidden/재진입·즉시 keyboard/reduced 확인. 실제 인사 장면과 귀환 장면 비교|
|InterPals 입력이 이진 반응에 가까움|실제 방향/압력에 따른 spring 반응 추가|기존 GSAP 스크롤/사진/편지 본문과 속성 소유권 분리. 얼굴·본문을 흔들지 않음|
|CTA hover 해제 시 빛이 중앙으로 튐|현재 gradient 위치에서 사라짐, press/release 피드백|키보드 포커스는 정적. 기존 갤러리 선택/시차 슬라이더의 정상 retarget 동작은 유지|
|편지 개폐가 느린 선형 동작, 키보드와 마우스 경로 불일치|현재 접힘 값에서 방향 전환, 비대칭 개폐, 완료값 보장; keyboard/Escape 즉시|실제 열기·중간 방향 전환·서명·접기·다시 읽기 흐름 보존. 접기 후 scroll 변화 0|
|약속서 펼칠 때 위치가 약543px 튐|짧은 읽기 가능한 reveal, 읽기 중 기존 scroll-anchor 계약을 문서까지 확장|강제 scroll 호출/빈 공간 예약 없이 1440·1920 모두 opener와 문서 시작 위치 및 scroll 값 동일. 닫은 후 focus 복귀, keyboard CSS 애니메이션 0|
|장미 접촉 순간 새 손가락이 위로 나타남|손목 중심 열린/쥔 손의 축과 투영 일치, 전달자 손에 가려질 때 pose 교체|GSAP 실제 1.379/1.38/1.65초의 grip 좌표 동일. 원화/얼굴·의상 재생성 없음. hidden/offscreen 정지·재개/즉시 replay 충돌도 수정|
|hidden에서도 host RAF가 예약됨|hidden에서 실제 RAF 취소, visible에서 단일 재개. 취소/blur는 release burst를 만들지 않음|숨김 이벤트 동안 frameSerial 고정, 복귀 시 시간 점프 없음. visible 실제 경과 시간을 써 소프트웨어 렌더링에서 유성이 과도하게 느려지는 문제 방지|
|발견물의 keyboard 입력에도 불필요한 장식 동작|16개 발견물 유지, 비영속 입력 분기로 즉시 결과 제공|기능·저장 계약 변경 없이 키보드/움직임 감소 경로를 보존|

### 실제 화면 및 동작 검수

환경: Linux `/usr/bin/chromium`, Playwright, WebGL **SwiftShader 소프트웨어 렌더링**, 1440×900 KO와 1920×1080 es-DO, DPR1. 이 검수는 프레임별 출력·수명주기 확인이며 하드웨어 GPU FPS 측정이 아니다. hidden은 visibilitychange 주입으로 확인했으며 실제 OS 최소화 시험을 가장하지 않는다.

- 두 크기에서 초기 Hero 유성·idle·포인터·press/release/cancel, 정/역 스크롤, 새 idle→접근→인사→복귀·연속 입력·키보드·reduced, 갤러리 hover, 시차 키보드, 편지 개봉/서명 문서/접기/장미/다시 읽기를 확인했다.
- Hero held→release 실제 변화는 1440 183,476px / 1920 313,117px이며 열린 하늘 안에 있다. 남녀 얼굴 내부 표본 max 채널 차이는 1(렌더 양자화 수준)이다. 원본 모든 픽셀을 전수 동일 비교했다는 뜻은 아니다.
- 기존 Hero passage와 B 도착 캡처는 두 크기 모두 전후 **변화0px**. 승인 도착 구도와 카메라 경로는 바꾸지 않았다.
- 새 idle/hold는 떨어진 두 샘플의 몸·날개·꼬리 transform이 동일. hidden 중 고정, 재입력 후 정상 복귀. Hero hidden frameSerial도 고정. reduced의 효과 시간은0이며 포인터 잔여 정착 때 일부 draw가 있어 ‘0프레임’이라고 주장하지 않는다.
- 약속서 1440: opener/document top442.17, scroll9550 동일. 1920: top622.47, scroll11131 동일. 두 크기 Δscroll0. 1440 실제 장미 0/1.2/1.379/1.38/1.65/2.2/3초를 확인했고 contact grip659.629/613.825가 교체 전후 동일하다.
- 정상 실행 pageerror/console error/HTTP오류/requestfailed/contextloss는0. Playwright가 GSAP thenable을 반환받아 대기한 초기 harness 문제와 의도적 near-wing 네트워크 실패주입의 fallback 대기 timeout은 정상 경로와 구분했다. 실제 SVG 오류 전달 경계가 드러나 단순 선택자 오류로 축소하지 않았으며 후속 수정·실패주입 결과는 아래에 기록한다.

[Hero 전](assets/impeccable-landing/full-skill-review/motion-correction/before-1920-hero.webp) / [입력 중 후](assets/impeccable-landing/full-skill-review/motion-correction/after-1920-hero-held.webp), [새 전](assets/impeccable-landing/full-skill-review/motion-correction/before-1920-bird-together.webp) / [인사 후](assets/impeccable-landing/full-skill-review/motion-correction/after-1920-bird-hold.webp), [장미 접촉 연속 프레임](assets/impeccable-landing/full-skill-review/motion-correction/rose-contact-continuity.webp), [약속서 후](assets/impeccable-landing/full-skill-review/motion-correction/after-1920-pact-open.webp).

이번 수정 전 동결 소스는 90파일/711테스트·production build·TypeScript·diff 검사를 통과했다. 출판 직전 Site 원격이 다른 세션의 도미노 수정 소스9a84896으로 전진하여, 같은 Hero 브랜치에 해당 커밋을 정상 통합했다. 기존 사이트의 규칙·설명 개선을 덮어쓰지 않았으며 main을 대상으로 병합·push·배포하지 않았다. 통합 후 시각 검수21파일의 SHA256은 모두 동일하다. 통합 최종 검사 결과는 아래에 덧붙인다.

남은 한계: 새 어깨의 확대 접합선·장미 손목의 미세 색차와 접촉 순간 아주 작은 끝점 변화는 완전한 새 원화/관절 리깅 수준으로 해결됐다고 주장하지 않는다. 현재 관찰 크기에서 큰 pose pop은 없어졌다. 모바일·영상·전체8게임 플레이·실제 하드웨어 GPU 성능은 이번 검수 대상이 아니다.

통합 최종 전체 검사는 **91파일/726테스트** 및 production build를 통과했다. 기존 큰 chunk/Motion use-client 경고는 남는다. [독립 브라우저 측정·전후 해시](assets/impeccable-landing/full-skill-review/motion-correction/landing-motion-browser.json).

### 최종 이미지 실패 복구

실제 near-wing 요청 abort에서 SVG image onError가 failed 상태로 연결되지 않는 문제를 발견했다. 정상 모션 승인과 구분해 미통과로 남긴 뒤, 같은 새 담당자가 active5 이미지에 native Image 오류 감지와 cleanup을 추가했다. 정적 fallback 원본은 이 감시에서 제외한다. 동작값·모션 CSS·카메라 변경은 없다.

수정 후 독립 Chromium fresh1440 context에서 같은 실제 URL을 abort: **data-failed=true / greeting disabled / 원본 hummingbird-body fallback 표시 / layered rig 제거 / 오류 안내 표시 / pageerror0**를 확인했다. 최종 새 소스 SHA256은 `0c42d10492d2c17a0073b56f6d31b7eab3df85ddeca06b5432157f782f98d234`, 정상 모션 검수 나머지20파일은 동일하다. 새 범위11테스트·TypeScript·최종 production build·diff 검사 통과. 앞 전체726테스트 이후 추가한 오류 경계1개는 이 좁은 검수로 확인했으며 전체727테스트 재실행으로 표시하지 않는다. 최종 정상 모션 및 이 실패 복구 범위에 남은 차단 결함은 관측하지 않았다. 사이트 전체 미술 최종 승인과는 다르다.


## 승인 B 공부방·게임방의 소품 반응과 유성 증량 — 2026-10-23 UTC

요청: 승인된 방에 실제 오브젝트 인터랙션을 늘리고, 초기 Hero 유성을 더 자주·여러 개 보이게 한다. 기준소스 b2facef. 루나는 설치된 스킬 목록과 현재 입력/발견물/공개 소스를 읽기 전용으로 매칭했고, Sol은 공간 반응 helper/테스트, 루트는 공유 host·입력 투영·유성·렌더 생명주기, 독립 Sol은 실제 브라우저 전후 검수를 맡았다.

### 설계와 적용 지침

- 기존 3개의 직접 공간 버튼은 L04 토끼, L09 사진, L06 노트북이다. 기존 16개 발견물이 전부 방의 직접 hit target인 것처럼 보고하지 않는다. 기존 작업영역·원문·게임·API를 새로 만들거나 단순화하지 않는다.
- 방 원화는 계속 승인된 하나의 rigid illustration이다. 전체 방이나 인물을 새 3D 모델로 만들었다고 주장하지 않는다. 원화에 정합한 Three 셰이더 표면과 작은 실제 extruded heart 두 개를 기존 공유 renderer에 더했다. 카메라/원화/스케일/벽·바닥은 유지했다.
- 실제 적용: 프로젝트 couple-games-landing-design, Ponytail, Three scene/material/shader, Impeccable bolder/animate/delight, Emil animate/review-animations와 STANDARDS, GSAP performance/ScrollTrigger. 기존 도구의 속성 소유권을 유지하고 별도 renderer·라이브러리·RAF를 추가하지 않았다. 새 방 반응은 현재 입력에서 이어지는 감쇠와 셰이더로 구현했고, 쓰지 않은 Motion/Remotion/HyperFrames를 사용했다고 기록하지 않는다.
- 참고: Luna가 확인한 ThreeUI MIT glassToggle의 고정 비율·측정된 입력 면적과 hover/activation 분리 원리. 코드·환경맵·파랑 palette를 통째로 가져오지 않았고 Kexsio의 검증되지 않은 구현을 복사하지 않았다.

| Before | After | Why |
|---|---|---|
|소품 hover에서 작은 검은 label만 표시|모니터 내부 cyan 빛/한 번 지나가는 광택, 눌렀다 놓는 잔광|원래 모니터면에 정확히 등록, 남자 얼굴·본문은 움직이지 않음|
|키보드에 별도 반응 없음|손 아래 keystrip에 blue→rose 빛 물결, 눌렀다 놓을 때 짧은 pulse|원본 손 위로 재질을 덮지 않음. 실제 검수에서 label이 빛을 가려 아래로 옮김|
|토끼·노트북·사진의 직접 반응이 빈약|토끼 위쪽에 작은 입체 하트 두 개가 인사, 노트북 lid의 rose catchlight, 사진의 나무 테두리 glint|토끼/인물의 표정·사진 내부 보존. 사진 frame mesh는 내부에 삼각형이 없는 구멍 구조라 사진 인물에 광택을 덮지 않음|
|기존 발견물 클릭과 새 반응이 충돌할 위험|모니터·키보드는 순간 광반응 전용; 기존3버튼은 같은 발견물 창과 조작을 유지|native dialog open 동안 material 비활성화, Escape focus/스크롤 복귀 유지|
|새 input footprint가 물건 모서리를 놓칠 위험|현재 카메라 ray→승인 source pixel 역투영, source bbox로 button 배치|실제 검수 후 monitor bbox를 화면 전체 x78..242/y323..621로 맞춤. 카메라를 움직여 오류를 감추지 않음|
|방 반응이 계속 재생되거나 다음 장면까지 잔류할 위험|현재 hover/press/activation에만 반응, 유한 sweep 후 정지. .94 이후 방 범위/desktop/dialogclosed에만 활성|reduced/keyboard는 움직임 없는 정적 피드백, cancel에 새 release burst 없음, hidden 및 post bridge 이탈 시 정지. 신규 두 버튼은 검수하지 않은 좁은 화면에서 노출하지 않고 기존3개는 보존|
|유성1줄기/11.8초|5.4초 주기4줄기, lane/속도/강도가 다른 짧은 경로|열린 하늘에서 더 자주 겹쳐 보임. 원본 인물보다 뒤, 기존 초기 Hero 종료/움직임 감소 보호 유지|

### 실제 검수와 보존

실제 `/usr/bin/chromium`, Playwright, Linux ANGLE Vulkan **SwiftShader**, DPR1, 1440×900 KO / 1920×1080 es-DO. 독립 담당이 수정 전 3개 소품의 hover/click/input/focus와 같은 조건에서 수정 후 5개의 반응을 직접 확인했다. 루트도 모니터·키보드·토끼·유성 실제 캡처를 열어 비교했다.

- 정상 두 크기 idle B 전후 전체 픽셀 변화0. 5개 hover/held의 남녀 얼굴 내부 두 표본도 각크기 변화0. 이는 내부 샘플 검수이며 모든 인물 픽셀 전수 동일 주장과 구분한다.
- 모니터/키보드 hover·press·cancel·키보드 입력, 3개의 기존 modal 입력/닫기/focus/scroll 복귀, modal 중 새 material 비활성, q.9→1→1.3 이탈과 역복귀를 확인했다. 기존 토끼 그림자 slider, 사진 shutter, 노트북 pointer drawing→card 흐름 유지.
- 정착 뒤 idle frameSerial 고정, hidden에서도 고정. 원본 방 camera/행렬은 변함없다. 실제 검수는 정상 경로 page/console/network 오류0이며 SwiftShader ReadPixels warning은 하드웨어 성능이나 무경고 실행으로 해석하지 않는다.
- 전체 **92파일/736테스트**, TypeScript, production build, diff 검사 통과. source 역등록과 정착/중단·사진 내부 raycast hole·reduced/keyboard·자원 해제에 의미 있는 검사를 포함했다. 최종 CSS와 monitor hitbox 조정 뒤 production build를 다시 실행했다. 기존 큰 chunk/Motion use-client 경고는 남는다.

모바일·영상·전체 8게임 플레이·실제 GPU FPS/장시간 성능은 이번 검수에서 제외했다. 이번 승인 범위는 B 소품 반응과 유성 증량이며 전체 사이트 미술 최종 승인이나 새 전체 점수를 의미하지 않는다.

최종 보충에서 두 문제를 관측해 같은 담당과 수정했다. 첫째, 이전 버튼의 blur가 새 버튼의 press를 지웠다. cleanup은 자기 target이 현재 target일 때만 수행하도록 고쳤고, 두 크기에서 **5개 연속 held의 target===id·press===true, cancel 후 press===false**를 strict assert했다. 둘째, 루트가 실제 L06 그림에서 작은 내부 사각판처럼 보이는 테두리를 거부했다. 담당자는 kind2 material만 테두리를 없애고 경계 alpha0인 부드러운 diagonal rose catchlight로 교정했다. 전체 구도나 조명으로 문제를 감추지 않았다.

reduced 초기 두 자동화 샘플은 B 위치가 아니므로 승인 근거에서 제외했다. 실제 heroHeight−viewportHeight로 이동해 progress1/roomInteractionActive=true인 fresh reduced context에서 모니터·키보드·토끼의 정적 반응/Animating=false를 다시 확인했다. 이는 검수 위치 정정이며 제품 오류를 고쳤다고 표시하지 않는다. 앞 정상 모션/입력 근거와 최종 fragment 차이를 해시로 구분한다. 전체736테스트는 최종 입력 경계/재질 폴리시 전 실행이며, 그 뒤 변경은 해당 strict 브라우저 회귀검사·8개 helper 테스트·TypeScript·최종 production build·diff로 좁게 확인했다.

최종 L06 실제 재검수도 두 크기 통과했다. 단단한 quad/rim이 없어지고 lid 내부 부드러운 rose catchlight로 보이며, hover→held 변화는1440 18,758px /1920 30,639px, 남녀 얼굴 내부 표본은각0이다. source-laptop-freeze와 최종해시가 동일한 상태에서 확인했다. 독립 검수는 이 제한된 방 반응·유성 범위 Approve이며, 남은 차단 결함을 관측하지 않았다.

[방 수정 전](assets/impeccable-landing/full-skill-review/motion-correction/room-interaction-before.webp) / [수정 후 실제 소품 반응](assets/impeccable-landing/full-skill-review/motion-correction/room-object-reactions.webp), [늘어난 유성 실제 프레임](assets/impeccable-landing/full-skill-review/motion-correction/hero-frequent-meteors.webp), [전후 브라우저·strict 입력 회귀검사·최종 소스 해시](assets/impeccable-landing/full-skill-review/motion-correction/room-interaction-browser.json). 기존 원격 Hero 브랜치에 통합하고 owner-private 확인 Site의 audience를 유지해 업데이트한다. 프로젝트 main을 대상으로 병합·push·배포하지 않는다.

### 출판 직전 다른 세션 변경 보존

Site 원격5325742의 source-checkpoint가 새 게임 UI 소스549ee3a로 전진한 것을 확인했다. 기준 b2facef 대비15파일은 게임 앱/규칙 안내/게임 CSS·검수 문서이고 landing 변경은0이었다. 이를 기존 Hero 브랜치에 정상 merge(9a480f4)하여 현재 사이트의 개선을 덮어쓰지 않았다. 이번 방 담당이 해당 게임 기능을 구현/검수했다고 주장하지 않는다. 최종 시각검수5파일 SHA256은 모두 동일하며, 다른 세션 CSS 변경도 room-shell/game-surface 범위라 landing에 새 전역 규칙을 추가하지 않는다. 통합 후 전체 **92파일/742테스트**와 production build가 다시 통과했다. 따라서 앞736테스트 이후의 최종 입력/셰이더 수정도 이 마지막 전체 실행에 포함된다.
