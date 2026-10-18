# Gate1 제작 자산 inventory (R6–R8)

조사 기준일: 2026-10-18. 범위는 `/workspace/yl-folded-playhouse-g1` (R6), `...-r7`, `...-r8`, `/workspace/gate1-assets-r6`, `-r7`, `-r8`, `/workspace/gate1-evidence`의 로컬 파일 및 기록이다. 상태는 현재 R8과 제공된 검수 지시를 기준으로 했다. 파일이 남아 있다는 이유로 삭제/폐기된 것으로 해석하지 않는다. 미채택 결과는 **미채택·보존**이다. 소스는 읽기만 했고 렌더·녹화·성능 측정·업로드는 하지 않았다.

## 지금 쓰는 상태와 핵심 판정

| 자산 | 파일/형식 | 용도 및 상태 | 원본 관계 |
|---|---|---|---|
| R8 across hero | `yl-folded-playhouse-r8/src/landing/AcrossHero.tsx`, TSX | 실제 적용. `previewSpaceV4`를 동적 import하며 장면 공간을 구성한다. `SHARED_INTRO_FILM_READY=false` | 이 코드의 V4 import가 실제 적용 상태. V6/V7/V8 변형은 별도 후보 |
| folded chamber | `public/models/folded-chamber-r8-space-v4/chamber.glb` + 동 폴더 HDR 4개, `public/models/folded-chamber-v7/` EXR/normal PNG | 실제 V4 로더가 쓰는 geometry/probes/textures. 적용 | `folded-chamber-v6` 폴더는 보존본이며 현재 V4 geometry 로더 경로가 아님 |
| hero 표면의 발광 디테일 | `public/motion/folded-playhouse-lightwell.mp4`, MP4 | V4 장면의 작은 표면 발광/반사 디테일에 사용. 영상 패널 전체의 모핑 완성본이 아님 | HyperFrames가 만든 emissive 채널용 조명 영상 |
| 승인 원화 얼굴 | `public/images/yeonseok-lisbeth-cutout.webp` | 장면의 승인된 얼굴/인물 원화 재사용 | 재생성하지 않음 |
| 배경 하늘 | `public/images/midnight-rose-sky.png` (원본 1939×811) 및 `.webp` | 기존 랜딩 배경. 정적 HTML 우주 통합안에 재사용; 제품 Hero 공간에는 미적용 | Git 원본 `fbdec480` 재사용. 새 이미지 아님 |
| 인트로 영상 | `public/motion/folded-playhouse-intro-{wide,tall,classic}.mp4`, `gift-intro-remotion.mp4` | 보존 자산. 새 공간과 불일치하며 공유 intro 미준비이므로 현재 across hero에서는 비활성 | 기존 Remotion 렌더. `SHARED_INTRO_FILM_READY=false`이므로 intro `<video>`에 소스 미지정 |
| HyperFrames 이전 영상 | `public/motion/folded-playhouse-surface.mp4`, `folded-light-hyperframes.mp4` | lightwell 영상은 작은 발광 디테일만 적용; 이전 surface는 provenance용 보존 | 전체 3D 장면 대체물 아님 |
| R8 실제 브라우저 녹화 | `gate1-assets-r8/review-packet-v8-20261018/G1R8-V8-native-actual-interaction.webm` | 실제 상호작용 검수 증거, 미업로드·로컬 보존. 기록: 1920×1080, 1437.52 s, 134,342,035 bytes, 13 stages, console errors 0, PID 47848 정상 종료 | 최신 실제 브라우저 캡처. 새 녹화하지 않음 |
| R8 V6/V7/V8 검수안 | `space-v6*`, `space-v7*`, `space-v8-sync-web`, `v6-open-hero-capture-manifest.json`, `v6-annex-capture-manifest.json`, V8 source manifest | 진단/일시적 browser-module override 검수 자료. 시각 승인 없음; 제품 승인 자산으로 간주하지 않고 보존 | 현재 R8의 V4 적용과 구별. V6/V7은 temporary override였음 |

R8 `AcrossHero.tsx`에서 확인한 실제 배선: `previewSpaceV4`, portrait `yeonseok-lisbeth-cutout.webp`, `surfaceFilm='/motion/folded-playhouse-lightwell.mp4'`; intro source는 `SHARED_INTRO_FILM_READY`가 true일 때만 설정된다. sibling `ReviewedHero*`의 V8/V7/V6 구현 파일 및 캡처 소스는 존재해도 현재 AcrossHero 적용을 대체하지 않는다.

## 제작·검수 파일 목록과 분류

| 경로/파일군 | 형식 | 용도 | 상태 / 기존 원본 재사용 |
|---|---|---|---|
| `gate1-assets-r6/`, `gate1-assets-r7/delivery/`의 `G1R6-*`, `G1R7-*` PNG | PNG | Hero/Mid/Arrival 웹 출력, Cycles 64 OIDN native 출력, same-camera 및 실제 페이지 비교 | R6/R7 제작·검수 결과. 이후 R8 공간과 다르므로 현 hero 적용 아님. 각각의 실제 Library 기록은 아래 ID 표 참조 |
| `gate1-assets-r6/chamber*.blend`, `gate1-assets-r7/chamber*.blend` 및 `chamber-source-portable.blend`, `chamber-baked.blend`, `chamber-final.blend` | Blender | R6/R7 공간 제작 원본과 bake/final 변형 | 보존된 제작 원본/중간본. R8 이어쓰기 계보 |
| `gate1-assets-r6/denoise/`, `gate1-assets-r7/denoise/` | EXR | raw/clean diffuse, room/foreground/shell/canopy 비교 | 렌더 진단 및 보존. 적용 런타임 텍스처와 구분 |
| `gate1-assets-r6/native/`, `gate1-assets-r7/native/` | EXR, PNG | Cycles raw/linear 및 OIDN Standard/AgX 비교 | 네이티브 출력 비교. 승인 원화나 최종 브라우저 화면 아님 |
| `gate1-assets-r6/canary/` | GLB, EXR, HDR, PNG | 소형 canary 모델, normal/환경/코너 검증 | 기술 검증용 미채택·보존 |
| `gate1-assets-r6/probe-axis-calibration.exr`, R6/R7 `specular-*`, `material-diagnostic/` | EXR/PNG | probe 축·반사·재질 원인 분리 진단 | 미채택·보존 |
| R6/R7 `browser/`, `preview*`, `actual-page-three-poses.png`, `same-camera-comparison.png`, `opening-before-camera.png`, `aperture-*-mask.png` 등 | PNG | 실제 브라우저 pose와 프레임/마스크/비교 스틸 | 이전 공간의 검수 근거. 현재 hero 미적용 |
| `gate1-assets-r8/chamber-preview.blend`, `chamber-space-v2*.blend` … `chamber-space-v6*.blend`, `.blend1` | Blender | R8 V2–V6 및 백업의 공간 원본 | 실험별 제작 원본/중간본. `.blend1`도 보존된 백업이며 삭제/적용으로 오판하지 않음 |
| `gate1-assets-r8/space-v2*…space-v6*/*-model/chamber.glb` | GLB | 버전별 웹 전달용 geometry | 후보별 미채택·보존. 현재 R8의 실제 V4 geometry는 `public/models/folded-chamber-r8-space-v4/chamber.glb`임 |
| R8 `space-v2*…space-v6*-model/*.hdr` | HDR | `hero-environment`, `arrival-environment`, `*-indirect` environment/GI probes | 버전별 공간 조명 데이터, 후보/보존. 이름상 HDRI와 baked indirect를 각각 구분 |
| R8 runtime `public/models/folded-chamber-r8-space-v4/` | GLB + HDR | 실제 V4 chamber geometry와 hero/arrival specular·indirect probes 4개 | 현재 AcrossHero V4 적용 geometry/probes |
| R8 runtime textures `public/models/folded-chamber-v7/` | EXR + normal PNG | V4 geometry의 shell/room/foreground/canopy lightmaps와 normal maps | V4 로더가 `ASSET` base로 참조하는 실제 적용 텍스처. GLB 폴더 버전과 텍스처 폴더 버전이 다름 |
| R8 `space-v2*-web`, `space-v3-web`, `space-v4-web`, `space-v4-page`, `space-v5-web`, `space-v5-page-staged`, `space-v6-*`, `space-v7-*`, `space-v8-sync-web` | PNG + `observations*.json` | pose/scroll별 브라우저 캡처와 측정값/관찰 기록 | 실제 브라우저 캡처 또는 진단 산출물. 버전/오버라이드별 미채택·보존; R8 V8 actual recording과 혼동 금지 |
| `gate1-assets-r8/r7-repair/` | PNG, WEBM, JSON, log | R7 repair same-camera 비교와 실제 브라우저 draft 증거 | 작업 검수·보존. R8 현재 across 자산 아님 |
| R8 `review-packet-v7-20261018/` | WEBM, PNG, JSON, patch | 동기화 수정 중단 진단 녹화, screenshots, Git/evidence snapshot | 명시적으로 not-final; 미채택·보존 |
| `/workspace/gate1-evidence/` | PNG 및 관련 자료 | Remotion studio authored/before, intro contact sheet, live canvas match, technical-v2/v3 frame 비교 등 | 기존 인트로/기술 검수 증거. 최종 새 공간 승인으로 간주하지 않음 |
| `yl-folded-playhouse-r8/videos/folded-playhouse-hyperframes/` | HyperFrames brief, frame PNG snapshots 및 project assets | folded lightwell 영상 저작 원본과 스틸 | `folded-playhouse-lightwell.mp4` 제작 계보. 영상은 발광 디테일용 |
| `public/motion/folded-playhouse-{intro-tall,intro-wide,intro-classic,lightwell,surface}.mp4`, `folded-light-hyperframes.mp4`, `gift-intro-remotion.mp4` | MP4 | 여러 세대의 인트로/표면/라이트웰 영상 | R6/R7/R8 소스 트리에 일부 동일 파일이 보존됨. 제품에서 쓰임은 위 현재 상태와 별개 |
| R8 `provenance/v8-first-native-recording-source/` | TS/TSX/CSS + JSON manifest | V8 녹화에 사용한 소스 스냅샷 | 녹화 출처 증거. 제품의 현재 AcrossHero 상태는 별도 working tree에서 확인 |
| `gate1-assets-r8/*capture*.mjs`, `*author*.py`, logs/checks/JSON | 스크립트·로그·데이터 | 이전 버전 제작/브라우저 캡처/검수 재현 기록 | 기록·보존만 수행. 이번 inventory에서 실행하지 않음 |

### 정확한 기존 Library ID (로컬 성공 응답 기준)

아래는 로컬 `library-*.json` 및 `material-diagnostic/library-*.json`의 `status=succeeded`, 정확한 `file_name`, `library_file_id` 필드를 대조한 21개 항목이다. 재업로드하지 않았다. JSON 내 실패 batch 항목은 성공 ID가 없어 제외했다.

| R# | 파일명 | Library ID |
|---|---|---|
| R6 | `G1R6-render-contract-review.ko.md` | `libfile_fcd44ac3dce0819190fe06a137686a71` |
| R6 | `G1R6-same-camera-comparison.png` | `libfile_cabe914abaf08191b7fae3a3efeea062` |
| R6 | `G1R6-actual-page-three-poses.png` | `libfile_be8e5ce9e79c819198b24e6b7ca6dcae` |
| R6 | `G1R6-native-Arrival-Cycles64-OIDN.png` | `libfile_8f47aef8a1fc81919b018e07dad110ed` |
| R6 | `G1R6-native-Hero-Cycles64-OIDN.png` | `libfile_c7f65a39be24819196f0dca6e033eeeb` |
| R6 | `G1R6-native-Mid-Cycles64-OIDN.png` | `libfile_c6f63623fe108191901f97310178b2ce` |
| R6 | `G1R6-web-Hero-1920.png` | `libfile_30c6a91332a08191bc90d4d9bd87a45c` |
| R6 | `G1R6-web-Mid-1920.png` | `libfile_2528523fabc08191838c20d341955c50` |
| R6 | `G1R6-web-Arrival-1920.png` | `libfile_b6892342bc50819189fb875081891036` |
| R6 | `G1R6-evidence-source.zip` | `libfile_7dc4d65e2b5481918a9fb54683028107` |
| R6 | `G1R6-source-and-assets.bundle` | `libfile_c3c90081c75c81918617aea475678d4c` |
| R7 | `G1R7-native-Hero-Cycles64-OIDN.png` | `libfile_513f69158e0c81919334b09b07bf7b52` |
| R7 | `G1R7-web-Mid-1920.png` | `libfile_67a4e1fdedcc81918adedb3b32621263` |
| R7 | `G1R7-native-Mid-Cycles64-OIDN.png` | `libfile_ab8e4db5107c81918000b3a222f0a9d5` |
| R7 | `G1R7-web-Arrival-1920.png` | `libfile_130def1c1a58819183e5291f14d489bc` |
| R7 | `G1R7-native-Arrival-Cycles64-OIDN.png` | `libfile_09f9bdefa8c48191949c60cb73218853` |
| R7 diagnostic | `G1R7-alcove-gap-proof.png` | `libfile_6a9437fd3c4081918d74289ee444dd61` |
| R7 diagnostic | `G1R7-material-cause-isolation.png` | `libfile_ca21cb30453c8191bf2563b8ff514db9` |
| R8 | `G1R8-v4-actual-page-middle-progress.png` | `libfile_07a1fb30d6d081918086362d99df8224` |
| R8 repair | `G1R7-technical-repair-same-camera.png` | `libfile_76312f5a64c8819183c6ff70413bba72` |
| R8 repair | `G1R7-repair-actual-browser-draft.webm` | `libfile_550a3864f1048191b876df85278a07bd` |

## Intro와 얼굴/이미지 구분

- Remotion 실물: `public/motion/gift-intro-remotion.mp4`는 기존 `GiftIntro` 렌더(1920×1080, 30 fps, 3.6 s, 1,270,207 bytes). wide/tall/classic intro mp4도 기존 렌더물이다. 렌더 파일 보유와 이번 새 공간 적합성/활성은 별도다.
- HyperFrames 실물: `folded-light-hyperframes.mp4` 및 `folded-playhouse-lightwell.mp4`. 기록된 브리프는 black background 위 feathered reflected-light caustics를 emissive channel에 쓰며, 모핑 벽 전체나 별도 bent movie plane을 대신하지 않는다고 명시한다. 표면 구형 영상도 보존되어 있다.
- 실제 브라우저 증거: R8 V8 webm은 native actual interaction 녹화. PNG contact sheets 및 observations JSON은 still/계측 자료이며 영상 렌더와 혼동하지 않는다.
- 3D 자산: `.blend`는 편집 가능한 Blender 원본/백업, `.glb`는 브라우저 모델, `.exr`는 diffuse/linear/GI 또는 진단 이미지, `.hdr`는 환경/probe 데이터, `*-normal.png`는 normal map이다. 콘셉트/검수 PNG와 구분한다.
- 승인 얼굴과 sky 원본은 재사용. 얼굴 재생성 금지. Sky PNG 원본은 1939×811, webp는 기존 파생 최적화 파일이다. 정적 HTML 우주 통합안은 로컬 보존·검토 대기이며 제품 적용 아님.

## 범위 및 누락 위험

- 전체 자산은 모든 반복 캡처 프레임의 개별 파일명을 나열하지 않고 위 디렉터리별 완전 경로군으로 색인했다. 특히 R8의 많은 `shape-*` PNG와 `observations*.json`은 버전 폴더에서 원본 그대로 보존된다.
- local Library 응답에서 확인된 R6/R7/R8 항목만 exact ID로 기재했다. R8 batch 실패는 업로드 성공으로 간주하지 않았다. 오래된 Library 대상은 재업로드하지 않는다.
- 파일 내용이 있다는 사실만으로 눈으로 본 디자인 승인 또는 현재 적용을 주장하지 않는다. R8 V6/V7/V8 임시 오버라이드에는 시각 승인 없음.
- 기록된 새 공간 공유 인트로 준비값은 `false`; 현재 인트로 asset 준비와 기존 mp4는 혼동하지 않는다.


추가 확인: public/motion MP4는 7개(Rem​otion 4, HyperFrames 3), 현재 활성 배선은 lightwell 1개, 나머지 6개 비활성 보존. V4 actual geometry/probe path는 folded-chamber-r8-space-v4이며 texture base는 folded-chamber-v7이다. 위 구형 v6 폴더 설명은 보존 자산으로만 해석한다.
