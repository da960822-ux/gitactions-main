# 건의사항 통합 인계

작업 브랜치: `feat/private-suggestions`, 기준 SHA `b37c10b5a93d44236a7d5ed5834b817531e8ea39`. 랜딩·게임 파일과 `App.tsx`는 수정하지 않았다. 기존 App이 lazy-load하는 `/feedback`의 `FeedbackRoute` / `FeedbackPage`를 그대로 사용한다. 랜딩 담당자는 건의사항 링크를 `/feedback`으로 연결하면 된다. 현재 랜딩의 기존 링크도 이 경로다.

## 구현 계약

- 건의사항은 기존 작은 화면·터치 화면 접근과 `feedback.css` 반응형 배치를 보존한다. 게임용 데스크톱 차단을 건의사항에 적용하지 않는다. 새 모바일 디자인은 추가하지 않았다.
- `dos-language`와 KO / ES · RD 버튼을 사용한다. 문서 locale은 `ko` / `es-DO`다.
- 새 입력은 게임 제안(`game`), 불편한 점(`complaint`), 기타(`other`)와 내용(1–4000자)뿐이다. 기존 title 컬럼은 내용 앞부분으로 채운다. 기존 게시물의 독립 제목·message/feature 분류를 보존한다.
- 상태는 접수(`new`), 진행(`planned`), 완료(`done`)다. 진행 배지에는 원래 친밀한 문구 `해볼게요 / Lo anoto`를 작은 보조문구로 보존한다. 이전 `read`는 접수로 표시하며 DB 값을 강제로 바꾸지 않는다.
- 기존 Supabase Auth 세션과 익명 **인증된** 사용자 ID를 재사용한다. 미인증 `anon` 역할의 공개 쓰기를 허용하지 않는다. 서비스 역할 키를 클라이언트에 추가하지 않는다.
- 권한은 기존 계약 그대로: 두 구성원만 조회, p2(Mami)가 작성, p1(Papi)이 status만 변경. 작성자나 상대방의 본문 수정/삭제 기능은 추가하지 않는다.
- 초대는 기존 UUID 링크로 한 번만 두 번째 구성원을 받아 이후 닫힌다. 이는 이름/이메일로 두 실명을 확인하는 allowlist가 아니다. 아직 비어 있는 초대 링크를 가진 첫 인증 사용자가 p2를 차지할 수 있다. 사용자 신원을 고정하는 계정 전환은 별도 범위다.
- 기존 7일 보관을 유지한다. RLS가 7일 지난 게시물을 즉시 숨기며 기존 hourly cron이 물리 삭제한다. 공간은 유지된다. 익명 인증의 브라우저 데이터가 삭제되면 기존 좌석 복구가 보장되지 않는다.
- Supabase 값이 없으면 명시된 같은 브라우저 데모만 제공한다. 온라인 요청 실패를 로컬 저장 성공으로 바꾸지 않는다.
- 작성/상태/공간 생성에는 동기 ref 잠금이 있다. 제출 실패 시 입력을 보존하고, 같은 입력 재시도는 같은 UUID를 사용한다. DB가 이미 저장한 요청이면 원본 행을 반환한다. UUID를 다른 공간/내용에 재사용하면 거부한다. 브라우저 새로고침을 넘는 미전송 초안 보존은 추가하지 않았다.
- 목록은 기존 15초 간격 조회·창 focus·수동 새로고침으로 갱신된다. 즉시 Realtime 연결을 주장하지 않는다.

## 데이터 모델과 외부 조치

기존 `feedback_spaces`, `feedback_space_members`(space/user 기본키와 space/seat unique), `feedback_entries`를 재사용한다. 새 테이블이나 공개 권한은 없다. `202610110005_feedback_submission.sql`은 기존 category CHECK에 complaint/other를 더하고 `submit_feedback(uuid,uuid,text,text,text)` RPC를 만든다. 이 함수는 Auth와 p2 구성원을 검사하고 DB 기본 상태/시간으로 insert한 뒤 동일 요청을 비교한다. JSONB 단일 행을 반환하므로 클라이언트 RPC 결과는 객체다. authenticated 직접 insert 권한은 회수하며 기존 SELECT RLS와 status 컬럼 UPDATE 권한은 유지한다.

**이 세션은 원격 DB·Auth·보안 설정·배포를 실행하지 않았다.** `.env.example`만 있고 운영 연결값/연결 프로젝트가 제공되지 않았다. 다음 외부 단계가 완료돼야 운영 저장 완료로 보고할 수 있다.

1. 부모가 원격 작업 범위를 확인하고, 승인된 Supabase 프로젝트에 기존 0001–0004와 새 0005 마이그레이션을 적용한다. `supabase db push`는 적용 전 pending migration 전체를 검토한다.
2. 기존 익명 Auth 설정, `feedback-seven-day-cleanup` cron 및 RLS/grants를 확인한다. 이 작업을 위해 보안을 완화하지 않는다.
3. 기존 공개 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`로 프런트를 빌드한다. **0005부터 직접 insert가 막히므로 기존 프런트는 작성 실패한다. 새 RPC를 사용하는 이 프런트와 함께 적용해야 한다.**
4. 실제 분리된 두 브라우저/기기로 p1 공간 생성 → p2 초대 → 작성 → reload → p1 상태 변경 → p2 조회를 확인한다. 세 번째 인증 사용자와 미인증 요청의 조회/쓰기 차단도 확인한다. 실제 Supabase Auth/PostgREST에서 동일 request 재시도 한 건을 확인한다.

부모가 전달한 사용자 승인 증거(지정 저장소에 올리라는 명시적 지시)에 따라 이 브랜치만 일반 push한다. main merge/force push/배포는 하지 않는다. 개인정보 이미지나 검수 캡처는 업로드하지 않는다.

## 실제 검증

- 후속 커밋 최종 검증: 전체 Vitest **442/442**, 빌드 통과, Chromium **39/39**, uncaught page errors **0**. KO/ES 800px·390px 터치 화면에서 기존 접근·가로 넘침 없음, 390px 작성 후 SQL-backed reload를 확인했다. 기존 종이 펼침 `feedback-paper-unfold / 0.68s`와 reduced-motion 시 `none`, 진행 배지의 `해볼게요 / Lo anoto`도 실제 브라우저에서 검사했다.
- 후속 변경은 게임용 데스크톱 차단 제거와 진행 배지의 원래 보조문구 복원뿐이다. `feedback.css`의 종이 배경/펼침/호버/반응형 규칙과 기존 Mami/Papi KO/ES 제목·설명·placeholder·제출 문구, 랜딩/편지 파일은 변경하지 않았다. RPC·RLS·7일 보관·중복 제출/응답 유실 보호를 그대로 유지했다.
- 첫 커밋의 전체 Vitest 441/441와 `npm run build`가 통과했고, 아래 후속 변경의 최종 검증을 추가 기록한다.
- 새 SQL/RLS 테스트는 **실제 PostgreSQL 역할을 실행하는 PGlite**로 최신 migration chain을 적용해 두 구성원, 제3자, 미인증 사용자, 직접 insert 차단, status-only 권한, 유효성, 요청 재사용/충돌, 7일 만료를 확인한다.
- 첫 커밋의 Chromium KO/ES 1440×900 폼 검수는 29/29, uncaught page errors 0이었다. 당시 작은 화면 차단을 검사했으나 이것은 기존 접근의 퇴행이므로 후속 커밋에서 제거했다. 기존 독립 두 브라우저의 SQL-backed reload, 상태 공유(수동 조회), 연속 submit 한 요청, 저장 후 응답 유실/재시도 한 행, 오류 시 초안 보존, 빈 상태, 언어 변경, 세 번째 브라우저 거부 검사는 유지한다.
- 브라우저 검수는 `scripts/online-fixture.mjs`의 로컬 HTTP/PGlite 계약을 사용했다. Supabase Auth/PostgREST/Realtime와 운영 cron 자체의 검증은 아니다. 저장소 `output/`에는 결과 JSON/KO/ES 캡처가 있고 Git에는 넣지 않는다.

재현:

```sh
npm ci --cache /tmp/suggestions-npm-cache
npm test
npm run build
node scripts/online-fixture.mjs
# 별도 터미널
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=local-fixture-public-key npm run dev -- --port 5194
# 별도 터미널: 기존 scripts/playwright-browser.mjs가 지원하는 Playwright/Chromium 설치를 사용
FEEDBACK_URL=http://127.0.0.1:5194 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chromium node scripts/verify-feedback.mjs
```

추가하지 않은 범위: 관리자 대시보드, 첨부, 이메일 알림, 공개 쓰기, 인증 교체, 무기한 보관, 운영 설정 변경.
