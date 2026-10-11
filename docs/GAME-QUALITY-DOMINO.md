# 도미노 품질 개선 제안

분석 대상: `da960822-ux/gitactions-main`, `origin/main` 59d1047. 로컬 HEAD는 과거 일기 프로젝트이므로 모든 프로젝트 근거는 `git show origin/main:<path>`로 확인했다. 분석/제안만 수행했으며 앱 파일을 수정하지 않았다. AGENTS.md 및 ponytail full 적용. 8게임, 무료 운영, 비공개 손패 보호, 기존 규칙 유지.

## 현재 갖춘 것과 시장 비교의 한계

현재 도미노는 단순 프로토타입 규칙만 있는 상태가 아니다. 28종 SVG 타일/뒷면, 엔진이 만든 합법 수, 좌우 끝 선택, 1대1/두 종류 팀전, 세 단계 봇, 목표 점수, 카피쿠아/파소/트랑케 설정, 확인된 이벤트 기반 모션/게임별 합성 효과음, 점수 정산, 비공개 패 보호가 있다. 이를 다시 만드는 대신 플레이 무대와 반응의 완성도를 높인다.

실재하는 시장 참고 제품은 Flyclops의 **Domino!**이며 공식 출처 후보는 https://www.flyclops.com/ 이다. 보조 비교 후보는 Board Game Arena의 도미노 페이지 https://boardgamearena.com/gamepanel?game=dominoes 이다. 2026-10-11 두 URL의 읽기 요청은 클라우드 프록시 CONNECT 403으로 차단됐다. 현재 판매 상태·기능 목록·UI·실제 조작을 직접 검증하지 않았으며, 아래 기준은 경쟁사가 모두 구현했다고 주장하는 표가 아니라 현재 소스와 기존 감사 기록으로 도출한 제품 품질 목표다. 경쟁사 규칙/아트/화면을 복제하지 않는다.

관련 근거: docs/SESSION-HANDOFF.md, GAME-POLISH-DOMINO.md, QUALITY-VISUAL-AUDIT.json, DominoBoard/Tile/EventStage/chain/motion, CSS, domino engine/test, audio, RoomClient, deployment. 기존 문서의 테스트 통과는 기록을 읽은 것이며 이번에 다시 실행하지 않았다.

## 1. 스크롤 없이 완결되는 하나의 테이블 — P0

- 현재 근거: `DominoBoard.tsx:177–224` 제목·팀 요약·좌석 카드가 별도 행이고, `245–256` 여섯 설정 다음 `258`에 손패가 배치된다. 기존 시각 감사에서 KO 1440×900 보드 높이 1172px, 시작 y194, 내 손패가 화면 밖이다. ES 1920×1080도 보드 높이 918px, 시작 y296이다. 이는 현재 직접 찍은 캡처가 아닌 저장된 감사 결과다.
- 목표 흐름: 작은 점수/라운드 리본 → 중앙 펠트 체인 → 바로 아래 내 랙. 2/4좌석을 테이블 둘레의 작은 공개 정보로 놓고 진행 중 여섯 설정은 테이블을 밀지 않는 설정 창에 둔다. 룰 확인은 가능하되 보드를 압박하지 않는다. 종료 때 공개 패는 확대해서 확인 가능한 결과 영역으로 전환한다.
- 구조/자산: 현 DominoBoard 내부 구역 재배치와 CSS grid; root 공통 room shell 축소 필요. 엔진·SVG·행동 계약은 재사용한다.
- 검증: KO/ES 모두 1440×900에서 개시/4좌석/긴 체인/패스/라운드 종료의 체인·내 패·양끝·주 행동·점수가 세로 스크롤 없이 보인다. 기본 7패 전체가 식별되고 상단 여백은 root 포함 150px 이내. 1024 폭 및 터치 크기 44px 확인.

## 2. 끝 선택을 숫자와 실제 결과로 보여주는 조작 — P0

- 현재 근거: `DominoBoard.tsx:228–240,258–269`는 손패 클릭 뒤 체인 양끝에 좌/우 버튼을 표시한다. 끝 숫자는 별도 작은 배지이고, `domino-premium.css:77–93` 체인은 가로 스크롤이다. 긴 체인의 전체 상황과 양끝을 동시에 이해하는 비용이 크다. 합법 끝만 표시하는 보호는 이미 있다.
- 목표 흐름: 패를 선택하면 손에서 즉시 들리고, 양끝의 매치 숫자 및 놓은 뒤 새로 열릴 숫자가 실제 방향의 반투명 타일로 표시된다. 사용자가 끝을 누르면 보낸다. 양끝 모두 합법이면 어느 쪽인지 반드시 선택한다. 선택 취소는 같은 패/Esc. 클릭·터치 흐름을 기본으로 완성한 다음 같은 합법 끝으로 드래그를 더할 수 있다. 잘못된 드롭은 원위치로 복귀하며 요청을 보내지 않는다.
- 구조/자산: 현 engine actions를 그대로 사용하고 `orderDominoChain`에 의한 논리 순서와 타일 orientation 보존. 우선 양끝 도크를 스크롤 영역 밖에 고정하고, 중앙은 읽을 수 있는 크기로 유지. 후속으로 테이블 안을 돌아가는 2D 체인 배치를 만들면 긴 판에서도 끝이 사라지지 않는다. Pointer Events를 쓸 수 있어 새 드래그 라이브러리는 필요 없다. hand index를 재정렬하면 원래 엔진 index를 반드시 유지한다.
- 검증: 첫 수/한쪽 합법/양쪽 합법/더블/0/긴 체인에 대해 사용자가 예측한 새 끝과 확인 후 끝이 일치. 키보드만으로 선택→끝→취소 가능, 선택·합법·포커스가 서로 구별됨. 빠른 클릭/다른 수신 상태에서는 다른 타일이 나가지 않는다. 드래그 추가 시 판정은 위치가 아닌 engine action으로 재검증.

## 3. 작은 그림과 대기 상태까지 통일한 실물감 — P1

- 현재 근거: `DominoTile.tsx`에는 수지/모서리/핍/황동 SVG 재질이 이미 있다. 반면 테이블은 CSS 방사형 펠트/나무 그라디언트이며 EventStage TileArt는 다른 간단한 타일 그림을 만든다. `domino-premium.css:123`는 비활성 패 opacity .54로 읽기까지 약화한다. 결과 공개패는 `70` overflow hidden, 42px 타일로 길면 잘릴 수 있다.
- 목표 흐름: 내 차례가 아니어도 패를 또렷하게 읽고 전략을 생각한다. 조작 가능 여부는 랙/표시로 구별하며 흰 타일 자체를 흐리지 않는다. 보드·손·미리보기·이벤트·공개 결과가 같은 재질이다. 종료 후 모든 공개 패를 빠짐없이 확대해 확인할 수 있다.
- 구조/자산: 현 SVG 28종을 유지·재사용하고 프레이밍/조명 체계를 맞춘다. 도미니카 클럽 테이블 방향의 직접 제작 또는 사용 허가된 펠트/우드 텍스처와 일관된 좌석 배지 소수. 이벤트 속 타일은 DominoTile 공용 컴포넌트 사용. 새 3D 엔진·외부 이미지 CDN·스킨 상점은 필요 없다.
- 검증: 100% 크기에서 0–6 핍, 상대 뒷면, 더블 방향, 마지막 타일이 구분된다. 타일 앞/뒤 개인정보 조건 유지. 기다림/비합법/선택/포커스 상태가 색만으로 구분되지 않으며 읽기 가능한 대비를 측정. 결과에는 공개 패 누락/잘림이 없다.

## 4. 손에서 실제 끝까지 이어지는 확인 기반 모션 — P1

- 현재 근거: 도착은 `domino-premium.css:166–167`에서 끝 근처 14px 이동/회전, 260ms다. `DominoEventStage.tsx`는 개별 공개 이벤트를 430ms씩 별도 영역에 보여준다. 엔진 `runBots`는 한 action에서 여러 봇 수를 처리하므로 도미노 보드에는 여러 신규 타일이 같은 스냅샷으로 도착할 수 있다. 마지막 sequence만 자동 스크롤한다(`DominoBoard.tsx:128–138`).
- 목표 흐름: 클릭 후 즉시 선택 반응 → 서버 확인 중 손패는 소유권 유지/진행 표시 → 확인 후 내 타일이 랙에서 선택 끝으로 이동·회전·착지 → 열린 끝과 좌석 패 수가 정착. 봇은 공개된 tile/by/side만으로 좌석 뒷면에서 플레이 타일로 전환하며 순서대로 짧게 재현한다. 네트워크 실패에는 착지/점수/승리 연출이 없다. 정상 수의 이동과 차례가 길게 알림 대기하지 않는다.
- 구조/자산: sequence 큐와 현재 공용 피드백을 확장; 공개 이벤트의 actor/side/tile 이용, source/target rect는 로컬 UI에서 계산. 실제 손패를 공용 이벤트에 추가하지 않는다. 게임 상태는 최신 권위 상태를 유지하고 모션은 표시 계층에서 재현. reconnect backlog는 재현하지 않고 현재 상태로 정착한다.
- 검증: 두 브라우저에서 1수/봇 연속2수/패스/종료 순서가 같고 각 play sequence는 한 번만 착지한다. 지연/중복/재접속/탭 복귀에 오래된 움직임 없음. 60Hz 기기에서 frame/입력 지연 측정. reduced motion은 이동 대신 즉시 정착과 강조를 제공한다. 입력 피드백은 100ms 이내 목표, 서버시간은 별도로 표시·측정하며 100ms 완료를 약속하지 않는다.

## 5. 현재 효과음을 테이블의 촉감으로 마무리 — P1

- 현재 근거: `audio.ts:282–316`에 select/place/pass/turn/tranque/capicua/paso/score 전용 합성 소리가 있다. 합성 유무가 아니라 실제 청취 품질·착지 타이밍·물리 기기 출력이 미검증이다(핸드오프). 사운드는 기본 off이고 사용자 설정과 기존 transport가 존재한다.
- 목표 흐름: 선택에는 작은 리프트/접촉음, 서버 확인된 착지에는 짧고 무게 있는 수지 타일 탁음, 패스에는 낮은 테이블 터치, 점수에는 절제된 마무리. 턴 알림은 플레이를 방해하지 않는다. 보너스·점수·승리 연속은 한 결과 표현으로 정리해 소리가 쌓이지 않는다.
- 구조/자산: 기존 Web Audio·음량·mute·gesture unlock 재사용. 필요하면 직접 녹음/정당한 사용권을 가진 짧은 타일/펠트 샘플 2–3개를 가볍게 묶고 variation으로 반복 피로를 줄인다. 단순히 mp3를 늘리는 것을 목표로 하지 않는다. BGM·유료 API는 추가하지 않는다.
- 검증: 실제 폰/노트북/이어폰에서 착지 프레임과 음 시작 목표 차이 ≤50ms 측정, 겹침·클리핑·지나친 고음 없음 청취 확인. mute/음량/화면 숨김/첫 gesture/재접속 동작 유지. 음향 없이도 모든 이벤트를 이해할 수 있다.

## 6. 설명을 읽지 않아도 이해되는 첫 수·패스·정산 — P1, 봇 고도화 P2

- 현재 근거: 개시 버튼은 합법 최고 타일을 바로 놓을 수 있으나 왜 그 타일인지 보드에서 설명하지 않는다(`228`). 패스 버튼은 존재(`268`). 카피쿠아/파소/트랑케/점수 설명과 결과는 이미 있으며 정산은 여러 text row와 작은 공개패로 나뉜다(`273–282`). `chooseDominoBotAction:87–105`의 보통은 큰 패 우선, 어려움은 자기 패의 지원/공개 노출을 계산하는 결정적 휴리스틱이다. 상업 수준 강도를 입증한 측정은 없다.
- 목표 흐름: 첫 판만 '최고 더블로 시작', 선택 중 '이 끝과 6이 맞아요', 못 놓을 때 '양끝 2·5에 맞는 패 없음'을 해당 물체 옆에서 짧게 안내. 종료는 공개 패의 pip 합→판 승점→보너스→누적 목표를 한 정산판에서 추적. 카피쿠아는 직전 양끝과 마지막 비더블로 이유를 설명하며 보너스 off이면 성립과 추가 점수 없음을 나눈다. 결과 뒤 다음 라운드가 시선 안에 있다.
- 구조/자산: existing actions/settings/roundResult/log 재사용. 도미노 하우스 규칙을 보편 규칙으로 바꾸지 않는다. 봇 개선은 나중에 무료 규칙 기반으로 공개 seat별 pass 이력/자기 남은 지원/팀 차례를 평가하되 상대 손패 접근 금지. 불필요한 새 난이도/과금 AI는 만들지 않는다.
- 검증: 처음 접한 KO/ES 사용자에게 규칙 문서를 미리 보여주지 않고 개시→양끝 선택→패스→점수 설명 과제를 수행시키며 원인과 승점을 설명 가능한지 본다. 기존 rare-event fixtures+실제 플레이 종료를 함께 확인. 봇 변경 시 동일 seed 배치의 승률/실수/계산시간을 기존과 비교, 상대 비공개 패 변경에 행동이 영향받지 않는 테스트 유지.

## 7. 연결 상태가 조작을 속이지 않는 온라인 품질 — P0, root 공통 과제

- 현재 근거: `core/client.ts:40–56` subscribe는 SUBSCRIBED만 후처리하고 snapshot에 연결 상태가 없다. version 회귀 차단/직렬 요청/stale_state retry/requestId는 이미 있다(`97–109`). DominoBoard는 busy와 일반 오류 문구만 보여준다(`143–152`). 저장된 fixture는 Realtime WebSocket을 구현하지 않아 실서비스 두 기기 검증이 남았다.
- 목표 흐름: 정상/전송 중/상태 확인 중/재연결을 구별한다. 응답이 끊긴 수는 아직 처리 여부가 불명임을 표시하고 최신 권위 상태를 확인한 뒤 다시 행동한다. 새 상태와 엔진 action을 기준으로 selected index를 재확인한다. 새로고침 후 익명 세션·자기 손패·순서가 돌아오고 과거 효과는 재생하지 않는다.
- 구조/자산: root가 RoomClient/PlayApp 공유 연결 모델·실제 재시도·응답 유실 처리를 맡고 도미노는 그 상태를 랙/선택끝에 보여준다. 도미노 단독 polling/채널/인증을 중복으로 만들지 않는다. 무료 요금제 범위에서 현재 snapshot+Realtime 경로를 측정한다.
- 검증: 실제 Supabase에서 KO/ES 서로 다른 두 기기, 100–200점 완주와 네트워크 절단/복귀/중복클릭/응답 유실/동시 요청/방 전환을 검사. 확인되지 않은 수에 성공 연출 0회, 같은 확정 수 중복 적용 0회, 상대/봇 손패 노출 0건. 정상 네트워크의 수 전달 p50/p95와 복귀 시간 측정 후 합격 기준 확정.

## 구현 순서와 범위

1. root가 compact room shell·connection/action status 계약을 정하고 도미노가 한 화면 테이블 및 고정된 ends/hand를 완성.
2. 클릭/키보드/터치 선택→미리보기→끝 확인 흐름 완성; 개시/패스/정산을 같은 무대에 통합.
3. 기존 SVG 재사용한 물체 통일 → sequence 기반 이동/봇 공개 순서 → 실제 착지에 맞춘 음향 청취 검증.
4. 실제 두 기기 KO/ES 전체 매치와 실패/재접속/접근성을 통과시킨 후 드래그·2D 굽은 체인·봇 강도 향상을 필요에 따라 추가.

root 과제: 헤더/공통 세션·요청·복구·접근성 상태와 여러 게임 회귀, 실서비스 2기기/무료 운용 측정. 도미노 소유 과제: 테이블·끝/손패 조작·타일 재질·모션·도미노 SFX·규칙/정산 표현. 공통 오류를 도미노 내부의 중복 네트워크 코드로 해결하지 않는다.

리스크: hand sorting/animation은 엔진 index와 확인 sequence를 잃으면 다른 타일 전송/중복 연출이 발생한다. 원점 이동에 상대 hand를 추가해서는 안 된다. 자체 녹음/자산의 사용권을 남기고 기존 하우스 규칙을 유지한다. 무료 Supabase에는 상시 가용성 보장이 없으므로 제품 품질 목표와 유료서비스 uptime 보장을 혼동하지 않는다. 과금·랭킹·매칭·스킨 상점·4인 인간 좌석 확대는 이번 목표의 필수 기능으로 요구하지 않는다.

직접 경쟁사 플레이, 새 브라우저 캡처, 실제 Supabase/물리 음향 검증과 앱 구현은 수행하지 않았다. 위 합격 기준은 계획이며 상업 품질 통과 주장으로 사용하지 않는다.

## 설치 스킬 적용 후 보완

사용자 요청으로 설치된 Awesome GameDev Agent Skills upstream `0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd`를 읽어 기존 제안을 보완했다. 출처는 https://github.com/gamedev-skills/awesome-gamedev-agent-skills 이며 설치 위치는 `/workspace/gitactions-main/.agents/skills`다. router 본문에 따라 프로젝트를 React 19 DOM/SVG/CSS/Web Audio로 확인했다. 전문 게임 엔진 fingerprint가 없는 기존 웹게임에 discipline 개념을 적용하며 Godot/Unity/Phaser로 전환하거나 엔진 코드를 가져오지 않는다. 아래는 계획 보완이며 구현·실측·새 자산 생성은 아니다.

### 적용 본문/참조와 바뀐 판단

| 근거 스킬 | 기존안에서 더 구체화하거나 제한한 판단 |
|---|---|
| `game-ui-ux/SKILL.md` + `references/layout-and-flow.md` | 화면에 들어오게 단순 축소하는 것 대신 CSS grid/flex로 playfield와 랙을 앵커링한다. KO/ES 긴 문구의 줄바꿈으로 랙이 밀리지 않게 공간 배분을 정한다. 설정/결과 창의 첫 focus·focus trap·Esc 닫기·기존 focus 복귀까지 합격 기준에 포함한다. 창이 열리면 뒤 테이블에 입력이 전달되지 않으며 게임/Realtime은 멈추지 않는다. 모바일 조작을 제공할 때 `env(safe-area-inset-*)`와 화면 회전/브라우저 toolbar 변화를 검사한다. 새 범용 화면-stack framework를 만드는 것은 필요 없다. |
| `input-systems/SKILL.md` + `references/buffering-and-accessibility.md` | 클릭·키보드·터치 입력을 `selectTile`, `chooseEnd(left/right)`, `cancelSelection`, `pass`, `nextRound` 같은 명명된 행동으로 연결한다. native button activation은 재사용하고 커스텀 keydown은 `event.repeat`를 무시하며 press edge 하나가 요청 하나만 만든다. select/confirm 전에 active turn, busy, 해당 tile의 현재 engine index와 value, 최신 legal action을 재검증한다. 수신 hand 변경/라운드/방 전환/설정 변경에는 선택을 폐기하거나 같은 타일임을 확인한다. 드래그는 필수 조작으로 만들지 않고 `pointercancel`/잘못된 드롭에 복귀한다. 플랫폼 게임식 100–150ms 버퍼를 도미노 수에 그대로 적용하지 않는다. 네트워크 대기/다음 차례/모션 종료 뒤 오래된 수를 자동 송신하는 입력 큐는 금지한다. |
| `game-feel/SKILL.md` + `references/feedback-recipes.md` | '더 많은 연출' 대신 이벤트 중요도별 2–3개 반응만 사용한다. 선택은 lift+짧은 pick; 확인 play는 source→end 이동+착지음+현재 끝 강조; 확정 보너스/종료는 짧은 seal/정산 숫자+절제된 sound. 수지 타일에는 과장된 squash/stretch보다 형태를 보존하는 ease-out 정착을 쓴다. 화면 shake·hit-stop·flash·particle 5–8종을 도입하지 않는다. 모션은 최신 권위 상태 위 표시 계층이며 새 input이나 server update를 막지 않는다. reduced motion은 공간 이동/과장을 끄고 정착 상태·숫자·한 번의 강조를 유지한다. |
| `create-game-assets/SKILL.md` + `references/art-direction.md`, `raster-pipeline.md`, `provenance.md`, `assets/art-direction-brief.md`, `asset-manifest.json` | 기존 28종 타일을 다시 생성하지 않고 하나의 승인 대상 family로 유지한다. '클럽 테이블'이라는 분위기 표현을 정면/탑뷰, ivory resin+brass+deep green felt, 동일 좌상단 부드러운 광원, 낮은 배경 대비, 검정 핍 가독성, 단단한 형태/짧은 settle로 고정한 style brief로 바꾼다. manifest에는 28 face/1 back, selected/playable/waiting/preview/result 상태, felt/wood, event seal, 선택적 SFX의 path·화면 크기·anchor·권리·검증 상태를 기록한다. Contact sheet는 기존 chain76px/hand96px/공개42px와 새 설계의 실제 크기에서 0–6/더블/뒷면/초점 상태를 함께 보여준다. 확대 미감만으로 승인하지 않는다. 신규 텍스처는 3×3 반복/압축 후 브라우저 배경에서 점검하며 숫자·라벨·포커스는 코드로 유지한다. SVG는 벡터 품질을 유지하고 raster contact sheet용 nearest-neighbor를 실제 SVG에 강요하지 않는다. |
| `audio-design/SKILL.md` | 기존 SFX GainNode·음량·mute·gesture unlock을 유지하고 현재 선택/착지/턴/점수의 상대 loudness를 먼저 청취한다. 반복 착지는 소수 take 또는 아주 작은 pitch 변주로 조절하되 sequence 중복 재생 방어는 유지한다. 선형 GainNode 값은 최종 출력에서 쓰고, 청취/혼합 기록은 dB로 비교한다(`20*log10(gain)`, 0은 silence). 기존 저장 볼륨 의미를 몰래 바꾸지 않는다. Master clipping/headroom과 voice cap을 검사하며 소리가 겹친 경우만 우선순위/감쇠를 수정한다. 음악이 없는 도미노에 Music/Voice 버스·adaptive music·beat quantization·ducking을 의무 도입하지 않는다. 착지음은 사용자 입력 시점이 아닌 확인된 착지/표시 시점과 맞춘다. |
| `performance-optimization/SKILL.md` + `references/profiling-and-budgets.md` | 기존안의 60Hz 목표를 검증 절차로 보강한다. 최적화와 새 raster/art 확정 전에 release build에서 최대 체인+4좌석+봇 연속수+정산/reduced-motion의 baseline을 브라우저 Performance timeline으로 측정한다. input→선택표시, layout/paint/composite, SVG filter, React commit, 메모리, 요청→확인상태/상대표시 시간을 분리한다. network p95와 frame time을 섞어 '느린 렌더링'으로 단정하지 않는다. 60Hz 16.67ms는 프레임 예산이며 결과 개선을 실측으로 확인한다. SVG→atlas, pooling, 무차별 memoization, Canvas/WebGL 전환은 측정된 병목 없이는 실행하지 않는다. |

### 실행 순서의 보완

1. **원상 baseline과 명세를 먼저**: 기존 release에서 개시/최대 체인/4좌석/봇 연속수/정산을 캡처·프로파일. 게임별 style brief와 상태/크기/provenance manifest를 작성하고 기존 SVG+펠트+HUD의 실제 크기 시안을 비교한다. root 공통 연결/요청 상태와 compact shell 계약을 맞춘다.
2. **입력과 화면을 먼저 완결**: grid/flex 테이블, 고정 ends/hand, 설정/결과 focus 흐름, named actions와 press edge, current index/legal action 재검증. 클릭/키보드/터치로 개시→놓기→패스→다음 라운드를 완주한다. 드래그·체인 곡선 배치는 기본 흐름이 합격한 뒤 추가한다.
3. **한 수로 조작감 검증**: 로컬 즉시 선택 반응과 확인된 play의 이동/착지/끝 강조 2–3채널을 구현 대상으로 정하고 실패·중복·취소·reduced motion을 함께 검증한다. 이때 얻은 frame/audio 측정으로 필요한 병목 하나만 수정한다.
4. **아트 family와 음향 확정**: 실제 크기 contact sheet→테이블 캡처→원본/압축 상태 확인→물리 기기 청취 순으로 검증하고 manifest에 passing evidence를 기록한다. 테스트하지 않은 자산은 approved로 표시하지 않는다.
5. **연속수와 실제 온라인 확대**: 동일 패턴을 봇 연속수/보너스/라운드 종료에 적용하고 실제 두 기기 KO/ES 전체 매치·응답 유실·재접속·방 전환을 검사한다. 연출 예산, 입력/확인/상대전달 p50/p95, frame 수치를 전후 비교해 합격 여부를 정한다.

공통 root에 추가할 기준은 modal focus/뒤 보드 입력 차단, 요청 중/확인 불명/복구 상태, 이벤트 backlog 폐기 정책이다. 도미노 담당은 선택 tile의 identity/index 재검증, 실제 끝 미리보기, tile family/원점→끝 모션/SFX를 맡는다. 스킬 설치는 실행 환경의 준비이며 위 개선을 구현하거나 검증했다는 뜻이 아니다.

## `faluciano/domino-party-game` 소스 확인 (2026-10-11)

사용자 제공 참고 저장소 `/tmp/domino-party-game`의 체크아웃 `c0d167b369373e5bdca6da252eec7cfb28bb646b`와 MIT `LICENSE`를 읽고 규칙/봇 구현만 대조했다. 코드나 그림은 복사하지 않았다. 이 프로젝트는 Android TV가 호스트와 authoritative runtime을 맡고 휴대폰을 컨트롤러로 쓰는 4좌석 2팀 게임이다. 현재 저장소는 1대1, 사람 2명 대 봇 2명, 혼합 사람-봇 팀전과 선택 가능한 라운드/보너스 설정을 제공하므로 참고 저장소의 제품 구성으로 대체할 근거가 아니다.

| 항목 | 참고 저장소의 동작 | 현재 저장소와의 차이 및 결정 |
|---|---|---|
| 분배/시작 | 28장을 모두 네 명에게 7장씩 나누고, 첫 라운드는 더블-6(la mula)을 놓는다. | 1대1은 14장을 쓰고 나머지는 stock에 두며, 가장 높은 더블/타일이 시작한다. 의도된 별도 변형이므로 이번 UI 작업에서 규칙을 바꾸지 않는다. |
| 막힌 판 | 네 번 연속 패스 후 낮은 pip 합계 팀이 이기고 두 팀 합계의 차이를 점수로 받는다. 정확히 같으면 팀 A에 승리를 기록하되 0점을 준다. | 1대1은 두 번, 네 좌석 모드는 네 번 패스한다. 막힘은 기본 팀 합계 또는 선택 가능한 최저 개인 합계로 승자를 정하며, 동점은 draw이고 승리 팀은 상대 팀의 pip 합계를 기준으로 정산한다. 엔진 테스트/기존 설정 계약을 유지한다. |
| 보너스/매치 | 확인한 공유 규칙에는 capicúa/paso corrido 보너스가 없고 목표는 200점이다. | 사용자가 선택하는 목표 점수, 선택 보너스, 목표가 없는 단일 라운드가 있다. 이 설정과 정산 표시를 보존한다. |
| 봇 | 가장 먼저 발견한 합법 타일을 놓는다. 첫 수에는 6-6을 우선하고 양 끝이 모두 가능하면 왼쪽을 고른다. | easy/normal/hard 세 단계 휴리스틱이 있고 어려움은 자기 잔여 타일의 끝 수 지원을 고려한다. 두 구현 모두 숨겨진 상대 손패를 봇 판단에 사용하지 않는다. 참고 봇을 복사하거나 난이도 회귀 없이 교체하지 않는다. |
| 입력/표시 | 컨트롤러는 안정 ID `tileId`와 끝을 보내며 현재 화면은 주로 양끝 합법 버튼을 선택한 타일에 붙인다. 디스플레이는 spiral chain 배치를 사용한다. | 현재 서버 경계는 hand index+side 합법 action이며 UI는 선택된 값의 안정 키로 최신 action을 재검증한다. 이 작업은 클릭/키보드 미리보기와 고정 끝 도크를 우선하며 spiral 배치, 네트워크 아키텍처, 자산은 가져오지 않는다. |

확인 근거는 참고 저장소 `packages/shared/index.ts`의 타입/`resolveRoundEnd`/`play`/`gameReducer`, `packages/display/src/use-bot-turns.ts`, `packages/client/src/App.tsx`의 선택/끝 입력이다. 이 대조는 라이선스가 있는 참고 구현의 규칙 설명이며 현재 저장소의 엔진 규칙 승인이나 상용 품질 검수를 의미하지 않는다.

## 구현 후 실제 데모 확인 (2026-10-11)

`http://127.0.0.1:5191`에서 새 로컬 데모 방을 열어 1대1 선택 뒤 설정에서 혼합 4좌석, 매치 목표 200점을 적용했다. 1440×900 Chromium에서 두 사람 좌석 선택을 번갈아 하며 사람 플레이/패스와 봇 자동 수를 진행해 라운드 1을 마쳤다. 화면은 내 팀 20 대 상대 0으로 정산했고, 공개 체인 24개와 결과 손패 4개(총 28개)가 DOM에 표시됐다. 이어 p1으로 다음 라운드를 열고 p2/ES로 바꿔 누적 20/0 및 스페인어 라운드 2 테이블을 확인했다. 페이지 오류와 액션 경보는 없었다.

기본 테이블은 y≈192–821, 손패는 y≈723–785로 900px 높이 안에 보였다. 실제 2인/봇 플레이에서 손패 버튼은 88×51px, 설정 버튼은 76×44px, 양쪽 끝 도크는 각각 76×72px였다. modal 열기 시 첫 select에 포커스가 이동했고 Esc 뒤 설정 버튼으로 돌아왔다. 첫 수는 손패를 고른 뒤 `3|3` 확인 버튼을 눌러 확정했다. 이후 체인에서 합법 타일을 고르면 양끝 도크와 방향별 새 끝 미리보기가 각각 표시됐다. 전체 페이지의 나머지 규칙/반응/방 콘텐츠는 더 아래에 있어 browser document 자체는 길지만 핵심 테이블과 손패는 첫 화면에 들어온다.

실행 증거: 전체 라운드 결과 캡처 `/tmp/domino-actual-round-end.png`, 누적 스페인어 다음 라운드 캡처 `/tmp/domino-actual-es-next-round.png`, 동작/횟수 요약 `/tmp/domino-actual-smoke.json`. 캡처는 local demo 환경을 보여주며 별도 기기 실시간 검증, 네트워크 복구, 화면 확대/실물 터치 검증은 포함하지 않는다.

## Sol 구현 및 독립 검수 기록 — 2026-10-11

이 절은 위 분석 당시의 미구현 기록 이후 실제 작업과 검사 결과다. 엔진의 기존 규칙과 28종 SVG를 유지하고, 개인 손패·공개 체인·미리보기·이벤트·결과에서 같은 `DominoTile`을 사용한다. 기다리는 손패의 opacity를 1로 유지하고, 손패 SVG의 기본 폭이 버튼 폭을 넘어 겹치던 실제 브라우저 결함을 수정했다. 생성한 오리지널 펠트의 원본은 보관했으며 화면에는 640×640, 74,600바이트 WebP를 쓴다. 생성·정규화·실제 크기 검사 근거는 `public/images/domino/manifest.json`에 남겼다.

확인된 공개 play sequence만 내 손패의 이전 DOM 위치 또는 상대 좌석의 뒷면에서 해당 공개 체인 타일까지 340ms 동안 이동한다. 연속 봇 수는 sequence 순서대로 한 번씩 착지하고, 대기 중인 신규 체인 타일은 착지까지 표시를 보류한다. 상대의 실제 손패를 모션이나 로그에 추가하지 않는다. 중복 sequence는 공용 `dominoWindow`에서 제거한다. 첫 진입, 방·좌석·라운드 변경, sequence 회귀, 숨겨진 화면, 큰 복구 backlog는 현재 상태로 정착한다. round-end/win은 이전 착지 큐를 폐기해 결과 뒤 늦은 타일 소리가 나오지 않는다. reduced motion은 공간 이동을 생략한다.

Chromium에서 임시 Board 하네스를 1440×900으로 검사했다. 보드 시작 y=100일 때 KO/ES 기본 bottom=786, 선택=810, 긴 체인=786, 정산=895이며 다음 라운드 버튼은 bottom=867이다. 기본 손패 bottom=692이고 모든 버튼·select가 44×44px 이상이며 대기 손패 opacity는 모두 1이다. ES 390×844에서는 손패를 가로로 이동해 읽으며 손패 bottom=750이다. 이는 독립 컴포넌트 하네스 결과이며 통합 room shell 검수와 구별한다. 28종 앞면·뒷면·더블·선택·미리보기의 실제 크기 contact sheet와 KO/ES 기본·선택·긴 체인·정산 캡처는 `output/playwright/game-quality/domino/`에 있다. `report.json`에서 실제 flight sequence 2→3→4, 방 전환 및 reduced motion의 flight 0회, 브라우저 오류 0건을 확인했다.

공통 연결 복구 코드를 독립 검토하면서 같은 방의 구독 해제 뒤 진행 중 RPC 응답을 무효화하지 않는 문제, syncEpoch에서 GameFeedback을 remount해 이미 열어 둔 AudioContext를 닫는 문제, 화면 숨김 때 지연 효과음 큐가 남는 문제를 지적했다. root가 각각 refreshId 무효화, identity에 따른 기록만 초기화, visibilitychange에서 지연 큐 취소로 수정했고 변경을 다시 읽었다. PlayApp의 reconnect identity 변경은 DominoBoard의 모션을 즉시 정리하며, 권위 복구 snapshot의 syncEpoch 변경은 과거 로그를 새 baseline으로 취급한다. HTTP snapshot만 복구된 상태를 Realtime connected라고 표시하지 않는 계약도 확인했다.

실제 Chromium AudioContext를 계측한 결과 컨텍스트 생성 1회/종료 0회, 복구 identity와 과거 로그가 변경될 때 oscillator 수 1→1, 이후 새 선택에 1→2였다. 기존 enabled=true 및 volume=0.42가 유지됐다. 화면 숨김 직전 첫 cue가 oscillator 3까지 생성된 뒤 숨김/복귀 및 숨김 중 새 score/turn snapshot 적용 후에도 3을 유지했다. `audio-identity-review.json`의 6개 검사 모두 통과하고 브라우저 오류는 없었다. 이 계측은 물리 출력의 청취나 착지음의 기기별 지연 측정은 아니다.

실행한 검사: 도미노 엔진·보드·타일·Stage·sequence 관련 47개 테스트와 전체 `tsc -b` 통과. 후속 client.online/PlayApp/Stage/sequence 38개 테스트도 통과했으며 같은 방 구독 해제 후 진행 중 snapshot 무효화 검사가 포함된다. 서로 겹치는 테스트 수를 합산하지 않는다.

실제 Supabase 두 기기 완주·응답 유실·무료 운영 측정, 물리 음향 청취, release build 성능 프로파일은 이 하네스 검사로 검증하지 않았다. transport 응답 유실 때 요청 완료 여부가 불명확함을 표시하고 권위 snapshot을 다시 확인하는 공통 client 흐름을 root가 구현했다. 관련 client/PlayApp30개 검사와 독립 리뷰를 통과했으며, 오래된 index를 자동 재전송하지 않는 선택 version 보호를 유지한다. 실제 인터넷 응답 유실 상황의 재현은 아직 미검증이다.

## 재현 가능한 통합 브라우저 검수 (2026-10-11)

`scripts/verify-domino-quality.mjs`는 `scripts/playwright-browser.mjs` 실행기를 사용해 실제 데모 방을 만들고 사람-봇 팀전 라운드와 다음 누적 라운드까지 진행한다. `DOMINO_URL`로 앱 주소를, `PLAYWRIGHT_ARTIFACT_DIR`로 출력 폴더를 지정한다. Chromium 모듈/실행 파일은 공통 실행기의 `PLAYWRIGHT_MODULE` 및 `PLAYWRIGHT_EXECUTABLE_PATH`를 따른다. 이 스크립트는 실제 클릭과 키보드 입력을 사용하며 개인 손패 원문을 JSON/HTML에 복사하지 않는다.

2026-10-11 실행에서 9개 검사가 모두 통과했다. 1152×720(125% 확대 대응)에서는 가로 overflow가 없었고, 최상단에서 테이블은 x=50–1102, 손패는 y=808–870에 있어 첫 화면 아래에 있었다. 세로 479px 이동하면 손패가 화면에 들어와 조작할 수 있었다. Enter 반복 입력 테스트에서 사람의 공개 타일은 1개였고 자동 봇의 응답 수도 체인에 정상 반영됐다. Esc는 선택을 취소했다. 1024×640 리사이즈에서도 overflow가 없고 테이블은 x=50–974였다. 완료한 라운드는 공개 체인 25개와 네 좌석 잔여패 3개가 모두 표시됐으며, 다음 라운드에서 4/200 누적 점수를 확인했다. 브라우저 오류는 없었다.

재현 명령: `DOMINO_URL=http://127.0.0.1:5191/ PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chromium node scripts/verify-domino-quality.mjs`. 기본 결과/캡처 폴더는 `output/playwright/domino-quality/`다. 결과 캡처는 라운드 종료 뒤 공개된 손패를 포함한다. 실제 Supabase 두 기기, 물리 터치, 브라우저 확대 UI 자체는 이 검수에 포함하지 않았다.

## Sol 초보자 그림 안내 독립 검수 — 2026-10-11

`DominoQuickGuide`의 KO/ES 문구를 실제 도미노 엔진·컨트롤과 대조했다. 첫 수는 배분된 패 중 가장 높은 더블이며 항상 6|6은 아니고, 더블이 없으면 숫자 합이 가장 큰 패다. 안내는 4|4를 예시로 쓰고 현재 차례에 손패를 선택하도록 설명한다. 선택 후 같은 숫자의 열린 끝을 누르면 바로 놓기가 확정되며, 첫 수에는 시작 타일 버튼을 사용한다. 패를 뽑지 않는 점, 합법 패가 없을 때만 패스하는 점, 1대1 두 번·4인 팀전 네 번 연속 패스 시 막히는 점, 기본은 팀의 남은 숫자 합이 낮은 쪽 승리라는 점을 본문에 확인했다. 모드·단판 또는 누적 경기·보너스는 모달의 설정 안내와 접힌 세부 규칙에서 확인할 수 있다. 그림은 런타임과 같은 `DominoTile`이며 새 외부 자산이나 비공개 손패 조회를 추가하지 않는다.

최종 카피와 공통 CSS가 고정된 뒤 실제 Vite 앱의 KO/ES 설명 모달을 Chromium 1440×900 및 390×844에서 검사했다. 데스크톱 모달은 900px 폭, 모바일은 x=20–370의 350px 폭이며 내부 가로 넘침이 없다. 세 그림 모두 자기 figure 안에 들어오고, 닫기 버튼 44×44px·세부 규칙 summary 높이 44px·확인 버튼 높이 47px를 확인했다. Tab/Shift+Tab 경계 초점 순환, Esc 뒤 원래 버튼으로 초점 복귀, X 및 확인 버튼 닫기, 모바일 하단까지 스크롤 후 sticky X 닫기, Enter로 세부 규칙 열기/접기가 KO/ES에서 모두 정상이다. 본 검사 16개와 모바일 하단 추가 검사 6개가 통과했으며 본 검사 중 페이지 오류는 0건이었다. 실제 데모 방 아래 가이드도 KO/ES 1440×900에서 그림과 본문이 정상 표시됐다.

증거는 `output/playwright/game-quality/domino/quick-guide/report.json`, `bottom-report.json`, 각 언어의 `dialog-1440.png`, `dialog-390.png`, `dialog-390-bottom.png`, `guide-1440.png`다. 방 생성 후 390px로 줄이면 기존 데스크톱 게임 제한 때문에 방 화면 자체가 제거된다. 따라서 390px 증거는 데스크톱에서 연 설명 모달을 리사이즈한 결과이며 모바일 도미노 플레이 지원을 검증한 것이 아니다. 물리 터치 및 스크린리더 음성 출력은 검사하지 않았다.
