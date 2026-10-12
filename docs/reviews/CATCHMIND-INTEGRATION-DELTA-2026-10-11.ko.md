# 캐치마인드 완료본 보존을 위한 통합 차이

**최신 통합 완료:** ccec83d fetch로원본f0/5f/1c객체확보. 부모승인4ac의캐치마인드UI/engine/client/server를범위별통합했고현재해당핵심source는일치한다. ac25936의최신KO마스크공백보정도그대로반영했다. 아래표는소스확보전의차이기록이며현재미반영목록이아니다. 실제Edgehandler/clock/CAS/채우기/272단어/고정마스크회귀통과, 도움말도주제단일선택/고정글자수로갱신. 최종Luna분리세션검수는아직미실행.

부모 보유 개선 `f0c6d01a53eeac96cb4d55804689b6724bfc184e` 및 캐치마인드 `5f7e75d3602365e081e9f59bf585f05bf812cfea` 객체는 이 checkout에 없다. 아래는 **현재 소스에서 확인한 차이**와 부모 완료본을 보존해야 하는 경계다. 해당 두 commit의 실제 diff나 전체 테스트를 직접 검증했다고 주장하지 않는다. 구판에 최신 기능을 중복 재구현하지 않는다.

| 통합 지점 | 현재 checkout에서 관찰 | 완료본에서 보존할 사항 |
| --- | --- | --- |
| `src/app/CatchmindTable.tsx` `bucketFill`/pointer handler | region이 canvas42%를 넘으면 false; redraw는 결과 무시, fill pointer는 queue 처리 후 서버 fill 전송. 빈 캔버스 채우기가 시각 적용 없이 기록될 수 있음. | f0의 큰 영역/빈 캔버스 채우기와 무안내 실패 수정의 실제 diff를 우선 적용. no-op/실패 안내·undo/순서·두 viewer redraw를 부모 구현과 함께 보존. 이번 branch는 이 파일을 수정하지 않음. |
| `src/games/catchmind.ts` state/actions/view | `round`, `drawer`, `wordChoices`, `phase: choosing/drawing/round-over/finished`, 기본6라운드. guess는 drawer 금지, 정답 즉시 round-over. | 5f7e75d의 단일 주제·기존 동시 정답 계약·타이머·타임오버·재시작을 통째로 보존. 현재 교대 라운드와 중복 점수 처리로 되돌리지 않음. 실제 양언어 입력/동시 요청의 원래 계약은 부모 source/tests를 기준으로 판단. |
| `src/app/beginner-guides.ts`, `src/games/rules.ts` | 구판6라운드/출제1점·정답1~3점/역할교대 안내, Spanish accent 정확성은 NFC lowercase trim 기준. | 최신 단일 주제 도움말과 버튼/시간/끝 조건을 부모 완료본과 함께 합침. 구판 설명을 새 state에 표시하지 않음. 정답 정규화/별칭은 기존 완료 구현 계약을 유지. 이번 후속 변경은 다빈치/Marble 문구에만 한정. |
| `src/app/PlayApp.tsx` tick effect | drawing+deadline에1초 갱신, deadline/hint requestKey dedupe 후 api.tick. | 최신 타이머 상태/재시작 identity/timeout 단일 실행/언어별 view를 함께 유지. deadline와 phase props만 구판으로 되돌리지 않음. 이번 branch가 이 파일에 새 변경을 하지 않았음. |
| `src/core/client.ts` sendChat/tick/sendAction | drawer 제외 채팅만 guess; choose 시 deadline 시작, drawing 종료 시 null. tick은 시간/힌트 갱신, local/online 분기. | 서버와 로컬 최신 주제/정답/동시 요청/timeout/restart 조건을 일치시킴. 네트워크 재시도·stale version·요청 ID 보존. 기존 사용자별 language 저장 유지. |
| `supabase/functions/action/index.ts` | 서버 clock timeout 처리, drawer 제외 chat guess, choose deadline, 비drawing deadline null, room CAS commit. | 최신 5f의 서버 정답 계약/타이머/종료/재시작 및 request idempotency를 함께 합침. 클라이언트만 바꾸고 서버를 구판으로 두지 않음. 해당 서버 파일은 이번 branch에서 수정하지 않음. |
| `supabase/functions/_shared/engines.js` | 생성 파일은 이 checkout의 구판 Catchmind를 포함. 후속 생성 diff에는 Marble/Lisyeon도 있음. | **파일 전체 복사 금지**. 부모 최신 `src/core/server.ts`와 engines를 유지한 통합 source에서 `npm run build:edge`로 다시 생성. 이번 generated diff의 Marble 부분을 수동 복사하기보다 source부터 합침. |
| 도움말/캔버스 이미지 | 현 guide webp는 이전 라운드 UI를 예시로 표시할 수 있음. | 최신 화면의 주제/정답/타이머와 불일치하는 안내 이미지·설명은 최종 통합 검수에서 식별. 새 개인 이미지와 혼합하거나 공개 업로드하지 않음. |

통합 순서: 부모 완료본을 기준으로 독립 브랜치에서 이번 변경 중 필요한 Marble/다빈치/도움말을 범위별 합친다. 충돌에서 Catchmind 관련 state/client/server/UI/help/tests는 부모 최신 변경을 우선 보존하되 이번 공통 변경 필요 여부를 source diff로 확인한다. 생성 Edge는 마지막에 재빌드한다. 체크아웃/원본 사용자 변경을 버리는 reset/강제 덮어쓰기를 사용하지 않는다.

코드 회귀는 부모 최신 `catchmind.test.ts`, `CatchmindTable.test.tsx`, `client.test.ts`, `client.online.test.ts`, `authority.test.ts` 및 부모 추가 테스트에 맞춰 수행한다. 최종 actual play는 Luna가 KO/ES **분리된 두 세션**에서 단일 주제·양언어/동시 정답 계약·deadline 직전/직후·time-over 단일 반영·재접속·두 동의 재시작을 확인해야 한다. 이번 문서 작성에서 인게임 반복 검수는 실행하지 않았다.
