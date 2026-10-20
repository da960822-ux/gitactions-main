# 리디자인 진행 실패 감사

작성: 2026-10-21 · 범위: 프롬프트/계획/스킬/활성 source/QA 기록의 읽기 전용 대조

## 판정과 자료 한계

이 감사 범위에서는 “무슨 Three 좌표나 셰이더가 미감을 망쳤는가”라는 단일 원인을 확정하지 않는다. 저장소에 초기 사용자 개발 지시 0–13절 원문은 없고, 이번 감사자는 현재 MP4를 재생하거나 브라우저에서 새 검수를 하지 않았다. root가 전달한 현재 source 관찰은 별도로 기록하되, 수정 중이거나 브라우저 검증 중인 구현 세부를 과거 실패의 확정 원인으로 확대하지 않는다.

확인 가능한 과정상 실패는 기록에 이미 적혀 있다. 총괄은 승인 없는 갤러리 자산·색·배치 변경, Hero와 후반의 명도/톤 단절, 구도보다 개별 오브젝트를 먼저 고친 반복, 테스트를 시각 완료와 혼동한 점을 인정했다. 현재 self-review도 전체 랜딩을 불합격으로 두고, Hero 전환 불합격·이스터에그 미검수·장미 그림 부재·엔딩 구도 미승인을 기록한다. 최신 커밋 `cf907bc` 역시 제목에 “visual review failed”를 남겼으며, 이 커밋만 74개 파일(+4,158/−644)을 바꿨다. 변경량이 실패의 원인이라는 뜻은 아니지만, 구현량과 시각 통과를 같은 척도로 볼 수 없다는 직접 증거다.

현재 checkout은 `redesign/folded-playhouse-depth-r8-20261018`, HEAD `cf907bc`이며 감사 시작 시 worktree는 clean이었다. 조사한 사용자 지시의 최신 제약은 현재 대화에 전달된 내용이고, 전체 원시 대화 로그는 저장소에서 찾지 못했다.

## 최신 지시와 오래된 문서의 우선순위

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
| 확인된 source 경계 | 런타임은 `LandingWorldHost.tsx`에서 `previewSpaceV19`를 동적 import하고 `poseSpaceV19`를 직접 import한다. V19 모듈은 `storySurfaceV19`, `curvedReflectionV19`, `floorSupportV19`, `stageMotionV19`, `poseSpaceV19`와 `arrivalCoveV15`를 사용한다. `shellTwist`는 `poseSpaceV6` helper를 쓴다. 여러 버전 파일은 테스트 전용/보존물과 구분해야 한다. | 현재 import graph. 버전 이름/코드가 많다는 사실만으로 미적 실패 원인을 단정하지 않는다. V1–V18 소스 및 캡처 일부는 `preserved-work/.../gate1-assets-r8/provenance`에 보존돼 있고, `inactive-source-cleanup.json`은 일부 파일이 app/tests/authoring graph에서 비활성이라 제거된 근거를 담는다. |
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

## 총괄 추기: 이번 시도의 실제 결과

위 표의 감사자 범위와 별도로 root/독립 Sol은 기존 영상과 이번 Hero 실제 브라우저 캡처를 확인했다. 활성 V19에서 방의 카메라 추종 확대를 없애고 우주 표면을 옆으로 여는 시도를 했으나, 중간 p=.20–.24에 사각 방과 검은 여백이 노출되고 p=.18에서 여자친구가 오른쪽으로 잘렸다. 위아래 분할을 없앤 사실이 더 나은 공간을 만들었다는 뜻은 아니었다. root와 독립 시각 검수 모두 **불합격**이다.

최종 시도는 관련 15개 테스트·TypeScript·Vite 빌드를 통과했고 첫 Hero/B 도착은 1920 비교에서 픽셀이 동일했다. 그러나 브라우저의 정·역/중간 반전 샘플은 전체 모션 품질 통과가 아니며, raw 반복 pose 비교도 일치하지 않는 샘플을 남겼다. 검사 성공 수가 시각 실패를 뒤집지 못한다는 이번 세션의 직접 사례다. 환경은 Chromium SwiftShader, logical 1920×1080·1440×900, backing DPR .5였다. 실제 GPU 성능·모바일·첫 방문 타이밍은 검수하지 않았다.

독립 검수 의견에 따라 이 시도의 다섯 파일 변경만 archived patch의 역적용으로 작업 소스에서 제거했다. 다른 담당 문서는 보존했다. 제품 소스는 `cf907bc` 기준으로 복귀했으며 기존 전환 결함이 해결됐다고 주장하지 않는다. 실패 시도는 `output/current-review/hero-composition-20261021/hero-attempt.patch`, `report.json`, 두 해상도 contact/capture에 보존했다. 새 main 병합·push·배포는 없다.

추가 B 검수는 실제 private headless 브라우저에서 WebGL을 의도적으로 끈 fallback 경로만 대상으로 했다. DOM 원문은 직접 읽기로 열렸으나 Host가 world 부재 시 외부 tick 전 반환하여 스크롤 상태가 갱신되지 않았고, 갤러리 실패 뒤 준비 문구가 남았다. 여덟 게임 선택/직접 링크가 사라졌다는 뜻은 아니다. 이 경로의 오류는 WebGL 비활성으로 유도한 것이므로 정상 3D 런타임 오류와 구분한다. 별도 fallback 품질 보완 항목이다.

## 후속 지시에서 바로잡을 총괄 책임

사용자가 불합격 판정만 반복하지 말고 더 나은 지시로 구현을 계속하라고 요청했다. 총괄의 첫 수정 지시는 ‘수평 분할 제거’에 치우쳤고 측면 힌지를 선행 해법으로 지정했다. 목적 원화의 투영 면적과 중간 얼굴 안전 영역을 같은 성공 조건으로 만들지 못했다. 새 지시는 `HERO-REVISION-BRIEF-20261021.ko.md`에 전문을 보존했다. 첫 화면·B를 보존하면서 가까운 카메라와 Hero stage의 비율을 함께 재설계하고, 구도의 실제 화면 증거부터 확보한다. 두 번째 시도는 첫 실패의 구조를 그대로 인수하는 미세 패치로 진행하지 않는다.

기능 보존도 잘못 해석했다. 이야기·번역·아이디어·장난·공동 기능을 각각 큰 설명 장면으로 노출하면서 사적인 선물의 흐름이 기능 소개로 바뀌었다. 수정 계획은 게임 목록 뒤 기본 흐름을 **봉투 발견/개봉 → 원문 → 짧은 엔딩**으로 제한한다. 장난/공동은 맥락상 선택했을 때만 노출하고, 번역은 Catchmind 맥락에, 아이디어는 별도 페이지/메뉴에 둔다. 기능 삭제나 편지 축약으로 해결하지 않는다.

자산 사용 보고도 화면 기여와 분리해야 한다. 병렬 Luna 감사에서 motion MP49개와 제작 프로젝트가 확인됐지만 현재 연결된 두 영상의 emissiveIntensity는0이고 custom shader는 영상 map을 샘플하지 않는다. 로드/디코드/진단 이름을 ‘사용 완료’로 보고할 수 없다. 별도 인벤토리가 보존·연결·픽셀 기여·대표 프레임 품질을 구분한다. 모든 과거 export를 한 화면에 넣는 대신 승인/현행/폐기 초안을 나눠야 한다. 이는 사용자의 자산 재사용 요청을 총괄이 정확한 사용 계약으로 바꾸는 책임이다.

## 실제 스킬 내용에서 확인한 충돌

총괄이 스킬 전문을 대조한 결과 `.agents/skills/gpt-taste/SKILL.md`는 AIDA, 기능/Bento, 큰 CTA/가격 footer, 무작위 레이아웃 선택, picsum 사진 등을 강제한다. 이 사이트의 사적인 선물·승인 자산·기존 갤러리 보존과 충돌하는 항목이다. `.agents/skills/couple-games-landing-design/SKILL.md`에는 compact game rail·secondary sections brief라는 오래된 지침도 남아 있다. 현재 사용자가 기대하는 길고 풍부한 공간 경험보다 이를 우선하면 다른 제품이나 축소판을 만들 위험이 있다. Emil의 DOM transform/opacity 권장은 실제 Three mesh 변형 요구의 대체 근거가 아니다.

이것은 **현재 설치 내용의 충돌을 직접 읽어 확인했다는 사실**이다. 과거 모든 변경에서 이 조항을 실행해서 실패했다는 인과 증거는 아니다. 향후에는 최신 사용자 지시와 승인 자산·제품 목적을 먼저 고정하고, 충돌 조항은 적용하지 않는다. Impeccable의 'brief wins' 원칙, 실제 화면 critique, 가독성·접근성·입력 중단/복귀 같은 합당한 부분을 사용한다. 스킬 이름을 많이 적거나 모두 기계적으로 실행하는 것이 목표가 아니다.

## 최신 정리·운영 상태

### 총괄이 추가한 기술 제약의 재정정

v6의 아치 모양 접합선은 생성 원경을 전경 윤곽 안에서만 원본 원경에 붙이면서 생겼다. 전환 중 모든 원경 픽셀을 고정하는 것은 사용자의 직접 요구가 아니라 총괄이 추가한 기술 제약이었다. 승인 첫 화면·B·인물 보존과 이를 구분하지 못했다. 원본과 cleanplate의 전역 위치 차이는 작지만 색/구름 차이는 남아, 더 정교한 윤곽만으로 해결되지 않았다. root와 독립 검수는 두 실제 자산을 비교했고, v8은 원본 p0를 유지하면서 초기에 먼 배경만 일관된 cleanplate로 이어 주도록 수정했다. 실제 전경 기하/카메라는 유지한다. root가 연 실제 v8 중간 PNG에서는 아치 접합/원경 잔상이 해소됐지만 근경 꽃 추출은 남았다. 전체 모션/시각 통과는 아직 아니며 배경 교체의 가시성과 소품 경계를 따로 확인한다. 모델 문제가 아니라 지시의 과도한 구현 가정도 수정해야 한다는 직접 사례다.

### 최신 역설계 적용과 병렬 기능 보완

사용자가 다시 제시한 지시는 증상인 수평 분할 대신 승인 B의 도착 구도에서 역으로 설계하라는 것이다. `HERO-REVISION-BRIEF-20261021.ko.md`에도 전문을 갱신했다. aperture A는 실패 이력이며 v6에서 분리 방식의 실제 런타임으로 대체됐다. 그 사이 D/v8의 도착 구도와 v11의 전경/원경 정지 구도는 한정된 검수 기반을 확보했다. 실제 런타임 v6는 방 노출 전 B 카메라 도착·얼굴/문구 분리·B 대비 토끼/사진 실루엣 보존을 확인했으나, 아치 모양 원경 접합선과 난간 잔여 조각 때문에 시각 불합격이다. 구조적 구도 개선과 추출/접합 완성도를 구분한다. 기존 B의 원본 가장자리와 중앙 분홍 구분선 자체를 결함으로 취급하지 않는다. 모바일과 후반 공유 연결부는 여전히 뒤 순서다.

별도 Luna는 실제 메인 갤러리의 WebGL 생성 실패 시 무한 준비 표시를 선택 게임의 기존 정적 이미지로 바꾸고, 메인 stylesheet에 누락된 contain 규칙을 추가했다. root도 1440×900 캡처를 직접 확인했다. WebGL을 명시적으로 끈 Chromium에서 8개 선택의 이미지·KO 이름·진입 href와 ES 전환/선택 유지가 확인됐고 page error·실패 응답은 없었다. 이는 GPU 경로·게임 플레이·컨텍스트 소실 복구 검수는 아니다. 근거는 `/workspace/scratch/gallery-webgl-fallback-20261021/evidence.json`이다.

checkpoint `f0e62c8` 저장 시 root가 실행한 전체 검사는 **77개 파일/612개 검사 통과**, production build 통과, `git diff --check` 통과였다. 근거는 `/workspace/scratch/code-cleanup-20261021/final-vitest.log`와 `final-build.log`다. 이후 분리 방식의 Hero 런타임 수정이 추가됐으므로 이 수치를 최신 소스 검증으로 재사용하지 않는다. 큰 bundle 경고는 남아 있으며 성능·시각 합격으로 바꾸어 보고하지 않는다. v6 첫 가시 프레임은 자산/GPU warmup 뒤 entrance=0·textures=8·fallback 없음으로 두 해상도에서 확인됐고 콘솔/페이지 오류는 0이었다. 이는 SwiftShader 구도 검수이며 실제 GPU 성능·모바일·전체 정역방향 모션 검수는 아니다. 현재 경계 실패는 별도 정정 중이다.

### 앞선 정리 검수 이력

사용자가 불필요한 코드/자산 정리를 명시해, 참조 그래프로 비활성을 확인한 과거 folded 실험 소스/전용 테스트38개(67,354 B)를 제거했다. 활성 V19·공유 V11/V6 helper·게임·Remotion 제작 소스는 보존했다. retained290 source의571 relative edge를 대조해 미해결 import는0이었다. 정리 뒤 root77개 테스트 파일/613개 검사와 전체 빌드가 통과했다. 이후 renderer 수정과 마지막 영상 제거 뒤 검수는 별도로 해야 하며 이 숫자를 최종 화면 승인으로 재사용하지 않는다.

자산은 사용하지 않는 과거 MP49개와 orphan preview PNG3개를 삭제했다(합계12개,8,319,417 B). 삭제 전 파일/hash/사용처와 baseline `cf907bc…` 복구 위치는 motion inventory와 cleanup manifest에 남겼다. 원본 이미지·사진·장미·8게임 아트와 제작 프로젝트는 삭제하지 않았다. 끝의 ‘처음으로’가 이야기 중간으로 가던 잘못된 anchor는 `#home`으로 수정했다.

**최신 사용자가 시각 실패 횟수에 따른 담당자 자동 교체를 폐기했다.** 이전 교체는 과거 사실일 뿐 미래 운영 규칙이 아니다. 현재 owner를 유지하고 실패 화면/측정으로 지시의 전제와 누락 조건을 고쳐 재설계한다. B에서 역설계할 때도 최종 도착→중간 정지 구도부터 검수하고, 이미 정한 aperture/hinge/복도에 B를 맞추지 않는다. 현재 새 static 후보의 얼굴 안전성은 공간 완성도 통과와 구분한다.

### 브랜치 계보와 보호 소스 확인

Git/source 대조에서 post-hero `789777f`와 game-fixes `df087fc`는 모두 checkpoint `f0e62c8`의 조상이다. `src/games` 트리는 game-fixes 브랜치와 byte-identical이며, post-hero 브랜치와 다른 부분은 후속 game-fixes 변경이 checkpoint에 통합된 결과다. 선택된 10개 보호 파일이 이전 `cf907bc` 기준과 동일했고, 별도 경로 diff에서 게임/Supabase 소스 변경이 없음을 확인했다. 이는 브랜치 계보와 소스 보존에 관한 Git 근거이며, 8개 게임의 런타임 동작이나 realtime·모바일 QA 결과를 뜻하지 않는다. root는 `f0e62c8`을 기존 Hero 작업 브랜치 remote에 push한 것을 확인했으며, main 병합이나 배포는 하지 않았다.

### v8 검사와 추가 자산 판단

root는 원래 backing DPR1의 p=.16도 직접 열어 꽃/잎 추출 오류가 저해상도 확대만의 문제가 아님을 확인했다. 반면 실제 중간 반전·resize 복귀는 안정화 뒤 두 해상도 모두 행렬/캡처가 일치했다. 처음 불일치는 검수기가 ScrollTrigger refresh/scrub 정착 전에 비교한 것이므로 제품 좌표를 또 바꾸는 패치를 하지 않았다. 최신 관련 27검사·production build 통과는 v8 범위이며 v6 전체 616검사와 구분한다. 짧은 ES 실제 사용 영상은 Hero/B 구간 증거만 남겼다. 후반 새 계획 구현·모바일·실제 GPU 성능 검수는 아니다.

흑백 선택 이미지를 반복 생성하는 접근 자체도 정합 실패 원인이 될 수 있어, root는 원본 전경의 RGBA 배경 분리 후보를 별도 생성했다. 새 후보는 더 연속적인 표면을 갖지만 RGB·꽃 밀도·소품 세부가 달라진 파생 아트이며 exact source extraction이라고 보고하지 않는다. 현재 제품 v8에는 미통합이며 실제 격리 합성으로 판단 중이다. 사람/방 원본을 재생성하지 않았다.
