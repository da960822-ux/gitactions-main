# 일곱 게임 도움말 ↔ 실제 소스 대조

범위: `1feaca3` 이후 현재 checkout에서 KO/ES 도움말, 첫 행동, 선택 뒤 확정, 종료/승리 조건을 읽고 대조했다. 인게임 화면/음향/최종 두 세션 QA는 수행하지 않았다. 부족한 최신 커밋을 현재 소스에 포함했다고 주장하지 않는다. 새 문구는 엔진 규칙을 바꾸지 않는다.

| 게임 | 첫 행동과 확정의 실제 소스 | 종료/승리 소스 대조 | 결과 |
| --- | --- | --- | --- |
| 도미노 | `DominoBoard.tsx`: 손패 선택 → `시작 타일 X\|Y 놓기` / `Jugar ficha inicial X\|Y`, 이후 열린 왼쪽/오른쪽 끝이 곧 확정. Esc는 확정 전 선택 취소. | `games/domino.ts`: 빈 손패가 라운드 승리; 연속 패스2/4로 막힘, 기본 팀 합/설정 lowest-player 비교; 목표0은 한 판,100/200 누적. | `DominoQuickGuide.tsx`에 Esc 추가. 설정별 동점/보너스는 기존 세부 규칙 범위. |
| 자이푸르 | `JaipurBoard.tsx`, `games/jaipur.ts`: `가져오기` / `Tomar` 탭 → 옷감 선택 → `가져오기: 옷감` / `Tomar: tela`. 교환 탭 → 2–5 같은 수 → `N장 교환` / `Cambiar N cartas`. 판매 상품/수량 → `N장 판매 확정` / `Confirmar venta de N`. 확정 전 취소. | `isRoundOver`: 3종 상품 더미가 비거나 **덱이 비면** 끝. `finishRound`: 토큰 점수+낙타 다수5; 2승 또는3라운드 종료, 승수 동점 draw. | `JaipurQuickGuide.tsx`의 실제 확정명, 덱 종료 문구와3라운드 승수/동점 보완. 덱이 비어도 시장 보충 실패까지 기다리는 규칙으로 임의 변경하지 않음. |
| 스플렌더 | `TableGames.tsx`: 보석 색 선택 → `보석 가져오기` / `Tomar gemas`; 카드 → 비용 확인 → `구매 확정` / `Confirmar compra` 또는 예약 확정. ×/Esc는 확정 전 카드 취소. | `games/splendor.ts`: 15점 도달 뒤 양쪽 동일 턴 수; 점수→구매 카드 수 적은 쪽→draw. 귀족/예약/10토큰 한도 유지. | `SplendorQuickGuide.tsx`에 ×/Esc 추가. 기존 비용·점수·원본 귀족 아트 교체 없음. |
| 민화투 | `MinhwatuTable.tsx`: 내 손패 선택 → 후보2면 실제 바닥 선택으로 확정, 그 외 `N월 패 내기` / `Jugar la carta del mes N`. 더미 공개 자동, 후보2면 다시 선택. Esc로 선택 취소. | `games/minhwatu.ts`: 양쪽 손패와 덱이 비면 끝; `scoreMinhwatuMatch` 결과 높은 점수, 동점 draw. 기본/족보×2−상대족보와 Godori50 유지. | 기존 선택/확정·달 매칭·종료 설명 일치. `MinhwatuGuide.tsx`에 Esc 취소 안내 보완. |
| 다빈치 | `DaVinciTable.tsx`: 조커 + 배치 → 준비 완료, 타일 뽑기 → 상대 타일/숫자 → `이 숫자로 추측하기` / `Adivinar este número`(조커 별도) → `추측 확정` / `Confirmar`. 확정 전 취소. | `games/davinci.ts`: 상대 타일 전부 공개하면 승리; 오답은 이번 뽑은 타일 공개, 덱 빈 경우 추가 공개 없음. | `beginner-guides.ts`에 두 단계 확정 버튼과 취소 명시. 새 개인 그림은 비공개 주입 대기, 규칙과 상대 숨김 유지. |
| 부루마블 | `MarbleBoard.tsx`: 첫 roll 전 말 선택 → `주사위 굴리기` / `Lanzar los dados`; 빈 도시 구매/지나가기; 내 도시 선택 → 실제 건설 행동; 차례 마치기. | `games/marble.ts`: 파산 또는120턴, modern 순자산/legacy 현금; saved 경제0/1은 건설100, fresh 경제2는40/60/80%. | 구판 Spanish 안내를 실제 `Lanzar los dados`로 정정. 경제별 건설 예시·승리 조건 분기 유지. 30번 세계여행 이동 연출에서 p1아시아나/p2젯블루 모티프 KO/ES 연결 확인. |
| 캐치마인드 | 현재 `CatchmindTable.tsx`: 단어 버튼 즉시 choose, 공유 채팅 `PlayApp.tsx` 입력/전송이 guess, 그리는 사람의 다음 라운드/종료. | 현재 `games/catchmind.ts`는6라운드/교대 출제/1~3점/최종 점수, 부모 완료 `5f7e75d`는 최신 단일 주제 계약. | **통합 차단**. 구판 도움말을 최신 단일 주제 완료본에 복사하지 않는다. 최신 소스 전달 후 버튼/양언어 정답/타이머/종료/재시작을 해당 계약과 함께 대조. 아래 별도 통합 문서 참조. |

아시아나/젯블루 연결은 `lastMove.source === 'train' && lastMove.from === 30` 연출에 한정한다. 제목은 `둘의 상상 여행` / `Nuestro viaje imaginado`이고, 실제 노선/운항 보장/브랜드 제휴 문구를 넣지 않았다. 기존 `choose-train`, 운임, 이동 거리, 출발 보너스와 착지 효과는 변경하지 않았다. 다른 열차역이나 황금열쇠를 항공 이동으로 강제 바꾸지 않는다.

번역 확인 범위는 위 도움말과 대표 행동/확정/승리 조건이다. 게임 전체 희귀 카드·설정·오류·기기별 접근성·새 통합 Catchmind 번역 전수 완료 판정이 아니다.

검증: PlayApp 기존26 회귀 통과. MinhwatuGuide의 기존 ES 상세 문구 검사1건이 축약 문구 때문에 실패한 뒤 source에 더 명확한 원래 표현을 복원해 관련3 검사 통과. 마지막 TypeScript/Vite/Edge build 통과. 동작 엔진/경제/서버 파일 diff 없음.
