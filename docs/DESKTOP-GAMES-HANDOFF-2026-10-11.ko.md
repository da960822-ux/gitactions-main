# 데스크톱 게임 독립 작업 인계 — 2026-10-11

## 베이스와 통합 조건

작업 공간 `/workspace/gitactions-games`, 브랜치 `games/desktop-approved-portraits`.
베이스 **b37c10b5a93d44236a7d5ed5834b817531e8ea39**.
원본 `/workspace/gitactions-main`의 work 브랜치와 기존 파일은 수정하지 않았다.
최초 작업은 push/PR/배포 금지였다. 이후 사용자가 정확한 원격 저장소에 정상 작업 브랜치 push를 명시 승인했다. 승인된 `games/desktop-improvements-20261011-8c90594-379a58`만 업데이트하며 main/force push/PR/배포는 하지 않는다. 랜딩/히어로/모바일/리듬타파 SWF/건의사항 페이지는 수정 범위에서 제외했다.

다음 Git 객체는 조사 시 모두 없었다. 이 변경을 최신 작업 완료본이라고 간주하지 말고 부모 세션에서 기존 커밋/파일과 통합한 뒤 다시 검증해야 한다.

| 필요한 커밋 | 존재 여부 | 영향 |
| --- | --- | --- |
| f0c6d01a53eeac96cb4d55804689b6724bfc184e | 없음 | 기존 게임 개선을 이번 베이스에 포함했다고 주장할 수 없음 |
| 5f7e75d3602365e081e9f59bf585f05bf812cfea | 없음 | 단일 주제·타이머·타임오버·재시작 완료 캐치마인드 파일 필요 |
| 1c20ea3 | 없음 | 아바타 완료본 미포함, 해당 기능을 재구현하지 않음 |

`AGENTS.md`, Ponytail full, GameDev router, create-game-assets, game-ui-ux 및 관련 부루마블/다빈치/스플렌더 계획을 읽었다. 기존 React/DOM/SVG 방식을 유지한다. 이전 문서의 검수 숫자는 이번 변경의 검수로 옮겨 쓰지 않았다.

## 부루마블 배치와 저장 호환성

새 상태만 `boardVersion: 2, cityRouteVersion: 2`로 만든다. 기존 40칸 방에서 `cityRouteVersion`이 없으면 원래 도시·인덱스·소유권·가격을 그대로 사용한다. `boardVersion` 없는 legacy18도 그대로 사용한다. 실행 중 저장방의 인덱스를 옮기는 마이그레이션은 없다.

기존 계획은 40칸/24도시와 기존 도시 목록을 지정하지만 최신 사용자 서사의 뉴어크·서울은 없었다. 중간 도시 대부분을 유지하는 최소 변경안을 적용했다. 신규 판에서 뉴욕과 산토도밍고의 **도시 전체 레코드**를 교환하여 해당 도시의 가격·임대·그룹을 보존했다. 뉴어크는 마이애미, 서울은 밴쿠버 자리를 이어받는다. 별도 구매 도시를 5개로 축소하지 않았다. 특수 칸 16개는 위치·종류·납부액이 그대로다.

| 엔진 인덱스 (0부터) | 도시 | 매입 | 기본 임대 | 최종 자산 실루엣 |
| --- | --- | ---: | ---: | --- |
| 1 | 광주 | 100 | 12 | 사직전망타워 |
| 3 | 뉴욕 | 260 | 42 | 엠파이어스테이트 빌딩 중심 스카이라인 |
| 4 | 마드리드 | 140 | 18 | 왕궁 |
| 5 | 산티아고 데 로스 카바예로스 | 160 | 22 | 복원 영웅 기념탑 |
| 8 | 푸에르토플라타 | 180 | 26 | 산펠리페 요새 |
| 9 | 산후안 | 200 | 30 | 엘모로 요새 |
| 11 | 라베가 | 220 | 34 | 원죄 없이 잉태되신 성모 대성당 |
| 13 | 푼타카나 | 240 | 38 | 공항의 야자 지붕 터미널 |
| 15 | 산토도밍고 | 120 | 15 | 알카사르 데 콜론 |
| 16 | 파리 | 280 | 48 | 에펠탑 |
| 17 | 도쿄 | 300 | 55 | 도쿄타워 |
| 19 | 바르셀로나 | 320 | 60 | 사그라다 파밀리아 |
| 21 | 사마나 | 340 | 64 | 사마나 보행교 |
| 22 | 아바나 | 360 | 70 | 엘 카피톨리오 |
| 24 | 멕시코시티 | 380 | 75 | 팔라시오 데 베야스 아르테스 |
| 25 | 리스본 | 400 | 80 | 벨렝탑 |
| 28 | 런던 | 420 | 84 | 엘리자베스 타워와 의회 |
| 29 | 로마 | 440 | 88 | 콜로세움 |
| 31 | 뉴어크 | 460 | 92 | 발렌타인 하우스 |
| 32 | 발파라이소 | 480 | 96 | 역사적 푸니쿨라 |
| 33 | 세부 | 500 | 100 | 산토니뇨 성당 |
| 35 | 토론토 | 520 | 104 | CN타워 |
| 36 | 오클랜드 | 540 | 108 | 스카이타워 |
| 38 | 서울 | 560 | 112 | N서울타워 |

핵심 순서: **광주(1) → 뉴욕(3) → 산토도밍고(15) → 뉴어크(31) → 서울(38) → 출발점 지나 광주(1)**. 주사위/카드/여행 목적지 선택에 의해 중간 칸 방문이 달라지는 기존 규칙은 유지한다. 지정 도시를 반드시 모두 방문하게 하는 새 규칙은 추가하지 않았다.

산토도밍고 방문 카드는 판별 도시 검색으로 신규15/기존40칸3/legacy18의2에 도착한다. 가격120·기본임대15를 유지한다. 모든 가격·임대·그룹 분포, 건설비40%/60%/80%, 통행료 배율, 시작 보상, 대출300/330, 기금,120턴 종료 조건은 바꾸지 않았다. 경제/저장 호환성 테스트는 원래 40칸 회귀 fixture와 신규 배치를 따로 검사한다.

## 부루마블 자산과 표시

`MarblePropertyArt`는 1단계 공통 별장, 2단계 공통 빌딩 SVG symbol을 쓴다. 각 도시는 동일한 형태에 다른 색을 적용한다. 3단계는 해당 도시의 최종 랜드마크 실루엣으로 교체한다. 별장→빌딩→랜드마크는 단순 높이 증가가 아니라 지붕/평면/실루엣 변화다. 건설 단계 숫자와 별은 DOM 표시다. 선택 도시 증서도 같은 단계 자산을 사용한다.

최종24개는 `public/images/marble/landmarks/manifest.json`에 도시·인덱스·이름·경로·bytes를 기록했다. 기존14개 SVG를 재사용하고 새로운10개 벡터 실루엣을 작성했다. 원래24개 도시 파일/manifest는 저장방 표시를 위해 보존한다. 특히 도미니카 산티아고의 최종 그림은 기존 칠레 안데스산맥 그림과 구분했다. SVG는 실제 관광 건물/구조물의 **게임용 단순화**이며 정밀 건축 모델이나 공식 그림 복제라고 주장하지 않는다. 네이티브 화면 및 사용자 최종 미술 승인은 별도다.

데스크톱에서 판 최대폭680px, 측면 도시명 회전 제거, 도시 이름 두 줄, 단계 표시와 선택 증서 크기를 정리했다. 기존 모바일 입장 제한을 유지하고 모바일 CSS 규칙은 편집하지 않았다.

dragon=친칠라, fox=말티푸, penguin=판다로 SVG 모습/KO·ES 이름만 변경했다. 엔진 ID와 선택·중복·잠금 계약을 유지했다. 고양이·우주비행사·로봇 그림은 그대로다.

세계 여행 칸(30)의 서버 확정 여행 이동에만 Asiana(P1)/JetBlue(P2) 색상의 비행기와 목적지를 보여준다. **둘의 상상 여행 / Nuestro viaje imaginado**를 함께 표시한다. 실제 항공 노선/제휴/운항을 주장하지 않는다. 여행비/시작점 보상/목적지 처리·기존 열차역 규칙은 바꾸지 않았다. 새 이동 연출에만 비행기를 움직이며 첫 재접속 스냅샷에서는 정적 표시다. 축소 모션을 지원한다.

랜드마크 선정 근거: [광주 관광 사직공원](https://tour.gwangju.go.kr/home/tour/info/park/003.cs?act=view&category=003&infoId=262), [도미니카 관광 알카사르](https://www.godominicanrepublic.com/things-to-do/museo-alcazar-de-colon), [도미니카 관광 산티아고 기념탑](https://www.godominicanrepublic.com/things-to-do/monumento-a-los-heroes-de-la-restauracion), [사마나 관광](https://www.godominicanrepublic.com/destinations/samana), [발렌타인 하우스](https://newarkmuseumart.org/exhibition/the-ballantine-house/), [N서울타워](https://www.nseoultower.co.kr/), [푼타카나 공항](https://www.puntacanainternationalairport.com/en/). 공식 모두의 마블 가이드는 기존 `MARBLE-REFERENCE.md`의 참고 판단을 사용했고 이번 재조회는 실패했다. 새 벡터는 외부 이미지를 복사하지 않았다.

## 다빈치 조커와 스플렌더 blocker

`public/images/yeonseok-lisbeth-cutout.webp` 실제1254×1254 RGBA 픽셀을 열어 왼쪽 Lisbeth/오른쪽 연석을 확인했다. 원본 bytes는 바꾸지 않았다. 백조커는 Lisbeth, 흑조커는 연석을 SVG viewBox로 한 사람씩 표시한다. 본인의 조커/배치 미리보기/공개된 상대 조커에만 표시한다. 상대가 숨긴 타일에서는 값이 잘못 전달되더라도 얼굴·crop·그림 경로를 DOM에 넣지 않는다. 추측 숫자와 조커값·정렬·공개 규칙은 그대로다.

검수한 원본 SHA-256: `72a0010ae5960d33e62b4678715bfd1df71e3d8f743248c69eeb4c5c1c55b318`. 부모의 최신 원본이 달라졌다면 crop 좌표를 그 실제 픽셀에 다시 확인해야 한다.

스플렌더 Library 대상: `libfile_e0b409da6f188191833c6b6fea49fe83`(01-doctor-noble-portrait.png), `libfile_11a21ea77bf481918844b881f860b455`(02-hanbok-noble-frontal.png). 현재 Library 스킬의 resolved-reference materialization 경로로 승인된 두 레코드와 전송 정보를 얻었다. 현재 제공된 공식 helper를 내려받아 두 signed transfer를 처리했으나 모두 **download failed**였고 허용된 한 번의 재시도도 동일했다. 로컬 bytes0/픽셀 미확인. 임의 다운로드 도구나 다른 그림으로 우회하지 않았다. 귀족 그림·비용·점수·규칙을 이번 브랜치에서 교체하지 않았다. 부모가 승인 원본 bytes 전달을 조율해야 한다.

## 검증 상태와 번역 범위

완료: 변경 후 `npm test` **49파일/440테스트 통과**, `npm run build` TypeScript/Vite/Edge 생성 통과, `git diff --check` 통과. 새10SVG XML/viewBox/script 부재 및24개최종경로 존재 검사 통과. Edge 엔진 생성물은 빌드로 함께 갱신했다. 이 결과는 부모 환경의 최신398테스트/누락커밋 통합 검증을 대체하지 않는다.

실제 플레이 검수는 사용자 지시대로 **gpt-6-luna** `/root/luna_playqa`에 위임했고 호출에 성공했다. 두 Chromium browser contexts/두 계정/KO·ES 좌석으로 실제 버튼/방 초대/턴 행동을 수행했다. 상세 결과는 아래 절에 기록한다.

번역 확인 범위: 이번 새 말 이름·서사·세계여행 표시·조커 접근성 KO/ES와 Luna가 조작한 부루마블/다빈치/스플렌더/캐치마인드 흐름. 전체8게임 모든 도움말/오류/희귀 이벤트 번역을 새로 전수 감사하지 않았다.

현재 베이스의 캐치마인드는 여러 라운드/한 명 drawer·한 명 guesser 방식이다. KO/ES 어느 정답으로든 맞히는 기존 흐름과 숨김 정보는 검사했지만, 누락된5f7e75d의 단일 주제·동시정답·타임오버·재시작 완료 기능 보존이라고 보고하지 않는다. 해당 완료본은 수정 없이 통합해야 한다.

운영 Supabase Realtime/실기기2대/물리음향은 미실행. 로컬 PGlite fixture는 SQL/RLS/Edge authority를 사용하지만 실제 Auth/PostgREST/WebSocket을 제공하지 않는다. 각 커밋 후 상대 컨텍스트의 수동 reconnect/읽기 갱신을 온라인 실시간 전달 완료라고 부르지 않는다.

## Luna 두 세션 실제 UI QA 증거

사용 모델은 런타임에서 호출 가능한 `gpt-6-luna`였다. 서로 분리된 Chromium context와 계정, 한국어 P1/스페인어 P2로 검증했다. 단일 화면을 멀티플레이 완료로 취급하지 않았다.

| 대상 | 완료한 실제 UI 흐름 | 증거 |
| --- | --- | --- |
| 부루마블 | 40칸/24도시 신규 경로, NY260/42·Santo120/15, P1→P2→P1, 기존 ID의 친칠라·판다, P2 reload/reconnect, 다른 게임 선택 후 새 부루마블 시작 | `marble-two-player.json`, `marble-route-ko.png`, `marble-route-es.png`, `marble-restarted-ko.png` |
| 다빈치 | 두 좌석 초기 배치 동의, 뽑기·추측·턴 교환, reload 후 좌석/숨김 상태 유지, 한 사람씩 흑백 조커 crop, 상대 숨긴 값 null | `davinci-two-player.json`, `davinci-joker-p1.png`, `davinci-joker-p2.png` |
| 스플렌더 | KO/ES 양쪽 합법 토큰 가져오기와 턴 교환, 비공개 예약 카드, reload 후 좌석/상태 유지 | `splendor-two-player.json`, `splendor-live-ko.png` |
| 캐치마인드 (현재 구버전) | 두 라운드 KO↔ES 정답 수락, 맞히기 전 비밀 주제 미노출, reload 후 종료 상태 유지 | `catchmind-two-player.json`, `catchmind-round-1-p1.png`, `catchmind-round-2-p1.png` |
| 건물 자산 | 실제 Chromium에서 기본24·최종24 image 및 공통1/2단계48개 symbol 로드, 형태 변화/도시 색상 확인 | `marble-art-contact-sheet.json`, `marble-art-contact-sheet.png` |
| 저장 판 렌더 | controlled fixture의 route 미지정 version2에서 기존40칸/Santo3·NY15·Miami31·Vancouver38, legacy18에서 기존18칸/11도시/Santo2 유지 | `marble-saved-route1.json`, `marble-saved-route1.png`, `marble-saved-legacy18.json`, `marble-saved-legacy18.png` |
| 동일 게임 재경기 | controlled 종료 상태의 Catchmind/Splendor/DaVinci에서 P1 요청→P2 동의→동일 gameId의 fresh initial state, version+2/result null 확인 | `replay-contracts-two-player.json`, `replay-catchmind-fresh.png`, `replay-splendor-fresh.png`, `replay-davinci-fresh.png` |
| 상상 여행 표시 | controlled saved-state `lastMove.from=30/source=train/to=1`에서 P1 Asiana/P2 JetBlue, KO/ES 상상 여행 문구·광주 목적지·정적 비행기 표시 | `marble-flight-preview.json`, `marble-flight-asiana.png`, `marble-flight-jetblue.png` |

이미지·JSON은 별도 QA 증거 압축 파일에 담는다. 디버그 fixture 코드/계정 자격증명/Library signed transfer는 전달물에 포함하지 않는다. 데스크톱 1440×900에서 측면 이름은 가로 방향이고 가로 overflow가 없다. 부루마블 패널 하단은 KO980px/ES912px로 세로 스크롤이 필요하다. 캡처는 fullPage이며 한 화면 전체 맞춤 완료라고 주장하지 않는다. 저장 판·종료 후 재경기·여행 표시는 fixture가 지정한 상태의 실제 UI 검증이다. 승리까지 실제 플레이하거나 실제 세계 여행 이동을 수행한 것으로 보고하지 않는다. 여행 애니메이션의 실제 이동 경로 검수는 미실행이며 서버 확정 출발점 필터는 unit test로 확인했다.

아직 운영 Realtime, 실제 기기2대, 물리음향, 전체 게임 승리까지의 모든 분기, 최신 누락 커밋의 캐치마인드 단일 주제/동시 정답/타이머/타임오버는 미실행이다. 승인된 스플렌더 그림은 파일 전달 후 실제 bytes·픽셀·귀족 두 장만 교체되는지 확인해야 한다.

## 부모 통합 순서

이 브랜치/패치는 b37c10b 베이스의 독립 변경이다. 부모가 가진 누락 커밋과 먼저 대조하여 소스 파일을 통합하고, Edge 생성물 충돌은 통합된 소스로 `npm run build`를 실행해 다시 생성한다. 최신 캐치마인드 완료본·아바타·히어로 작업을 이 베이스로 덮어쓰지 않는다. 부모의 최신 전체 테스트와 빌드 및 실제 운영 두 세션 검증은 통합 후 따로 수행한다. 이번 세션은 push/PR/배포하지 않았다.
