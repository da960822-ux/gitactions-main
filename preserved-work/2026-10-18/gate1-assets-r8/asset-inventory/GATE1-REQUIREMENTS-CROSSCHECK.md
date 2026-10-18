# Gate1 요구사항 대 실제 R8 배선 — 읽기 전용 교차 점검

점검일: 2026-10-18. 코드는 실행하지 않고 R8 소스, public asset 경로, 로컬 검수 문서를 읽었다. 실제 적용 대상은 `src/landing/AcrossHero.tsx → previewSpaceV4`; V5/V6/V7/V8의 독립 캡처/override를 적용 상태로 계산하지 않았다. R8은 visual UNAPPROVED이며 Gate2 진입 상태가 아니다.

| Gate1 요구/표현 | R8 AcrossHero V4의 실제 구현 | 판정 |
|---|---|---|
| 실제 3D folded chamber와 브라우저 hero의 연결 | V4가 `/models/folded-chamber-r8-space-v4/chamber.glb` 로드 | 적용 |
| 조명/재질 전달과 pose bake | V4의 texture base는 `/models/folded-chamber-v7/`; EXR diffuse/normal maps 로드. bake samples 0/.43/1 blend | 적용. geometry와 텍스처 폴더 세대가 다름 |
| 환경 조명/probe | `folded-chamber-r8-space-v4/{hero,arrival}-environment.hdr`, `{hero,arrival}-indirect.hdr` 로드 | 적용 |
| 승인 원화 인물, 비재생성 유지 | `yeonseok-lisbeth-cutout.webp`를 alpha plane에 사용, fallback도 동일 원화 | 적용 |
| hero 판의 공간 열림 | V4 `heroHingePose`에서 shell rig 강체 회전; V4 geometry morph targets 처리 | 부분 적용. 강체 힌지는 실제 메시 변형과 동일하지 않으며 구조를 전부 연속 표면 변형으로 주장할 수 없음 |
| 승인 얼굴/인물의 무대 이동 | portrait stage rig로 plane 강체 이동·회전 | 부분 적용. 인물 픽셀/형태 자체 변형은 아님 |
| 작은 이미지가 휘어 영상 패널로 자라며, 동일 surface가 공간 내 영상면으로 이어지는 연출 | V4에 `folded-playhouse-lightwell.mp4` VideoTexture 경로 존재하나 material `woven light`의 emissive map으로 작은 디테일에만 쓰임 | 미적용 요구가 남음. 현재 표면 역할 전환이나 영상 패널 모핑 구현으로 볼 수 없음 |
| 새 공간에 맞는 shared Remotion intro | `SHARED_INTRO_FILM_READY=false`; intro `<video>`의 `src`는 undefined. 기존 Remotion mp4는 저장됨 | 비활성/미적용 |
| HyperFrames와 실시간 공간의 관계 | HyperFrames 영상은 작은 발광/반사 세부로 연결. 검수 보고서도 같은 표면 영상의 역할 전환을 미충족으로 기록 | 부분 적용(디테일만), 주요 연출은 미충족 |
| hero의 editorial copy, 한국어/스페인어, games/letter CTA | V4 AcrossHero JSX에 현지화 카피, `#games`, `#papi-letter` link | 적용(구조). 현재 검수 권한은 시각 승인 아님 |
| 새 cosmic background 디자인 방향 | 원본 `midnight-rose-sky` PNG/WebP는 저장되고 landing.css에 배경 사용. 별도 `design-first-20261018` HTML/preview는 디자인 검토물 | 적용은 현재 배경의 유지뿐. 디자인 study는 제품소스에 반영 전 |
| 실제 visual-quality approval / Gate1 완료 | `GATE1-CURRENT-STATUS.json`: visual UNAPPROVED; active AcrossHero V4. R8 검수보고서도 unfinished seam, contact, contrast, occlusion limitations를 열거 | 미충족/승인 대기 |

## 문서 및 자산 인벤토리에서 고친 오기

- R8 실제 V4 geometry는 `public/models/folded-chamber-r8-space-v4/chamber.glb`이다.
- V4의 실제 texture `ASSET` base는 `public/models/folded-chamber-v7/`이다. V4 폴더에는 HDR probes 4개가 있고 GLB는 v4 폴더, diffuse EXR/normal PNG는 v7 폴더에서 온다.
- 이전 inventory 문구에서 `folded-chamber-v6`를 실제 V4 runtime geometry/texture라 한 것은 틀렸다. 이를 `미채택·보존` 구형 자산으로 분리해 바로잡았다.
- MP4 수는 public/motion에 일곱 파일: Remotion 4 (`intro-wide`, `intro-tall`, `intro-classic`, `gift-intro-remotion`), HyperFrames 3 (`folded-playhouse-lightwell`, `folded-light-hyperframes`, `folded-playhouse-surface`). 현재 AcrossHero는 lightwell만 emissive detail에 연결, shared intro는 false라 intro mp4는 비활성이다. 이름상 HyperFrames 산출물 보유 자체는 현재 제품에서 패널 모핑까지 쓴다는 근거가 아니다.
- `docs/across-distance/FIRST-HERO-REVIEW.md`는 초기 디자인/구현 기록으로, 현재 Gate1의 V4 경로와 intro-ready 상태를 기준 삼는 문서가 아니다. 현재 상태는 `GATE1-CURRENT-STATUS.json`, R8 AcrossHero/V4 source, `gate1-assets-r8/delivery/G1R8-검수보고서.ko.md`와 대조했다.

## 검사 한계

소스/로컬 문서 경로를 읽었으며 브라우저 캡처, 렌더, 녹화, 하드웨어 성능 측정은 하지 않았다. 따라서 visual pass 판정을 만들지 않았고, 여기의 “적용”은 코드와 asset path 배선이 연결됨을 뜻한다.
