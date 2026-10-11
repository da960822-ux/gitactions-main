# Jaipur — Assessment A, 2026-10-11

최신 후속: 마지막 캡처의 P3 취소 문구 잘림은 root가 액션 행의 열 배분과 수량 버튼 전용 font selector를 수정해 해결했다. 좁힌 KO/ES390 검사에서 취소 버튼80×44px·글자 내부 표시·판매 수량/취소 tap·트레이139.97px·문서 폭390px·오류0을 확인했다. `JAIPUR_TARGETED_MOBILE=1 node scripts/verify-jaipur-quality.mjs`에 재현 검사를 보존했다. 아래 A/후속 캡처 당시 관찰과 최신 상태는 [통합 재검수](GAME-READINESS-RECHECK.md)를 함께 읽는다.

Method: independent Assessment A (`/root/sol_jaipur`), source + fresh Chromium contexts + actual same-browser demo Room + separately labelled engine fixtures. Detector/B output was not read or run; findings were not shared with the other assessment or Luna before A completed. This is the design/usability half of the parent critique, not a standalone combined Impeccable critique.

## Verdict

현재 시장 거래 화면은 이 제품에 맞게 구성되어 있다. 원본 상품 장면, 사막색 카드 프레임, 낙타 무리와 뒤집힌 보너스, KO/ES 이름은 일반 대시보드와 구별된다. 공개 시장과 상품 토큰이 상시 보이는 데스크톱 구성은 거래 판단에 도움이 된다. 핵심 행동은 완료할 수 있었지만, 선택 취소의 일관성, 모바일의 선택/확정 위치, 자동 다음 라운드의 문맥, 물체 도착과 점수/소리의 시간 관계가 남은 약점이다.

**Design health: 27/40, Acceptable (디자인 휴리스틱 평가이며 출시 승인 점수가 아님).** 물리 오디오나 실제 온라인 동기화가 검증되었다는 뜻도 아니다.

## 이번 실행 근거

`/tmp/jaipur-assessment-a.mjs`를 새로 작성해 5191 개발 서버에서 네 독립 context를 만들었다: KO/ES 각각 1440×900, KO/ES 각각 390×844. 모바일은 `hasTouch: true`, `isMobile: true`이며 카드·탭·확정·취소는 Playwright `tap()`으로 실행했다. 실제 휴대폰 손가락 터치가 아니다. 새 탭에서 실제 demo Room을 만들고 양쪽 동의로 Jaipur에 진입했다.

- 실제 Room: 상품 선택, 동일 카드 재선택, 가져오기 탭으로 선택 해제, 상품 획득 확정, 양쪽 좌석의 실제 차례 진행, 2↔1 불일치 교환/비활성 확정, 취소, 정상 2↔2 교환, 판매 그룹 선택/확정, 카드 비행 정리, 아래 그림 가이드 이동.
- 별도 새 탭의 engine fixture: 손패 7장에서 가죽 마지막 카드를 눌러도 그룹의 앞 첫 ID가 판매 대상으로 정해지는 점, −/+로 5장 판매, 거절 응답에서 선택 5장/수량 5 유지, 같은 선택 재확정, 판매 중 점수와 비행 동시 상태, 3장 판매로 세 번째 상품 더미 소진→자동 라운드 2, 이전 정산과 새 점수 0 구분, reduced-motion 비행 0.
- 새 실행 확인 65개 중 61개 통과. 실패 4개는 네 조합 모두에서 **가져오기 선택에 명시적 취소 버튼이 없는 것**이다. 대표 행동 실패나 page error는 없었다. 불일치 교환은 네 조합 모두 설명+비활성 확인, 정상 거래/판매/취소/거절 선택 보존과 감소 모션은 완료했다.
- `output/playwright/jaipur-assessment-a/report.json`, `harness.mjs`, 24개 PNG에 이번 실행을 보관했다(ignored). 초기 harness의 상대 좌석 언어/교환 합법 전제 오류는 QA 코드에서 바로잡았다. UI/엔진 소스는 변경하지 않았고 서로 다른 UI 버전을 반복 다듬지 않았다.

| 새 실행 실측 | KO | ES |
| --- | --- | --- |
| 실제 Room 1440 기본 board top/bottom | 229.42 / 886.80px | 227.42 / 894.36px |
| 실제 Room 1440 판매 손패 bottom | 861.63px | 869.19px |
| 실제 Room 1440 판매 트레이 높이 | 92px | 92px |
| 실제 Room 390 문서 가로 폭 | 390px | 390px |
| 실제 Room 390 판매 트레이 높이 | 252.20px | 269.47px |
| 실제 Room 390 판매 시장 top→손패 bottom 범위 | 789.73→1640.73px (851px) | 805.73→1676.89px (871px) |
| y=229px fixture의 라운드 정산 포함 board bottom | 942.64px | 948.20px |

모바일 주요 활성 카드·모드 버튼·확정·취소의 이번 측정에 44×44px 미만 표적은 없었다. 모든 mobile tap 흐름이 가로 스크롤 없이 완료되었다. 다만 판매 시 시장→손패 전체 범위는 844px보다 길다. 1440 라운드 fixture는 실제 Room top에 맞춘 독립 보드이며 shell 전체의 실제 라운드 경기라고 부르지 않는다.

## Nielsen 휴리스틱

Operate surface이므로 10항목 모두 적용했다. 0은 사용 불가, 4는 매우 뛰어남이다.

| # | 항목 | 0–4 | 이번 근거 / 약점 |
| --- | --- | --- | --- |
| 1 | 시스템 상태 표시 | 3 | 선택 윤곽/체크, 교환 장수, 차례/점수와 라운드 정산이 보인다. 새 라운드 번호는 이전 정산 toast가 가린다. 실제 온라인 대기/복구 상태는 이번 실행에 없음. |
| 2 | 현실과의 일치 | 3 | 상품 그림/이름·낙타 무리·판매 수량을 이해할 수 있다. 토큰 상위값과 전체 판매 보상 구분에는 규칙 이해가 필요하다. |
| 3 | 사용자 제어·자유 | 2 | 판매/교환 취소는 잘 된다. 가져오기 재탭은 해제되지 않고 취소 버튼이 없어 현재 탭 재선택이라는 우회가 필요하다. 확정 후 거래 undo는 제공하지 않는 계약이다. |
| 4 | 일관성·표준 | 3 | 세 모드 모두 선택 후 확정이다. 모드별 취소 차이와 손패 카드 하나를 누르면 상품 그룹 전체가 선택되는 동작은 약간 학습이 필요하다. |
| 5 | 오류 예방 | 3 | 2↔1 전송 차단, 정확한 legalAction 선택, 판매 최소/최대 수량, busyRef와 stable ID 검증이 있다. 실제 서버 경쟁/응답 유실은 미검증이다. |
| 6 | 기억보다 인식 | 3 | 카드 이름, 상품 그룹, 수량, 토큰/보너스 공급이 보인다. 모바일의 공급/시장/손패/확정 위치 분리로 기억 부담이 늘어난다. |
| 7 | 유연성과 효율 | 2 | native button/stepper/그룹 판매로 동작한다. 직접 카드 묶음 토글이나 대량 수량 바로 선택은 없고 5장 판매는 +를 네 번 누른다. 실제 키보드 전체 흐름은 A에서 다시 실행하지 않았다. |
| 8 | 미적·최소 구성 | 3 | 데스크톱은 공개판/손패/공급이 잘 나뉘며 기록/세부 규칙은 접힌다. ES 보너스 문구는 좁은 칸 사이에 붙고 모바일 반복 안내가 트레이를 키운다. |
| 9 | 오류 인지·진단·복구 | 2 | 불일치 교환은 수량을 바꾸라는 이유가 명료하고 선택이 보존된다. fixture 거절은 포괄적인 ‘선택을 확인’ 문구만 보여 정확한 원인을 구분하지 못한다. |
| 10 | 도움말·문서 | 3 | 세 단계 그림+실제 컨트롤 설명과 전체 규칙이 아래에 있다. 작은 화면에서 행동 중 도움말까지 스크롤해야 한다. |
| | 합계 | **27/40** | 핵심 거래 가능, 문맥과 일관성 개선 필요 |

## 우선 문제와 재현

### A1 — P2: 가져오기만 명시적 취소가 없다

실제 네 Room에서 시장 상품을 선택하고 동일 카드를 다시 탭/클릭했다. `aria-pressed`와 선택 ID는 그대로 1개이며 트레이에는 확정 버튼만 있다. 교환/판매에는 취소가 있다. 데스크톱은 Escape(소스 경로 있음), 모바일은 이미 활성화된 가져오기 탭을 다시 탭해 선택을 지울 수 있지만 이는 화면에 안내되지 않는다. 터치 사용자는 불필요한 모드 변경을 해야 선택 해제를 발견한다.

**수정 방향:** 같은 선택의 두 번째 탭으로 해제하거나 가져오기 트레이에도 명시적 취소를 둔다. 서버 행동 변경은 필요 없다. `/impeccable clarify` 또는 `/impeccable harden`.

### A2 — P2: 모바일 판매는 선택한 카드에서 수량/확정까지 시선이 거슬러 올라간다

실제 390 판매에서 트레이 높이는 KO252px/ES269px이고, 그 아래에 상대 패 안내를 거쳐 내 손패가 나온다. 시장 top→손패 bottom은 KO851px/ES871px이어서 한 844px 화면에 모두 들어오지 않는다. 7장 fixture에서 마지막 가죽을 선택한 뒤 +를 네 번 누르려면 위에 있는 트레이로 이동한다. 동작은 완료되지만, 한손/주의 분산 사용자는 선택·수량·확정 사이를 왕복한다.

**수정 방향:** 모바일에서 선택한 상품명/판매 수량/확정·취소를 손패 근처로 배치하고, 선택 후 반복 안내는 접는다. 데스크톱 Grid와 44px 표적은 유지한다. `/impeccable adapt` 또는 `/impeccable distill`.

### A3 — P2: 자동 라운드의 이전 정산 toast가 새 라운드 번호를 가린다

y229px engine fixture에서 세 번째 상품 더미를 소진시켰다. 엔진 round2/currentScore0과 이전 round1 total11은 올바르게 구분된다. 그러나 `Cuenta de la ronda 1` toast가 우측 상단 라운드 pill 위에 놓이며, 영구 정산 행은 보드 bottom942.64/948.20px로 900px 화면 아래에 일부 놓인다. 자동 새 판의 ‘현재 2라운드’ 표시와 ‘방금 끝난 1라운드’ 정산을 동시에 읽기 어렵다.

**수정 방향:** toast가 round/turn 표식을 덮지 않는 위치를 확보하거나 header/접힘 기록에 이전 정산을 한 줄 요약한다. 자동 다음 라운드와 기존 자체 규칙은 유지한다. `/impeccable layout`.

### A4 — P2: 판매의 표시 점수와 가져오기/교환 소리의 박자가 계획과 다르다

이번 5장 fixture 확정 35ms 뒤 실제 엔진 점수20, 화면의 점수20(+20 표시), 비행10개가 동시에 보였다. `JaipurBoard`의 `GameValue`는 확정 snapshot 점수를 즉시 읽는다. 카드→토큰→보너스 이동은 순서를 갖지만 **점수 도착 후 정산 표시**까지 같은 순서로 지연된 것은 아니다.

소스상 sale의 coin/bonus는 `JaipurMotion`의 token/bonus flight delay+220ms에서 한 번 재생한다. 반면 take/exchange/camel과 시장 refill 소리는 `GameFeedback`이 fresh snapshot에서 즉시 또는 115ms 간격으로 재생하며, 각 카드의 220ms+35ms 이동 종료와 결합되지 않는다. 이는 착지음 계약이 아니라 확정 응답음 계약에 가깝다. 실제 귀로 들은 결과나 headless 오디오 출력 성공으로 해석하지 않는다.

**수정 방향:** 실제 점수 상태는 즉시 유지하되 시각적 점수 강조를 도착에 맞추고, 가져오기/교환 cue를 ‘착지’로 부르려면 현재 모션 종료 시점에서 담당하도록 연결한다. 다음 합법 행동을 모션 때문에 막지 않는다. `/impeccable animate`.

### A5 — P2: 거절 안내가 보존된 선택을 다시 고르라고 읽힌다

fixture에서 5장 판매 `runAction=false`를 반환했다. 선택 5장/수량5는 보존되고 재확정이 성공했다. 그러나 문구는 `동작이 거절됐어요. 선택을 확인해 주세요.` / `La acción no se aceptó. Revisa tu selección.`이며 Board의 catch 경로는 ‘다시 선택’이라고 한다. 최신 판 변화와 네트워크 오류, 불법 선택의 이유를 이 영역에서 구별하지 않는다. 실제 Room에서는 root action-notice가 별도 원인 문구를 보여줄 수 있으므로, Board 문구만을 전체 서버 오류 UX라고 단정하지 않는다.

**수정 방향:** 아직 보존된 선택과 재시도 가능성을 문구에 명시하고, root의 실제 거절 원인과 중복되는 포괄 안내를 줄인다. `/impeccable clarify`.

## 강점과 감정 흐름

1. **보드의 거래 구조가 읽힌다.** 데스크톱 새 실행에서 5시장·손패·6상품 토큰이 동시에 보였고 카드 그림이 상품 이름과 일치했다. 선택 카드에는 색 외 체크/문구가 있다.
2. **고위험 확정 전에 합법성을 확인한다.** 2↔1은 이유와 비활성 확정으로 막히고, 같은 손패 수로 실제 2↔2 교환이 완료됐다. 거절 뒤 선택을 잃지 않았다.
3. **숨은 정보와 라운드 전환을 분리한다.** 보너스 값은 획득 전에 예측하지 않고 결과에서 공개된다. 이전 점수11과 새 판0은 별도 정산/점수로 보인다. 모션은 돌아와 사라지고 reduced motion은 정보만 남긴다.

감정 흐름은 상품 선택의 빠른 체크→확정된 이동→판매 보너스의 작은 절정으로 자연스럽다. 약한 구간은 모바일에서 수량을 찾는 왕복과 거절의 막연한 이유다. 끝 경험에서는 이전 정산을 볼 수 있는 것이 강점이지만 새 round pill을 가리는 toast가 ‘지금 어디인가’를 약화한다. 흔들림/hit-stop을 늘리는 것이 해결책은 아니다.

## 인지 부하와 persona

8항목 체크: single focus 통과(현재 모드1개), chunking 부분 실패(시장5/손패최대7/상품공급6을 함께 판단), grouping 통과, hierarchy 통과, one thing at a time 통과(선택→확정), minimal choices 부분 실패(상품 후보5개 이상은 실제 카드 게임의 필수 선택), working memory 실패(모바일의 선택/수량/공급 위치), progressive disclosure 통과(기록·상세규칙 접힘). **2–3개 부담 항목: moderate.** 카드 게임의 고유 선택 수 자체를 없애라는 의미가 아니라 상품별/현재 행동의 관련 정보를 더 가깝게 묶으라는 의미다.

- **Jordan, 초보자:** 첫 거래는 상품/낙타와 그림 설명으로 찾을 수 있다. 하지만 가져오기 취소 방법이 안내되지 않고, 마지막 같은 상품 카드 클릭이 그 카드 개별 선택이 아니라 첫 N장 그룹 판매라는 점은 실제 사용으로 배워야 한다. 현재 문구·stepper는 이를 어느 정도 설명한다.
- **Casey, 주의가 분산된 모바일 사용자:** 합성 tap으로 모든 행동을 완료했고 작은 활성 표적은 없었다. 손패와 수량/확정 사이 왕복 및 상대 패 설명이 끼는 위치가 주된 부담이다. 앱 전환 뒤 네트워크 복구나 물리 엄지 도달성은 이번 증거가 아니다.
- **Alex, 반복 플레이 사용자:** 강제 튜토리얼은 없고 그룹 판매가 가능하다. 5장 판매에서 +4회, 선택/확정/취소 표준 버튼 경로 외 수량 바로 선택/직접 묶음 토글은 없어 반복 거래 효율은 보통이다. 새 shortcut을 추가해야만 완성이라는 뜻은 아니다.

작은 관찰: ES 좁은 보너스 칸의 `cartas vendidas`가 인접 칸과 붙어 읽힌다(`es-1440-fixture-round.png`). 세 칸의 숫자3/4/5+와 테두리로 의미는 유지된다. 데스크톱 상대/내 무리와 손패 한도 안내의 반복은 모바일에서는 트레이/손패 간격을 더 키운다.

## GAME-QUALITY-PLAN 현재 소스 대조

‘구현’은 현재 소스 또는 이번 해당 행동에서 확인한 것이며 모든 기기/서버에 대한 보장이 아니다. ‘다른 방식’은 계획의 기능 목적은 충족하되 구체 입력/자산 방법이 달라진 경우다. ‘미검증’은 구현이 없다는 뜻과 구분한다.

| 계획 항목 | 현재 판정 | 현재 근거와 남은 범위 |
| --- | --- | --- |
| 공통 작은 방 바/동시 공개판·패·조작 | 부분 구현 | `PlayApp` + `quality-table-room` compact shell. 새 실제 1440 기본/판매는 범위 안. Room 제목·플레이어 줄은 별도로 남고 모바일 top은 478/509px. |
| 즉시 선택→전송 중→확정/실패 | 구현, 실서버 미검증 | `JaipurBoard` mode/state/busyRef/error, `PlayApp` ActionFlightGuard/pending. 이번 선택/거절/확정으로 확인. 오래 지속되는 서버 대기 UI는 실행 안 함. |
| 실제 reconnect 재조회/상태 표시 | 구현, 실제 온라인 미검증 | `core/client` CHANNEL_ERROR/TIMED_OUT/CLOSED, reconnectRoom→refresh(true), syncEpoch; `PlayApp` 연결 strip. 이전 계획의 getSnapshot-only 진단은 현재 소스와 다름. |
| 기존 event/motion/audio 재사용 | 구현 | `JaipurMotion`, `jaipur-motion`, `GameFeedback`, shared `audio.ts`; 새 BGM/renderer 없음. |
| 기존55장/11낙타/7장한도/stable ID 계약 | 보존 | `jaipur.ts` newRound/identities/getPlayerView, Board data attributes. 이번 그룹/최대7 fixture도 엔진에 연결. 전체 공식판 규칙 감사는 이번 범위 아님. |
| 시장/손패 두 줄+옆 상품 레일 | 구현 | `jaipur-premium.css` desktop Grid. 새 실제 1440 시장5/토큰6/판매패 확인. mobile은 세로 흐름 유지. |
| 손패로 판매할 묶음 직접 고르기 | **다른 방식** | 상품 카드 클릭은 종류 그룹 선택이며 수량 stepper로 앞 N stable ID를 판다. 개별 카드 임의 조합의 묶음 토글은 구현되지 않음. 계획 하단의 ‘상품그룹→수량’ 계약과는 맞음. |
| 하나의 판매 트레이·상품/보너스 예고·확정/취소 | 구현 | `jaipurSalePreview` 상위 알려진 값/보너스 유무, −/+ 수량, saleChoice, Cancelar. 합계나 미래 보너스 값 예측 없음. |
| 교환 양쪽 선택/불일치 안내 | 구현 | 2↔1 새 실행에서 설명+비활성 확인; 같은2↔2 실제 행동 수락. |
| 실패 선택 보존 | 구현, 실제 서버 실패 미검증 | 새 controlled false 응답5선택 보존/재시도. 실서버 지연/유실/경쟁 거절은 별도. |
| 그림/배경/테두리/수량 통일 | 구현, 일부 다른 방식 | 공통 GoodArt/frames/DOM label + 생성 WebP atlas7상품. SVG21구성은 fallback, 정상 runtime은 상품별 atlas1장면; 숫자는 DOM. |
| 대표 금·가죽·낙타→7family/token/back | 구현 | 현재 atlas mapping + coin/bonus/award/back, manifest 원본/압축/권리조건. 새 아트 생성 실행은 A에서 없음. |
| 시장5/손패7/6토큰 KO/ES native scale | 이번 확인 | 실제 Room 기본/판매 + 7장 fixture. atlas 그림/상품 이름 대응 확인. 물리 디스플레이 비교 승인과는 다름. |
| 판매카드→토큰→공개bonus→점수 도착 | **부분 구현** | flight 순서와 coin/bonus landing timer 구현. 실제 화면 점수는 token 도착 전 확정 snapshot에서 이미20으로 바뀜(A4). |
| take/exchange 물체 착지음 | **미구현(그 시점 결합)** | 현재 source는 fresh snapshot cue 즉시/115ms 간격. sale coin/bonus만 landing에 결합. 오디오 자체는 구현, 실제 청취는 미검증. |
| 공식 대비 낙타 교환·선공·동점 차이 명시/엔진 임의변경 금지 | 계약 보존, 외부공식 대조 미검증 | 현재 engine camel교환금지, 다음p1, 점수동점draw/최대3round 동승draw. `rules.ts`/quality docs에 앱 규칙 설명. 공식판 최신 원문 재검증 없음. |
| 최대교환2–5/판매6·7/라운드복합 UI | 부분 새 검증 | A는 실제2↔2 + 5장fixture + 자동round를 새 실행. 5↔5/판매6·7은 현재 code/기존 tests 존재하지만 A에서 다시 실행하지 않음; 기존 결과를 새 실증으로 부르지 않음. |
| 입력 시각반응100ms 목표 | 측정 코드 구현, A 미측정 | `verify-game-quality-performance.mjs` click→DOM/다음rAF observer 존재. 이번 tap 성공은100ms 실측이 아님. |
|60Hz/frame/layout/React/decode/audio/network 비용 분리 | **부분 도구/부분 미검증** | 현재 script는 production preview 선택/취소8회씩, longtask/rAF/CDP Script/Layout/Recalc/Task metrics. React commit/paint completion/image decode/audio scheduling/실서버시간 분리는 없음. A는 실제 profiler trace를 수집하지 않음. |
| 수정전후 동일 환경 성능 비교 | 미검증 | 이 A에 전후 baseline/최대복합/종료 action trace 없음. root의 별도 수행이 있더라도 A의 새 증거로 혼합하지 않음. |
| 키보드/초점/감소모션/KO·ES | 부분 새 검증 | 새 KO/ES layouts + reduced-motion sale0flights. native buttons/escape/modal focus는 current source 확인, A의 전체 keyboard/125%/orientation 실증 없음. |
| 모바일390기존진입/터치 유지 | **합성 touch 새 검증 / 물리 미검증** | 실제 Room hasTouch/isMobile tap으로 가져오기·교환·판매·취소. 44px 표적 측정/가로폭390. iOS/Safari·실기기손가락/노치/엄지·앱전환 제외. |
| 실제 두 사용자/기기·fullmatch·느림/중복/오프라인/reconnect | 미검증 | same-browser demo와 별도 controlled engine fixture만. SQL 또는 online fixture도 A가 읽거나 실행하지 않음. |
| 오래된효과/상대private누출/실패성공효과0 | 부분 근거 | source sequence/reset/player guards, private engine view; 새 false0commit와 cleanup. 실제 Realtime 재접속/반복snapshot/전체 private data audit 새 실행은 없음. |
| 실제 오디오청취/기기별레벨·headroom | 미검증 | 현재 pergame opt-in/volume/voice 제한/visibility pause 소스 존재. 노트북/이어폰/스피커로 듣지 않음. |
|대표시안+실playcapture+권리·출시승인 | 일부 구현/승인 미검증 | 이번 native 화면 판독과 current manifest 존재. 상업 권리확인·물리음향·paid-release approval은 별도. A에서 출시완료 표현 금지. |

## parent 합성용 질문 / 제한

새 기능보다 먼저 손볼 것은 무엇인가: (a) 가져오기 취소의 모드 일관성, (b) 모바일 손패 가까운 판매 트레이, (c) 라운드 toast 위치와 점수/소리 강조의 순서? 핵심 공개 정보를 줄이지 않고 선택/확정 사이 이동을 줄일 수 있는가? ‘착지음’ 대신 지금 동작을 ‘확정 응답음’으로 유지할 것인지도 소유자가 선택해야 한다. 이 질문들은 A의 독립 관찰을 parent가 합성할 때 사용할 재료이며, A가 사용자 승인을 요청하거나 구현을 멈추는 gate가 아니다.

런타임 소스 변경·detector·B/Luna 결과 교환·운영 배포·커밋/푸시는 하지 않았다. 실제 Supabase/Re­altime, 물리 모바일/오디오, 실기기 profiler와 125% 화면은 미검증이다. Context command는 PRODUCT.md의 구형 schema를 보고했으나 이번 범위를 넓혀 문서를 재작성하지 않았다; 필요하면 별도 Impeccable init로 갱신할 수 있다.

## A/B 합성 후 한 묶음 수정과 bounded 확인

아래는 위 독립 A의 수정 전 결과를 보존한 후속 기록이다. parent가 A/B 합성을 마친 뒤 Luna는 Board/CSS, Sol은 Motion/helper/tests, root는 shared audio loop를 수정했다. 새 기능이나 검수 범위를 늘리지 않았다.

- A1: 상품과 낙타 무리 재탭이 선택을 해제하고, 가져오기에도 명시적 취소가 있다. 실제 Room의 click/tap으로 확인했다.
- A2: 모바일 판매 트레이를 줄였다. 확인 중 **취소 버튼이 + 수량 버튼의 탭을 가로채는 새 CSS 회귀**를 발견했다. root가 해당 회귀만 동결 예외로 승인했고, Luna가 범용 stepper grid 선택자에서 cancel을 제외했다. 중단된 모바일 흐름만 이어서 강제 클릭 없이 + 네 번→5장, 취소/재선택, 거절 시 5장 보존, 같은 선택 재확정을 확인했다. 손패와 위쪽 트레이 사이 이동 자체는 남는다.
- A3: 이전 정산은 접힌 기록의 항상 보이는 summary에 남고, 그 summary가 `settlement` 도착점이다. 새 round2에서 old toast는 0개, 새 round pill은 보인다. 숨긴 정산 본문을 도착점으로 쓰지 않는다.
- A4: take/exchange/camel cue는 `JaipurMotion`의 실제 배치된 카드 중 마지막 비행의 delay+220ms에 한 번 예약한다. 비행 배치가 없으면 cue가 없고, reduced-motion은 확정 때 한 번이다. sale coin/bonus의 첫 reward 착지 계약은 유지했다. root shared 실제 audio loop에서 세 transfer와 bonus를 제외해 중복을 막았으며, refill draw/sale sell/round score/win은 shared 계약을 유지한다. **확정된 authoritative 점수는 계속 즉시 갱신된다.** 35ms 표본에서도 점수20과 비행10개가 함께 보였다. 점수 지연 연출을 구현했다고 부르지 않는다.
- A5: 실패 문구는 현재 게임판 확인 후 재시도를 안내한다. 선택5/수량5가 유지되고 재확정이 수락됐다. 실패 원인별 구분은 이 Board 문구에서 추가하지 않았다.

| 후속 원값 | KO | ES |
| --- | --- | --- |
| 1440 판매 트레이 | 92px | 92px |
| 1440 y229 fixture round2 board bottom | 886.375px | 895.9375px |
| 390 손패7/판매5 fixture 트레이 | 166.75px | 139.96875px |
| 390 접힌 settlement summary | 338.40625×44px | 338.40625×44px |
| 390 판매 활성 컨트롤 | 모두 최소44×44px | 모두 최소44×44px |
| 390 문서 가로폭 / reduced-motion 비행 | 390px / 0 | 390px / 0 |

실제 same-browser Room 획득/2↔2 교환/판매/취소와 별도 source-module engine fixture의 7손패/판매5/거절/자동 round2 흐름을 유지했다. KO390 실제 Room 최소 판매까지 완료했지만 fixture의 + interception으로 중단될 때 그 context의 메모리 표본은 저장되지 않았다. 기존 Room PNG는 남고, KO390은 수정 후 **fixture 부분만** 이어서 확인했다. ES390은 같은 Room+fixture 흐름을 완료했다. 최초 중단의 시장 합법 행동 전제와 진입 대기 문제는 QA 코드에서 처리했으며 UI 소스 오류로 세지 않는다.

Headless `AudioBufferSourceNode.start`/`OscillatorNode.start` 호출을 기록했다. KO1440 take에는 보존된 refill draw가 확정 기준106.9ms, 별도 place texture 두 개가339ms에 함께 호출됐다. ES1440은 refill71.7ms/place349.2–349.3ms, ES390은 refill190.8ms/place469.1ms였다. Exchange texture 두 개는 각각 KO1440 345.1–345.2ms, ES1440 460.2ms, ES390 369.9ms에 한 cue로 호출됐다. 이 수치는 입력 처리/queue 시간을 포함하므로 220ms 자체의 성능 측정이 아니다. 코드의 착지 예약과 실제 WebAudio 호출 근거이며 **물리 출력/귀로 듣는 동시성/브라우저의 실제 paint 완료 증거는 아니다.** KO390 오디오 표본은 앞서 중단 때 보존되지 않아 다시 측정하지 않았다. camel 마지막 착지 예약은 helper 단위 검사 근거이며 이번 실제 Room에서는 선택/재탭/취소를 확인했다.

후속 report는 자동 assertion78개 중75개 통과, page error0이다. 나머지3개는 QA 판정 조건의 문제다: take 두 경우는 보존된 refill draw까지 transfer 소리로 세었고, KO1440은 의도적으로 접힌 details 본문의 빈 `innerText`를 실패로 셌다. 원래 실패 assertion을 지우지 않고 같은 기록의 texture pair/visible44px summary를 근거로 `adjudications`에 별도 판정을 보존했다. 이를 새로운 브라우저 재실행이나 78개 모두 자동 통과했다고 부르지 않는다. `output/playwright/jaipur-assessment-a-confirm/report.json`, `harness.mjs`와24개 PNG(ignored)에 근거가 있다. Motion/helper/PlayApp 관련27개 검사는 통과했다.

**후속 디자인 건강 점수: 29/40** (원래27/40에서 사용자 제어2→3, 오류 복구2→3; 나머지는 유지). A1/A3의 지적은 해결, A4의 transfer 착지 cue는 구현으로 바뀌었으며 즉시 점수 계약은 명시했다. A2는 높이가 줄었지만 공간 왕복은 부분 개선이다. 남은 **P3 표시 문제**: ES390 `Cancelar`가44px 칸 밖으로 그려져 우측 일부가 잘리며, KO 취소는 세로 줄바꿈으로70.78125px 높이다. 실제 tap은 수락되고 +를 가로채지 않는다. 이번 한 묶음 확인에서 발견한 잔여 표시 문제를 숨기지 않고 기록하며 추가 광범위 수정/검수는 하지 않았다.

임시 harness 정리 뒤에도 회귀를 재현하도록 `scripts/verify-jaipur-quality.mjs`에 KO/ES390 `hasTouch` source-module fixture의 실제 + tap/취소/44px/compact assertion만 추가했다. portable `launchChromium` helper는 유지했고 default localhost5191·Vite 모듈·demo/fixture 범위를 명시했다. 새 스크립트 전체 브라우저 배치는 실행하지 않았으며 `node --check`와 scoped `git diff --check`만 통과했다. 실제 Supabase/Realtime, 물리 터치/오디오, 실기기 profiler와 paid-release 승인은 계속 미검증이다.
