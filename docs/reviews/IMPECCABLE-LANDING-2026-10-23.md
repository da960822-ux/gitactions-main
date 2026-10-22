# 랜딩 개선·스킬 적용 기록 — 2026-10-23 KST

기존 브랜치 `redesign/folded-playhouse-depth-r8-20261018`, 시작 커밋 `2bebd90`. 승인된 우주 Hero/B 게임방·인물·8개 게임·원문 편지·실제 서명·장미 엔딩을 보존했다. 원본 main 병합이나 공개 배포는 하지 않는다.

## 진단과 범위

Impeccable 공식 v4.5.2 본문과 선택한 세부 지침을 읽고, 서로 결과를 보지 않은 시각 검수 A와 detector/브라우저 검수 B를 분리했다. A의 초기 평가는 21/32이며 완료 판정이 아니다. 기존 31/40 기록과는 평가 적용 항목이 달라 직접 비교하지 않는다. CLI 두 검사 `[]`와 실제 화면의 결함이 동시에 존재했다. 승인된 Baby 서체·헌정문은 일반적인 detector 경고로 제거하지 않았다.

루나는 설치된 전체 144개 SKILL.md(본문 142종)를 후보로 대조했다. Impeccable 내부 명령만 대상으로 삼지 않았다. 선정 스킬의 현재 본문·필수 참조자료를 읽고, 문제→주 스킬→보조 스킬→소유 파일→검증 기준을 매칭했다. 전체 설치 스킬을 이번 화면에 모두 실행했다는 뜻은 아니다.

상세 [전체 스킬 매칭 기록](assets/impeccable-landing/skill-matching.json).

## 실제 수정

| 문제/새 요구 | 적용한 지침 | 실제 변경 | 검수 |
|---|---|---|---|
| 초반 카메라가 한 사람만 크게 잘라 보여줌 | camera-systems, Impeccable layout/animate, GSAP ScrollTrigger | 급격한 FOV 33.8° 확대 제거, 초기 이동/시선 재조정. B 최종 좌표·원화는 유지 | 동일 315px 스크롤 전후 캡처. 전체 이동 구도 최종 승인으로 간주하지 않음 |
| B 이후 화면 약 60%가 빈 상태 | layout/animate | 들어오는 서사와 방의 유지 시간을 맞추고, 모바일의 관련 없는 테이블이 서사 중 나타나지 않게 함 | 방 도착·출구 실제 화면 |
| 대표 게임이 작고 실행 버튼이 화면 아래 | layout/adapt | 데스크톱 대표 크기 2.1→2.6, 뷰포트 비례 무대, 설명/실행 버튼 한 묶음 | 1440/1920에서 대표 약 330/395px, 버튼 노출, 8개 선택·경로 |
| 게임 조각이 선택 후에도 계속 흔들림 | Emil animate, Impeccable animate, 기존 Three 루프 | 480ms 퇴장 축소→이동→중앙 확대, 입력 중 방향 전환 시 현재 자세에서 재시작. 무한 부유 제거 | 정지 경계 3회 동일, 빠른 재선택·실제 포인터·키보드·움직임 감소 검사 |
| 승부 표정 전환 때 배경까지 겹침 | Emil crossfade/button 지침, animate/delight, Motion의 CSS 선택 지침 | 방 배경은 한 장으로 고정, 마스크 포즈만 격리 합성, 280ms 포즈 전환/160ms 버튼 피드백 | 마우스·터치 에뮬레이션·빠른 역전환·키보드·움직임 감소. 독립적인 인체 애니메이션은 아님 |
| 좁은 화면에서 거리·새 설명·시간·대결이 충돌 | adapt/layout | 좁은 화면의 명시적인 세로 흐름, 새 전용 영역, 시계/그림의 충분한 폭 | 390 실제 브라우저, 새 반응·내용·잘림 |
| 장미 이후 다시 읽기가 스크롤 밖 | adapt/harden, Ponytail | 실제 엔딩 높이를 ResizeObserver로 반영하고 정리. 접는 위치 유지 | 실제 그린 사인→접기→장미→일반 클릭으로 다시 읽기 성공 |
| 모바일 봉투 잘림/닫힌 종이 교차 | layout/adapt | 폭에 맞춘 위에서 보는 카메라, 닫힌 봉투 속 종이 숨김 | 봉투 전체 노출, 편지 1개 유지, 실제 서명/복귀 재검사 |
| 사용자 제공 첫 만남 이야기 | couple-games-landing-design, bolder/layout/animate, GSAP core/timeline/scrolltrigger, Motion React | 게임방과 거리 사이에 InterPals/첫날 12시간 장면 추가. 새 SVG 접힌 종이와 잉크 선. GSAP은 바깥 스크롤, Motion은 별도 안쪽 포인터 반응 소유 | 한국어/스페인어, 세 화면, 역방향·포인터 복귀. SVG 상속 테두리/모바일 띄어쓰기 피드백 반영 |

새 사실은 사용자의 직접 설명만 사용했다: InterPals에서 만남, 처음 조금 무례했던 행동, 그날 시차에도 12시간 끊임없이 연락한 일. 첫 대화 날짜를 4월 4일로 추정하거나 실제 채팅 문장을 만들지 않았다. 기존 편지 원문을 바꾸지 않았다.

## 전후 화면

| 항목 | 이전 | 이후 |
|---|---|---|
| Hero 같은 스크롤 위치 | [이전](assets/impeccable-landing/hero-before.png) | [이후](assets/impeccable-landing/hero-after.png) |
| 게임 갤러리 | [이전](assets/impeccable-landing/gallery-before.png) | [이후](assets/impeccable-landing/gallery-after.png) |
| 좁은 화면 거리 | [이전](assets/impeccable-landing/distance-before.png) | [이후](assets/impeccable-landing/distance-after.png) |
| 좁은 화면 봉투 | [이전](assets/impeccable-landing/envelope-before.png) | [이후](assets/impeccable-landing/envelope-after.png) |

새 첫 만남 장면은 기존 화면에 없었던 추가다. [현재 장면](assets/impeccable-landing/first-conversation.png).

## 사용하지 않은 것과 제한

- shape는 이미 확인된 목적/보존 범위를 다시 승인받는 절차로 반복하지 않았다. overdrive의 새 기술 방향 선택과 live의 실시간 변형 선택 워크숍도 실행했다고 주장하지 않는다. polish는 실제 화면 피드백을 같은 담당자에게 돌려 수정하고 재검수하는 방식으로 적용했다.
- Remotion/HyperFrames 영상, Motion+·MotionScore, 새 런타임 의존성, 새 인물 생성은 사용하지 않았다. 영상도 만들지 않았다. 새 종이 자산은 소스에 들어 있는 SVG다.
- 기존 지역·리듬게임 접속 문제·시작 날짜·두 언어는 이미 구현된 서사여서 신규 콘텐츠라고 계산하지 않았다. 새 게임 코스/플레이 기능 추가안은 사용자 의도와 달라 제외했다.
- Chromium headless, ANGLE SwiftShader, DPR1의 1920×1080·1440×900·390×844 결과다. 소프트웨어 렌더링이며 실제 GPU/스마트폰 성능이 아니다. 갤러리 480ms는 논리 동작 시간이고 병렬 소프트웨어 캡처의 첫 안정 표본은 663ms였다. 하드웨어 FPS 합격을 선언하지 않는다.
- API/멀티플레이의 외부 운영 상태, 실제 게임 내부 전수 플레이, 스크린리더·200% 확대·Safari는 이번에 검수하지 않았다. 기존 API·게임 엔진·리듬타파 파일은 변경하지 않았다.
- Hero의 다른 중간 위치에서 큰 벽/일부 인물 퇴장 구도, 갤러리 일부 주변 오브젝트 겹침은 남은 시각 검수 대상이다. 이 기록은 사이트 전체 완성 선언이 아니다.

검증 결과: 빌드 성공, Vitest 87개 파일/672개 테스트 통과, 별도 Node LetterCollection 테스트 1개 통과, 마지막 CLI detector `[]`, diff 공백 검사 통과. Vite의 기존 큰 청크 경고와 Motion의 use-client 번들 경고는 남아 있다.

새 첫 만남 장면은 독립 섹션의 첫 버전이다. 현재는 사실 요약과 종이 비주얼·포인터/스크롤 반응까지이며, 풍부한 서사 전개 전체가 완료됐다고 간주하지 않는다.

## 실행 기록

`context --target src/landing/Landing.tsx` 1회. 초기 CLI 표준/layout 검사와 마지막 표준 검사 완료. 브라우저 주입 검사의 모바일 overlay가 뷰포트 폭을 바꾸는 현상은 별도 기록하고, 오염된 측정값 대신 새 비주입 컨텍스트를 사용했다. 독립 A 완료 후에만 B 결과를 합쳤다. 사용자 목적·브랜치·보존 요구가 이미 명시돼 같은 승인 질문을 반복하지 않았다.

Critique slug `src-landing-landing-tsx`; ignore 파일 없음. 현재 스냅샷 `.impeccable/critique/2026-10-22T20-11-54Z__src-landing-landing-tsx.md`는 남은 Hero 검수 때문에 닫지 않았다. 임시 critique 본문은 삭제했다. B의 전용 overlay 서버는 종료했다. 로컬 검수 서버는 루트 소유 Vite preview 5174이며 종료 시 해당 실행 세션에 Ctrl-C를 보낸다. 사용자 확인 주소는 기존 본인 전용 Site를 유지한다.

## ThreeUI·Kexsio를 검토한 후 적용한 업그레이드

이번 작업의 시작점은 기존 Hero 브랜치의 `0579f6e41bc9572e111c3eeecb63e6b647bc2560`이다. 위의 종이 포스터·복도 관련 설명은 이전 체크포인트 기록이며, 아래 구현으로 교체했다. 새 제품 브랜치·런타임 의존성을 만들지 않았다.

### 실제 참고한 범위

ThreeUI와 Kexsio는 여러 구현을 모은 카탈로그다. 실제 브라우저에서 ThreeUI 3D Paper의 드래그/굽힘, Kage의 정·역 스크롤, Kexsio Hover Row의 선택 영역 확대를 확인했다. Kexsio Shutter는 자동 순환 예제여서 스크롤 전환 증거로 쓰지 않았다. 로딩에 머문 Service Cards도 사용했다고 계산하지 않았다.

ThreeUI Community 공개 소스는 커밋 `68802d5428071ada5c20db8094b1649e6bb770ed`로 고정했다. 두 패턴만 선별 적용했다. `glassToggleScene.ts:553–571`의 FOV/비율/카메라 거리 계산은 승인된 B 방의 물리 기하를 유지하는 데 적용했고, `character-filmstrip.html:401–434`의 초점/깊이 원리는 실제 갤러리 조각 경계에 맞춰 재배치했다. 전자는 기존 도착 공식과 대수적으로 동등하며, 그 자체가 새 시네마틱 연출을 만들어준다는 뜻은 아니다. [MIT 고지와 원본 파일 해시](../../THIRD_PARTY_NOTICES.md), [소스 검토 기록](assets/impeccable-landing/threeui-upgrade/source-audit.json).

Kexsio는 선택된 대상이 충분한 공간을 받고 다른 선택지도 계속 찾을 수 있어야 한다는 구성 원리를 참고했다. 코드·사진·브랜드를 복사하지 않았다. ThreeUI Pro/Beta, 외부 카탈로그 미디어, 폰트도 가져오지 않았다. 기존 React 19.1.1·Three 0.186.1·GSAP 3.15.0·Motion 14.5.0을 유지했다. ThreeUI의 예전 색공간 API를 그대로 넣거나 별도 렌더러/iframe을 추가하지 않았다.

### 병렬 구현과 실제 스킬 적용

| 담당 영역 | 실제 변경 | 읽고 적용한 지침과 역할 | 직접 검수 |
|---|---|---|---|
| Sol: Hero → B | 기존 긴 복도·벽·측면으로 넘어가는 사진판 제거. 승인 우주 원본을 인덱스 메시의 전체 화면 표면에 등록하고 내부가 깊이 방향으로 휘게 했다. 짧은 카메라 이동 뒤 B 전체를 함께 드러낸다. 가장자리는 프레임 밖에 고정하고 3% 여유 영역만 추가해 포인터 이동 시 경계가 드러나지 않게 했다. 원본 인물은 변형하지 않았다. | camera-systems, threejs-scene-setup/scene graph, Impeccable layout/animate. 기존 GSAP 스크롤/공유 카메라 소유는 유지. | 1440×900·1920×1080에서 진행률 .20/.28/.35/.50 실제 완료 프레임. B 원본 행렬·끝 구도·정역 전환·포인터 경계·자원 정리 테스트. **아래 P2는 남음.** |
| Sol: 첫 대화 | 한 장의 종이 요약을 InterPals → 서툰 첫인상 → 첫날 쉬지 않은 12시간의 세 장면으로 확장. 같은 연결선이 이어지고 꺾였다가 큰 `12시간 / 12 horas`와 함께 정리된다. 실제 DOM은 항상 읽을 수 있다. 첫 시안의 얇은 선/과한 빈 공간 피드백을 같은 담당자에게 돌려 50svh 텍스트 흐름과 480–540px 시각물로 재구성했다. | Taste, couple-games-landing-design, Impeccable bolder/layout/animate, GSAP React/core/timeline/ScrollTrigger. 네이티브 sticky와 단일 SVG 타임라인 사용. 새 Motion 포인터 기울기는 추가하지 않음. | 1440/1920 세 장면, 역방향·분수 단위 선 진행·언어·움직임 감소, 390 스페인어 제한적 잘림 확인. 가짜 채팅/날짜/시각/용서 장면을 만들지 않음. |
| Sol: 두 도시·시차 | 광주와 산토도밍고를 한 쌍의 새 도시 일러스트로 제작. 한 이미지의 좌우를 CSS로 사용한다. 시간 선택에 따라 낮/밤 톤이 반응한다. 기존 현재 시계·날짜·13시간 차이·전날 계산 유지. | Taste와 Impeccable layout/animate. Motion의 in-view/reduced-motion 판단, GSAP 240ms 색조 전환. 키보드·오프스크린·움직임 감소에서는 즉시 반영. | 실제 슬라이더·Home/End·전날/같은 날·양 언어. 도시 그림은 분위기 일러스트이며 실제 방문 기록/첫 대화 날의 모습이 아님. |
| Sol: 게임 갤러리 | 큰 대표 오브젝트와 기존 480ms 선택 교환을 유지. 주변 일곱 개를 양쪽 열린 호로 옮겨 대표 조각과 겹치지 않게 했다. Splendor·DaVinci 아트와 모든 기존 게임 자산/광원 유지. | threejs-scene-setup, game-ui-ux, ThreeUI 초점/깊이 원리와 Kexsio의 선택 공간 관찰. | 8개 대상 실제 메시 경계, 포인터 선택·hover·Home·빠른 선택 전환. 최소 대표/주변 간격 1440에서 35.47px, 1920에서 42.56px. [측정](assets/impeccable-landing/threeui-upgrade/gallery-checks.md). |
| Luna: 공통 메뉴/복원 | Hero의 처음 메뉴를 유지하고 Hero를 지나면 같은 노드를 64px 고정 메뉴로 전환. 준비 완료와 ScrollTrigger pin 설치 뒤 직접 링크를 복원. 기존 게임·편지·건의사항·언어 항목 유지. | Ponytail, Impeccable live/polish·복원/접근성 원칙, ScrollTrigger 초기화 순서. | 1440×900·1920×900 초기/고정/역복귀, `/#games`, `/#papi-letter`, KO/ES, feedback 이동. 추가 1440/1920×1080에서 시간·편지 메뉴의 실제 페인트와 elementFromPoint까지 확인. [검증](assets/impeccable-landing/threeui-upgrade/navigation-checks.json). |
| 독립 Sol 검수 + 루트 통합 | 구현 담당과 분리해 실제 중간 화면과 전체 사용자 흐름을 확인. 검사 실패만 전달하지 않고 원인과 개선된 프롬프트를 같은 담당자에게 돌려 재검수했다. | Impeccable critique/layout/polish의 독립 시각 판단, Taste, Ponytail. 이전 공식 critique 기록을 참고하되 새 전체 명령을 모두 실행했다고 주장하지 않음. | 양 데스크톱에서 8개 선택/경로, 시간 변경, 메뉴를 통한 편지 열기, 편지 1개, 직접 그린 서명→문서 서명→장미→일반 다시 읽기. |

설치된 144개 SKILL.md/142종 본문은 후보군이다. 전체를 기계적으로 실행하지 않았으며, 실제 선정/역할은 [기존 스킬 매칭](assets/impeccable-landing/skill-matching.json)에 이어 위에 구분했다. GSAP는 스크롤/조정된 타임라인, Motion은 기존 컴포넌트 입력과 가시성 판단에 사용했다. Remotion/HyperFrames 영상은 제작하지 않았고 실시간 3D의 증거로 쓰지 않았다.

### 전후 화면과 남은 시각 문제

| 영역 | 이전/반려 | 현재 |
|---|---|---|
| 첫 대화 | [요약 포스터](assets/impeccable-landing/threeui-upgrade/story-before.png) | [InterPals](assets/impeccable-landing/threeui-upgrade/story-contact.png) · [서툰 시작](assets/impeccable-landing/threeui-upgrade/story-awkward.png) · [12시간](assets/impeccable-landing/threeui-upgrade/story-continuous.png) |
| 시차 장면 | [이전](assets/impeccable-landing/threeui-upgrade/time-before.png) | [도시 일러스트](assets/impeccable-landing/threeui-upgrade/time-after.png) |
| 갤러리 | [이전 배치](assets/impeccable-landing/threeui-upgrade/gallery-before.png) | [열린 양쪽 호](assets/impeccable-landing/threeui-upgrade/gallery-after.png) |
| Hero 중간 | [반려한 사진판/얼굴 절단](assets/impeccable-landing/threeui-upgrade/hero-rejected.png) | [현재 .35](assets/impeccable-landing/threeui-upgrade/hero-current-midpoint.png) · [B 도착](assets/impeccable-landing/threeui-upgrade/hero-current-arrival.png) |
| 공통 메뉴 | 처음 Hero 구도 유지 | [후반부 고정 메뉴](assets/impeccable-landing/threeui-upgrade/navigation-after.png) |

**P2: Hero .35의 전경 겹침은 남아 있다.** 딱딱한 사진 경계가 얼굴을 가르는 문제는 없어졌지만, 전체 화면 혼합 중 망원경/하늘의 높은 대비가 게임방 얼굴 위에 겹친다. 두 인물이 함께 나타나는 것과 얼굴 가독성이 완성되는 것은 다르다. 메시 내부 변형과 짧은 카메라 이동은 실제 구현이지만, 게임방은 승인 일러스트이며 독립적인 완전한 3D 방이 아니다. Lusion 수준의 공간 전환이나 전체 디자인 합격으로 보고하지 않는다.

독립 A의 휴리스틱 평가는 **24/32**(7·10번 해당 없음)이며, 사용성 기반이 개선됐다는 뜻이다. 시각 완성도 전체 통과가 아니다. 비선택 갤러리 조각이 작고 어둡다는 P3 관찰도 남겼다. [독립 평가 원문](assets/impeccable-landing/threeui-upgrade/assessment-a.json).

**P3: 첫 대화의 처음 두 상태는 절제된 연결선 시각물이다.** 12시간의 중심과 밀도는 개선됐으나 첫날을 재현한 풍부한 인물 일러스트 장면은 아니다. 새로운 기억이나 가짜 대화를 만들어 부풀리지 않았다. 독립 검수는 이 점을 마감 관찰로 남겼다.

### 최종 검증과 보호 범위

최종 소스에서 Vitest **87개 파일/673개 테스트**, production build 통과. 별도 Node LetterCollection 검사 **1개 통과**. 실제 브라우저에서 위 사용자 흐름을 확인했고 수집된 page error는 0이었다. 1920 첫 검수 도중 한 번 실행 컨텍스트가 사라져 별도 새 컨텍스트에서 나머지 전체 흐름을 재검수했다. 재검수에서 자발적 reload나 page error는 재현되지 않았다. 실패한 최초 실행을 정상 완료로 숨기지 않는다. [통합 증거/제한](assets/impeccable-landing/threeui-upgrade/verification.json), [첫 대화 크기/상태](assets/impeccable-landing/threeui-upgrade/story-checks.json).

환경은 `/usr/bin/chromium` headless, ANGLE Vulkan **SwiftShader**, DPR 1이다. 소프트웨어 렌더링이며 하드웨어 GPU FPS·실제 모바일 기기 성능은 측정하지 않았다. CPU submit 시간이나 타임라인 길이를 GPU 성능으로 해석하지 않는다. Vite의 기존 500kB 초과 청크 경고는 남아 있다. Safari·실물 기기·외부 API/멀티플레이 운영 상태·8개 게임 내부 전수 플레이는 이번 범위에서 검수하지 않았다. 모바일 전수 검수와 새 영상은 요청에 따라 하지 않았다.

8개 게임 엔진·규칙·라우트·API/데이터·리듬타파 원본은 수정하지 않았다. 원문 편지·서명 저장·장미 엔딩·KO/es-DO와 승인 인물/게임방 원본을 보존했다. 새 자산은 `public/images/story/city-windows.png` 한 장이며 생성 원본도 별도로 유지했다. 원본 main 병합이나 공개 audience 전환은 하지 않는다. 기존 본인 전용 Site에 이 변경을 업데이트한다.

현재 검수 서버는 루트 소유 Vite **dev 5174**이며 종료 명령은 해당 실행 세션 Ctrl-C다. 제품 확인 주소는 기존 private Site를 유지한다. 이번 기록은 구체적인 업그레이드와 남은 P2/P3를 보고하는 것이며 사이트 전체 완료 선언이 아니다.
