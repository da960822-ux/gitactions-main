# 자이푸르 준비도 — Assessment B

`src/app/JaipurBoard.tsx`, `src/app/JaipurMotion.tsx`, `src/app/JaipurQuickGuide.tsx`의 detector 및 브라우저 근거를 정리한다. 코드 동결 지시를 지켰고 앱 파일은 수정하지 않았다. Impeccable context는 자이푸르를 사암색·자두색·청록색·황동색의 2인 거래 게임으로 규정한다. 기계 검출 결과는 이 디자인 맥락과 소스·테스트를 함께 보고 판정했다.

## Detector 결과

공식 launcher로 세 TSX 대상을 한 번 검사했다.

```text
.agents/skills/impeccable/scripts/impeccable detect --json src/app/JaipurBoard.tsx src/app/JaipurMotion.tsx src/app/JaipurQuickGuide.tsx
exit: 0
```

stdout 전체는 `[]`이며 `/tmp/jaipur-impeccable-detector.json`에도 저장했다. stderr는 비어 있었다. 정적 TSX 검출의 primary finding은 0개다. 이 결과가 접근성이나 실서비스 검증을 뜻하지는 않는다.

브라우저에서는 새 Chromium 컨텍스트로 기존 `http://127.0.0.1:5191/play`에 접속해 정상 좌석 선택 흐름으로 같은 브라우저 데모방을 만들었다. 제목을 `[Human]`으로 바꾸고 임시 Impeccable live server(8400)가 제공한 공식 `detect.js`를 주입했다. 주입과 overlay 표시가 성공했고 콘솔은 `32 anti-patterns found`, page error 0개를 보고했다. 캡처는 `/tmp/jaipur-b-desktop.png`, `/tmp/jaipur-b-mobile.png`, 계측 JSON은 `/tmp/jaipur-b-browser.json`이다.

Overlay의 대표 경고를 실제 구조와 대조했다.

| 표시된 경고 | 판정 |
| --- | --- |
| `No disponible` 같은 문구 5회 반복 | 각 시장 카드에 해당 카드의 비활성 사유를 표시한다. 카드마다 필요한 안내라 반복 문구 경고는 false positive다. |
| 다수의 `NESTED CARDS` | 시장 카드와 상품/보너스 더미가 보드 안에 구성되는 실제 카드게임 계층이다. 이 화면에서는 분류상 경고가 제품 구조를 문제로 입증하지 않는다. |
| 크림/베이지 팔레트 | DESIGN.md에 명시된 자이푸르 사암색 팔레트와 일치한다. false positive다. |
| 본문 넓은 자간 | Jaipur 본문 전체에 자간을 지정하지 않았다. 스타일에는 제목의 약한 음수 자간과 작은 대문자 kicker의 `.08em`만 있어 이 경고는 범위가 과도하다. |
| 작은 본문/기능 글자, 낮은 대비 | 공통 Room shell과 보드의 보조 문구에 표시됐다. 보조 표기는 일부 10–11px로 작다. 주 행동/가이드 본문은 더 크지만 모든 실제 텍스트-배경 조합의 명암비를 계산하지 않았으므로 이 항목은 false positive로 확정하지 않고 접근성 미검증 위험으로 남긴다. |

첫 overlay 실행에서는 주입 요소가 문서 가로폭 측정에 영향을 줘 1440px 뷰포트에서 1460px, 390px에서 468px로 보였다. overlay 없는 확인용 새 컨텍스트에서는 문서 폭이 각각 정확히 1440px과 390px였다. 따라서 앞의 초과폭은 검출 overlay 영향이지 앱 가로 overflow 근거가 아니다.

확인 컨텍스트에서 5191 데모의 실제 시장 상품 하나를 선택하고 확인했다. 확인 버튼이 활성화됐고 차례가 p1에서 p2로 바뀌었으며 page error는 0개였다. 1440×900에서 확정 후 보드 경계는 y=229.4–886.8이었다. 390×844에서는 문서 폭 390px을 유지하고 세로 스크롤을 사용했다. 증거는 `/tmp/jaipur-b-confirm.json`, `/tmp/jaipur-b-confirm-es.png`, `/tmp/jaipur-b-confirm-mobile.png`에 있다.

임시 8400 서버는 종료했다. stop 도구는 persistent live-script 제거 과정에서 `config_missing`을 보고했지만 detector script는 임시 Playwright 페이지에만 주입했고 해당 컨텍스트를 닫았다. 앱 파일에 script를 쓰지 않았다. 기존 5191 및 5194 서버는 정리 후에도 HTTP 200으로 응답했다.

## 개선안 대조표

| 요구사항 | 소스/테스트 근거 | 구현·검증 상태 |
| --- | --- | --- |
| 55장·낙타 11장·시장 5장·손패 7장 유지 | `src/games/jaipur.ts:38–45`; `jaipur.test.ts` 초기 구성과 낙타/손패 분리 검사. | 현재 엔진에서 유지. 이번 5191 패스는 시장 5장을 확인했으며 손패 7장은 기존 엔진/fixture 테스트 근거이고 이번 세션에서 실 Room으로 만들지는 않았다. |
| 비공개 정보 보호 | `makeView()` (`src/games/jaipur.ts:64–76`)는 본인 손패·상대 장수·상품 토큰의 알려진 맨 위 값·보너스 개수만 반환하고 덱/상대 손패/RNG seed/전체 보너스 타일/하위 상품 토큰 값을 내보내지 않는다. `JaipurBoard.test.tsx`는 비밀 상대 카드·보너스 값 렌더링 누출을 막고, 엔진 테스트는 caller view/private event payload를 확인한다. | UI는 상대 카드 뒷면과 보너스 뒷면을 사용하며 보너스 값은 확정 판매 이벤트 뒤에 공개한다. 코드/fixture 근거이며 이번 브라우저 패스에서 Supabase 요청을 하지 않았다. |
| 6·7장 묶음 판매와 중복 확정 방지 | `JaipurBoard.tsx:51–53, 76–85, 138–143`은 같은 상품의 앞 N stable ID와 현재 legal action을 연결한다. `jaipurSalePreview()`는 5+ 보너스 단계만 표시하고 숨은 값을 공개하지 않는다. `jaipur.test.ts`는 6장 판매와 3/4/5+ 보너스 단계를 다룬다. | 기존 DOM→엔진 복합 fixture `output/playwright/jaipur-quality/compound/report.json`: KO 6장 21점, KO/ES 7장 22점, 앞 N ID 일치, 확정 뒤에만 보너스 더미 감소, Enter 20회에도 요청/commit 각 1회, false/throw 뒤 선택 보존 및 재시도. 이는 engine-backed browser fixture이며 서버/Realtime 검증은 아니다. |
| 라운드 종료와 자동 다음 라운드 | `jaipur.ts:46–63,129–130`은 덱 소진 또는 상품 더미 3종 소진 시 종료, 낙타 다수 5점(동점 0), 다음 라운드 p1 선공, 2승 또는 3라운드 종료(3라운드 동수는 무승부)를 구현한다. `jaipur.test.ts`는 더미/덱 종료, 동점, p1 선공, 2승 및 3라운드 무승부를 검사한다. Board/Motion 테스트는 정산 내역 표시를 확인한다. | 기존 엔진 테스트 근거. 이번 브라우저 패스에서 실제 full round 경계를 끝까지 플레이하지 않았다. 공식판과의 일치도 이 테스트로 확정할 수 없다. |
| 선택·오래된 ID·실패 복구 | `JaipurBoard.tsx:35–60,76–94`는 stable ID로 선택을 보관하고 최신 view에서 인덱스를 다시 찾으며 현재 `view.actions`와 정확히 맞을 때만 확정한다. 좌석/라운드/턴/시장·손패 ID 변경은 선택을 초기화하고 `busyRef`는 동기 중복 제출을 막는다. | 복합 fixture가 5↔5 교환, ID 집합 보존, false/throw 실패, 재시도, 반복 확정을 검증한다. 새 5191 패스는 일반 가져오기 한 건과 차례 전환을 확인했다. 실제 동시 클라이언트나 응답 유실을 재현하지 않았다. |
| 모션 이벤트 순서·비공개·감소 모션 | `jaipur-motion.ts:7–19,45–70`은 새 sequence를 정렬하고 확정 이벤트에만 비행을 만든다. `JaipurMotion.tsx:93–127`은 큐를 처리하고 reduced motion/숨긴 탭에서는 정적 결과를 남긴다. 순수 motion 테스트는 순서/리셋, 이벤트 음향, 교환 양방향, 낙타/보충, 판매 토큰/보너스, 7장 비행 시간을 검사한다. `JaipurMotion.test.tsx`는 과거 정산을 재생 없이 렌더링한다. | reduced-motion 및 compound fixture는 결과와 비행 정리를 확인한다. 이번 패스에서는 실제 오디오를 듣거나 빠른 Realtime 이벤트 backlog를 만들지 않았다. 큐 순수 로직은 테스트되지만 지연/역순 서버 갱신에서 React 큐 수명주기는 통합 테스트되지 않았다. |
| 화면 크기와 가이드 | `JaipurBoard.tsx`, `JaipurQuickGuide.tsx`, `jaipur-premium.css`는 반응형 보드와 3단계 KO/ES 가이드를 구현한다. 기존 guide harness는 KO/ES 데스크톱/모바일 및 modal/inline에서 45/45, page error 0을 기록했다. | 이번 5191 확인은 1440/390 문서 폭, 보드와 단일 거래를 확인했다. 실제 7장 Room은 이번 B 패스에서 구성하지 않았다. 이전 engine fixture의 KO/ES 7장 보드 끝 위치는 900px 안쪽이다. |
| 실제 성능·기기·서비스 복원력 | 계획은 선택 100ms, frame 비용, 두 기기 Realtime, 재접속, 물리 모바일과 실제 음향을 별도 출시 기준으로 둔다. | 이번에 측정하지 않았다. 데모는 같은 브라우저 좌석 흐름이다. SQL/Auth/Edge Function/Realtime, 물리 두 기기, 물리 터치/스크린리더, 스피커 청취를 확인하지 않았다. 이 자료로 상업 출시 준비 완료를 주장하면 안 된다. |

## 테스트 수와 문서 정합성

현재 `it()` 선언을 세면 `src/games/jaipur.test.ts` 20개, `src/app/JaipurBoard.test.tsx` 10개, `src/app/jaipur-motion.test.ts` 6개, `src/app/JaipurMotion.test.tsx` 1개로 총 37개다. 이번 Assessment B에서는 테스트를 재실행하지 않았고 파일 인벤토리만 확인했다. `docs/GAME-QUALITY-JAIPUR.md:158`의 31/31은 첫째·둘째·넷째 파일만 더해 순수 motion 테스트 6개를 빠뜨린 수치다.

`docs/GAME-QUALITY-JAIPUR.md:149`에는 390px 캡처가 대기 중이라는 문장이 있으나 아래쪽에는 모바일 캡처가 완료됐다고 기록돼 있어 앞 문장이 오래됐다. detector 검사로 구현 결함은 확인되지 않았다. 남은 주요 근거 공백은 실제 full round, 빠른/지연 이벤트에서의 컴포넌트 큐, 인증된 두 기기의 재접속/실패, 작은 글자 대비율, 물리 접근성/오디오, 공식판 비교다.
