# 데스크톱 일곱 게임 — 구현·검증·남은 작업

비교 기준은 `8c90594`와 이 브랜치 후속 수정이다. 랜딩·모바일·리듬 SWF는 제외한다. 원래 통합 환경과 현재 실행기는 별도다. 기존 `f0c6d01`, `5f7e75d`, `1c20ea3` Git 객체는 현재 실행기에서 확보하지 못했으므로 통합 환경의 최신 기능/그림에 대한 완료 판단을 하지 않는다.

## 완료 판단표

| 게임 | 구현과 이번 도움말 변경 | Luna의 두 세션 실제 확인 | 남은 작업 |
| --- | --- | --- | --- |
| 캐치마인드 | 현재 소스는 제시어 선택/그림/공유 정답 채팅/여러 라운드. KO/ES 기존 도움말은 유지. | 현재 코드의 첫 제시어 선택·그리기, 답 숨김, 재조회, controlled 종료 후 양쪽 재경기 동의. | **최신 소스 필요.** 사용자 승인 단일 주제·동시 정답·타이머·타임오버·재시작은 현재 실행기에 없어 검증 불가. 구버전 설명을 임의로 최신 규칙으로 바꾸지 않음. |
| 부루마블 | 40칸/24도시, 새 route3 도시 여섯 곳, 기존 route2/원래40/legacy18 유지. 0단계 땅, 단독주택→아파트→랜드마크, 통합 자산 경로/큰 미리보기/높이 대응/첫 버튼 안내. | KO/ES × 1280×720·1366×768·1440×900·1920×1080, roll/buy/build에서 보드 전부 화면 안. 가로 넘침·이름 잘림·그림/이름 겹침 0, 132px 미리보기와 주 행동 겹침 0. 기존 턴/재조회/saved40/legacy18 확인. 말 개발 회귀에서 겹침 발견; 수정 후 화면 검수는 최종 통합 뒤로 보류. | **시각 완료 보류.** 도시·공통 건물·6종 말은 사용자 반려 후 새 미니어처 제작 중. 승인 bytes 없음. 기존 SVG 말은 기능용 fallback. 720 높이 대출 버튼은 스크롤 필요. |
| 다빈치코드 | 원본 두 사람 cutout의 흑/백 조커 crop. 상대 숨긴 패에는 얼굴 경로 없음. 실제 준비 버튼·조커 + 빈칸·뽑기→대상→숫자→확정 안내. | 양쪽 준비 버튼과 조커 위치 선택 성공. 턴/숨긴 값/재조회 및 controlled 종료의 양쪽 재경기 동의 확인. | 실제 운영 Realtime·자연승리까지의 전체 경기는 이번 검수 범위 밖. 원본 pixels/hash 확인, 새 얼굴 생성 없음. |
| 스플렌더 | 기존 카드/귀족 ID·비용·점수·규칙 유지. 3색 보석 선택→확정, 구매/예약 확정·금·동점 안내. | 첫 3색 가져오기→상대 턴, 비공개 예약/재조회, controlled 종료의 양쪽 재경기 동의. | **두 귀족 원본 미적용.** Library 공식 materialization 및 재시도 실패, bytes0/픽셀 미확인. doctor/hanbok 외 대체 생성 금지. 별도 공개 업로드 승인/원본 전달 대기. |
| 자이푸르 | 기존 atlas/카드/교환/판매/낙타/자동 라운드/2승 보존. 시장 선택 뒤 실제 확정 버튼·종료·낙타 교환 금지 안내. | 낙타3 가져오기→상대 턴, 양쪽 reload 뒤 턴/개인 손패/상대 수 보존, controlled 종료→양쪽 동의→새 판. | 자연승리 전체 경기와 운영 Realtime 미실행. |
| 민화투 | 원본48 얼굴/달 매칭/점수·고도리/종료 보존. 손패 선택→N월 패 내기, 두 후보 직접 선택과 네 그림 사례 안내. | 손패→실제 월 버튼→상대 턴, 양쪽 reload 뒤 턴/개인 손패 보존, controlled 종료→양쪽 동의→새 판. | 자연승리 전체 경기와 운영 Realtime 미실행. |
| 도미노 | 기존28타일/설정/봇/팀/막힘/누적 유지. 선택 뒤 중앙 시작 X\|Y 확정, 단판과100/200 목표 구분 안내. | ES 활성 좌석 손패 선택→중앙 시작 버튼→KO 차례. 양쪽 reload 뒤 턴/개인 손패/상대 수 보존, controlled 종료→양쪽 동의→새 판. | 자연승리 전체 경기와 운영 Realtime 미실행. |

## 확정 도시 배치와 이미지 연결

새 판 `cityRouteVersion:3`에만 아래 이름 변경을 적용한다. 0-based index이며 각 칸의 가격·통행료·도시군·건설비를 보존한다. 기존 route2 방에 자동 이식하지 않는다.

| index | 기존 route2 → route3 | 최종 랜드마크 |
| --- | --- | --- |
| 11 | 라베가 → 베를린 | 브란덴부르크 문 |
| 13 | 푼타카나 → 마이애미 | Colony Hotel · **Miami Beach 소재** |
| 21 | 사마나 → 이스탄불 | 하기아 소피아 |
| 32 | 발파라이소 → 아그라 | 타지마할 |
| 33 | 세부 → 아테네 | 파르테논 |
| 36 | 오클랜드 → 시드니 | 시드니 오페라 하우스 |

서사 고정 칸은 광주1→뉴욕3→산토도밍고15→뉴어크31→서울38→광주다. 광주는 조선대학교 본관, 뉴어크는 성심대성당, 도쿄는 센소지 가미나리몬으로 최신 지시 반영. 산토도밍고 알카사르 데 콜론은 **디에고 콜론의 거주지**로 표기한다. 이전 로마/오클랜드 교체 제안과 마이애미 프리덤 타워 후보는 폐기했다. 실제 항공 노선 주장 없이 Asiana/JetBlue 상상 여행만 보존한다.

실제 스타일 원본은 `public/images/marble/collector-atlas.webp` 1774×887, Git blob `feb0dd05420ba1cba3b513dea36fa5b39655039e`. 산토도밍고 crop (0,0,443,443), 광주 (443,0,887,443). 건축·지형·식생·수면·따뜻한 조명 기준이며 실제 landmark 자체를 대신하지 않는다.

`public/images/marble/dioramas/manifest.json`은 24개 최종 도시와 공통1/2 경로를 정리한다. **path는 현재 전부 null**이다. 승인 로컬 bytes/픽셀 검수 후 plannedPath에 저장하고 path를 지정해야 한다. route3는 누락 파일을 요청하거나 반려 SVG를 최종 그림으로 표시하지 않고 준비 중 표시를 쓴다. 주택54%·아파트73%·랜드마크100% CSS와 밑면 정렬은 연결 준비이며 실제 alpha bounds/물체 크기·품질 검수는 미실행이다. 최초 반려된 아파트 시안은 적용하지 않는다. 국기 de/tr/in/gr/au는 flagcdn 다운로드가 프록시403으로 막혀 누락 상태이며, 없는 파일을 요청하지 않는다.

`public/images/marble/pawns/manifest.json`은 기존 ID fox/cat/penguin/astronaut/robot/dragon을 그대로 유지한다. 모든 replacement path는 null. 기존 `MarblePawn.tsx` SVG는 보존된 기능용 fallback이며 새 6종 승인 자산 도착 후 같은 보드/선택/이동 컴포넌트에 연결 가능하다. 현재 친칠라·말티푸·판다의 이름/ID나 작은 크기 구분만으로 시각 합격이라고 판단하지 않는다. 통합 `1c20ea3` 그림 bytes와의 대조는 현재 불가하다.

## 검증 범위와 증거

관련 `AGENTS.md`, Ponytail full, GameDev router, game-ui-ux, create-game-assets, card-game, save-systems, audio-design, Playwright 지침을 읽고 기존 React/DOM/CSS/Web Audio를 유지했다. 새 엔진·음악 시스템·의존성 없음. Luna는 지원되는 `gpt-6-luna` 기존 `/root/luna_playqa`이다. 별도 두 Chromium contexts/두 계정/KO·ES로 UI를 조작했다. PGlite fixture는 실제 SQL/RLS/Edge authority를 사용하지만 Auth/PostgREST/Realtime WebSocket을 구현하지 않는다. 명시적 상대 재조회와 운영 자동 전달을 구분한다. 재경기는 **fixture로 종료 상태를 만든 뒤 실제 양쪽 동의 버튼**으로 확인했으며 자연승리까지 플레이한 결과가 아니다.

로컬 증거: `output/playwright/{marble,davinci,splendor,catchmind}-two-player.json`, `replay-contracts-two-player.json`, `domino-jaipur-minhwatu-two-player.json`, `marble-desktop-final-review.json`. 전체 화면 캡처에는 방 식별자가 있어 이 문서의 공개 원격 업로드에 포함하지 않는다. 안전한 보드 crop만 별도 제공한다.

번역 검수는 이번 짧은 안내·명칭 KO/ES와 Luna가 실제 조작한 각 단계다. 모든 희귀 이벤트·설정·오류 문구 전수 감사, 운영 두 기기 전체 경기, 물리 음향/스크린리더는 미실행이다. 빌드·회귀 검사 최종 결과는 아래에 기록한다.

최종 자동 검사: **49개 파일·444개 테스트 통과**, TypeScript/Vite/Edge build 통과, `git diff --check` 통과. 도시 변경 여섯 칸의 이름 외 모든 칸 경제·view 값을 route2와 비교하고 기존 route2/원래40/legacy18 분기를 유지하는 회귀를 포함한다.

공개용 [데스크톱 레이아웃 측정](assets/marble-desktop-layout-2026-10-11.json)은 식별자를 제외한 Luna 원본 측정치다. 이 측정의 그림은 route2 기존 SVG이며 시각 최종 승인 또는 새 route3 bytes 검수가 아니다.

최신 사용자 순서: 인게임 반복 QA는 중단하고 구현 우선. 전체 요구는 [요구사항별 대조표](DESKTOP-REQUIREMENTS-LEDGER-2026-10-11.ko.md)에 소스/커밋/차단별 기록. 최신 표기는 cat=랙돌/Ragdoll, robot=리스연/Lisyeon이다. Library 새4파일도 공식 다운로드+한 번 소비자 로컬 재시도 실패(bytes0). 27d802e 측정 이후 말 간격/안쪽 표시 공간 CSS를 추가했으므로 해당 추가분의 화면 결과는 미실행이다.

이후9개의 Library 파일도 같은 공식 download+한 번 소비자 로컬 재시도 실패. 최신 우주인/마이애미 버전1 확인, 사용자 승인 우주인 v1도 실제 로컬 파일 없음. 총13파일이 bytes0이며 새 아트 연결·최적화·픽셀/alpha 검수는 미완료다. 각 manifest에 source Library 버전과 `applied:false`를 기록했다.

최신 전달 도시12도 동일 materialization 초기+retry 실패. 현재 부루마블25개 bytes0. 다빈치 최종 아트 요구는 새 사진2장 캐리커처·비공개 사용으로 변경; 기존 크롭 기본 경로 제거, private runtime injection 구조 준비. 새 조커 파일은 아직 부모 사진 확보/제작 대기.

후속 private joker 주입/리스연 관련18 회귀 통과. TypeScript/Vite/Edge 빌드는 타입 오류1건 수정 후 통과. 새 이미지 bytes0 및 후속 CSS 화면 검수 미실행 상태는 유지한다.

최신 전송은 해결됨: ccec83d 원본32 해시/bytes/pixels 확인 뒤 WebP32 경로 연결.32원본52.6MB→6.39MB, lossless resizedRGBA 확인. 공통 단계는동일형태/도시색 tint renderer. 인게임 검수는아직미실행. f0/5f/1c 객체확보 후 승인소스 통합 진행 예정. 조커 새시안 사용자승인과 별개로 개인bytes없음/비공개적용대기. 추가두반려견 말은아직32범위 밖.
