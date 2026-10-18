# 원문 요구사항 대조표

2026-10-18 · 원문 0–13절과 추가 작업 맥락을 대응한다. **계획 대응표이며 구현 완료표가 아니다.** 검증 열은 후속 수행 계획이고 이번 확인은 제2·7·17절을 따른다. 승인 주체는 사용자이며 ChatGPT는 총괄 검수·권고를 맡는다.

| ID | 요구사항 | 계획 절 | 구체 대응 | 근거/상태 | 검증 방법 | 승인 시점 |
|---|---|---|---|---|---|---|
| P-01 | 범위 임의 축소 금지 | 1·12·14 | 전 장면·8게임·12최종 산출물 유지 | 사용자 원문·이번 사용자 원문 | 추적표/실제 산출물 누락 검사 | G0→각 Gate |
| P-02 | 효과 강도 임의 하향 금지 | 1·12·14 | 동등 시각 대안 실제 비교 후 승인 | 사용자 원문·이번 사용자 원문 | 사용자 전후 영상 심사 | G0→각 Gate |
| P-03 | 복잡성 때문에 기능 삭제·대체 금지 | 1·12·14 | geometry/자산 재설계 후 재검수 | 사용자 원문·이번 사용자 원문 | gate 실패·대안 기록 | G0→각 Gate |
| P-04 | fade/slide/작은 parallax를 Lusion 전환이라 부르지 않기 | 1·12·14 | 같은 topology 판→벽, camera 실제 입구 통과 | 사용자 원문·이번 사용자 원문 | H3–H6 raw clip | G0→각 Gate |
| P-05 | 실제 화면 없이 완료 선언 금지 | 1·12·14 | 기존 앱 캡처와 새 구현 증거 구분 | 사용자 원문·이번 사용자 원문 | capture/QA manifest | G0→각 Gate |
| P-06 | 전체 페이지 한 번에 구현 금지 | 1·12·14 | Hero만 G1, 이후 순차 | 사용자 원문·이번 사용자 원문 | diff 경계·사용자 지시 | G0→각 Gate |
| P-07 | 갤러리·기존 기능 임의 삭제/초기화 금지 | 1·12·14 | 보호 경계·게임 handoff | 사용자 원문·이번 사용자 원문 | hash/route/선택 회귀 | G0→각 Gate |
| P-08 | 불만족 디자인 회귀 금지 | 1·12·14 | 고리/파이프 재발을 명시 불합격 | 사용자 원문·이번 사용자 원문 | before/after visual QA | G0→각 Gate |
| P-09 | 미사용 skill/tool 적용 보고 금지 | 1·12·14 | 조사·설치·실행·제작 단계를 분리 | 사용자 원문·이번 사용자 원문 | import/source/실행 log | G0→각 Gate |
| P-10 | 어려운 요구 설명 없는 제외 금지 | 1·12·14 | 위험/불가/대안/승인 시점 기재 | 사용자 원문·이번 사용자 원문 | 미해결 목록 심사 | G0→각 Gate |
| P-11 | 최적화는 품질/콘텐츠/검증 범위 유지 | 1·12·14 | 동일 외형 비용 감축 우선 | 사용자 원문·이번 사용자 원문 | 성능+visual 동시 비교 | G0→각 Gate |
| P-12 | 품질 낮은 대안 승인 필요 | 1·12·14 | 변형 topology·shader 재설계 먼저 | 사용자 원문·이번 사용자 원문 | 사용자 저하 대안 명시 승인 | G0→각 Gate |
| P-13 | 지금 계획 전용·코드/삭제/manifest변경/푸시/배포 금지 | 1·12·14 | 제품 clean·외부문서/기존앱캡처만·이번 설치 없음 | 사용자 원문·이번 사용자 원문 | git status 전후 | G0→각 Gate |
| P-14 | 실제 Plan Mode 도구 있으면 사용, 없으면 주장 금지 | 1·12·14 | 전환 기능 없음 명시 | 사용자 원문·이번 사용자 원문 | tool inventory | G0→각 Gate |
| P-15 | 아트·기술 주역할 메인 책임 | 1·12·14 | 메인 design/renderer 책임, Luna 단순 조사 | 사용자 원문·이번 사용자 원문 | 분담/검증 기록 | G0→각 Gate |
| I-01 | 개인적인 연인 선물, 게임 플랫폼 이상 작품 | 4·6·9 | 커플 중심 펼쳐지는 극장 | 사용자 실제 이야기·home.ts | 서사/구도 심사 | G1·G2·G4 |
| I-02 | 프로포즈급 완성도, 실제 청혼/결혼 암시 금지 | 4·6·9 | 반지/제단·결혼 카피 배제 | 사용자 실제 이야기·home.ts | 카피·오브젝트 전수 검토 | G1·G2·G4 |
| I-03 | 연애 시작일 2025-04-04 | 4·6·9 | 실제 날짜만 intro/story seed | 사용자 실제 이야기·home.ts | 문자열 대조 | G1·G2·G4 |
| I-04 | 한국과 도미니카 거리 | 4·6·9 | 두 공간의 시각화, 미확인 km/도시 창작 금지 | 사용자 실제 이야기·home.ts | 사실 검수 | G1·G2·G4 |
| I-05 | 언어 장벽 불편 | 4·6·9 | 두 언어 면이 같은 뜻으로 맞물림 | 사용자 실제 이야기·home.ts | S02 DOM/영상 | G1·G2·G4 |
| I-06 | 함께 게임하기 어려웠던 경험 | 4·6·9 | 게임 접근 동기 story 단락 | 사용자 실제 이야기·home.ts | 사실 대조 | G1·G2·G4 |
| I-07 | 도미니카에서 한국 리듬게임 접속 못한 경험 | 4·6·9 | 사용자 제공 사실로만 표현 | 사용자 실제 이야기·home.ts | 거짓 오류로그/영상 없음 | G1·G2·G4 |
| I-08 | 함께 놀려고 직접 제작한 동기 | 4·6·9 | 이야기→선택 공간 연결 | 사용자 실제 이야기·home.ts | S02/S03 raw | G1·G2·G4 |
| I-09 | KO·도미니카 ES 지원 | 4·6·9 | ko/es 저장, lang es-DO | 사용자 실제 이야기·home.ts | V03–V06 | G1·G2·G4 |
| I-10 | 캐치마인드 양언어 정답 인정 | 4·6·9 | answers/isCorrectGuess 보존·시각화 | 사용자 실제 이야기·home.ts | KO/ES 실제 정답 입력 | G1·G2·G4 |
| I-11 | 미발생 사건·미확인 기능 창작 금지 | 4·6·9 | 가짜 통화/여행/사진/공통번역 배제 | 사용자 실제 이야기·home.ts | 사실·API 대조 | G1·G2·G4 |
| I-12 | 사적 자연스러운 말투·Baby 주요 호칭 | 4·6·9 | 원문 메인카피, 기존 letter Mami는 보존 | 사용자 실제 이야기·home.ts | 한/스페인어 카피 심사 | G1·G2·G4 |
| I-13 | Baby, 이거 내가 만들었어! | 4·6·9 | 3줄 editorial 조합 | 사용자 실제 이야기·home.ts | 3viewport PNG | G1·G2·G4 |
| I-14 | 멀리 있어도 우리 둘이 같이 놀 수 있게 | 4·6·9 | DOM 본문 유지 | 사용자 실제 이야기·home.ts | 한/스페인어 읽기 | G1·G2·G4 |
| I-15 | CTA 같이 놀자 | 4·6·9 | Hero #games, 마지막 실제 /play | 사용자 실제 이야기·home.ts | V02/V04 | G1·G2·G4 |
| I-16 | 광고/인위감성/과장 brand 카피 금지 | 4·6·9 | 개인 gift/couple 동기 | 사용자 실제 이야기·home.ts | 카피 전수 검수 | G1·G2·G4 |
| R-01 | Lusion 핵심, 2023판과 현재 구분 | 5·10 | live/archival 구분, 원본 미재생 표시 | 공식 page 열람·타임코드는 사용자 제공 | 원본 확보 후 motion 비교 | G0 조사·G1 비교 |
| R-02 | 00:05–00:14 축/occlusion/반사/깊이 | 5·10 | 두 hinge축·edge·광원 | 공식 page 열람·타임코드는 사용자 제공 | H1/H2 | G0 조사·G1 비교 |
| R-03 | 00:22.6–00:23.7 휘고 커지는 영상판 | 5·10 | vertex/UV 면 변형 | 공식 page 열람·타임코드는 사용자 제공 | H4 | G0 조사·G1 비교 |
| R-04 | 00:59.5–01:01 테두리 넘어 내부 | 5·10 | z=-4 통과, 다음 방 실제 존재 | 공식 page 열람·타임코드는 사용자 제공 | camera trace/raw | G0 조사·G1 비교 |
| R-05 | 01:03.5–01:05 인물/타입 반대 깊이 | 5·10 | type +Z·인물 무대 잔류 | 공식 page 열람·타임코드는 사용자 제공 | H3 | G0 조사·G1 비교 |
| R-06 | 01:05–01:14 전후경 속도/원근/회전/반사 | 5·10 | 실제 3D depth layers | 공식 page 열람·타임코드는 사용자 제공 | H3/H4 | G0 조사·G1 비교 |
| R-07 | 01:34.5–01:37.5 공간 변형/회수 | 5·10 | 동일 seam Ending/역행 | 공식 page 열람·타임코드는 사용자 제공 | H6/S06 | G0 조사·G1 비교 |
| R-08 | 같은 물체·공간이 다음 구성으로 변함 | 5·10 | fold topology/identity 유지 | 공식 page 열람·타임코드는 사용자 제공 | 중간 프레임 연속성 | G0 조사·G1 비교 |
| R-09 | 가능하면 실제 WebGL/Mesh/Shader/Camera | 5·10 | 직접 Three+GSAP | 공식 page 열람·타임코드는 사용자 제공 | runtime/source 검증 | G0 조사·G1 비교 |
| R-10 | Landing Love·Codrops | 5·10 | pacing·실제 WebGL 예제 조사 | 공식 page 열람·타임코드는 사용자 제공 | 출처/reference board | G0 조사·G1 비교 |
| R-11 | Nicelydone·Refero·Lazyweb | 5·10 | UI/구도 보조 조사 목적 명시, 개별 미분석 | 공식 page 열람·타임코드는 사용자 제공 | 접근·자료 검증 | G0 조사·G1 비교 |
| R-12 | Paired·Life360 | 5·10 | 친밀 UX/거리 표현만, 기능 오인 금지 | 공식 page 열람·타임코드는 사용자 제공 | 카피/UX 대조 | G0 조사·G1 비교 |
| R-13 | WebsitePrompts.ai·InspoAI·Inspo MCP | 5·10 | discovery 후보, MCP 가용 미확인 | 공식 page 열람·타임코드는 사용자 제공 | 도구 실사용 기록 | G0 조사·G1 비교 |
| R-14 | Bruno Simon 완전 제외 | 5·10 | 모든 참조에서 제외 | 공식 page 열람·타임코드는 사용자 제공 | reference manifest | G0 조사·G1 비교 |
| R-15 | 직접 복제 금지·독창성 | 5·10 | 개인 원화/실제 동기 중심 독자 형상 | 공식 page 열람·타임코드는 사용자 제공 | 사용자 concept 심사 | G0 조사·G1 비교 |
| A-01 | 기존 우주/하트/장미/리본/색/레이아웃 불변 아님 | 3·4·5 | 새 fold stage, 소재는 선택 | 코드 직접 읽기·캐리커처 직접 열람 | 새 vs 이전 구도 | G1 |
| A-02 | Rose Gold+Burgundy Pink 적극 검토 | 3·4·5 | edge/key reflection/type/CTA highlight | 코드 직접 읽기·캐리커처 직접 열람 | palette/light pass | G1 |
| A-03 | 전체 분홍 통일 불필요·black/cool/warm 대비 | 3·4·5 | charcoal+cool rim+warm edge | 코드 직접 읽기·캐리커처 직접 열람 | 안정 PNG | G1 |
| A-04 | 압도 첫 화면·풍성 공간·명확 중심 | 3·4·5 | 인물 56–68% 목표·층/빛/내부 기능 | 코드 직접 읽기·캐리커처 직접 열람 | 시각 검수, 수치 보장 아님 | G1 |
| A-05 | 극적 조명·깊이/원근·독창 재질 | 3·4·5 | 원화 key 일치·두께·roughness 분리 | 코드 직접 읽기·캐리커처 직접 열람 | pointer/scroll raw | G1 |
| A-06 | 대담 editorial typography | 3·4·5 | 한/ES 독립 줄바꿈·큰 위계 | 코드 직접 읽기·캐리커처 직접 열람 | 3viewport/2언어 | G1 |
| A-07 | 연속 변화·화려함/사용성 균형 | 3·4·5 | geometry continuity+skip/CTA | 코드 직접 읽기·캐리커처 직접 열람 | forward/reverse/keyboard | G1 |
| A-08 | 장식 줄인 미니멀 목표 아님 | 3·4·5 | 콘텐츠/광원층/게임 고유조각 풍성 | 코드 직접 읽기·캐리커처 직접 열람 | 밀도·의미·성능 동시 심사 | G1 |
| A-09 | 기존 거대고리 | 3·4·5 | 닫힌 주형 대신 낮은 얇은 판 | 코드 직접 읽기·캐리커처 직접 열람 | 얼굴 중심·고리 재발 금지 | G1 |
| A-10 | 플라스틱 파이프 재질 | 3·4·5 | 넓은 금속 edge/무광 paper | 코드 직접 읽기·캐리커처 직접 열람 | 재질 근접/움직임 | G1 |
| A-11 | 캐리커처 분리·광원 불일치 | 3·4·5 | 원화광에 환경 맞춤·접지/light-wrap | 코드 직접 읽기·캐리커처 직접 열람 | 원본 얼굴 보존+시각 통합 | G1 |
| A-12 | 청록 단조로움 | 3·4·5 | 중성-black/rose/burgundy 조명 설계 | 코드 직접 읽기·캐리커처 직접 열람 | 색 교체만이면 불합격 | G1 |
| A-13 | 타입 충돌 | 3·4·5 | screen safe-zone/world projection | 코드 직접 읽기·캐리커처 직접 열람 | 각 p 얼굴·CTA 검사 | G1 |
| A-14 | 무의미 floating 도형 | 3·4·5 | 역할 있는 판/조명/게임만 | 코드 직접 읽기·캐리커처 직접 열람 | 오브젝트 전후 역할 | G1 |
| A-15 | 오랜 정체 화면 | 3·4·5 | 3.2s entry+4개 scroll 상태 | 코드 직접 읽기·캐리커처 직접 열람 | 전체 영상 pacing | G1 |
| A-16 | 표면 접근뿐 다음 공간 없음 | 3·4·5 | 실제 내부 z=-8 공간 | 코드 직접 읽기·캐리커처 직접 열람 | 통과 전후 raw | G1 |
| A-17 | 비슷한 화면으로 회귀 | 3·4·5 | 새 기능 공간+역행 때만 복귀 | 코드 직접 읽기·캐리커처 직접 열람 | S01→S02 비교 | G1 |
| A-18 | 아트/공간/물체/빛/타입/모션 전면 검토 | 3·4·5 | 3콘셉트와 원인별 해결 | 코드 직접 읽기·캐리커처 직접 열람 | 사용자 계획 심사 | G1 |
| A-19 | 승인 원화 중심·안정 구도 둘이 주인공 | 3·4·5 | 정면 제한·얼굴 warp 금지 | 코드 직접 읽기·캐리커처 직접 열람 | 안정 frame/원본 | G1 |
| A-20 | 강한 등장·빛/반사·pointer·camera·연속전환 | 3·4·5 | H0–H6 명시 | 코드 직접 읽기·캐리커처 직접 열람 | 9동작 녹화 | G1 |
| A-21 | 잠깐 가림 허용·큰 하트/무의미 구조 우선 금지 | 3·4·5 | occlusion 짧게·stable face clear | 코드 직접 읽기·캐리커처 직접 열람 | 전체/안정 frame | G1 |
| A-22 | 최소3 differentiated hero·특징/전환/추천 이유 | 3·4·5 | A극장/B지평/C인쇄실 | 코드 직접 읽기·캐리커처 직접 열람 | 비교표·추천 상대 근거 | G1 |
| S-01 | S00 선물 같은 짧은 first visit | 5·6·16 | Remotion 3.2s·skip/revisit | scene storyboard 설계 목표 | V01 | G1→G5 |
| S-02 | S01 최강 Hero·정적/동적 모두 완성 | 5·6·16 | H0–H6·DOM/portrait/world | scene storyboard 설계 목표 | visual+raw | G1→G5 |
| S-03 | S02 거리/언어/게임 어려움/동기, 긴글나열 금지 | 5·6·16 | 두면 합류·actual story 영상/DOM | scene storyboard 설계 목표 | G2 카피·scroll | G1→G5 |
| S-04 | S03 story→실제 gallery, 표면/카메라/공간 전환 | 5·6·16 | 동일 면→벽/선반, z crossing | scene storyboard 설계 목표 | S03 raw | G1→G5 |
| S-05 | S04 선호 3D 장점 기준, 더 좋은 재구성 가능 | 5·6·16 | 중심/주변 선택 보존·개선 비교 | scene storyboard 설계 목표 | before/after | G1→G5 |
| S-06 | S04 단순 grid 퇴보 금지 | 5·6·16 | 조각 깊이/선택/방 진입 | scene storyboard 설계 목표 | G3 visual | G1→G5 |
| S-07 | S04 게임별 고유 이미지/preview·색재사용 금지 | 5·6·16 | 8고유 screen/object/film | scene storyboard 설계 목표 | 8asset manifest | G1→G5 |
| S-08 | S04 기존 목록/route·원본 rhythm 보호 | 5·6·16 | 8id + public/rhythm hash | scene storyboard 설계 목표 | V04 | G1→G5 |
| S-09 | S05 선물/편지 발견·실제 개봉·3D/시네마틱 | 5·6·16 | flap/paper hinge/펼침 | scene storyboard 설계 목표 | V08 | G1→G5 |
| S-10 | S05 문장 자연등장·커플 감정 detail | 5·6·16 | 기존5문단/첫무대 seam 회수 | scene storyboard 설계 목표 | text/frame 심사 | G1→G5 |
| S-11 | S05 의미/말투 존중·과장금지·읽는DOM | 5·6·16 | literal preservation/selectable | scene storyboard 설계 목표 | diff0·읽기 | G1→G5 |
| S-12 | S05 못 준 장미 마음 선택, 장미 의무 아님 | 5·6·16 | 확인된 원문 범위만·봉투 대안 | scene storyboard 설계 목표 | 사실 심사 | G1→G5 |
| S-13 | S06 첫 요소 회수·마지막 실제 게임 CTA | 5·6·16 | fold edge 변주→선택 /play | scene storyboard 설계 목표 | Ending raw/route | G1→G5 |
| S-14 | 장면 추가/재구성 가능, 필수 콘텐츠 삭제 금지 | 5·6·16 | S00–S06 전부 포함 | scene storyboard 설계 목표 | 추적표/전체 영상 | G1→G5 |
| S-15 | 각 장면 전후/변형/카메라/p/포인터/역행/영상/DOM | 5·6·16 | 제5 H0–H6·제6 S00–S06 계약 | scene storyboard 설계 목표 | 설계항목 완결 검사 | G1→G5 |
| T-01 | GPT Taste 가능하면 적용·minimal로 축소금지 | 7·16 | local gpt-taste/upstream v2 구분·충돌 규칙 배제 | package/source·공식 repo/문서·도구 목록 | 실사용 version/목적 기록 | G0 조사→해당 Gate 실행 |
| T-02 | Emil animate | 7·16 | 감쇠/중단/반전 계획 | package/source·공식 repo/문서·도구 목록 | 실제 motion review | G0 조사→해당 Gate 실행 |
| T-03 | Emil review-animations | 7·16 | raw 영상 critique | package/source·공식 repo/문서·도구 목록 | 수정 전후 | G0 조사→해당 Gate 실행 |
| T-04 | Emil animation-performance | 7·16 | frame 원인 추적 | package/source·공식 repo/문서·도구 목록 | trace/real device | G0 조사→해당 Gate 실행 |
| T-05 | Emil emil-design-eng | 7·16 | upstream 정확명 확인·로컬 동일명 미확인 | package/source·공식 repo/문서·도구 목록 | 설치/사용 분리 | G0 조사→해당 Gate 실행 |
| T-06 | Emil prototype | 7·16 | 필요시 G1 재시안 비교·현재 구현금지 | package/source·공식 repo/문서·도구 목록 | variant 실제 비교 | G0 조사→해당 Gate 실행 |
| T-07 | GSAP ScrollTrigger pin/scrub/camera/type/object | 7·16 | master pose·단일 timeline owner | package/source·공식 repo/문서·도구 목록 | p/camera trace | G0 조사→해당 Gate 실행 |
| T-08 | Three/R3F 공간/빛/shader/morph/surface/pointer | 7·16 | 기존 직접 Three 유지·R3F 추가불필요 | package/source·공식 repo/문서·도구 목록 | WebGL geometry 실제 | G0 조사→해당 Gate 실행 |
| T-09 | Remotion intro/story/필요시 letter | 7·16 | GiftIntroV2/AcrossOurStory | package/source·공식 repo/문서·도구 목록 | source/export/runtime 연결 | G0 조사→해당 Gate 실행 |
| T-10 | HyperFrames type/game preview/video surface/highlight | 7·16 | SharedWordsFilm·8preview·surface | package/source·공식 repo/문서·도구 목록 | source/export·실사용 | G0 조사→해당 Gate 실행 |
| T-11 | Remotion와 HyperFrames 둘다 실제활용·중복제작금지 | 7·16 | 서사 vs type/preview 역할 분리 | package/source·공식 repo/문서·도구 목록 | 두 제작물 manifest | G0 조사→해당 Gate 실행 |
| T-12 | 영상엔진과 실시간3D 역할 구분 | 7·16 | video는 mesh 내부 재질·camera live | package/source·공식 repo/문서·도구 목록 | raw pointer/scroll | G0 조사→해당 Gate 실행 |
| T-13 | Codrops/ReactBits/MagicUI/Motion/Anime/OpenMotion/GSAPSkills | 7·16 | 정확 필요성 생길때만 분석·설치 금지 | package/source·공식 repo/문서·도구 목록 | 도입 이유/중복 여부 | G0 조사→해당 Gate 실행 |
| T-14 | InspoMCP/AwesomeGameDevSkill 검토 | 7·16 | MCP 미가용·프로젝트 collection 흔적, game 수정없음 | package/source·공식 repo/문서·도구 목록 | tool/skill 실제 경로 | G0 조사→해당 Gate 실행 |
| T-15 | 관련없는 library 무조건 설치 금지·공개코드 적극분석 | 7·16 | 기존 stack 우선·license/source 기록 | package/source·공식 repo/문서·도구 목록 | dependency diff | G0 조사→해당 Gate 실행 |
| T-16 | 도구 source/현재가능/담당/예산/대안 명시 | 7·16 | 제7 도구 matrix | package/source·공식 repo/문서·도구 목록 | plan review | G0 조사→해당 Gate 실행 |
| F-01 | 모든 게임·진입 경로 | 15 | 8 id/play/room 유지 | 실제 routes/catalog/core/copy·사용자 handoff | V04/V05 | G1 보호·G3 통합·G6 회귀 |
| F-02 | KO/도미니카ES·게임 연결 | 15 | dos-language/player language 유지 | 실제 routes/catalog/core/copy·사용자 handoff | V03–V06 | G1 보호·G3 통합·G6 회귀 |
| F-03 | 캐치마인드 양언어 정답 | 15 | 코어 변경금지·실제 input | 실제 routes/catalog/core/copy·사용자 handoff | V06 | G1 보호·G3 통합·G6 회귀 |
| F-04 | 기존 편지 원문 | 15 | 한/ES 5문단 literal 유지 | 실제 routes/catalog/core/copy·사용자 handoff | V08·hash/diff | G1 보호·G3 통합·G6 회귀 |
| F-05 | 건의사항 페이지·문구·top 직접이동 | 15 | /feedback nav/데이터 보존 | 실제 routes/catalog/core/copy·사용자 handoff | V09 | G1 보호·G3 통합·G6 회귀 |
| F-06 | 기존 게임 데이터/API/흐름 | 15 | 게임 담당 baseline에서 landing hunks만 | 실제 routes/catalog/core/copy·사용자 handoff | protected hash/온라인 조건부 | G1 보호·G3 통합·G6 회귀 |
| F-07 | 공통 자동번역 있다고 소개금지 | 15 | catchmind 범위+한도/원문 fallback만 | 실제 routes/catalog/core/copy·사용자 handoff | 실제 API/카피 대조 | G1 보호·G3 통합·G6 회귀 |
| F-08 | 게임 개발과 랜딩 scope 구분 | 15 | engine/rules/schema/rhythm 금지경계 | 실제 routes/catalog/core/copy·사용자 handoff | diff allowlist | G1 보호·G3 통합·G6 회귀 |
| F-09 | 게임/랜딩 분리·77차이 현재 검증 | 15 | 1545 전체/107src/122public 재확인 | 실제 routes/catalog/core/copy·사용자 handoff | Git 진단 | G1 보호·G3 통합·G6 회귀 |
| F-10 | 미푸시3972aa/ec08555·진행중 조커 작업 보호 | 15 | 타작업 접근/편집/중단 금지·handoff 의존 | 실제 routes/catalog/core/copy·사용자 handoff | 최종 bundle/SHA 전 통합금지 | G1 보호·G3 통합·G6 회귀 |
| F-11 | PC오프라인·별도클라우드·GPU추측금지 | 15 | SwiftShader 실제 blank diagnostic만 | 실제 routes/catalog/core/copy·사용자 handoff | GPU json/실측 구분 | G1 보호·G3 통합·G6 회귀 |
| G-01 | Gate0 15개 결과 A–F 전체 설계 | 12·13·15 | 구조/실패/갤러리/3안/추천/story/tools/protection/assets/mobile/roadmap/QA | 원문 게이트·최신 위임 승인 | 제1–16·추적표 | 각 Gate 사용자 통과 지시 |
| G-02 | Gate1 오직 Hero+직접연결 진입/공간 | 12·13·15 | story 본편/gallery/letter 새구현 금지 | 원문 게이트·최신 위임 승인 | 변경 파일 경계 | 각 Gate 사용자 통과 지시 |
| G-03 | Gate1 실제작동·이미지 시안만 금지 | 12·13·15 | 3D/재질/light/entry/pointer/camera/morph/video/CTA | 원문 게이트·최신 위임 승인 | 실제 browser source/raw | 각 Gate 사용자 통과 지시 |
| G-04 | Hero 검수9동작 첫진입/entry/안정/pointer/forward/morph/camera/reverse/복귀 | 12·13·15 | V02 녹화 순서 | 원문 게이트·최신 위임 승인 | 1920 raw+PNG | 각 Gate 사용자 통과 지시 |
| G-05 | 1920 우선 실제파일·주요화면 ChatGPT 검수용 | 12·13·15 | manifest/원본 clips/PNG | 원문 게이트·최신 위임 승인 | 사용자 파일 열람 | 각 Gate 사용자 통과 지시 |
| G-06 | Remotion/홍보영상으로 runtime증거 대체금지 | 12·13·15 | 분리 폴더/파일명 | 원문 게이트·최신 위임 승인 | 증거 provenance | 각 Gate 사용자 통과 지시 |
| G-07 | 10미적 기준·불합격 완료처리금지 | 12·13·15 | 제13.3 전항목 사용자 심사 | 원문 게이트·최신 위임 승인 | 실제 전체영상/안정frame | 각 Gate 사용자 통과 지시 |
| G-08 | 실패 시 구도/공간/자산/다른안/새프로토타입 | 12·13·15 | 문제 규모 따라 재설계 | 원문 게이트·최신 위임 승인 | 재제출·횟수제한 없음 | 각 Gate 사용자 통과 지시 |
| G-09 | 기존시안 고집/목표하향/효과제거금지 | 12·13·15 | A 실패하면 교체 가능 | 원문 게이트·최신 위임 승인 | 사용자 before/after | 각 Gate 사용자 통과 지시 |
| G-10 | 기존보다 좋아진 근거 실제 비교 | 12·13·15 | 24a Hero/caa preview 동일 viewport/path | 원문 게이트·최신 위임 승인 | 제16.3 7축 | 각 Gate 사용자 통과 지시 |
| G-11 | Hero 승인전 G2 금지·internal build 자체평가 승인아님 | 12·13·15 | 사용자 명시 통과 지시 필요 | 원문 게이트·최신 위임 승인 | SHA/통과기록 | 각 Gate 사용자 통과 지시 |
| G-12 | 다른단계 사전은 계획/자산조사만 | 12·13·15 | Gate0은 문서·읽기만 | 원문 게이트·최신 위임 승인 | git clean | 각 Gate 사용자 통과 지시 |
| G-13 | Gate2 actual story/Remotion/HyperFrames/interactive/연결 | 12·13·15 | S02 별도 구현 | 원문 게이트·최신 위임 승인 | G2 실제영상/scroll 검수 | 각 Gate 사용자 통과 지시 |
| G-14 | Gate3 고유visual/3D/preview/route/lang/앞뒤 | 12·13·15 | S03/S04 별도 구현 | 원문 게이트·최신 위임 승인 | G3 선호기준 비교/사용자통과 | 각 Gate 사용자 통과 지시 |
| G-15 | Gate4 개봉/영상+live/type/원문/실제감정 | 12·13·15 | S05 별도 구현 | 원문 게이트·최신 위임 승인 | click/open/return | 각 Gate 사용자 통과 지시 |
| G-16 | Gate5 opening→Hero→story→portal→gallery→letter→end 통합 | 12·13·15 | 공통world/물성/scene state | 원문 게이트·최신 위임 승인 | desktop 전체raw | 각 Gate 사용자 통과 지시 |
| G-17 | Gate6 desktop 먼저·mobile 핵심 동일·정적제거금지 | 12·13·15 | touch/crop/DPR·3D/개봉 유지 | 원문 게이트·최신 위임 승인 | 390raw+실기기 | 각 Gate 사용자 통과 지시 |
| G-18 | Codex 구현·ChatGPT 품질검수·사용자 목표 | 12·13·15 | 메인 제출/사용자심사·사용자 최신위임 적용 | 원문 게이트·최신 위임 승인 | 각Gate 별도판정 | 각 Gate 사용자 통과 지시 |
| G-19 | 사용자 불만이면 완료아님·피드백 반영 | 12·13·15 | 자체완료 금지·사용자 재검수 | 원문 게이트·최신 위임 승인 | 잔여문제/수정자료 | 각 Gate 사용자 통과 지시 |
| V-01 | 필수1920×1080·1440×900·390×844 | 11·13 | 각 별도 raw/PNG | 기존 기록/이번 환경진단/설계 목표 분리 | viewport/DPR manifest | G1→G6 |
| V-02 | 로딩/Hero/3D/camera/light/중간frame/reverse | 11·13 | V01/V02 PNG+raw | 기존 기록/이번 환경진단/설계 목표 분리 | 동작전체 확인 | G1→G6 |
| V-03 | 영상재생/gallery/letter/buttons/nav | 11·13 | V01/V07/V08 | 기존 기록/이번 환경진단/설계 목표 분리 | 영상·기능실행 | G1→G6 |
| V-04 | KO/ES/feedback/mobile/console/performance | 11·13 | V03/V09–V12 | 기존 기록/이번 환경진단/설계 목표 분리 | 실패·미검증 공개 | G1→G6 |
| V-05 | screenshot/test pass만으로 디자인완료금지 | 11·13 | 별도 눈으로 QA·사용자 심사 | 기존 기록/이번 환경진단/설계 목표 분리 | 제13.3 | G1→G6 |
| V-06 | 기존418ms 경고·software≠GPU | 11·13 | 과거 문서값·이번 diagnostic 분리 | 기존 기록/이번 환경진단/설계 목표 분리 | 환경·기록 출처 | G1→G6 |
| V-07 | 가능하면GPU 실측·FPS/frame/stutter | 11·13 | 60fps 우선 목표·p95·jank 보고 | 기존 기록/이번 환경진단/설계 목표 분리 | 동일GPU recording on/off | G1→G6 |
| V-08 | WebGL자원/decode/texture/mobile부담 | 11·13 | renderer.info/video trace/메모리예산 | 기존 기록/이번 환경진단/설계 목표 분리 | V12 | G1→G6 |
| V-09 | 60FPS 목표·난도/기기 고려 실측 공개 | 11·13 | 목표/실측 명확표기 | 기존 기록/이번 환경진단/설계 목표 분리 | 거짓달성 주장 금지 | G1→G6 |
| V-10 | shader/LOD/compression/instancing/DPR/prerender 검토 | 11·13 | 동일 외형비용 최적화순서 | 기존 기록/이번 환경진단/설계 목표 분리 | 성능+시각 비교 | G1→G6 |
| V-11 | 최종desktop전체/Hero/transition/gallery/letter/mobile 영상 | 11·13 | 6종 실제raw/clips | 기존 기록/이번 환경진단/설계 목표 분리 | 최종manifest | G1→G6 |
| V-12 | Remotion/HyperFrames 제작영상 | 11·13 | source/export 구분 | 기존 기록/이번 환경진단/설계 목표 분리 | 실제소스·export | G1→G6 |
| V-13 | 사용스킬도구/변경파일/성능/기능/자산잔여12항목 | 11·13 | 제15 전부 | 기존 기록/이번 환경진단/설계 목표 분리 | parent completeness | G1→G6 |
| V-14 | 실제 vs highlight 구분·미구현편집 완료금지 | 11·13 | 원본·편집 provenance | 기존 기록/이번 환경진단/설계 목표 분리 | runtime 재현 | G1→G6 |
| C-01 | 현재 원격 먼저 확인 | 2 | ls-remote 재조회: main b37c10b/landing24a6ec6/games438f50d | 원격 heads·조회시점 | 착수 직전 재확인 | 명시 사용자 승인 |
| C-02 | 선호 갤러리 caa6d31 기준 | 2·6 | 현재 gallery StudioScene과 import 1줄 차이 | 선행 객체 diff 기록·이번 보존 캡처 관찰 | G3 같은 조건 비교 | 명시 사용자 승인 |
| C-03 | 이전 77개 차이 재검증 | 2 | 선행 집계 전체1545, src/public229; 현재 재집계 미실행, 충돌 수와 구분 | 선행 diff 기록; alternate 유실로 현재 재검증 대기 | 통합 hunk별 검토 | 명시 사용자 승인 |
| C-04 | 미푸시3972aa4/ec08555 안전 보호 | 8·16 | remote 없음; 담당 인계까지 임의 merge/수정 금지 | 사용자 전달 사실 | T1 verify/fsck/hash | 명시 사용자 승인 |
| C-05 | 독립 조커 원화 교체 작업 편집·중단 금지 | 1·8·16 | 파일·프로세스 소유권 분리 | 이번 작업은 계획·읽기 전용 | T0/T2 보호 | 명시 사용자 승인 |
| C-06 | 게임과 랜딩 분리·안전 연결 전략만 | 8·16 | 게임 G 기준 통합 branch에 landing 한정 변경 | 새 game 구현 없음 | G3 전 회귀 | 명시 사용자 승인 |
| C-07 | 오프라인 PC와 클라우드 구분·GPU 추측 금지 | 2·11 | 선행 Chromium SwiftShader 기록, 실제 GPU 미검증 | existing-browser.json | 가속 환경 실측 전 미합격 | 명시 사용자 승인 |
| C-08 | 허용 범위는 읽기·기존 실행/캡처·공식 조사 | 1·2·7 | 이번 설치/코드/패키지/커밋/푸시/배포 없음 | 원본 clean·후속 기존 dirty 보존·외부 진단 | 최종 재확인 | 명시 사용자 승인 |
| C-09 | 접근 못한 영상 봤다고 주장 금지 | 2·10·17 | 2023 지정구간 사용자 관찰 기반·직접시청 미완료 | 페이지 열람/동영상 재생 구분 | 실제 원본 접근 뒤 분석 | 명시 사용자 승인 |
| C-10 | 프로젝트 밖 한국어 전체문서+짧은 요약·Library | 1·17 | 읽기 쉬운 PDF에 본문/전체 대조표, 요약 먼저 | 최종 파일·납품 결과 | G0 | 명시 사용자 승인 |
| C-11 | 메인6.1 sol medium·Luna 단순 조사 | 1·7 | 모델변경 주장 없음·메인 아트/기술 책임 | 스킬 이름독립 조사만 | G0 | 명시 사용자 승인 |
| C-12 | 설치 계획과 실제 사용 분리 | 7·17 | 존재/열람/설치/새제작/웹검증 별도 | 도구명·파일·실행증거 체인 | 각 Gate | 명시 사용자 승인 |
| C-13 | 원문대조·3콘셉트·추천·상세storyboard·위험/자산/게이트 | 3–17 | 전체문서 각 표로 대응 | 이 대조표 및15산출물 표 | G0 | 명시 사용자 승인 |
| C-14 | 계획 승인 전 구현 금지·승인 대기로 종료 | 1·12·17 | 사용자 명시 승인만 유효, 이전 위임 문구 배제 | 문서 승인 상태 | G0 이후 Gate별 | 명시 사용자 승인 |

총 157개 검토 ID. 개수는 품질·무누락 보증이 아니며 원문 역대조와 사용자 검수를 계속한다. 사용자 계획 명시 승인 대기.
