# 세 게임 품질 개선 구현 기록

2026-10-11, 기준 커밋 `59d10472ddde64809d0a6702a54a447087f17dc8`. 기능은 게임별 Luna, 이미지·모션·브라우저 검수는 게임별 Sol이 담당했다. 상업화 품질을 목표로 현재 소스의 조작·화면·피드백을 개선했으며, 아래 완료 항목과 출시 전 미검증 항목을 구분한다.

| 게임 | 이번 구현 | 검수 근거 |
| --- | --- | --- |
| 도미노 | 실제 놓이는 방향·새 열린 끝 미리보기, 선택/취소/확정, 실패 후 선택 유지, 설정 모달, 선명한 기존28타일과 원본 생성 펠트, 공개 이벤트 순서대로 내 패/상대 좌석에서 체인까지 이동하고 착지 효과음 | KO/ES Chromium 화면, 긴 체인, 독립 Board 검수의 button/select 최소44px, 사람2+AI2 한 라운드 및 누적 다음 라운드, 공개 체인24+잔여패4=28개 |
| 자이푸르 | 가져오기·낙타 가져오기 확인, ID 기반 교환/취소, 상품 그룹·판매 수량 조절과 앞N장 강조, 시장5/손패7/상품토큰6/보너스3 배치, 원본 상품 그림7종·뒷면, 카드→판매→토큰 이동과 착지 음향, 이전 라운드 정산 분리 | KO/ES 데스크톱과390px모바일, 판매5장 한 번 확정·10flight·총20점(상품11+보너스9), 추가6·7장판매/5↔5교환/실패선택보존/반복Enter 단일확정, 자동 라운드 경계/감소모션/resize |
| 스플렌더 | 카드별 단일 구매·예약 패널, 비용·할인·금·부족 예고, 직접 토큰 반환 조절과 현재 합법행동 일치, 카드ID·출처·방·좌석·버전 재검증, 공개 보너스·귀족 진행, 3칸 예약 상한의 합법행동 노출 오류 수정, 보석SVG6종, 지불→카드→보너스/귀족 이동 | 기존90+10이미지 해시 보존, KO/ES 4상태 보드 하단890.7px/900px·가로 넘침 없음, 10토큰/금 부족/예약3칸/상대턴 회귀, 실제 요소 기준 이동·구매/귀족 착지 cue 각1회·종료 overlay0 검수 |

공통으로 실시간 연결 상태를 표시하고, 다시 시도 버튼을 실제 `room_snapshot` 호출로 연결했다. 온라인/탭 복귀 시 서버 상태를 다시 가져오며, 구독 해제 또는 방 변경 뒤 늦게 도착한 응답을 무효화한다. 도미노·자이푸르·스플렌더의 오래된 선택은 `stale_state` 뒤 자동 재전송하지 않고 갱신된 판에서 다시 확인하도록 했다. 요청 응답을 잃은 경우 행동을 재전송하지 않고 서버 판을 다시 조회하며 처리 여부가 불확실하다고 표시한다. 재접속 시 과거 이벤트·이동·효과음은 초기화하되, 같은 게임의 AudioContext와 사용자의 효과음 설정은 유지한다. 숨긴 탭의 대기 효과음도 취소한다.

## 오픈소스·스킬 참고 방식

- [Awesome GameDev Agent Skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills), `0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd`: 전문가74개와 router를 `.agents/skills/`에 설치했다. 기획 수정·입력·카드게임·아트·음향·game-feel·성능 지침을 DOM/React 환경에 맞춰 적용했다. Apache-2.0의 LICENSE/NOTICE와 파일 SHA-256 manifest를 저장했다. 엔진 교체는 하지 않았다.
- [Dominican Domino Party Game](https://github.com/faluciano/domino-party-game), `c0d167b369373e5bdca6da252eec7cfb28bb646b`: MIT를 확인하고 규칙·reducer·종단 선택·봇을 읽어 현재의 선택형 규칙/AI와 비교했다. 코드·아트를 복사하지 않았다. 상세 차이는 [도미노 보고서](GAME-QUALITY-DOMINO.md)에 있다.
- [Udaipur](https://github.com/skvrahul/UdaipurGame), `9f5fbe8447540bb58d60bb45a62ae5e79c86d39f`: ID 기반 선택/명시적 행동 흐름을 참고했다. 라이선스 파일/선언을 찾지 못했으며 상대 정보 보호 TODO도 있어 코드·아트를 복사하지 않았다. 현재 자이푸르 규칙과 정보 보호를 유지했다.
- [hexanome-04/splendor](https://github.com/hexanome-04/splendor): 기존 프로젝트가 보유한 원본90개 개발카드·10개 귀족과 기존 MIT 고지를 유지했다. 출판사 아트의 독립적 상업 허가는 확인되지 않았다. [자산 출처](ASSETS.md)를 참조한다.
- GameNest·Hwatu·그림 게임·Ruffle·boardgame.io는 이번 세 게임의 변경에 필요하지 않아 설치/복사하지 않았다.

## 재현 가능한 검증

최종 전체 `npm test`: 초보자 가이드 검사 포함 45개 파일351개 테스트 통과. `npm run build`: TypeScript·Vite 운영 빌드·Edge 엔진 bundle 생성 통과. 최종 비용 문구 변경 뒤 관련 스플렌더16개 검사를 추가 통과했으며 `git diff --check`도 통과했다. 운영 산출물의 UI만 사용한 `scripts/verify-game-quality-build.mjs`에서 세 게임 생성·동의·보드/자산 로딩, 가로 넘침 없음, 브라우저 오류0개를 확인했다.

```bash
npm ci --cache /workspace/.cloud-setup/npm-cache
npm test
npm run build
```

로컬 SQL/RLS/게임 권위 경로는 `scripts/online-fixture.mjs`와 `scripts/verify-game-quality-online.mjs`로 검증했다. 두 독립 Chromium 컨텍스트에서 각 게임6개 행동을 확정하고 버전8로 일치함을 확인했다. 응답의 원본 hands/덱/시드/숨은 보너스 필드 누락, 자기 손패 매핑과 두 사람 손패ID 비중복, 방 종료 후 view 제거를 검사했다. 이는 해당 응답 계약의 회귀 검사이며 임의의 모든 별칭 필드까지 탐색한 포괄적 보안 보증은 아니다. 브라우저 오류0개였다. fixture에는 Realtime이 없어서 매 단계의 명시적 snapshot 갱신으로 검증했다. 실제 인터넷 두 기기 동기화 결과로 주장하지 않는다.

```bash
# 서로 다른 터미널에서 실행. 공개용 로컬 fixture key이며 실제 서비스 키를 넣지 않는다.
PORT=54321 node scripts/online-fixture.mjs
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=local-fixture-public-key npm run dev -- --host 127.0.0.1 --port 5192 --strictPort
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_NO_SANDBOX=1 node scripts/verify-game-quality-online.mjs
```

재현 스크립트는 `scripts/verify-domino-quality.mjs`, `scripts/verify-jaipur-quality.mjs`, `scripts/verify-splendor-quality.mjs`이며 공통 `scripts/playwright-browser.mjs`를 사용한다. 운영 빌드 검수는 `npm run preview -- --host 127.0.0.1 --port 5194 --strictPort` 실행 후 `QUALITY_PREVIEW_URL`을 지정해 `scripts/verify-game-quality-build.mjs`를 실행한다. Playwright 모듈/Chromium 경로는 위 환경 변수로 설정한다.

스크린샷과 JSON 측정은 `output/playwright/` 아래에 생성된다(ignored). 게임별 문서에 해당 시나리오와 상세 측정/제한을 기록했다. 1440×900은 주요 판/손패/행동 배치를 검토하는 대표 크기이며, 문서·채팅·확대 화면은 세로스크롤로 접근한다. 1152×720 검수는 1440×900의125%확대와 동등한 CSS viewport를 사용했으며 실제 브라우저 확대 UI 자체는 조작하지 않았다. 도미노/스플렌더의 기존 데스크톱 제한과 자이푸르의 모바일 지원은 유지했다.

## 실제 출시 전 남은 확인

- 실제 Supabase 프로젝트 URL/공개 키가 현재 환경에 없다. 배포된 Auth·RLS·Edge Function·Realtime의 두 기기 전체 경기, 지연/끊김/중복/응답 유실/재접속은 검증하지 못했다.
- 헤드리스 브라우저의 AudioContext 유지·cue 호출·착지 타이밍은 확인했으나, 실제 스피커/헤드폰 청취와 터치 장치 체감 평가는 하지 않았다.
- 현재 게임 규칙의 선택형/지역 차이, 자이푸르·스플렌더 명칭 및 보존한 스플렌더 출판사 아트의 상업 사용 권리는 출시 담당자의 확인이 필요하다.
- 반응시간100ms/프레임시간16.6ms 등의 상업 품질 목표는 아직 실기기 프로파일 측정값이 아니다. 실제 플레이어의 이해도·조작 실수·장기 경기 테스트도 남아 있다.

클라우드 설정 초안에는 실제 checkout 경로와 HEAD, 재사용 설치·시작 지침, `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 요구 이름을 저장했다. 초안 저장은 적용/게시가 아니며 환경 설정에서 검토·저장·게시해야 이후 환경에 적용된다. 서비스 키를 브라우저 VITE 변수에 넣지 않는다. 작업 소스는 이 workspace에 있으며 원격 push 또는 운영 배포는 하지 않았다.

## 초보자용 그림 설명 보완

세 게임의 플레이 화면 아래 안내와 게임 목록의 설명창에 같은 한국어·도미니카 스페인어 안내를 적용했다. 목표 한 줄, 실제 자산으로 만든 그림 세 장과 핵심 행동, 제한·예외를 요약한 팁을 먼저 보여 준다. 긴 규칙은 기본으로 닫힌 ‘세부 규칙 보기’에 보존하여 필요할 때만 펼친다. 다른 다섯 게임의 설명과 저장된 이전 규칙 구분은 유지했다.

- 도미노: 배분된 최고 더블로 시작하는 예시, 같은 숫자 연결, 끝 클릭으로 확정하는 실제 조작, 뽑기 없는 패스와 tranque를 안내한다. 스페인어 본문은 119단어다.
- 자이푸르: 같은 장수의 2↔2 교환, 같은 상품 세 장 판매와 비공개 보너스, 상품 손패 7장과 별도 낙타 무리를 그림으로 구분한다. 상품 한 장/시장 낙타 전부/교환/판매 중 한 행동, 다이아몬드·금·은 최소 두 장, 두 라운드 승리를 짧게 안내한다.
- 스플렌더: 서로 다른 보석 세 개 또는 같은 색 두 개, 실제 카드 `t1-01`의 비용·보너스·점수, 귀족 `n0`의 카드 보너스 조건을 보여 준다. 금 대체 지불, 예약 세 장, 토큰 열 개, 영구 할인과 15점 뒤 동일 차례 수 정산을 안내한다.

그림은 기존 타일 SVG·상품 atlas·보석 SVG·원본 카드와 귀족을 재사용하며 새 외부 이미지 의존성을 추가하지 않았다. 설명창은 세 그림이 겹치지 않도록 폭을 조정하고, 모바일에서는 세로로 배치한다. 닫기 버튼을 44×44px로 키우고 접힌 규칙 summary도 기존 모달 초점 관리에 포함했다. 도미노·스플렌더의 모바일 플레이 제한을 변경하지 않았으므로 두 게임의 390px 검수는 설명창과 읽기 전용 안내 렌더링으로 확인한다.

검증은 전체 351개 테스트, 설명 관련 19개 검사, 운영 빌드를 통과했다. 게임별 Sol은 KO/ES 1440px·390px에서 그림의 실제 수량·비용·배치, 본문 14px, 가로 넘침, 상세 규칙 펼침과 키보드·초점 복귀를 확인했다. 운영 빌드 UI 검사도 세 게임×두 언어 6개 경로에서 세 그림과 자산 로드, 기본으로 접힌 상세 규칙의 열기·닫기, 가로 넘침 없음과 브라우저 오류 0개를 확인했다. 물리 모바일 기기의 터치 및 스크린리더 음성 검수는 하지 않았다.
