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
