# 자이푸르 PC 레이아웃·모션 검수 — 2026-10-27

범위: GitHub `main`의 자이푸르 UI만 수정한 `qa/jaipur-layout-motion` 브랜치. 운영 Sites v46 소스와 동일하다고 가정하지 않았으며 운영 배포는 하지 않았다. 게임 규칙, 가격, 점수, 다른 게임과 아이디어박스 코드는 변경하지 않았다.

| 요구사항 | 코드 | 자동 검수 | 실제 화면 증거 |
| --- | --- | --- | --- |
| 최근 거래가 HUD/조작을 가리지 않아야 함 | `src/styles/jaipur-layout.css`: 최근 거래를 점수와 분리된 행에 배치하고, 열린 내역은 같은 행의 가로 스크롤 패널에 표시 | `verify-jaipur-layout-motion.mjs`: 점수·시장·손패·토큰·조작부와 교차 없음, 열기 전후 게임판 높이 동일. `verify-jaipur-quality.mjs`: 실제 데모 게임방에서도 열기 전후 하단 860.5px 동일(1440×900) | [1280×800 최근 거래](screenshots/jaipur-layout-motion-20261027/1280x800-history.png), [1847×872 최근 거래](screenshots/jaipur-layout-motion-20261027/1847x872-history.png) |
| 낙타·향신료·은 등 시장 카드의 전체 그림과 별도 이름/행동 영역 | `JaipurArt.tsx`의 시장 전용 `showWholeArt`와 `JaipurBoard.tsx` 적용; `jaipur-layout.css`에서 그림 영역과 텍스트 영역 분리 | SVG `preserveAspectRatio="xMidYMid meet"` 단위 테스트 및 브라우저 DOM 검사; 5장 시장·7장 손패·가로 스크롤 없음 | 위 두 최근 거래 화면의 시장 카드 |
| 가져오기·교환·판매가 PC에서 한눈에 조작 가능 | 짧은 화면의 교환 미리보기/판매 미리보기 밀도 조정, 기존 행동 탭/확정 버튼 유지 | 두 화면 크기에서 열린 거래, 교환, 판매 상태 모두 게임판 하단이 화면 안에 있음: 1280×800은 736/798/797px, 1847×872는 752/837/845px | [1280 교환](screenshots/jaipur-layout-motion-20261027/1280x800-exchange.png), [1280 판매](screenshots/jaipur-layout-motion-20261027/1280x800-sale-preview.png), [1847 교환](screenshots/jaipur-layout-motion-20261027/1847x872-exchange.png), [1847 판매](screenshots/jaipur-layout-motion-20261027/1847x872-sale-preview.png) |
| 선택·거래·토큰/점수 반응, 반복 클릭 안전성, reduced motion | `jaipur-feedback.css`: 선택 체크 팝과 점수/토큰 변화 강조, 카드 이동보다 앞에 정보/버튼 배치. 상품 토큰 잔량에 기존 `GameValue` 적용. 기존 `JaipurMotion`과 `busyRef`를 재사용 | 선택/취소/가져오기, 교환 확정, 판매 완료를 실제 클릭; 각 확정 연속 2회 호출에도 실행은 1회. 판매 후 점수 증가와 향신료 토큰 감소, 각각의 변화 표시, 안내 최대 1개 확인. reduced motion에서 선택 애니메이션과 카드 이동 0개 확인 | [판매 완료·점수 반응](screenshots/jaipur-layout-motion-20261027/sale-complete.png) |

기존 모션: 시장→손패·낙타 무리·교환 양방향 카드 이동, 판매 카드→토큰 이동, 보너스 뒤집기, 라운드/승리 안내, 점수 `GameValue` 델타, 선택 사운드가 이미 구현돼 있었다. 이번 변경은 그 경로를 새로 만들거나 중복 안내하지 않고, 선택과 토큰 잔량의 반응을 더하고 이동 중 버튼·문구를 읽을 수 있게 했다.

검증: 자이푸르 단위 테스트 35개 통과, 전체 빌드 통과, `verify-jaipur-layout-motion.mjs` 통과, 데모 게임방을 사용하는 `verify-jaipur-quality.mjs` 통과. 브라우저 예외 0건. 화면 증거는 로컬 Vite 소스를 Chromium에서 렌더링한 것으로 운영 v46 화면 자체의 검증은 아니다.

Library 원본 입력 `libfile_618242046c308191b29a0e7900ce7ae8`(`image(20261027-090501).png`, 검색 메타데이터 1340×562)은 식별했다. Library 공식 다운로드 헬퍼가 `hosted apps tools/list request failed: network`로 실패했다. 전송 우회 없이 중단했으므로 입력 파일의 로컬 존재·가독성·픽셀 비교는 수행하지 못했다.
