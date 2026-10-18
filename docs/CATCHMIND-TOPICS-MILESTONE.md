# 캐치마인드 주제·마스크·재시작 마일스톤

2026-10-11. 작업 폴더 `/workspace/gitactions-game-personalization`, 브랜치 `game-personalization-20261011`.
기준 커밋 `1c20ea3d47517c656d3f52205c1992228bc1940e`의 아바타 6종을 유지했다. 기존 홈, 독립 랜딩, 도시 배치, 다빈치 조커, 스플렌더 규칙·비용·점수는 이번 변경에 포함하지 않았다. 원본 `/workspace/gitactions-main`은 `51a9ee3acf6a93cc899ab67e0911f6a6e91f996d` 그대로다. 푸시·배포·PR은 하지 않았다.

## 완료한 동작

- 주제 6개: 동물 62, 음식 45, 자연·우주 40, 장소·건물 35, 탈것 30, 생활·취미 60. 합계 272개, 기존 한국어·스페인어 쌍 192개 보존, 추가 80개.
- 새 판은 호스트가 주제 하나를 선택하고 설정을 저장해야 제시어를 제공한다. 전체/혼합/복수 선택은 UI와 엔진 모두 지원하지 않는다. 첫 그림 시작 후 설정을 잠근다.
- 한 라운드 보기 안에는 중복 단어가 없다. 작은 주제에서도 12라운드·5개 보기를 지원하도록 셔플한 주제 풀을 순환한다. 서로 다른 라운드에는 같은 단어가 다시 나올 수 있다.
- 기존 직접 입력 단어 기능을 유지한다. 직접 입력 단어는 선택한 판의 단어 목록에 추가되고, 사전에 등록된 기본 표기/별칭과 충돌하면 거부한다. 사용자 입력에 붙인 임의 aliases 필드는 저장하지 않는다. 직접 입력 전용 모드의 기존 개수 제한은 유지했다.
- 한국어 `□`, 스페인어 문자 `?`를 나란히 표시한다. 스페인어 띄어쓰기는 보존한다. 예: `불가사리 / estrella de mar`는 `□□□□ / ???????? ?? ???`다. 시간에 따른 문자·초성 공개가 없다. 기존 힌트 수 설정은 UI에서 글자 수 표시 켜기/끄기로 연결했다.
- 정답은 기본 한국어·스페인어 또는 사전에 명시된 별칭만 인정한다. NFC 정규화, 소문자, 양끝 공백 제거를 사용한다. 악센트의 일반 제거, 부분 일치, 유사어 추정은 추가하지 않았다.
- 기본 80초, 30~180초 설정을 유지했다. 온라인 만료는 기존 서버 시간과 CAS/요청 영수증을 사용한다. 정각부터 늦은 정답을 인정하지 않으며, 종료 요청이 겹쳐도 한 번만 저장한다. 로컬 데모에서도 검증과 실행 사이 만료된 답을 정답 메시지로 잘못 표시하던 경계를 보정했다.
- 재접속·새로고침은 저장된 deadline을 유지한다. 이전 라운드의 늦은 그리기 작업을 새 deadline의 라운드에 자동 재실행하지 않는다.
- 최종 결과에 다시 하기 버튼을 추가했다. 한 사람이 반복 요청해도 기존 판을 유지하고, 두 사람이 모두 수락해야 새 판을 만든다. 새 판에서는 주제 미선택, 제시어·정답·점수·그림·채우기·추측·힌트·deadline을 초기화한다. 채팅 기록의 기존 보존 정책은 변경하지 않았다.
- 이전 저장 판에 category_id가 없으면 이미 배분된 제시어와 정답을 유지한다. 설정을 임의로 추론하거나 다시 배분하지 않는다.
- 기존 출제자의 패스/수동 종료와 라운드 결과에서 정답을 공개하는 계약은 유지했다. 이를 삭제하거나 새 실패/벌점 규칙을 만들지 않았다.

## 변경 파일

- `src/games/catchmind-topic-dictionary.json`: 승인된 272개 데이터.
- `src/games/catchmindTopics.ts`, `catchmindWords.ts`, `catchmind.ts`: 카테고리, 별칭, 선택/잠금 검증, 고정 마스크, 저장 판 호환.
- `src/app/CatchmindTable.tsx`, `catchmind-table.css`, `PlayApp.tsx`: 단일 선택 UI, 양언어 마스크, 기존 재시작 동의 연결, 만료 요청만 수행.
- `src/games/rules.ts`: 실제 새 동작에 맞춘 한국어·스페인어 안내.
- `src/core/client.ts`: 시간 경계 메시지 보정과 이전 그리기 작업 재실행 방지.
- `supabase/functions/action/index.ts`: 점진 힌트 요청 제거, 기존 서버 만료/원자적 저장 유지.
- `supabase/functions/_shared/engines.js`: 현재 엔진으로 재생성.
- 엔진/테이블/권한/로컬/온라인 클라이언트 테스트, 실제 Edge 처리 코드 테스트, 기존 로컬 SQL 검증 도구의 설정 준비 수정.
- `scripts/verify-catchmind-topics.mjs`: 독립 세션 2개 브라우저 QA 재현 스크립트.

## 검증과 실제 화면

최종 `npm test`: 47개 파일, 398개 테스트 통과. `npm run build`: TypeScript, Vite, Edge 엔진 번들 완료. `git diff --check` 통과.

`src/core/catchmind.edge.test.ts`는 실제 Edge handler를 실행한다. 시간 -1ms/정각/+1ms, 두 좌석의 동시 timeout과 영수증 재시도, 마스크 자동 진전 없음, 두 사람의 새 판 동의를 검증했다. 데이터 저장은 CAS 모의 객체다. 실제 SQL/RLS·stale commit·중복 영수증은 기존 PGlite 데이터베이스 테스트로 별도 검증했다.

QA 파일의 기준 경로는 `/workspace/game-personalization-deliverables-20261011/`다.

로컬 SQL/RLS fixture와 Chromium 154의 독립 브라우저 세션 2개, 1440×900에서 UI를 직접 조작했다. 아래는 새로 렌더링한 QA 화면이며 원본 저장소 스크린샷이 아니다. QA 이름만 사용했고 Library에는 업로드하지 않았다.

- `catchmind-qa/01-host-category-desktop.png`: 호스트의 6개 단일 선택 설정.
- `catchmind-qa/02-drawer-desktop.png`: 정답을 아는 출제자의 캔버스.
- `catchmind-qa/03-guesser-static-mask-es.png`: 같은 그림과 비공개 정답, 두 언어 고정 마스크.
- `catchmind-qa/04-result-rematch-desktop.png`: 결과와 두 사람 동의 재시작.
- `catchmind-qa/05-real-30-second-timeout-es.png`: 실제 30초 경과 후의 실패 결과.
- `catchmind-qa/report.json`: 독립 세션·새로고침·재시작·시간 종료·늦은 정답 검증 결과.

브라우저 QA는 `PORT=54327 node scripts/online-fixture.mjs`와 `VITE_SUPABASE_URL=http://127.0.0.1:54327 VITE_SUPABASE_ANON_KEY=local-fixture-public-key npm run dev -- --port 5214 --strictPort`로 준비한 다음, `CATCHMIND_QA_URL=http://127.0.0.1:5214 node scripts/verify-catchmind-topics.mjs`로 재현한다. Playwright/Chromium 경로는 기존 `playwright-browser.mjs`의 환경 변수로 지정한다. fixture는 실 Supabase Auth/PostgREST/Realtime를 구현하지 않으므로 스냅샷 새로고침을 명시적으로 수행한다.

## 승인된 귀족 초상화 — 차단, 미적용

| 이미지 | Library ID | 파일 ID | 파일명 | 상태 |
|---|---|---|---|---|
| 1 의사 | libfile_e0b409da6f188191833c6b6fea49fe83 | file_00000000c1f881f5925d41e1b5443b9a | 01-doctor-noble-portrait.png | 바이트 다운로드 실패 |
| 2 정면 한복 | libfile_11a21ea77bf481918844b881f860b455 | file_00000000c50481f58cfa83ed5d51c308 | 02-hanbok-noble-frontal.png | 바이트 다운로드 실패 |

파일 확인 및 공식 prepare_materialize는 성공했지만 로컬 경로 없이 전송 정보만 받았다. 현재 Library skill의 공식 materialize helper로 각 파일의 전체 전송 객체를 처리했고 두 파일 모두 정확히 `library file transfer failed: download failed`를 반환했다. 네트워크 접근을 활성화한 의사 이미지 재시도도 동일했다. Library 이미지 read는 메타데이터/이미지 참조만 반환했으므로 실제 픽셀을 본 것으로 취급하지 않았다. 자동 승인 거절은 발생하지 않았다.

원본 바이트를 확보한 뒤 실제 픽셀을 확인하고 `public/images/splendor/nobles/`에 승인된 두 초상화를 추가해야 한다. 귀족 ID→그림 연결과 이벤트의 그림 참조만 함께 갱신하고, 엔진 비용/점수/조건 데이터는 유지한다. 이미지 3은 제외한다. 현재 스플렌더 파일에 불완전한 링크나 대체 그림을 넣지 않았다.

## 한계

운영 Supabase의 실제 두 기기·Realtime 복구·배포 후 동작은 확인하지 않았다. 서버 종료는 기존 방식대로 다음 tick/요청 때 저장하며 별도 백그라운드 타이머를 만들지 않았다. 모바일에서는 기존 캐치마인드 데스크톱 전용 정책을 유지했다. 랜딩·도시 재배치·조커는 이번 마일스톤에서 변경하지 않았다.
