# Hero 공간 전환 — 현재 작업 지시

상태 갱신: 2026-10-21. 이 브리프는 현재 공간 연구와 다음 검토 조건을 지정한다. 화면·모션·전체 랜딩의 합격 선언이 아니다. 상세한 이전 설계와 실패 증거는 [3b901a0 시점의 같은 문서 원문](https://github.com/da960822-ux/gitactions-main/blob/3b901a099f28a46dfa122ea9c85023010d8d2551/docs/redesign-20261018/HERO-REVISION-BRIEF-20261021.ko.md)에 보존돼 있다.

## 현재 상태와 판정

- 과거 `849344f` 기준 57.87초 영상과 독립 평가(구도4·공간3·목적4·craft3/5)는 Git 이력 및 [제품 보고서](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/native-whole-report.json)에 남긴다. 이는 현행 수정 전 checkpoint다.
- 현행 근거는 [요구 완료 감사](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/plan-completion-audit.json), [천장 표본 보고서](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/shallow-report.json), [현재 critique snapshot](../../output/current-review/hero-spatial-rework-20261021/hero-wall-volume-current/product-current/critique-snapshot-current.json)이다. 천장면은 561개 정점의 실제 변형과 법선 갱신을 가지며 `.35/.42`에서 완만한 곡면 실루엣이 보이고 `.68`에서 복원된다. 이는 표면 변화 구현 증거이지 연속 모션 합격은 아니다.
- 독립 A의 현행 10개 still 검토에서 이전 P1 큰 구조면 가림은 해소로 판정됐다. 남은 Hero 이슈는 상자/삽화처럼 읽히는 인상과 `.35`의 부분 jamb 가림이다. 연속 정방향·역방향 영상 및 성능 검수는 아직 대기 중이다. 그 결과 전에는 전체 완료나 전체 4/5 이상을 선언하지 않는다.
- GalleryCollection의 깊이·주변 선택물 크기·hover 맥락 타이틀은 구현됐고 최종 QA 중이다. Hero CTA pressed 상태도 구현됐다. post-polish 구현 검수는 [content audit](../../output/current-review/implementation-20261021/content-audit-v3/report.json)의 `postPolishImplementation`에 기록한다.
- 현행 테스트 집계는 main 76 files/623 tests, post 29/29이며 TypeScript/Vite/edge build 통과 기록이 있다. 622는 이전 checkpoint다. 테스트는 시각 합격을 대신하지 않는다. 500kB chunk 경고가 남는다.
- 최신 사용자 지시로 모바일 QA는 이번 실행에서 제외됐으며 완료 관문이 아니다. 실제 GPU 성능은 미검수이며 root가 최종 연속 영상·성능 결과를 보충한다.

## 현재 설계와 다음 수정의 이유

승인 B는 **원화 프레이밍과 인물 정체성**이며 특정 world 좌표·원경 거리·고정 카메라를 승인한 것이 아니다. 이전 distance120/yaw60 등의 추가 제약은 철회했다. 현재 경로는 I의 같은 석재 jamb 뒤를 지난 뒤 가까운 L자 실내로 진입한다. 실제 측벽·천장·바닥·별도 desk 하부가 경계를 소유하고 B 원화 하단을 floor로 접지 않는다. 원본 I/B/P의 RGB와 승인 도착 구도는 보존한다.

기존 천장 연결면은 grid로 구현됐다. 다음 검토는 현재 형상이 연속 native 진행·역행·중간 반전에서 실제로 방을 여는지 확인하는 것이다. 관찰로 원인이 확인될 때만 기존 경계를 최소 수정한다. 승인 자산과 B 도착을 보호하고 장식이나 조명으로 문제를 덮지 않는다.

공유 카메라·Host와 후반 연결은 root가 통합한다. Sol은 시각·모션·자산, Luna는 명확한 기능·정리를 맡는다. 실패 횟수로 owner를 교체하지 않는다. 같은 owner에게 관찰 프레임·측정·잘못된 프롬프트 전제를 전달하고 수정한다. 이전 e28/444e 표본과 실패 설명은 문서 Git 이력 및 기존 연구 보고서에 보존하며 현재 제품 판정과 섞지 않는다.

## 검수 순서와 완료 기준

1. 첫 bounded batch는 1920×1080에서 같은 source로 최대 다섯 actual still을 잡는다: p0, P가 마지막으로 읽히는 상태, B의 첫 부분 노출, 두 얼굴이 처음 읽히는 상태, B 도착. 각 PNG의 source/artifact hash와 DPR·렌더 환경을 기록한다.

2. 이 정지 표본을 독립 검토한 뒤에만 다음 단계를 진행한다. 승인 I/B, 원본 인물, 접합·가림, 실제 실내의 공간 책임을 확인한다. B만 보이는 도착 프레임은 전환 증거가 아니다.

3. root의 최종 1440×900 데스크톱 연속 영상에서 native 정방향·역방향·중간 반전·도착을 확인한다. 현재 cameraOrientationReview에는 1920×1080과 1440×900 각 다섯 장, 총 열 장의 hash 확인된 실제 still이 있으며 독립 A가 이전 P1의 중간 벽 가림을 해소로 판정했다. 별도의 이전 천장 검토에는 1440×900 네 still만 있다. 연속 영상은 미실행이며 성능 검수는 두 데스크톱 크기에서 별도로 남는다. 모바일 QA는 이번 범위에서 제외된다.

4. 구도·공간·목적·craft 각 검토 점수는 4/5 이상이고 blocking 문제가 없어야 한다. 테스트·TypeScript·build는 시각 판단을 대신하지 않는다. SwiftShader는 실제 GPU 성능을 증명하지 않는다. 이전 실패 기록은 보존한다.

## 보호 범위와 작업 역할

Hero 작업은 다음 기능과 콘텐츠를 변경하지 않는다.

- 승인 I/B/P 원본, 첫 화면 카피와 언어 전환
- 여덟 게임, 게임 route, 갤러리 자산·팔레트·배치
- 편지 주소·제목·원문 5문단·서명
- L01–L16 발견 행동과 R01–R04 공동 기능
- API, 인증, 양측 동의, 권한, RLS와 free-tier 보호

게임/후반/갤러리 owner가 소유한 연결 계약을 보존한다. 독립 toy table/list를 기본 흐름에 넣지 않는다.

기존 Ponytail full, Impeccable craft-floor/critique, GPT Taste, Emil Animate, Three.js scene/camera 지침을 범위에 맞게 적용한다.

실제 화면·입력·접근성 증거를 디자인 검토와 연결하고, 누락된 자료를 확인한 것처럼 쓰지 않는다.

새 renderer, 라이브러리, 자산, 장식·광원으로 구조 문제를 가리지 않는다.

새 자산·조명·장식은 만들지 않는다. 기존 재질은 필요한 범위만 최소 적용하며 구조나 가림 문제를 가리는 데 쓰지 않는다.

## 짧은 실패 이력

| 시도 | 실제 판정과 남은 교훈 |
|---|---|
| v11 | 공유 경계를 늦게 지나 B 도착 위주로만 보였다. 그 프레임은 연결 증거가 아니다. |
| v12 | 거대한 물체 조각과 B 원화의 세로 가장자리가 함께 드러나 사진 병치처럼 보였다. 미통합이다. |
| v6 고정 카메라·원경 RGB 고정 및 시간만 바꾸기 | 종료된 과도한 구현 제약이다. 사용자의 현재 지시가 아니며 재사용하지 않는다. |
| 과거 `e28adc59`, `.12/.35/.44` | raw edge/검정 여백과 70% 인쇄판 접사는 해소됐으나 `.35`의 gray 면·40px B strip/raw B-C edge와 `.44`의 1340px 가림으로 인계 불합격이다. `.50`/`1`의 이전 `2c19fa51` 결과는 이번 소스 검수가 아니다. 합의된 L자 얕은 실내 안은 다음 구현 가설이며 미검증이다. |

이 표는 실패 요약이다. 각 실험의 전체 지시, 캡처·측정·근거는 위 GitHub 원문과 현재 연구 폴더의 `shallow-report.json`, `SHALLOW-REVIEW.md`에서 확인한다.
