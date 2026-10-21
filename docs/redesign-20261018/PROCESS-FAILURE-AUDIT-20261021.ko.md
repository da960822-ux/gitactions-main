# 리디자인 진행 실패 감사

날짜 표기: 문서/폴더의 `20261021`은 한국 현지 작업일 식별자로 보존한다. 원 감사의 실제 실행일은 **2026-10-20 UTC**, 현재 보충 검수일은 **2026-10-21 UTC**다.
작성: 2026-10-21 · 범위: 프롬프트/계획/스킬/활성 source/QA 기록의 읽기 전용 대조

## 현재 상태 — 2026-10-21 UTC

**현행 보충:** 새 개인 이야기 흐름(광주↔산토도밍고, 실제 13시간 시차, 날짜/D+565, 조건부 장난 결투)의 native desktop QA는 source `5420dc0` 안정 상태에서 1920×1080 KO와 1440×900 ES로 끝났다. 네이티브 입력으로 0시→전날 11시 변환, 23시→같은 날 10시 변환, 포인터/키보드로 반대편 리액션 전환과 aria, 같은 UUID의 실제 원문 5문단 읽기→엔딩→재독서를 확인했고 1440 reduced motion도 통과했다; page/console/HTTP 오류는 0이다. 8개 원본 프레임과 현재 영상은 [후반부 현행 검수 상태](POST-HERO-REPLAN-20261021.ko.md)에 연결했다. 기록 세부는 [content-audit-v3](../../output/current-review/implementation-20261021/content-audit-v3/report.json)의 `illustratedStoryNativeReview`와 `illustratedStoryNativeReview.independentVisualReview`다. 독립 A는 여덟 프레임의 scoped 시각 검수를 통과시켰다: 원래 편지 종횡비(1920 `.9999445`, 1440 `.9999249`)와 자연 높이를 유지했고 overflow·오류가 없었다. 거리 타이포는 성기고 시계는 2D이며 결투는 합성 표현이다. 이 표본은 연속 3D/Lusion 모션 또는 전체 랜딩 4/5를 증명하지 않는다. 새 전체 영상은 capture-only 40px 휠 보정을 반영해 56.90초/1440×900 ES/1.2배속으로 기록됐다. 약속서 교체 제안 이전의 실제 검수본이다. 국가 모형 시안은 거절됐으며 콘텐츠 완료로 세지 않는다. 최신 보고된 전체 검사는 83 files/648 tests, post 29/29, TypeScript/Vite/edge build 통과(09:23 UTC)였으며 이는 5420dc0에 커밋된 동일 소스의 검사이며 디자인 합격을 뜻하지 않는다. Hero의 독립 A 판정 구도4·공간3·목적4·craft3/5 및 전체 4/5 미달은 그대로다. 모바일 QA는 제외됐고 검수하지 않았다.

독립 A의 최종 encoded 영상 표본 판정은 구도4·공간3·목적4·craft3/5이며 전체 4/5 관문은 미달이다. 이전 P1 가림은 해소됐고 `.35` 부분 노출은 짧게 지나가지만, 평평한 근접 벽·낮은 접힌 천장·직선 목재 접합이 B 원화를 상자 안의 삽화처럼 보이게 한다. 승인 B 도착은 보존하며 이 공간 통합 문제를 미완료로 남긴다.

현재 증거 묶음은 [요구 완료 감사](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/plan-completion-audit.json), [천장 정지 표본](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/shallow-report.json), [현재 critique snapshot](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/critique-snapshot-current.json) 및 [post-polish 검사](../../output/current-review/implementation-20261021/content-audit-v3/report.json)의 `postPolishImplementation`이다. 과거 `849344f` 영상/보고서는 역사 자료로 남기며 최신 통합 근거로 쓰지 않는다.

이전 Hero 카메라 검토는 1920×1080과 1440×900 각 다섯 장, 총 열 장의 settled still을 포함했다. 독립 A는 종전 P1 구조면 가림을 해소로 판정하며, 남은 P2는 상자/삽화처럼 읽히는 인상과 `.35` 부분 jamb 가림이다. 별도의 이전 ceiling review는 1440×900 네 still에서 561개 정점의 실제 변형, `.35/.42` 곡면 실루엣, `.68` 복원을 확인했다. 이는 전체 경로 통과나 4/5 전체 점수가 아니다. 이전 source `97005d6`의 [1440×900 ES 영상](../review/landing-current-es.mp4)은 역사 자료이며 SHA-256 `db4a2d0ffee5e965137c74aa8d148a245242e7d329fb00fa637e7bc54fecebce`다. 48.466667초 H.264/1.2배속, 무음·무자막, 14 native action으로 Hero 왕복·L06 그림→카드·gallery hover/click·편지 5문단과 4+4 장미·ending을 담았지만 현재 이야기 재구성의 QA가 아니다. 전체 16+4 행동 검수 영상도 아니다. Hero의 전체 4/5 관문은 미달이다. Software SwiftShader 표본은 1920과 1440에서 완료됐으며 hardware GPU 성능은 미측정이다.

Hero CTA pressed 상태와 GalleryCollection의 주변 선택물 크기·깊이·hover 맥락 타이틀은 구현됐다. [gallery scoped QA](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/product-report.json)의 `galleryHoverPolishVerification`은 1440×900 ES normal 및 1920×1080 KO reduced에서 통과했고, height-only resize 문제를 StudioScene의 `54acdf349482489d926ee19d8b51500b16e0bc766338b6e8dedf21a252dda4b6` 수정으로 해결했다. 원 실패 attempt는 같은 보고서에 보존했다; 모바일 viewport QA는 실행하지 않았다.

이전 source checkpoint의 검사 기록은 main 76 files/623 tests, post 29/29와 TypeScript/Vite/edge build 통과였다. 뒤이은 listener 수정 후 97005d6 build, focused 5 tests와 TypeScript가 통과했으나 623 full-suite는 그 수정 전에 실행됐다. 622는 더 앞선 checkpoint다. 이 수치는 모두 위의 최신 83/648 결과 이전 역사 기록이다. [이전 소프트웨어 성능 측정](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/performance-probe.json)은 Linux headless Chromium·ANGLE SwiftShader·DPR1의 stable 97005d6 release build/source에서 수행됐다: fence 뒤 완료된 WebGL 제출은 1920×1080에서 2.80회/초, 1440×900에서 4.38회/초였다. 이는 실제 화면에 제시된 frame/FPS나 hardware GPU 측정값이 아니다. 실제 GPU 성능은 미확인이다. 모바일 QA는 이번 범위 밖이며 완료 gate가 아니다. 이전 source의 1440 연속 영상은 역사 자료이며, 독립 A의 전체 4/5 관문은 미달이다.

이번 감독 교정의 핵심은 승인 B를 임의의 world 좌표·거리로 고정한 잘못된 전제, 20초 proof를 공동 그림/패턴 작성 전체 시간으로 읽은 전제, 상태 전이를 실제 화면 보상으로 대신한 판정을 제거한 것이다. 편지 최초 개봉/연속 닫기, 발견물 결과와 공동 기능은 각 실제 검수 범위를 구분한다. 테스트·스킬 이름·기능 수로 시각 합격을 대신하지 않는다.

상세 이전 진단과 원시 실패 이력은 [f12c25d 시점 감사 전문](https://github.com/da960822-ux/gitactions-main/blob/f12c25d9e2b45c178abe359aa66575a957af6967/docs/redesign-20261018/PROCESS-FAILURE-AUDIT-20261021.ko.md)에 보존한다. 최신 요구·보호 범위는 [Hero 지시](HERO-REVISION-BRIEF-20261021.ko.md)와 [후반 통합 계획](POST-HERO-REPLAN-20261021.ko.md)을 따른다. 아래 cf907bc 당시 checkout·점수·범위·검사 수치는 과거 감사 시점 기록이며, 현행 상태는 위 요약을 따른다.

## 과거 판정과 자료 한계

이 감사 범위에서는 “무슨 Three 좌표나 셰이더가 미감을 망쳤는가”라는 단일 원인을 확정하지 않는다. 저장소에 초기 사용자 개발 지시 0–13절 원문은 없고, 이번 감사자는 현재 MP4를 재생하거나 브라우저에서 새 검수를 하지 않았다. root가 전달한 현재 source 관찰은 별도로 기록하되, 수정 중이거나 브라우저 검증 중인 구현 세부를 과거 실패의 확정 원인으로 확대하지 않는다.

확인 가능한 과정상 실패는 기록에 이미 적혀 있다. 총괄은 승인 없는 갤러리 자산·색·배치 변경, Hero와 후반의 명도/톤 단절, 구도보다 개별 오브젝트를 먼저 고친 반복, 테스트를 시각 완료와 혼동한 점을 인정했다. 현재 self-review도 전체 랜딩을 불합격으로 두고, Hero 전환 불합격·이스터에그 미검수·장미 그림 부재·엔딩 구도 미승인을 기록한다. 최신 커밋 `cf907bc` 역시 제목에 “visual review failed”를 남겼으며, 이 커밋만 74개 파일(+4,158/−644)을 바꿨다. 변경량이 실패의 원인이라는 뜻은 아니지만, 구현량과 시각 통과를 같은 척도로 볼 수 없다는 직접 증거다.

현재 checkout은 `redesign/folded-playhouse-depth-r8-20261018`, HEAD `cf907bc`이며 감사 시작 시 worktree는 clean이었다. 조사한 사용자 지시의 최신 제약은 현재 대화에 전달된 내용이고, 전체 원시 대화 로그는 저장소에서 찾지 못했다.

## 당시 지시와 오래된 문서의 대조

| 현재 유효한 지시 | 오래됐거나 범위가 좁은 문서 기록 | 적용 기준 |
|---|---|---|
| B 게임방 **정적 구도는 승인됨**. 품질은 세 콘셉트 중 하나를 고르는 것보다 중요하다. 작은 방이나 긴 복도는 금지. | `PLAN.ko.md`의 초안은 A안을 추천하고, 예전 Gate0 승인 대기를 적는다. `PRODUCT.md`/`DESIGN.md`는 한 줄 8게임·작은 우주 Hero 중심으로 기술한다. | B 정적 구도를 기준으로 한다. A 추천과 Gate0 대기는 낡은 상태다. 정적 구도 승인은 전체 Hero 경로·후반 장면의 시각 합격을 뜻하지 않는다. |
| 데스크톱 먼저, 모바일은 마지막. | 일부 계획은 여러 해상도/모바일 설계를 동시에 상세히 적는다. | 데스크톱 시각 검수가 끝나기 전 모바일을 완료 상태로 취급하지 않는다. |
| Hero는 새 Sol High 담당자가 수정한다. 후반부는 별도 Sol이 계획만 한다. | 이전 owner 이름·수정 범위·실패횟수와 승인 순서가 다른 역사 기록이 다수다. | 현재 owner 범위를 우선한다. 이번 감사 작성자는 디자인을 수정하지 않으며, Hero/후반 코드를 함께 고치지 않는다. |
| 게임 정의 6개를 예전 상태로 복구하고 Leonardo 초상과 사용자 Splendor 표지를 유지하며 어두운 갤러리 팔레트/배치를 보존한다. | EASTER-EGGS v3의 승인 말 7종·조커·귀족은 후반 이벤트 자산 범위다. PLAN의 앞부분에는 갤러리 변경 중단 기록이 있다. | 갤러리 회귀 계약과 이스터에그 자산 계약은 별개다. 후반 자산 목록을 갤러리 여덟 게임의 새 정의/미술 지시로 읽지 않는다. |
| 게임, 편지, 피드백은 각각 독립 목적지다. 실제 계약은 8개 게임/route, 한국어·도미니카 스페인어, 편지 원문 보존이다. | 한 페이지 `/`의 story→gallery→letter는 같은 스크롤 시퀀스로 이어진다는 과거 설계다. `/feedback`은 독립 route라고 self-review가 확인한다. | 랜딩 내 섹션의 연속 연출과 기능 페이지 합치기를 구분한다. `/play?game=…`, `#papi-letter`, `/feedback`을 한 “경험”으로 합쳐 라우트/기능을 지우지 않는다. |
| root의 현재 지시는 Hero 실제 수정은 새 Sol High에게 허용하고, 후반부는 별도 Sol이 계획한다. 이 하위 감사 담당자의 범위만 감사 문서 1개 작성이다. | `PLAN.ko.md`에는 Gate별 진행 대기, owner 배정, 계획 승인 대기가 혼재한다. `REVIEW-LIMITATIONS.ko.md`와 PLAN 최신 서두는 후속 구현 허용과 별도 main/deploy 승인을 기록한다. | 계획 초안의 “승인 대기”를 새 중단 장벽으로 되살리지 않는다. 이 문서 작성자는 구현하지 않으며, 지정 Hero owner와 후반 계획 owner의 범위는 서로 분리한다. main 병합/배포는 별도 승인 전 금지다. |

`PRODUCT.md` 및 `DESIGN.md`는 2026-10-18에 작성된 파일이고, Impeccable context 출력은 “게임 8개 한 줄, 430–440px Hero, 현재 우주/장미 구성, gallery 없음”을 incumbent truth처럼 제시했다. 이 내용은 현재 승인 B 구도 및 실제 구현/사용자 제약과 다르다. context 로더가 이 파일들을 읽었다는 사실은 내용이 최신이라는 증거가 아니다. 최초 사용자 원문 부재도 계획문서가 원문보다 우선한다는 근거가 아니다.

## 스킬: 설치 흔적과 실제 적용 증거

스킬 파일이 존재하거나 계획 문서가 이름을 언급한 것만으로 실제 적용을 입증하지 않는다. 적용 증거는 해당 시점의 읽은 지침, 그 지침이 만든 구체 결정/변경, 그리고 검증 결과가 같은 범위에 연결돼 있어야 한다.

| 스킬/자료 | 현재 확인된 설치·기록 | 실제 적용으로 말할 수 있는 범위 |
|---|---|---|
| Ponytail full | `AGENTS.md`가 전체 agent에 적용하도록 요구하며 `.agents/skills/ponytail/SKILL.md`가 있다. 이 감사에서도 전문을 재사용해 읽었다. | 작업 규칙은 명시적이다. 과거 각 변경이 최소 완전 변경인지/후속 검증까지 따랐는지는 파일별 검토 없이 일반화할 수 없다. 과거 적용을 입증하는 실행 log는 찾지 못했다. |
| `couple-games-landing-design` | `.agents/skills/couple-games-landing-design/SKILL.md` 존재. EASTER-EGGS v3는 실제 적용 지침이라고 쓴다. | 기술/제품 제약이 반영된 계획 증거는 있다. 구체 skill read/invocation→현재 디자인 결과 연결은 보존 기록에서 확인되지 않는다. |
| Impeccable | `.agents/skills/impeccable/SKILL.md` frontmatter 스킬 버전은 4.5.2, 별도 bundled launcher `scripts/VERSION`은 0.1.14다. 이번 하위 감사에서 전문을 읽고 `context --target src/landing/LandingWorldHost.tsx`를 실행했다. 출력에 `MANUAL_DETECTOR_REQUIRED`와 “자동 hook 없음”이 표시됐다. | 두 버전은 서로 다른 구성요소의 버전이므로 값이 다르다는 것 자체는 결함 증거가 아니다. 이번 context는 오래된 Product/Design을 로드했으며, `reference/new-work.md` 및 skill이 fallback으로 지칭하는 `.agent/skills/impeccable/scripts` 경로는 현재 없다. `critique.md`와 `audit.md`는 있다. 이번 하위 감사는 critique/audit를 실행하지 않았지만 root가 별도 critique를 현재 실행 중이라는 인계가 있다. 자동 detector hook 부재는 확인된 운영상태이며, 시각 실패 원인이라는 증거는 아니다. |
| Taste / `gpt-taste` / `taste-redesign` | `.agents/skills/gpt-taste/SKILL.md`, `taste-redesign/SKILL.md`는 있다. PLAN은 gpt-taste를 조사했다고 적지만 해당 Gate에서 새 design workflow를 실행하지 않았다고도 명시한다. | 저장소에 존재하는 것과 디자인 결과에 적용된 것은 다르다. 이전 이름 `design-taste-frontend`와 현재 `gpt-taste`를 하나로 뭉뚱그리지 않는다. |
| Emil `animate`, `review-animations`, `animation-performance`, `emil-design-eng`, `prototype` | 관련 SKILL.md들이 존재한다. PLAN은 공식 문서/명칭을 조사했다고 기록하면서 “새 모션/디자인 실행 완료 아님”이라고 명시한다. 이전 `skill-application-audit.md`는 `24a6ec6` 기준 정적 source-mapping만 수행했고 “browser/render 없음”이라고 적었다. 그 파일은 현재 트리에 없고 `doc-cleanup.json`의 복구 항목으로만 남는다. | 정적 코드 연결/향후 검증 계획은 있다. 현재 `cf907bc` 디자인에 대한 Emil motion review 또는 performance 실측을 수행했다는 증거는 없다. |
| GameDev skill collection | `.agents/gamedev-skills-manifest.json`은 74개와 router를 upstream commit `0a70cfc…`에 pin하며 source manifest와 hash를 둔다. | 이는 GameDev collection의 설치/무결성 근거다. `impeccable`, `couple-games-landing-design`, Taste, Emil 스킬의 manifest/실행 근거로 확장할 수 없다. |

현재 Impeccable context에서 확인된 자동 UI detector가 없다. 과거 gate 기록에 Playwright 캡처, 빌드, 테스트가 있어도 그 자체로 Impeccable critique 또는 `review-animations`를 실행했다는 뜻은 아니다. 이번 하위 감사에서는 UI 코드를 수정하지 않았고 이 agent는 `craft-floor`/detector/critique를 실행하지 않았다. root의 현재 critique와 과거 디자인 owner의 스킬 적용은 별도 증거로 기록해야 한다. 한번-per-session context 규칙을 subagent별 독립 실행에도 적용하지 못해, root가 이미 context를 실행한 뒤 이 하위 agent도 context를 중복 실행했다. 이 중복 실행은 이번 운영상 실수이며 시각 실패의 원인이라고 볼 근거는 없다. 같은 세션에서 context를 다시 실행하지 않는다. 새 담당의 실제 검토에서는 UX critique, measurable audit, motion review를 서로 다른 범위/결과로 기록해야 한다.

## 기록으로 확인되는 원인과 아직 추정인 원인

| 분류 | 확인 내용 | 근거 / 한계 |
|---|---|---|
| 확인된 판단 오류 | 요청보다 넓게 갤러리 자산·색·배치를 교체하고, 사용자가 좋아한 기준을 바꿨다. | `IMPLEMENTATION-SELF-REVIEW.ko.md`의 총괄 자기 피드백과 갤러리 롤백 기록. |
| 확인된 판단 오류 | Hero/후반의 전체 스크롤 톤을 먼저 검수하지 않고 밝은 크림 장면을 끼워 넣어 톤 단절을 만들었다. | 같은 self-review가 인정. |
| 확인된 판단 오류 | 게임 식별성보다 새 조형을 앞세우고 이미 있던 Splendor cover 같은 명확한 자산을 우선하지 않았다. | self-review의 자산 회귀 원인 기록. |
| 확인된 판단 오류 | 방의 최종 카메라·스케일·화면 점유를 먼저 검수하지 않고 가림/경계를 객체 단위로 반복 수정했다. “빈 상자 안 작은 이미지” 지적은 해결되지 않았다. | self-review의 작은 방/가림 항목. 세부 기술 원인은 그 문서도 미확정으로 둔다. |
| 확인된 프로세스 공백 | 주요 실제 화면 검수보다 소스/테스트 확인이 앞섰고, self-test나 기능 통과를 시각 결과와 혼동했다. 현재 독립/총괄 시각 FAIL은 통과로 바뀌지 않았다. | PLAN 서두, REVIEW-LIMITATIONS, self-review, 최신 commit 제목의 상태가 일치한다. |
| 확인된 QA 경계 | 장미 hint action과 장미 4+4가 현재 정적 읽기 프레임에 보이는지는 서로 다른 주장이다. 현재 프레임의 꽃 부재는 보고돼 있다. 16 local action 성공도 전 이벤트 시각 통과가 아니다. | self-review와 PLAN 서두. 보조 영상은 최신 전체 디자인 승인 자료가 아니다. |
| 확인된 source 경계 | 런타임은 `LandingWorldHost.tsx`에서 `previewSpaceV19`를 동적 import하고 `poseSpaceV19`를 직접 import한다. 현재 V19는 `storySurfaceV19`, `ApprovedGamingRoom`, `stageMotionV19`, `poseSpaceV19` 등을 사용한다. 이전 표가 `curvedReflectionV19`, `floorSupportV19`, `arrivalCoveV15`를 현재 runtime 의존성으로 적은 것은 오래된 코드 기준의 오류였다. | 2026-10-21 현 import graph로 정정했다. 테스트만 연결된 `shellGeometry`·`arrivalCoveV15`와 그 테스트, 후자의 유일 helper `poseSpaceV11`, 호출자 없는 옛 재구성 방 `storyAtriumV19` 등 6개 파일/187줄을 활성 소스에서 제거했다. 현재 Hero 연구 담당도 미사용을 확인했다. 원본 계획·승인 자산·보존 archive·Git 계보는 유지한다. `shellTwist`/`poseSpaceV6`, reflection/floor/threshold는 기존 연구 patch의 의존성이 있어 이번 삭제에서 제외했다. 버전 이름만으로 미적 실패를 단정하지 않는다. |
| 현재 root의 기술 확인/진행 | `previewSpaceV19`의 room 구간에서 camera billboard/scale 동작은 `.12 < p < .38` 범위에 있고, `p=.27`에서 cosmic surface down/disappear 경계가 있다. root가 이를 수정하고 브라우저 검증 중이라고 전달했다. | source상 위치와 진행 상태의 인계 사실이다. 이 감사자는 해당 변경 diff나 브라우저 결과를 독립 확인하지 않았으며, 이는 단일 원인 판정이 아니다. 수정/브라우저 검증은 root가 계속한다. |
| 미확인 기술 원인 | S1 공간 전환 불합격, 작은 방, 빈 공간, 표면/캐릭터 가림이 어떤 기술 세부의 결과인지에 대한 단일 원인 판정. | 이 문서 감사범위에서는 현재 영상/브라우저를 재현하지 않았다. 사용자/독립검수 기록의 시각 FAIL과 root가 전달한 진행 중 source 관찰은 함께 남기되, 특정 수치나 코드 경로를 과거 실패의 확정 원인이라고 부르지 않는다. |

사용자가 이전에 들은 642 테스트 숫자는 이 감사의 디자인 pass 근거가 아니다. 최신 문서에 남은 54 shared + 28 game-client 테스트, 14 backend 검사 및 로컬 두 인증 컨텍스트의 client 2/UI 9는 모두 기술/범위 증거다. 로컬 두 context는 물리 기기 두 대 QA가 아니다. 실제 realtime, 2인·2기기 검수와 cloud deployment는 미완료/미실행으로 분리하며 main 병합·배포도 하지 않았다.

## 중단 프로세스와 다음 검수 게이트

1. **현재 scope 동결:** 이번 감사자가 코드/자산/브라우저를 바꾸지 않는다. Hero 소스는 새 Sol High에게만, 후반은 별도 Sol의 계획 작업에만 맡긴다. `LandingWorldHost` 같은 공유 경계에 동시 수정이 필요하면 먼저 파일 소유자와 변경 경계를 합의한다.
2. **모순 없는 최신 brief 하나를 기준으로 삼기:** B 정적 구도·기존 사용자 자산·보호 카피/8개 route·섹션 분리·데스크톱 우선·모바일 최후순위를 한 장의 요구사항표로 고정한다. 오래된 A 추천, Gate0 승인 대기, Impeccable Product/Design의 현행성 주장을 새 지시보다 앞세우지 않는다.
3. **정적 방과 이동 Hero를 별도 검수:** B 정적 구도는 이미 승인된 기준이므로 다시 콘셉트 승인을 요구하지 않는다. 새 구현의 실제 desktop 렌더가 승인된 B의 크기/점유/주인공 배치를 따르는지 먼저 대조한다. 그 뒤에만 Hero 이동의 입장·중간·도착·역행을 검수한다. 계획서 숫자·world 좌표는 후보 설명이며 제품 UX 계약이 아니다. 불합격이면 원인 측정 전 다음 시각 patch를 덧대지 않는다.
4. **후반은 별도 계획/페이지 검토:** 기존 story, gallery, letter, ending을 기능/원문 보존 경계에 맞춰 따로 설계한다. 피드백은 독립 `/feedback`, 편지는 독립 `#papi-letter`, 게임은 실제 `/play?game=` 목적지로 남긴다. 후반 계획이 승인되기 전 Hero와 합쳐 새 runtime/콘텐츠를 만들지 않는다.
5. **증거를 분리해 제출:** 각 범위별 실제 browser 원본 캡처/영상, 화면 크기, 언어, route, 입력/역행, 검수자 판정과 미확인을 기록한다. B 수동 검출 결과로 보고된 `src/landing` 13개와 `post-hero-preview` markup 7개 검사에서 finding 0, warning 0은 그 범위의 정적 검사 결과다. 경고 0도 시각 승인/실제 브라우저 pass가 아니다. 빌드/test·정적 코드·기술 profile·렌더된 mockup은 각각 해당 범위로만 표기한다. 불합격 1건은 다음 변경의 시작점이지 평균점수로 상쇄할 항목이 아니다.
6. **스킬 사용을 증명:** 사용 시점/읽은 SKILL 경로·버전, 특정 디자인/동작 결정에 적용한 문장, 결과 source, 실제 검수 artifact를 연결한다. Impeccable critique와 technical audit를 실행했다면 출력 파일을 남기고, motion은 `review-animations`, 성능은 계측 결과로 분리한다. 스킬 언급만 있는 기존 계획을 실행 기록으로 바꾸지 않는다.
7. **합격 전 확장 금지:** 새로운 아트 변형, asset generation, 페이지/기능 확장, 모바일 마감은 desktop scope의 독립 시각 승인 뒤 진행한다. 인증 공동 기능은 backend 검사와 분리해 실제 두 사용자의 두 기기 검수 뒤에만 사용 가능으로 표시한다. main 병합/배포는 별도 사용자 승인이 필요하다.

**확인하지 않은 것:** 원시 사용자 프롬프트 전체, 현재 video playback, 현재 브라우저 재현, V1–V19 전 파일별 픽셀 비교, 과거 각 skill invocation log. 남은 위험은 미확인 렌더 원인을 사실처럼 적지 않고, 후속 owner가 범위별 실제 화면에서 확인해야 한다는 점이다.

## 역사 기록과 현재 적용 원칙

`f12c25d` 시점의 전체 추가 감사와 개별 v6–v13 연구 chronology는 [Git history copy](https://github.com/da960822-ux/gitactions-main/blob/f12c25d9e2b45c178abe359aa66575a957af6967/docs/redesign-20261018/PROCESS-FAILURE-AUDIT-20261021.ko.md)에 보존한다. 이 문서는 그 긴 반복을 복제하지 않고, 현재 적용되는 판정과 경계만 유지한다. 과거 문단의 owner, source checkpoint, test 수치는 당시 상태다.

과거 시도에서 반복 확인된 교훈은 세 가지다. 승인 B는 도착 프레이밍과 인물 정체성을 보호하지만 특정 좌표·카메라·hinge 해결책을 강제하지 않는다. 테스트 통과와 정착 endpoint는 중간 화면의 시각 품질이나 연속 motion 증거가 아니다. 실패 뒤에는 같은 owner에게 실제 관찰 프레임과 잘못된 prompt 전제를 전달해 수정하며, 실패 횟수만으로 owner를 교체하지 않는다. 현재 제약은 [Hero brief](HERO-REVISION-BRIEF-20261021.ko.md), 요구·행동 범위는 [post-Hero plan](POST-HERO-REPLAN-20261021.ko.md), 공유 카메라/최종 연속 영상·성능 검수는 root가 소유한다.

초기 개발자 지시 0–13 원문은 저장소에서 찾지 못했다. 보존된 요구 추적표·기술 설계·현재 사용자 지시를 근거로 삼으며, 누락 원문을 복원한 것처럼 쓰지 않는다. 모바일은 이번 요청 범위 밖이고 완료 gate가 아니다. 최종 연속 영상과 software 성능 결과는 위 현재 상태에 반영했으며 actual GPU 성능은 미확인이다.
