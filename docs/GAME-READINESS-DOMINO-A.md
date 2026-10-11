# 도미노 Assessment A — 독립 디자인·사용성 평가

2026-10-11. 담당 `/root/sol_domino`. 대상 `src/app/DominoBoard.tsx`와 실제 `http://127.0.0.1:5191` 설명/게임 화면. 이 문서는 Assessment A만 기록한다. 다른 평가자나 detector 결과를 읽거나 실행하지 않았으며, 전체 critique 종합은 root의 별도 A/B 합성 단계다. UI 소스는 수정하지 않았다.

## 새 검사 근거와 한계

기존 완료 보고서를 재사용하지 않고 새 Chromium context로 KO/ES 설명 모달, 실제 데모 사람-봇 팀전(목표 200) 한 라운드를 검사했다. 첫 선택, 양끝 합법 미리보기, 왼쪽·오른쪽 실제 확정, 650ms 손패 누르기, Space 선택, Escape 취소, Enter keydown 반복, 봇 응답, 긴 체인, 두 번의 사람 패스, 막힘 정산을 진행했다. 기록된 21개 검사는 통과했다. 설정의 첫 select 초점 및 Esc 뒤 설정 버튼 복귀도 확인했다. 보이는 보드 button/select 최소 높이는 44px, 최소 폭은 약 75.5px였고 기다리는 패 opacity는 1이다.

증거: `output/playwright/domino-readiness-a/report.json`과 같은 폴더의 캡처. 실제 게임 캡처 파일명의 `ko-` 접두사는 최초 세션 언어이며 이후 데모 좌석 전환에 따라 UI 언어도 바뀌었다. 실제 언어는 report의 `phaseStatus` 및 캡처 본문으로 판정한다. `ko-default.png`와 `ko-both-ends-selected.png`는 KO, `ko-long-chain.png`, `ko-125-equivalent-top.png`, `ko-125-equivalent-rack.png`, `ko-round-end.png`는 ES 화면이다. 설명 모달은 `ko-instructions.png`, `es-instructions.png`에서 각각 직접 검사했다.

라운드는 공개 체인 24개와 공개 잔여패 4개로 종료됐고, 팀 남은 합 8 대 16, 승팀 득점 16이 표시됐다. 종료 직후 flight 0개, 숨긴 착지 대상 0개, 이벤트 stage animation은 false였다. 마지막에 room에 없는 `Español` 버튼을 찾은 자동화 selector가 timeout됐다. 이것은 제품 오류가 아니라 검사 도구의 좌석별 언어 전환 가정 오류다. 그 뒤 의도한 새 라운드/reduced-motion 캡처와 flight 타임라인/선택 지연 수집은 완료하지 못했다. 따라서 이 A 평가에서 이를 통과로 주장하지 않는다. 현재 소스의 관련 구현은 별도로 대조했다. 실제 Supabase, 기기 두 대, 물리 음향, 물리 터치, 스크린리더 음성 출력은 이 검사에 포함되지 않는다.

## 디자인 판단

도미노용으로 설계된 화면이라는 판단이다. 아이보리 수지 타일, 읽히는 검은 핍, 낮은 대비의 펠트와 우드 테두리가 한 테이블을 구성한다. 타일·손패·미리보기·공개 결과가 같은 SVG family를 쓰므로 그림의 차이를 규칙 차이로 오해하지 않는다. plum 방 shell과 밝은 테이블의 대비도 테이블에 시선을 모은다. 디자인 전체를 교체할 이유는 없다.

잘 된 점은 세 가지다. 고정된 양끝 도크는 긴 체인을 가로 이동해도 접근할 수 있고, 두 끝에 놓을 수 있는 상태에서는 각 방향의 타일과 새 끝 숫자를 동시에 보여준다. 팀 색만 쓰지 않고 팀명·좌석명·카운트를 병기해 동료와 상대를 구분한다. 초보자 도움은 세 장면과 짧은 행동 문구로 시작하고 지역 규칙과 보너스는 세부 규칙으로 접어 두어 첫 수를 배우는 비용이 낮다.

## Nielsen 점수

점수는 0=부재/매우 나쁨, 4=탁월함이며 이 Operate/Read 표면에는 열 항목 모두 적용한다.

| 항목 | 점수 /4 | 근거 |
| --- | ---: | --- |
| 1. 시스템 상태 가시성 | 3 | 차례·남은 패·팀점수·처리 중 표시가 있으나 상단 차례 tag가 round-over에서도 상대 차례라고 표시된다. |
| 2. 현실과 시스템의 대응 | 3 | 재질과 핍이 도미노이며 블록 방식·팀전·예시가 명확하다. 지역 용어는 세부 설명을 읽어야 한다. |
| 3. 사용자 통제와 자유 | 3 | 선택 취소와 Esc, 모달 닫기, 음소거가 있다. 확정 후 되돌리기는 온라인 규칙상 제공하지 않는다. |
| 4. 일관성과 관례 | 3 | 모든 위치의 타일 family와 native button/select가 일관된다. round-over의 두 상태 문구는 다르다. |
| 5. 오류 예방 | 3 | 합법 패/끝만 활성화하고 확인 반복을 한 수로 처리한다. 불가 끝의 이유는 표시되지 않는다. |
| 6. 기억보다 인지 | 3 | 끝 숫자·미리보기·팀·카운트를 같은 테이블에서 읽는다. 불가 상태 해석은 일부 규칙 기억에 의존한다. |
| 7. 유연성과 효율 | 2 | Space/Enter/Esc가 작동하지만 확정 뒤 focus가 BODY로 가고 드래그 대체 입력은 없다. |
| 8. 미적·최소주의 설계 | 3 | 공개판/손패가 우선이며 설정은 접힌다. 위의 방 제목과 게임 제목 반복, 작은 설명 글은 더 정돈할 여지가 있다. |
| 9. 오류 인지·진단·복구 | 2 | 공통 client의 재동기화와 보존 계약은 있으나 응답 미확인 설명과 Board의 일반 재시도 문구가 함께 나올 수 있다. 실제 온라인 실패 UI는 미검증이다. |
| 10. 도움말·문서 | 3 | 3그림 안내·게임 방법 링크·접힌 상세 규칙이 있고 모달 키보드 출구가 정상이다. |
| **합계** | **28/40** | **Good: 기반은 양호하나 키보드 연속 조작과 상태·오류 문구를 수정해야 한다.** |

## 우선 문제

1. **P2 — 확정 뒤 키보드 초점 맥락을 잃는다.** 합법 손패를 Space로 선택하고 끝 버튼을 focus한 뒤 Enter를 반복 입력했을 때 사람 타일은 정확히 한 개 늘었다. 그러나 1.05초 뒤 activeElement는 BODY였다. focus ring 자체는 3px solid로 존재했다. 새 수를 두려면 전역 Tab 순서를 다시 탐색해야 하며 keyboard persona의 피로가 커진다. 확정 뒤 비대화형 board 맥락이나 계속 존재하는 적절한 조작 지점에 초점을 보존하고, 상대 진행 때문에 자동으로 패를 선택하거나 확정하지 않는다. 제안: `/impeccable harden`.
2. **P2 — 라운드 종료인데 상단은 상대 차례라고 한다.** 실제 막힘 정산 캡처의 상단 tag는 `Turno rival`, 테이블 상태는 `Revisa el resultado de la ronda`이다. `PlayApp.statusLabel`은 `view.result`만 종료로 판단하지만 누적 경기의 round-over에는 최종 result가 아직 없다. novice가 상대 수를 기다릴 수 있다. `phase==='round-over'`를 라운드 결과로, 최종 finished/result를 매치 종료로 구별한다. 제안: `/impeccable clarify`.
3. **P2 — 불가능한 끝에 이유가 없다.** `dp-end-target`은 disabled/aria-disabled와 숫자만 표시하며 이유 문구를 렌더하지 않는다. 계획에서 요구한 불가 이유는 구현되지 않았다. 선택한 패가 한쪽에만 맞는 상태에서 다른 쪽은 `이 숫자와 맞지 않음`처럼 짧은 설명을 제공하고, 선택 전에는 `먼저 패 선택`을 구분한다. 색 변화나 hover에만 의존하지 않는다. 제안: `/impeccable clarify`.
4. **P2 — 응답이 불명확한 실패에 일반 재시도 문구가 겹칠 수 있다.** 소스 경로: PlayApp.runAction이 `action_confirmation_unknown`의 `최신 판에서 반영 여부 확인`을 표시하고 false를 반환한다. DominoBoard.submit은 false를 다시 `다시 시도해 주세요`로 바꾼다. 이 항목은 실제 Supabase 장애 재현이 아니라 현재 호출자·반환값 대조로 확인한 문구 위험이다. 불명확한 완료 상태에서는 공통 설명을 유지하고 Board의 일반 재시도 안내를 중복하지 않는다. 버전/CAS 보호로 중복 실행을 막는 것과 사용자가 무엇을 해야 하는지 이해시키는 것은 별개다. 제안: `/impeccable harden`.

P0/P1로 확인된 플레이 불능은 없다. 실제 상업 운영의 확인 부족은 아래 출시 관문이며, 이를 점수 높은 디자인으로 상쇄하지 않는다.

## 인지 부하·persona·감정 흐름

핵심 플레이는 낮은 인지 부하다. 공개판과 패가 묶이고 한 패 선택 후 두 끝 중 고르므로 이전 화면의 숫자를 외울 필요가 없다. 기본 손패 최대 7장은 게임 자체의 선택 복잡도이며 그 중 합법 패만 조작된다. 이를 불필요한 메뉴 7개와 같은 부하로 계산하지 않는다. 설정 모달에는 모드·난이도·목표·두 보너스·막힘 규칙의 6개 결정이 함께 있어 chunking/minimal choices 두 항목에서 중간 부하다. 첫 수 전 한 번 열고 기본값이 있으므로 플레이 화면의 지속 부하는 아니다.

- **Jordan/초보자:** 그림 안내와 합법 패의 선택은 명확했다. 불가 끝의 이유와 round-over의 상단 상태 불일치가 남은 위험이다. 첫 수를 모든 패 중 6|6으로 고정하지 않는 설명은 엔진과 일치한다.
- **Sam/키보드 사용자:** 모달의 초점 및 Esc, Space 선택, Enter 중복 방지는 작동했다. 확정 후 BODY로 나가는 것이 구체적인 반복 조작 비용이다. 이 검사에서는 끝 focus를 자동화로 직접 지정했으므로 실제 Tab만으로 한 라운드 전체를 완료했다고 주장하지 않는다. 스크린리더 음성·200% 확대는 미검증이다.
- **Alex/숙련자:** 강제 튜토리얼이 없고 두 단계로 수를 둔다. 드래그와 단축키 가속은 없고 긴 체인은 읽기 위해 가로 이동한다. 기본 클릭 사용을 막는 문제는 아니다.

초반은 공개된 규칙과 합법 상태가 불안을 줄이고, 중반의 선택 윤곽·새 끝 미리보기·실제 체인 갱신은 행동 성공을 확인시킨다. 끝에서는 승팀·남은 합·득점이 분명하나 종료 이벤트는 stage 큐를 폐기하고 정적 정산으로 즉시 전환한다. 이번 막힘 정산의 stageAnimated=false도 이를 보여준다. 큰 이벤트가 반드시 더 강한 이동을 해야 하는 것은 아니지만 마지막 패 착지나 카피쿠아 stamp가 항상 재생된다고 설명해서는 안 된다.

## GAME-QUALITY-PLAN 도미노 및 공통 계약 대조

| 계획 항목 | 현재 구현·이번 A 근거 | 분류 |
| --- | --- | --- |
| 작은 공통 헤더, 1440×900 공개판·손패·핵심 조작 | 새 기본 테이블 y≈389–841, 손패 y≈760–822. 선택 상태 테이블 bottom≈864이며 끝 버튼과 패를 함께 조작했다. 상세 도움/정산은 아래로 이어진다. | 구현·대표 상태 실측 |
| 좌석/팀 배지를 테이블 둘레, 설정 접기 | 테이블 상단 4좌석으로 그룹화하고 팀명·카운트 표시. 시작 후 설정 readout은 접힘. | 목적 구현, 위치는 상단 행 방식 |
| 28종 SVG·합법 행동·팀 규칙 보존 | 공용 DominoTile 사용, 실제 공개 체인+잔여패 총28, 양끝과 팀 정산 확인. 엔진 변경 없음. | 구현·대표 확인 |
| 패 선택→끝 미리보기→확정 | 양끝 preview2개 확인, 왼/오 실제 확정, Esc 및 native Space/Enter. 끝 버튼 클릭 자체가 확정이다. | 구현·대표 확인 |
| 드래그 추가 입력·드래그 취소 | Board에 drag/pointer gesture handler가 없다. 클릭/키보드가 제공된 방식이다. | **미구현**, 대체 클릭/키보드 있음 |
| 불가능한 끝의 이유 | disabled/aria-disabled뿐이며 명시 이유 없음. | **미구현** |
| 전송 중 상태와 실패 시 선택 보존 | Board busy/submit lock와 공통 pending, 성공 때만 선택 해제. 선택 identity와 최신 legalAction 재검증. 실제 온라인 지연/실패는 검사하지 않음. | 구현 소스 확인, 온라인 UX 미검증 |
| 긴 체인 최소 크기·양끝 접근·최신 식별 | 타일72px/더블39px 유지, 수평 scroll 안에서 최근 tile outline, 도크는 scroll 밖. 화면 전체 일괄 축소 없음. | 구현·대표 확인, 전체 체인 접어 배치하는 방식은 아님 |
| 손패 원점→도착 끝, 실제 착지음 | Stage는 own-hand DOM/source pin 및 공개 상대 좌석 back에서 target sequence로340ms flight, 정착 timer의 place. GameFeedback은 play cue 제외. | 구현 소스 확인; 이번 A의 flight geometry/timeline 저장 및 물리 청취 미완료 |
| 봇 복수 sequence 순서 | 실제 사람 수마다 봇 응답과 chain 증가를 진행. Stage queue는 sequence별340/180ms 처리. 이번 스크립트 마지막 timeout 전 flight timeline 미저장. | 실제 봇 응답 확인; 상세 timeline 이번 A 미검증 |
| 패스·막힘·보너스·팀 정산 | 실제 사람 패스2회 및 막힘 정산8:16/득점16 확인. capicua/paso/result metadata UI 존재. | 패스·막힘·정산 확인; 특수 보너스 실제 플레이 미검증 |
| 보상 이벤트 시각 강도 | terminal round-end/win은 queue를 폐기해 정적 최종 정산. capicua는 roundResult 설명으로 남으나 그 stamp queue는 terminal batch에서 생략된다. | **정적 결과라는 다른 방식**, terminal 연출 재생 완료라고 주장 불가 |
| 상대 패는 count/back만 | Stage의 own hand DOM·public event·seat backs만 사용, 결과에서만 revealed hands 표시. | 구현 소스 확인; 실제 두 인증 사용자 privacy 검증 별도 |
| 연결 상태·재조회·방/버전 보호 | client refreshId, room guard, selectionVersion, syncEpoch 및 offline/live board key 존재. Effects는 identity/history baseline·hidden queue cancel. | 구현 소스 확인; 실제 Realtime 복구 이번 A 미검증 |
| 응답 유실 자동 재전송 금지 | FunctionsFetch/RelayError에서 refresh(true) 후 confirmation_unknown. 다음 queued action의 old version 검사. UI 일반 retry 문구 충돌은 위 문제4. | 구현 소스 확인; 실제 인터넷 응답 유실 미검증 |
| key repeat·길게 누름·순간 반응 | 새 Enter 반복은 사람 수1개,650ms 손패 press는 확정0개,Space선택/취소 정상. source select 즉시 state 갱신. | 대표 입력 확인; 선택 latency100ms 목표 수집 미완료 |
| 125%·최소폭·방향 변경 | 1152×720 대응 top: table x50–1102, hand y≈808–870. scroll479 뒤 hand y≈329–391, documentWidth1152. | viewport 대응 검사; **실제 브라우저125% 확대 미검증**, firstfold 손패는 아님 |
| 감소된 모션·무음·포커스 | matchMedia/CSS 이동 제거 및 preference UI 유지, 이번 모달/선택 focus 검사. | 소스 확인·일부 focus 실측; 이번 reduced runtime·물리 음향 미검증 |
| 펠트/우드/재질·asset family | SVG 수지/핍+생성 펠트 WebP와 CSS 우드. 이번 화면에서 읽힘. wood는 이미지 asset 대신 CSS이다. | 구현·시각 확인, 다른 제작 방식 |
| production profiling 전후·60Hz budget | 이 A는 Vite dev, renderer frame/paint/decode/음향·네트워크 각각 profile하지 않음. Root의 별도 운영 측정은 이 A와 독립 근거다. | **이번 A 미검증**, 이전 대비 성능 승인은 별도 |
| 실제 두 사용자/두 기기 전체 경기·지연·expiry·복구 | 이 A는 같은 브라우저 demo의 두 좌석. root의 SQL fixture 두 context는 실제 서비스·기기 인증과 구별한다. | **실서비스 미검증** |
| original 대비 상업 품질 | 공개 원작을 새로 직접 비교 플레이하지 않음. 통합 UI의 대표 사용성과 현 규칙만 평가했다. | **미검증**, 테스트/점수로 대체 불가 |

수정은 위 네 가지 UI 문제를 한 묶음으로 처리한 뒤 그 부분만 한 확인 패스로 검증하는 것이 적절하다. 새 renderer·BGM·일괄 shake/hit-stop은 필요하지 않다. 기본 손패와 공개판은 지금 크기를 유지한다. PRODUCT.md의 Impeccable schema drift는 context loader가 보고했으나 이 UI 평가에서 고치지 않았다. 필요하면 root가 별도 `init`으로 정리할 수 있다.

Questions delegated to parent synthesis: 실제 두기기 출시 관문과 위 P2 UI수정의 우선순위는 Assessment B까지 종합한 뒤 root가 사용자에게 제시한다. 이 A 작업 자체에서는 UI편집·배포·commit/push를 수행하지 않았다.

## 수정 후 확인

A/B 합성 이후 Luna의 조작/문구와 Sol의 공개 사건 aria-live·11px 보조 글자 수정을 확인했다. 확정 뒤 보드 맥락 focus, Esc 뒤 손패 focus, KO/ES 불가 끝 이유, false 응답에서 선택 보존, round-over 정산 문구, 긴 체인/가이드 가로 넘침 없음이 통과했다. 관련24검사·TypeScript 통과, 브라우저 오류0. Sol 최종 점수는 효율2→3·복구2→3으로30/40이다. 실제 음성 출력·두 기기 Realtime·드래그는 완료로 표시하지 않는다. 임시 캡처 정리 후의 근거와 영구 재현 경로는 [통합 재검수](GAME-READINESS-RECHECK.md)에 있다.
