# 현대적 커플 우주 공간 재시작 — 출처 적용 명세 / 미완료

작성일: 2026-10-12. 보존 기준 revision: `ab81a9e2de168b89c58e197edbb6e5a541aad4ca`.
작업 브랜치: `local/lusion-space-restart-20261012`.
작업 경로: `/workspace/gitactions-lusion-space-restart`.
이번 문서 단계에는 제품 코드·자산을 변경하지 않았다. **명세 검토를 먼저 전달하며, 구현·시각 합격을 주장하지 않는다.**

## 변경할 수 없는 완료 조건

사용자가 2026-10-12 구현 재개를 승인했다. 합의 기준을 **전부 충족해야 완료**이며 하나라도 미달하면 미완료다. 구현이 어렵거나 실패해도 목표·효과 강도·검수 기준을 임의로 줄이거나 사용자가 거절한 쉬운 이전 디자인으로 되돌리지 않는다. 기능/테스트 통과는 시각 품질을 대체하지 않는다. 방향·기준 변경에는 사용자 승인이 필요하다.

히어로는 페이지에서 가장 화려하고 강렬해야 한다. 첫 화면에서 공간의 규모·독립 물체의 깊이·빛·재질·앞뒤 가림·실질적 입력 반응이 보인다. 입장 / 포인터 / 스크롤 / 편지 열기는 서로 다른 역할을 한다. 큰 평면 이미지를 살짝 흔들거나 하트·별을 늘리는 것만으로 충족하지 못한다. 얼굴·문구 가림 금지는 전체 효과를 작게 만드는 이유가 아니다. 원본 커플과 실제 개인 이야기가 중심이다.

관찰 자료는 방향 근거이며 옛 구성 복구 승인이 아니다. 현대적 인터랙티브 우주 방향과 승인 자산을 발전시킨다. 방·창틀·책상 배치는 필수가 아니며 거절된 방 구도를 기준으로 삼지 않는다. 여덟 게임·승인 개인 그림·부루마블 자산·캐치마인드 재접속 수정은 보존한다. main 변경·배포·강제 push·통째 revert 금지.

## 출처의 성격과 확인 한계

| 출처 | 이번 확인 | 사용할 수 있는 주장 | 금지되는 주장 |
|---|---|---|---|
| [landing.love/sites/lusion](https://landing.love/sites/lusion) | 부모 연구자가 전달한 ©2023 구버전 녹화의 구간별 관찰. 이 실행 환경의 웹 열기는 오류였다. 원본 녹화 픽셀을 이번 단계에서 직접 재관찰하지 못했다. | 아래 L1–L6은 전달받은 영상 관찰이며 새 설계의 해석은 별도 표기 | 현재 Lusion과 동일, 원본 제작 프롬프트/비공개 코드 확보, 직접 전체 영상을 보았다는 주장 |
| [App landing page](https://websiteprompts.ai/prompts/app-landing-page) | 공개 프롬프트 본문 재독 | mount / 반복 분위기 / scroll / hover를 따로 명세하는 방식 | Lusion 제작자의 원본 프롬프트라는 주장 |
| [Perfume brand](https://websiteprompts.ai/prompts/perfume-brand) | 공개 프롬프트 본문 재독 | 측광·유리/금속·표면·빛의 이미지 요구와 재질 명세 방식 | CSS 빛 번짐이 실제 3D 반사·굴절을 구현한다는 주장 |
| [Designer portfolio](https://websiteprompts.ai/prompts/designer-portfolio-website-prompt) | 공개 프롬프트 본문 재독 | mount / scroll / hover 표, 텍스트 reveal의 분리 | 프롬프트의 img 기반 3D 묘사를 실제 입체 물체로 인정 |
| [Lusion WebGL Scroll Sync](https://github.com/lusionltd/WebGL-Scroll-Sync), [demo](https://webgl-scroll-sync.lusion.co/) | 공식 공개 README 재독 | 한 canvas와 DOM 스크롤 동기화 문제·절충을 설명하는 구현 참고 | 이 예제가 Lusion 전체 사이트의 실제 구현이라는 주장 |
| Motion [useScroll](https://motion.dev/docs/react-use-scroll), [useTransform](https://motion.dev/docs/react-use-transform), [useSpring](https://motion.dev/docs/react-use-spring) | 공식 문서 확인 | progress→값 매핑과 smoothing의 구현 참고 | 라이브러리 설치 자체를 시각 품질의 증거로 사용 |

Personal Context는 이 대화에서 unavailable을 반환했다. 확인되지 않은 과거 자료를 기억으로 채우지 않는다. 부모에게서 추가 원본 녹화/분석이 도착하면 출처 열을 보강하고, 명세와 충돌할 경우 구현 전에 재대조한다.

## 보존 버전과 재사용 범위

| 정확한 revision / scene | 소스에 있는 것 | 이번 재사용 | 재사용하지 않을 구성 |
|---|---|---|---|
| `1cf833215196aa68b68b062d5a01e3c1b01f7530` / `src/preview/UnifiedHeroScene.tsx` | PerspectiveCamera FOV38, PBR/PMREM, 실제 mesh, 원본 알파 가림, 스크롤 투영, pause/context-loss 처리 | **가장 유용한 3D 파이프라인 기반**. 렌더러·자원 해제·투영·알파 깊이 원리·보호 영역 | 큰 Baby+작은 하트+얇은 궤도+빈 성운을 최종 디자인으로 유지하지 않는다. 과거112px 상한을 새 주 물체에 적용하지 않는다. |
| `53d31c317090cdc7fec3c796a0afad41bb9da976` / `HeartScene.tsx`, `heartPhysics.ts` | raycast, 드래그, home spring, 관성, 접촉·경계 반응 | 입력/복귀 알고리즘과 interruption 처리 | 9하트 구성·OrthographicCamera를 새 전체 공간으로 확대하지 않는다. sphere 접촉은 정밀 근접 접촉 모델이 아니다. |
| `5e788fe0ba837809d4790dac8a04afacf1ed306f` / `StudioScene.tsx` | canvas 진입 후 reveal 시작 수정 | offscreen 트리거 제어 참고 | 이 커밋이 새 대형 공간 전환을 구현했다는 해석 금지 |
| `ee50a228b83417cb74ff90626b2c825cfc8833cf` | 소프트웨어 GPU 이미지 경로 | fallback의 정직한 분류·성능 비교 참고 | PNG fallback을 실제3D 합격으로 간주하지 않는다. |
| `f434c864a85e5611b6840f5924fbe90ec38c8b82` | wire 제거, 최신 게임 통합 보존 | 비교용 wire 없는 이전 우주 화면 | 구성을 되살리는 것만으로 새 목표 완료 처리 금지 |
| `ab81a9e2de168b89c58e197edbb6e5a541aad4ca` | 최신 게임·개인 자산·startup/catchmind 수정 | 새 브랜치의 **보존 기준** | 거절된 원래 DOM 방 구성의 미세 polish로 축소 금지 |

저장된 실제 렌더 PNG/JPEG 네 장을 이번에 열어 픽셀을 확인했다. 새 렌더가 아니다.

- `/workspace/home-integration-deliverables-20261011/unified-space-20261011/video/after-fixes-initial.jpg`
- 같은 폴더 `after-fixes-scroll680.jpg`: 이전 video 폴더 기록이다. 1cf의 최신 path-cleanup 결과와 혼동하지 않는다.
- `/workspace/landing-orbit-passage-deliverables-20261012/wire-removed/space-1440-0.png`: f434 검수의 기존 wire 없는 화면.
- `/workspace/landing-hero-pass4-deliverables-20261011/compact-desktop-ES-first.png`: pass4의 기존 ES 화면.

보이는 차이: pass4는 작은 하트와 선, 후속 통합본은 세 재질과 성운을 포함하고, wire 제거본은 선만 사라진다. **세 화면 모두 큰 전경 표면/세계 열림/넓은 연속 표면 전환을 실제 픽셀에서 보여주지 않는다.** 정지 그림에서 운동의 강도·반사 이동·물리감을 판정하지 않는다.

## 새 장면의 구체적 방향

커플을 중심으로 한 **열린 우주 조각 공간**이다. 창틀과 책상이 보이는 방 대신, 넓고 두꺼운 로즈골드/펄 표면이 화면 바깥에서 커플 주변으로 들어오고 서로 다른 깊이를 만든다. 하나의 넓은 조각 표면은 첫 스크롤에서 계속 펼쳐져 게임을 놓는 공간으로 이어진다. 읽을 수 있는 DOM 문구/버튼은 독립된 안정 영역에 둔다. 새 얼굴·옆얼굴·인물 뒷면은 만들지 않는다.

주 물체는 **넓은 금속 꽃잎형 표면 2개 + 두께 있는 펄 조각 1개**다. 둥근 로즈골드/분홍/펄 하트는 기존 3개 이하의 보조물이다. 하트가 주 장면을 대신하지 않는다. 주 표면의 desktop 초기 투영 크기는250–460px, 전경 통과 중480–700px이며 화면 가장자리에서30–45%가 밖으로 나올 수 있다. 세 표면은 서로 다른 z에 있고 뒤쪽 표면은 원본 커플 실루엣에 실제로 가려진다. 전경 표면은 얼굴/전화기/손/문구 구획 밖의 좌우·하단을 크게 통과한다. 잘못 들어오면 경로를 바꾸며 전체를 작게 줄이지 않는다.

첫 화면의 커플 투영 폭은 desktop480–560px, mobile260–310px를 목표로 한다. 둘의 얼굴은 한 덩어리로 중심 읽기 지점이 된다. 제목은 커플보다 시선을 독점하는 거대 Baby 단독 글자가 아니라 기존 개인 문장과 적당한 display typography로 구성한다. 실제 이야기(멀리서 같이 게임, 한국어/스페인어 그림 대화, 약속한 장미, 실제 편지)를 장면의 이동 이유로 사용한다. 허구의 연애 사건·대화·통계는 만들지 않는다.

아래 수치는 **새 구현 명세**다. Lusion 영상의 측정값이나 공개 프롬프트 원문 수치가 아니다. 기준은 desktop1440×900 /1280×800, mobile390×844 /360×800, KO/ES다. 위치/투영 폭은 viewport 비율로 재계산하고 world 수치만 고정해서 모바일을 잘라내지 않는다.

## Lusion 관찰 → 적용량 명세

| ID / 전달된 실제 관찰 구간 | 우리 대상 / 역할 | 수량·강도·시간·발동 | 구현 / 자산 / 가림 | 상태·제외 이유 |
|---|---|---|---|---|
| L1 ·00:05–00:14 독립 물체 회전, 앞뒤 가림, 이동하는 specular와 무광 대비 | 히어로 주 조각3개 + 보조 하트≤3. 입체 공간과 물리 반응 | 주 조각 z=`+2.2,-1.2,-5.0`, 커플 plane 기준z0. desktop250–460px, mobile110–210px. 포인터 주 물체 회전최대35–55°; drag 투영 이동140–240px desktop/55–100px mobile. 입력 중 즉시 반응, release후0.5–0.9s 관성 복귀, 연속 입력 retarget. 단순 영구 wobble 대체 금지. | 실제 두께/곡률 mesh, `MeshPhysicalMaterial`, PMREM/key/rim. 금속 roughness.20–.30/metalness.85–1, 펄 roughness.32–.45, 무광 rose roughness.6–.75/metalness0. raycast+spring; 커플 알파 depth mask와 공간 경로 사용. | **채택**. 재질3종의 반사/무광 차이를 실제 영상으로 판정. sphere 근사 접촉은 closeup에서 분리 검수. |
| L2 ·00:22.6–23.7 동일 작은 표면이 휘며 넓은 패널로 연속 전환 | 편지 봉투/종이 표면. 손에 닿는 선물→읽는 편지 | 하나의 면/같은 mesh identity, closed투영260×170px→open640–760×460–560px desktop; mobile260×170→320–350px폭. 클릭 뒤총1.1–1.4s;0–.25s wax이탈, .15–.6s flap0→155°, .35–1.2s 종이곡률/접힘연속펼침. 반전시 현재 상태에서닫힘, 재시작금지. | 6–8구획 연결 paper geometry, 각진 경첩/곡률·두께·연속법선, PBR종이/wax/seam. 읽는 실제 본문은 DOM, 표면과 투영 일치한 뒤읽기상태로연결. 기존모든본문/서명/언어보존. | **채택**. CSS삼각형+본문fade만이면불합격. 종이가운데이미지만늘리는방법불합격. |
| L3 ·00:59.5–01:01 화면 프레임 밖으로 세계 열림 | 입장→히어로 공간 열림 | 첫ready뒤1.8–2.2s한번. camera z12.8→9.4(약27%dolly), 주전경한면screen밖→옆장면480–700px통과, 2면은깊은공간에서드러남. 이동량desktop220–400px/mobile90–160px. 버튼즉시가능, gate로대기시키지않음. | 동일 scene에서camera+densecurvedsurface. 초기bigPNG scale/fade가아님. 텍스트.65–.9s별도reveal, 원본얼굴은ready부터읽힘. 얼굴구획과상단nav안전. | **채택**. 장시간Intro/blockingloading제외. 큰움직임을별count로대체하지않음. |
| L4 ·01:03.5–05 타이포와 인물의 반대 깊이 | 첫스크롤, 커플·문구·공간의 서로 다른 이동 | hero아래첫720px(작은높이650px)연속scroll. camera z9.4→5.4 /x0→2.4, 보이는spaceyaw12–18°. 커플원본평면은nearfront유지, 투영폭520→330px /중심x50%→34%. 제목 plane은다른z에서반대움직임, fade는progress.3–.6보조. 역스크롤즉시같은경로. | 한progress소스, camera와DOMprojection동일값. 과거440px opacity전환확대금지. 새인물옆/뒷면 없음. realcamera이동+독립물체상대크기·가림변화필수. | **채택**. 인물3D라고표기하지않음. 커플원본2.5D한계는유지하되주변공간은실제3D. |
| L5 ·01:34.5–37.5 피사체가 프레임 경계 밖으로 나옴 | 주전경조각1개, 히어로/전환경계 | hero좌우바깥30–45%넘침. 첫scrollprogress.18–.72에서500px이상큰면이가장자리를지나며깊은게임공간드러냄. mobile은side부분통과100–180px, 전체면크기는축소만하지않고옆구획재배치. | viewport상대크기와safezones; hidden슬라이드카드container로큰면절단금지. canvas의정상viewport밖clip은가능, 면의앞뒤가림은z-buffer. | **채택**. 인물얼굴/문구위로넘치는경로제외. 작은하트몇개추가로대체불가. |
| L6 ·01:43–44.5 불투명 섹션이 공간을 덮음 | hero→게임배치 공간 마무리 | 첫scrollprogress.62–1.0, 같은rose-gold표면이펴지며게임영역후면이됨. 시각적으로40–65%viewport를차지한뒤안정된게임영역으로정착. 마지막180–240px구간에8gameDOM카드가읽히는위치로등장. | 기존hero주표면mesh를flatten/rotate하여다음공간바닥/배경으로연속전환. 게임카드는기존GameRail/실제클릭동작보존. 이미지crossfade두장이나별개장면teleport아님. | **채택**. Lusion의원래색/레이아웃복제안함. hero보다게임전시가더화려하게주목독점하면재작업. |

L2의 전환을 정확한 원본 영상 프레임의 동일 topology로 역설계했다는 뜻이 아니다. 관찰된 **연속 표면 관계**를 우리 고유 geometry로 구현한다. 모든 초기값은 성능/안전 튜닝 가능하나 시각 최소량·의미·역할을 줄이면 기준 변경이며 사용자 승인 대상이다.

## 공개 프롬프트 → 채택·변환·미채택 명세

| ID / 출처에서 실제 읽은 항목 | 우리 적용 / 수치 | 발동·기간 / 구현 | 미채택·변환 이유 |
|---|---|---|---|
| P1 App · 분위기2레이어, phone진입/반복/scroll, text진입 분리 | 배경광2개는 rose/lilac로변환, z−12/−18, viewport폭70–100%, opacity.18–.3. 주camera입장 L3와DOM문구reveal별도 | 배경두광은22s반대방향루프, displacementviewport8–14%; 문구ready+0.15s/.8s/line.08sstagger. resize·언어변경때readableline유지. | 원문의phone12px/6sfloat미채택: 수면앱의정숙함은현재목표불일치. SaaS문구/평점/후기/요금제미채택. 별약40개그대로복사안함. |
| P2 Perfume · 유리와측광·caustic이미지세부명세, dark/gold와장면단위광 | hero금속/펄/무광3표면비교, 고정warm key(−4,6,8)intensity3–4, coolrim(5,2,−3)1.5–2, PMREM반사panel4개. PBR값은L1 | camera/물체회전때specular이동필수; pointerlight반응은최대1worldunit. 배경softwarm광20s허용하되3Dlighting대체금지 | 원문의모든headingblur20px/1.6s·전이미지동일reveal미채택: 얼굴과개인글읽기지연. 가짜causticPNG를실제굴절이라부르지않음. perfume상업구조/문구미채택. |
| P3 Portfolio · mount/scroll/hover의트리거표, clip-path제목reveal, hover테두리 | 제목2줄mountreveal각.65–.8s/차이.08s, gamecardhoverborder/press160–180ms. glass/금속조각은실제mesh로변환 | mount1회; 첫scroll은L4/L6; hoverfinepointer만. 200px커서glow대신L1의raycast물체반응, geometry와광이실제변함 | 원문의이미지object5s/12pxfloat미채택. 보라200pxglow만follow미채택. badge/경력/가짜portfolio/후기미채택. |
| C1 Motion · scrollvalue/transform/spring | useScroll/Transform/Spring의**역할**은한progress소스→camera/plane/DOM매핑→input관성. 기존Three RAF와spring사용을우선 | 현재motion패키지없음. 라이브러리추가없이동등동작으로시작. React매frame setState/DOMlayout측정금지; cachedlayout/font+resizeinvalidate | 실제설치·hook사용안하면그대로문서에밝힘. 읽은문서/참고와사용코드는구분. |
| C2 공식Lusion ScrollSync · 한canvas/DOM동기화, native-scroll/rAF엇갈림·paddingtradeoff | 한Three renderer로hero/게임전환/편지소품관리. native scrolling유지. DOM관련조각은document좌표+cachedrect로투영 | scroll event에서값저장, render에서한번샘플링. 큰카메라전환영역은stickyDOM+canvas함께움직임. 여러section소품은absolutecanvas와overscan필요성profiling | 예제25%padding을무조건복사하지않음(fillrate비용). scrolljack/여러context설치금지. 최소동기화·빨리왕복스크롤의clip실제검수필요. |

공개 프롬프트의 세부를 전부 붙여 넣는 것이 목표가 아니다. 위 방식·필요 효과만 사용하고, 원문의 작은 반복 부유나 일률 fade는 목표 불일치로 미채택한다. 이는 **효과 축소가 아니라 더 강한 실제 3D 동작으로 대체**하는 명세다.

## 자산/코드 적용 목록과 실제 제작 방식

| 경로 | 보존/제작 | 용도·재질·규격 | 완료 전에 필요한 증거 |
|---|---|---|---|
| `public/images/yeonseok-lisbeth-cutout.webp` | **원본그대로**1254×1254RGBA. 원본hash보존 | 중심2.5D인물+알파depthmask. 각도는front유지. profile/back모델없음 | 원본bytehash, KO/ES모든입력/전환얼굴·전화기·손보존픽셀 |
| `public/images/landing/cinematic-observatory-hero-v1.webp`와manifest | **승인자산보존**, hero전체고정방background로재사용안함 | 기존fallback/아트reference. 새우주장면색·광참고. 그림을mesh/normalmap이라부르지않음 | 기존원본manifest/runtimehash유지, active3D경로가그림scale만하지않음 |
| `src/preview/spaceGeometry.ts` (신규예정) | 절차적넓은꽃잎/두께있는펄mesh3개+편지면 | 폭/곡률/두께가실제vertex로존재. 주surface절대얇은TubeGeometry궤도로대체안함. 약각8–16k triangles, 편지6–8접힘구획 | wireframe/projectiondepth/code검사, 회전시실제측면·곡률·가림관계변화 |
| `src/preview/heroMaterials.ts` | 기존3재질함수보존/필요확장 | 금속/펄/무광의L1값, normal변화는geometry. PMREM4panel+key/rim. HDR외부asset다운로드불필요 | 이동specular·무광diffuse대비실제frame, toneclipping없는얼굴 |
| `src/preview/CoupleSpaceScene.tsx` (신규예정) | 기존Unified렌더러/마스크/cleanup원리재사용, 새장면조립 | 단일renderer+PerspectiveCamera38°, 3주표면/≤3heart/별12–20보조. 입장·raycast·scroll·letter시퀀스. webGLcontextloss/pause지원 | 실제geometryidentity/카메라/logicalphase/투영값. dataset숫자만으로시각PASS금지 |
| `src/preview/spaceMotion.ts` (신규예정) | 순수motion값계산+기존spring원리 | L3입장·L4/L6scroll·L2letter인터럽트. dt종속성과범위clamp. fixedseeddeterminism | 최소의미있는테스트: quickreverse연속성/포인터복귀/안전영역/zero-size처리 |
| `src/preview/LandingPreview.tsx` | 새hero연결, 기존lang/nav/letterbody/gamecallers보존 | 기존HeroScene을삭제안함. 새branch에서mainhome/preview동일scene연결. 장면분리만, 실제개인copy유지 | 연결모드/hashjump/KOES/실제8게임선택/편지fullbody/focus/Escape |
| `src/preview/couple-space.css` (신규예정) | 새구성styles, 옛CSS보존 | desktop중심커플+안전한읽기구획, mobile중앙portrait/상하copy와큰면side재배치 | 4viewport KO/ESoverflow/CTA/focus/readability실제pixels |
| 기존 `heartGeometry.ts`, `heartPhysics.ts`, `spaceSafety.ts` | 보존·필요원리재사용 | 보조하트≤3와raycast관성. 기존112pxcaps를주표면에확대적용안함 | 안전영역을피하는경로와큰효과동시성립 |
| 기존 GameRail, 게임전체·37승인개인/부루마블WebP | **변경범위밖**, 보존 | 원래게임정체성/게임진입목록. 게임중canvas정지/해제 | 코드diff/hash비교, gameentrysmoke. 과거fullQA재실행주장금지 |
| 기존편지본문/서명/envelope·rose원본 | **보존**, 새mesh는원본메시지를전달하는무대 | wax/종이소재는proceduralmesh/PBR; 원본PNG는재질근거/복구이미지 | 편지readableDOM과면projection일치, longbodyscroll/reverse/모션축소 |

새3D 캐릭터나 방GLB, 생성동영상은 필요하지 않다. 주 표면·편지는 이번 범위에서 절차적 geometry로 제작할 수 있다. 편지 종이/왁스의 photoreal macro texture가 꼭 필요해지면 새asset요구를 명시하고 승인을 받으며, 임의의 불명확한 외부 모델로 채우지 않는다. 현재 승인 원본에서 존재하지 않는 모델/normal/HDR을 이미 있다고 주장하지 않는다.

## 안전 구획·반응형·접근성

히어로의 얼굴·전화기·손은 실제 원본 알파 실루엣으로 보호한다. 전경 경로는 좌/우 외곽과 하단 구획에 두며 글자 Range/버튼 경계+12–20px를 안전 구획으로 사용한다. 빈배경을큰사각마스크로잘라큰면이갑자기사라지는표현은금지. 안전구획과충돌하면world경로/깊이/조각방향을수정한다. 실제geometry를작게줄여회피하지않는다.

모바일은 얇은효과로대체하지않는다. 주요면이화면좌우에서큰규모로지나며가장자리비율이유지되게배치하고, 관성동작은tap/짧은drag로체험한다. 세로scroll을가로drag가막지않도록touch-action/pointercancel을검수한다. 원본인물각도한계는유지한다. KO/ES문장길이는양쪽독립검수하고lang전환은effect재입장초기화없이layoutcache만갱신한다.

reduced-motion은 정적인 깊이/재질구성+짧은opacity로읽기/버튼/편지를바로사용가능하게한다. 일반모션의목표수치와별도예외다. 사용자가pause를누르면idle/pointer/진입loop정지하되게임/편지는사용가능. WebGL실패fallback은정직한2D복구이며3D시각기준통과로기록하지않는다. 현행darkstartup유지, 새spinner/loadinggate추가안함.

## 검수 순서 — 영상 전에 명세를 확인

1. **출처 대조:** L1–L6/P1–P3/C1–C2 각각의 관찰/프롬프트내용/새해석/미채택이표에있음. 원본자료미확인표시를숨기지않음. 부모명세검토먼저전달.
2. **코드·자산 적합성:** 표각항목에실제파일/mesh수/vertex두께/재질/light/depth/기간/trigger/scrollmapping/safezone를기입. 사용하지않은Motionhook/GLB를사용했다고쓰지않음. 모든약속을파일과값으로대조. 미구현항목하나면기록중지하고구현계속.
3. **기능 QA:** KO/ES·4viewport·8게임진입·편지본문/서명/focus/Escape·pause/reduced/contextloss·빠른반전·tabhidden/routecleanup·기존게임diff보존. 필요한테스트/build. 기능합격열은시각열과별도.
4. **시각 QA:** 실제초기/입장/포인터drag-release/scroll0→180→360→540→720→0/편지open→중간reverse→open연속frame검사. below표전부PASS필요. 정지그림만으로운동합격금지. swiftshader와물리GPU판정구분.
5. **비교 녹화:** source/code/asset적합성확인뒤exactab81와newrevision, 동일viewport·DPR·포인터·scroll/action·벽시계·cold/warm조건. 최소30sdesktop+mobile24s, entrance/pointer/scroll/letter모두포함. 실제시간간격유지, 프레임보간/가속/멈춘간격삭제안함. 입력과capturedcadence기록, FPS는별도측정. 실제영상시각판정과각불합격수정필요.
6. **완료 판정:** below전항목충족·명세누락0·사용자시각승인. 게임테스트492개혹은새영상하나로전체완료선언금지. 한항목미달이면명확히미완료.

## 관찰 가능한 합격 / 불합격

| 항목 | 합격하는 실제 장면 | 불합격 예시 |
|---|---|---|
| 첫화면위계·강도 | 커플먼저읽히며250–460px실제조각의재질/깊이가공간을규정. 주장면은하위영역보다강렬 | 옛방구도큰PNG+±2–10px시차, 작은하트3개/미세별이주연출 |
| 입장/세계열림 | camera와큰전경면이확연히다르게움직이고뒤공간드러남. 시작부터nav/CTA사용가능 | backdrop1.02scale+전체fade, 얼굴뒤늦게출현, loading영상으로사용대기 |
| 독립깊이·가림 | 측면곡률/두께보임, 금속specular이움직임, 무광은다르게반응, 뒤면이실루엣뒤로가렸다나옴 | 물체모두한PNG/동일transform, 그려진하이라이트고정, 임의사각잘림 |
| 실제포인터/물리 | 하나의물체가선택되어140–240px이동/35–55°회전, 관성/복귀로손에서놓는느낌, 다른깊이는독립 | 전체background따라오기만함, 12pxfloatloop, 모든물체한꺼번에wobble |
| 첫스크롤대전환 | camera통과/투영크기/가림이연속변하며같은넓은표면이게임공간으로이어짐. 역scroll같은경로 | 사진작아지고opacity0→다른sectionfade, 흰패널teleport, 얇은wire연결 |
| 편지표면연속성 | 같은종이면이곡률/접힘을연속해제하고wax/flap뒤관계가바뀐후모든본문읽힘 | CSS삼각형1개+본문fade, 그냥modalpop, png늘리기만함 |
| 얼굴·개인성 | 원본얼굴/전화기/손보존, 실제개인말투·KO/ES/장미/게임선물관계읽힘 | 화려함을위해얼굴가림/새3D얼굴생성, genericstudio상업문구 |
| 모바일 | 같은깊이·측광·큰면통과역할이정돈된세로구성에서도보임, touch/scroll공존 | 모든3D제거하고큰배경PNG로대체하여mobilePASS표기 |
| 안정성/모션선택 | pause/reduced/fallback읽기경로명확, startupdark, 빠른반전시끊김/위치teleport없음 | 기능테스트만PASS이고실제영상멈춤/flash/끊김은무시 |

## 현재 상태와 다음 단계

- 보존 브랜치 생성, 목표/완료 규칙 고정, 출처 본문 재대조, 이전 실제 렌더 네 장 확인 완료.
- **부모에게 이 명세를 먼저 전달하는 단계**. 아직 새scene/productcode/asset/녹화없음. 명세검토없이영상부터만드는작업금지.
- 다음은 명세 대조에 대한 부모 연구자의 피드백을 반영한 뒤 geometry/material/camera/input/letter 순으로 구현한다. 효과 축소·옛 구성 복귀는 해결 방법이 아니다.
- 개인원본2.5D는명확한한계다. 완전3D커플/새얼굴은이번합의가없으므로제작하지않고, 주변세계/독립물체/표면전환의실제3D기준을완수한다.

미검수: 원본Lusion녹화의이번직접재생, 새3D구현/실제영상/물리GPU·실기기. 이명세는완성결과가아니며전합격조건충족전까지미완료다.
