# 공식 스킬 재점검·수정·재검수 — 2026-10-22 UTC / 23 KST

시작 소스 `921bac645d99ab0d7f54e00211b220695b422fd0`, 기존 `redesign/folded-playhouse-depth-r8-20261018` 브랜치. 승인된 우주 Hero/B 게임방, 인물, 8개 게임, 원문 편지, 두 언어, 실제 서명·장미·건의사항을 보존했다. 원본 main 병합·공개 audience 전환·새 영상·모바일 전수 검수는 하지 않았다. 이 문서는 현재 재점검 결과이며, [이전 체크포인트 기록](https://github.com/da960822-ux/gitactions-main/blob/921bac645d99ab0d7f54e00211b220695b422fd0/docs/reviews/IMPECCABLE-LANDING-2026-10-23.md)은 Git 이력에 남긴다.

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
