# Folded Playhouse — Gate 1 Hero 검수 제출

기준: `redesign/across-the-distance` @ `24a6ec69eea712f632ee80e8f3cae863d38c769f`. 작업 브랜치: `redesign/folded-playhouse-gate1-20261017`. 로컬 커밋 `d6d5f53f0734d3e9461ebe15b067ec4c73937dd2` (14개 파일, 푸시 없음).

Gate 0 v1에 대한 부모의 2026-10-17 19:39 UTC 착수 승인과 사용자의 최종까지 진행 위임을 적용했다. 중간에 초기 Plan Mode 문구를 다시 우선해 승인 대기로 잘못 돌아갔으나, 부모가 제공한 최신 대화 증거를 확인해 Gate 1을 재개했다. 사용자에게 다시 계획 승인을 요구하지 않는다. 이 제출물은 **부모 Hero 디자인 검수용**이며 자체 완료·다음 Gate 통과 선언이 아니다. Gate 2 이후는 구현하지 않았다. 푸시·배포하지 않았다.

## 실제 구현

- 승인된 1254×1254 투명 커플 원화와 큰 Baby/KO·ES 카피를 중심에 두는 로즈골드·버건디의 접힌 무대. 얼굴을 재생성하거나 다른 인물로 바꾸지 않았다.
- `FOLD_A`, `FOLD_B`는 동일 index topology·UV·morph position/normal target을 유지한다. 넓은 표면과 그 가장자리가 무대→열린 입구→내부 벽/바닥으로 실제 변형된다. 고리·파이프를 새로 사용하지 않았다.
- 첫 방문 3.2초 인트로, Skip·재방문 생략·영상 실패 시 같은 live 장면. 텍스트와 CTA는 DOM으로 읽고 조작할 수 있다.
- 포인터는 카메라와 광원을 감쇠 보간한다. 얼굴 warp는 없다. 스크롤은 단일 pose 상태를 통해 카메라·morph·조명을 제어하고 역행하면 동일 경로를 복원한다.
- 카메라는 인물 평면의 오른쪽을 돌아 z=-4 입구를 통과하고 z=-7 내부에 도착한다. 다음 방의 벽·천장·바닥은 처음부터 같은 scene에 존재한다.
- HyperFrames 영상은 실제 휘는 mesh의 VideoTexture다. 표면의 곡률과 법선·회전·크기가 변한다. 배경 전체 영상이나 카드 페이드로 공간을 대체하지 않았다.
- Hero CTA는 기존 `#games`, 편지 링크는 `#papi-letter`, 상단 메뉴는 기존 `/feedback`으로 연결된다. 기존 갤러리·편지·게임/API는 수정하지 않았다.

## 영상과 실시간 장면의 담당

`videos/folded-playhouse-remotion/index.tsx`는 웹과 동일한 `createFoldedWorld()`와 `introPose()`를 프레임별로 렌더한다. 1920×1080, 1440×900, 390×498의 96프레임/30fps MP4를 실제 출력했다. 마지막 frame 95는 live p=0·entrance=1이다. 큰 카피는 영상에 구워 넣지 않아 DOM과 중복되지 않는다. 영상 재생 중 숨은 live 장면은 계속 렌더하지 않는다. 일치하는 화면비와 준비된 영상에만 재생 소유권을 주며, 영상 종료·Skip·스크롤 시작 후 live로 전환한다.

HyperFrames는 `videos/folded-playhouse-hyperframes/`의 별도 4초·1024²·30fps 금속성 표면 모션을 실제 렌더했다. 기존 인트로를 다른 도구로 복제한 것이 아니다. 웹은 해당 영상의 시간을 스크롤에 맞춰 seek한다. 초기 안정 Hero에서는 이 패널을 보이지 않게 해 미디어 준비 상태가 handoff 프레임을 바꾸지 않도록 했다. 다음 공간이 열릴 때 같은 실제 mesh 위에 공개한다.

실행 명령의 요점: Remotion은 시스템 Chromium에서 `--gl=swangle --chrome-mode=chrome-for-testing --concurrency=1`로 성공했다. `swiftshader`/`angle` 조합의 초기 context 실패는 실패 로그로 남겼다. HyperFrames는 시스템 Chromium·소프트웨어 GPU·스크린샷 캡처 방식으로 렌더했다. 서비스 usage는 `no_subscription_login`이어서 계정 사용량은 확인하지 못했다. manifest/lockfile 변경과 신규 패키지 설치는 없다.

## 폴리시와 자체 시각 검토

실제 화면을 열어 바닥이 검게 뭉치는 문제를 수정하고, 얇은 무대 단면·접지 그림자·약한 반사·원본 경계 light-wrap을 추가했다. 카메라가 원화 평면을 통과할 수 있던 초기 경로는 옆으로 도는 경로로 수정하고 검사했다. 포인터 좌표도 pinned canvas 기준으로 제한했다. 바닥의 금속 가장자리가 본문을 통과하던 부분은 초기 바닥 폭을 인물 영역으로 옮겨 해결했다. 인트로/live 사이의 작은 배경 패널 차이는 패널 공개 시점으로 제거했다. WebGL context 복원, 영상 오류의 live 복귀, 키보드 focus가 있는 CTA 유지도 추가했다.

아트 디렉션이 목표 수준에 도달했다는 판단은 부모 검수 대상이다. 현재 금속은 카메라·법선에 반응하는 **analytic softbox reflection shader**이며, 모든 장면 오브젝트를 거울처럼 반사하는 path tracing/PBR mirror는 아니다. 인물은 승인 원화 기반의 평면이며 실제 3D 두상이 아니다. 이 물성·원화 통합·타이포·변형의 미적 충분성은 원본 영상과 화면을 보고 판단해야 한다.

## 기능 검증과 보호

- `pose.test.ts` 5개: 인트로 최종 pose 일치, 실제 입구 통과, 원화 평면 옆으로 통과, 역행 결정성, 카메라 연속성.
- TypeScript 및 프로덕션 빌드, `git diff --check` 통과. Three chunk 562.78kB의 500kB 초과 경고는 남아 있다. 경고 기준을 올려 숨기거나 패키지를 바꾸지 않았다.
- 실제 브라우저 smoke: KO→es-DO 전환, Hero→갤러리 CTA, 8개 선택의 `/play?game=id` 링크, 기존 편지 개봉/접기 복귀, 스페인어 feedback 진입, reduced-motion 비고정 상태, WebGL lose/restore 확인.
- 보호 파일 2,255개 SHA-256 변경/누락 0. 게임/core/app/router/갤러리/편지/manifest/lockfile은 기준과 동일하다.
- 8게임 온라인 대국·API 쓰기·캐치마인드 실제 양언어 플레이를 이번 Hero 검수에서 새로 완료한 것은 아니다. 해당 코드는 보호 해시와 링크 smoke로 보존을 확인했다. 별도 게임 담당 최종본의 bundle 복구 검증은 여전히 별도 통합 선행조건이다.

## 성능 환경과 한계

실제 WebGL 조회: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)`. 하드웨어 GPU 명칭이나 사용자 PC 성능을 추측하지 않는다. 측정은 이 클라우드 소프트웨어 렌더러의 결과다.

첫 녹화 없는 1920 스크롤 진단은 25개 rAF 간격에서 mean 369.32ms, p95 700ms, max 766.6ms, mean 역수 약2.71fps였다. 이는 GPU timer 값이 아니며 긴 CPU 작업도 관찰됐다. 1080p 녹화·중간 PNG readback을 병행하면 지연은 더 커진다. 원본 녹화는 이 지연을 숨기거나 재타이밍하지 않는다. 이 수치는 목표 60fps를 충족하지 않으며, 하드웨어 GPU 가속 성능은 미검증이다.

장면은 안정 상태에서 불필요한 재렌더를 멈추고, 영상 중복 렌더/오프스크린 처리·DPR 상한·단일 활성 표면 decode·동일 geometry 재사용을 적용했다. draw/triangle/texture 수와 rAF 원본은 진단 JSON에 제공한다. 핵심 효과를 지워 성능 통과로 처리하지 않는다. 실제 GPU 환경에서 frame time·decode·메모리를 재검증해야 한다.

## 제출 증거 읽는 법

최종 파일 목록·SHA·미디어 속성은 `DELIVERY-MANIFEST.json`을 기준으로 한다. `actual-browser-raw.webm`은 Playwright 네이티브 recordVideo 원본이다. Remotion/HyperFrames MP4는 제작 자산이며 실제 웹 구동 증거를 대체하지 않는다. 전후 비교는 같은 클라우드 Chromium·1920×1080·DPR1·동일 포인터/정규화 스크롤 절차를 사용하고, 기존 170vh/새 260vh의 길이는 구분한다. 중간 수정 전 기술 캡처는 최종 폴더와 분리한다.

Gate 1 최종 증거는 최초 진입·전체 인트로·안정 구도·포인터·정방향·morph·카메라 내부 진입·역방향·복귀를 담는다. 1440 스페인어와 390 한국어는 별도 PNG·진단으로 제출한다. 전체 랜딩의 새로운 이야기·갤러리·편지·Ending을 완료했다는 의미가 아니다.

## 실제 사용 스킬의 대응

| 지침 | 구현/검증 반영 |
|---|---|
| Ponytail full | 기존 의존성·소유권 유지, 보호 SHA·최소한의 핵심 테스트, 미검증 공개 |
| 로컬 gpt-taste v1 | 인물·타입 위계, KO/ES 별도 줄바꿈, 로즈골드/버건디 palette, CTA safe zone. 미니멀리즘 때문에 연출을 줄이지 않음 |
| Emil animate / review-animations | 단일 pose·감쇠 입력, 중단/역행·실제 프레임 검토와 재수정 |
| animation-performance | on-demand world render, 영상 중복 렌더 중지, 보이지 않을 때 정지, 실제 rAF 진단 |
| prototype | 독립 브랜치에서 실제 동작 Hero와 기존 결과 비교, Gate 2 차단 |
| Remotion create/render/best-practices | 공유 Three factory를 frame/fps로 평가, delayRender/GL finish, 실제 세 비율 export |
| HyperFrames core/CLI/GSAP | 별도 paused GSAP timeline·실제 surface film export·VideoTexture 연동 |
| Three materials/lighting | morph position+normal, 입구를 넘는 camera, 반사 shader와 실시간 포인터 조명 |
| Playwright | 실제 페이지·원본 recordVideo·3 viewport PNG·콘솔/HTTP·기능/성능 로그 |

`emil-design-eng`의 공식 원문 조사와 로컬 스킬 존재 여부는 Gate 0 문서에 구분했다. 이 목록은 신규 설치 목록이 아니다. Lusion 원본은 CONNECT403으로 이 환경에서 실제 시청하지 못했으며, Lusion 수준 달성·정밀 모션 비교 완료를 주장하지 않는다. Open-Generative-AI는 사용자 지시에 따라 비채택 상태다.

**다음 행동은 부모의 Gate 1 실제 영상·화면 검수와 그 피드백 수정이다. 부모의 Hero 통과 지시 전 Gate 2로 진행하지 않는다.**

## 원문 대조표 중 Gate 1의 제출 상태

전체 원문 172개 ID는 Gate0의 `REQUIREMENTS-TRACE.ko.md`를 유지한다. 아래는 이번 구현에 직접 해당하는 항목이며 ‘검증 존재’와 ‘미적 승인’을 구분한다.

| 원문 ID | 이번 대응과 증거 | 상태 |
|---|---|---|
| I-03, I-09, I-12–I-15 | 실제 날짜·Baby·원문 메인카피·KO/ES·#games CTA | 실제 DOM/언어 smoke 확인 |
| A-09–A-14 | 고리/파이프 대신 얇은 판, 원화광 기반 환경, 바닥-카피 충돌 수정, 역할 있는 geometry | PNG/원본 영상으로 부모 시각 심사 |
| A-15–A-17 | 3.2초 film·실제 다음 방·카메라 z=-7·역행 복귀 | 실제 trace/영상 존재; 소프트웨어 준비 시간은 별도 |
| A-19–A-21 | 승인 원화 고정·pointer·조명·실제 morph·가림 후 안정 인물 복원 | 원화 hash 보존, 원본 영상으로 미적 심사 |
| R-03, R-04, R-08 | 곡률/법선이 변하는 영상 mesh, 실제 입구 crossing, FOLD_A/B identity | 코드·중간 PNG·카메라 trace; Lusion 원본 직접 비교 미완료 |
| S-01, S-02 | 첫 방문·즉시 Skip·재방문 생략·Hero | 실제 브라우저·startup smoke |
| S-03–S-14 | 이후 이야기/갤러리/편지/Ending의 새로운 구현 | Gate2 이후로 남음, 이번에 완료 처리하지 않음 |
| 기능 보호 전체 | 2,255개 기준 파일 hash·8개 route 링크·언어/letter/feedback smoke | 보존 확인, 온라인 플레이 전체 회귀는 미실행 |

실제 MP4 재생 길이 3.2초와 첫 네트워크 진입부터 안정 Hero까지의 시간은 다르다. 이 소프트웨어 환경에서는 3D 준비에 수초가 관찰됐으며 그 시간도 원본 녹화에 포함했다. 준비 중 제목을 완성 상태로 먼저 보였다 숨기는 flash를 제거하고, CTA와 Skip을 사용할 수 있게 했다. 총 최초 진입이 3.2초 안에 끝났다고 주장하지 않는다.

## 최종 측정·연결 보완

최종 SHA d6d5f53f0734d3e9461ebe15b067ec4c73937dd2에서 녹화 없는 1920 측정은 23개 rAF 간격, mean 494.91ms, p95 633.3ms, max 4716.5ms, mean 역수 2.02fps다. 수초 구간의 작은 표본이며 SwiftShader에서 60fps 목표에 미달한다. GPU 가속 성능 통과로 해석하지 않는다.

공유 live canvas PNG와 Remotion frame95 PNG는 RGB 픽셀 차이 0이다. MP4 frame95는 압축 때문에 평균 절대 RGB 차이1.291/255, p95 4/255, 임의 채널 차이12 초과 픽셀1.441%였다. 형태가 다른 장면을 fade로 가린 결과가 아니다. 후속 커밋은 시작 DOM/Skip과 p>.2 camera target을 변경했으며, 모든 인트로 프레임의 p=0 pose와 출력된 세계는 동일하다.

시작 검증 3개(준비 전 제목 숨김·조기 Skip 후 영상 재시작 없음·재방문 intro 없음)도 실제 브라우저에서 통과했다. 최종 카메라 시선은 열리는 방 안을 향하도록 보완했지만, p=.58–.66에서 큰 면의 가림이 남는다. 이 구간의 밀도·반사·연속성은 부모 미적 심사의 핵심이며 만족스럽다고 자체 승인하지 않는다.

열람용 HERO-ACTUAL-CONTINUOUS.mp4는 Playwright 원본 WebM을 H264로 연속 변환한 파일이다. 구간 삭제·속도 변경·효과 합성은 없으며 원본 WebM도 함께 제공한다. 컨테이너25fps와 실제 장면 FPS는 별개다.

최신 d6d5f53 데스크톱 direct pass의 17개 관측 지점은 모두 surface video readyState=4였고 콘솔/HTTP 오류0·overflow0이다. 포인터 시 camera x/y 변화, p=.72 camera z=-4.700, p=1 z=-7.000, 역행 p=0 z=11.700을 기록했다. 최종 3해상도 대표 PNG는 같은 최종 SHA에서 재수집했다. 1440/390 전체 중간 pose 진단은 카메라 시선 최종 보완 이전 build의 기록으로 별도 표시하며, 최신 모바일 전체 cinematic 승인을 뜻하지 않는다. 전체 모바일 본 검수는 Gate6에 남는다.
