# 시각 자산 위치·출처·상태 목록

날짜 표기: 문서/폴더의 `20261021`은 한국 현지 작업일 식별자로 보존한다. 이번 실제 생성·브라우저·명령 실행일은 **2026-10-20 UTC**다.
기준일: 2026-10-21 · 범위: 이미지 자산의 원본, 파생, 현재 코드 연결, 미사용·보존 위치. 이 문서는 자산과 연결 상태를 조사한 목록이며 구현·승인 기록은 아니다.

## 요약

승인 게임방 원본과 승인 캐릭터 참조, 두 승리 반응, 사용자 제공 사진, Da Vinci용 커플 그림, 일곱 Marble 말, 기존 여덟 게임 갤러리 자산, 장미 이미지가 저장소에 남아 있다. 경로와 구현 참조를 보면 일부는 게임/랜딩에서 사용되고, 일부는 standalone preview나 오류 대체용이며, 일부는 현재 활성 경로에서 참조되지 않는다. 경로에 파일이 있고 빌드·테스트가 있다는 사실만으로 화면에서의 최종 통합 품질 승인을 주장하지 않는다.

지정된 ZIP 컨테이너 `/tmp/codex-remote-attachments/.../1-Yeonseok-Lisbeth-approved-assets.zip` 자체는 찾지 못했다. 다만 압축 해제된 승인 handoff `/workspace/scratch/approved-assets/`는 존재하며, `README.txt`와 `SHA256.json`, `assets/`의 PNG 세 개를 확인했다. 이 세 원본은 `public/images/approved-couple-room/`의 해당 파일과 각각 SHA-256이 일치한다. README에는 이 ZIP에 코드가 없고 승인 방·캐릭터 참조·Lisyeon 말만 들어 있다고 명시돼 있다. 따라서 이 세 승인 이미지가 사라진 것은 아니다. ZIP에 없었던 다른 자산까지 그 archive에서 복원·검증했다고 주장하지 않는다. 저장소의 파일·파생·코드 참조는 각 provenance/manifest와 대조했다. 검토 contact sheet는 `/workspace/scratch/visual-asset-inventory/`에만 만들었으며 원본 자산을 편집하지 않았다.

## 원본 인물·방·반응 이미지

| 자산 | 저장 경로와 출처 | 코드 연결/상태 | 파일·화면 검토 |
|---|---|---|---|
| 승인된 게임방 장면 | `public/images/approved-couple-room/approved-couple-gaming-room.png`; 1672×941. ZIP 상대 경로 `assets/approved-couple-gaming-room.png`; SHA-256 `a569e1a1ed8c21fffb7a11cc7065816a0882fdaaba3e1a4bcd65dc241681eb26` | `src/landing/cinematic/folded/ApprovedGamingRoom.ts`가 원본 텍스처를 불러온다. 승인 원본 그대로 보존 | 원본 화면에서 Yeonseok·Lisbeth, 헤드셋·옷, 토끼 인형, 액자와 두 자리의 방 구성이 구별된다. 따뜻한 실내 조명과 인물/배경의 작은 디테일이 일관적이다. 1672×941은 방 전체 구도에 쓰기 적합하며 큰 확대·재프레이밍은 별도 검수 필요 |
| 승인 캐릭터 정체성 참조 | `public/images/approved-couple-room/approved-character-reference.png`; 1312×1199. ZIP 상대 경로 `assets/approved-character-reference.png`; SHA-256 `ccabcdcc074d7f8840360c1cd5671a024d8c0336f6c7241e44cfb40e89b36f31` | `LandingWorldHost.tsx`, `AcrossHero.tsx`, fallback에서 참조된다. 승인 게임 자세의 대체 그림이 아니라 신원/참조용 | 두 인물 전신과 얼굴이 선명하다. 게임방 그림과 포즈·구도는 다르지만 인물 정체성은 일관된다. 승인 README는 이 참조의 서있는 포즈로 게임방 자세를 바꾸지 말라고 한다. 개별 이미지는 양호하며, 한 화면에서 어떤 구도를 쓸지의 문제는 원본 품질과 분리한다 |
| 원본에서 갈라낸 토끼 말 | `public/images/approved-couple-room/lisyeon-pawn.png`; ZIP 상대 경로 `assets/lisyeon-pawn.png`; SHA-256 `89a54ef25d4a1fa1eaca48d878abf911d1884897521cab00e04a04f2661d4794` | Marble canonical WebP로 변환된 별도 경로는 아래 말 표에 기재. 승인 토끼 그림이므로 캐릭터 참조 그림을 대체하지 않는다 | 투명 배경의 토끼 봉제인형과 받침이 명확하다. 1254×1254 PNG 원본은 큰 장식도 가능하지만, 실제 게임 말의 최종 크기 화면 품질은 별도 확인 대상 |
| 승리 반응 2종 | `public/images/approved-couple-room/result-yeonseok-wins.png`, `result-lisbeth-wins.png`; 각각 1672×941. `reaction-provenance.json`에 원본과 SHA-256 기록 | `src/app/CoupleResultMoment.tsx`가 원본 방과 승리 반응 마스크·인물 마스크를 겹쳐 실제 결과 장면에 연결한다. 팀 도미노/리듬 예외와 승자 조건은 구현 기록에 따름 | 직접 본 결과 이미지는 방 배경과 표정·자세 차이가 잘 구분되고 원본의 인물 스타일을 유지한다. 전체 배경을 독립 교체하는 자산으로 쓰지 않는다. 같은 원본 위에 마스크로 합성하는 용도다. 최종 게임 결과 화면의 지금 시점 재검수는 이 조사 범위에서 하지 않았다 |
| 결과 합성용 마스크 | `foreground-semantic-mask.png`, `result-yeonseok-mask.png`, `result-lisbeth-mask.png`, `character-opacity-mask.png`, `reaction-mask-provenance.json` 등 같은 폴더 | 활성 코드에서 참조되는 합성 마스크와 확인용·보존용 마스크를 구별한다. 마스크는 이미지 컨텐츠가 아닌 영역 선택 자료 | 해당 파일들은 일반 사용자 표시용 그림이 아니다. 파일 존재만으로 가장자리/합성 결과가 모든 크기에서 통과했다고 보지 않는다 |
| 환경 정리판 | `environment-clean-plate.png` 및 `environment-chair-vacancy-only.png`, `environment-floor-vacancy-only.png`; provenance에는 승인 원본을 기반으로 한 image_gen edit라고 기록 | 깨끗한 배경/가림 분석용 파생. `environment-clean-plate.provenance.json`은 인물 픽셀은 다시 만들지 않았다고 기록하나, 가려져 생성된 가구·환경은 원본과 다를 수 있고 직접 시각 확인이 필요하다고 명시한다. 현재의 메인 승인 원본을 대체하지 않는다 | 시트에서 인물 제거 영역의 책상·의자 재구성은 자연스러운 편이나, 생성된 빈 공간은 추정 환경이다. 가시 인물의 새 원본으로 쓰거나 원본과 픽셀 동일하다고 말하지 않는다 |
| 세로 여백 outpaint | `room-vertical-outpaint.png` 1536×1024 및 `room-vertical-outpaint.provenance.json`; source `/workspace/generated_images/exec-766d491c-534c-4717-a542-85ca1f671b8d.png` | 승인 검토 후보의 위·아래 테두리 연장이다. provenance는 중앙 전체 UV는 승인 원본만 샘플하고 바깥 52px만 파생 이미지를 사용하도록 기록한다. 중앙 인물·액자를 재생성하지 않는다. 승인 자체는 아님 | 단일 이미지 전체를 승인 장면처럼 표시해서는 안 된다. 경계 이음과 실제 런타임 최종 캡처는 별도 통과 조건이다. 같은 provenance가 다른 rejected exploration의 실제 경로·거절 사유도 보존한다 |

승인 방 원본 정보는 [source-sha256.json](../../public/images/approved-couple-room/source-sha256.json), 폴더 설명과 사용 제한은 [README.md](../../public/images/approved-couple-room/README.md), 파생 기록은 같은 폴더의 `*.provenance.json`에 있다.

## 커플 사진·인물 이미지

| 자산 | 위치·출처 | 상태와 범위 |
|---|---|---|
| 원래 커플 일러스트 | `public/images/yeonseok-lisbeth-portrait.jpg` 1536×1536. `docs/ASSETS.md`는 ZIP 안 `couple-landing-design/assets/couple-illustration.png`를 바이트 그대로 보존했다고 기록한다. 파일 확장자와 실제 JPEG 형식이 다르다 | 원본 보존본. 사용자 제공 원본이며 코드의 각 소비자가 현재 어느 화면에 노출되는지는 개별 확인해야 한다 |
| 배경 제거 커플 컷아웃 | `public/images/yeonseok-lisbeth-cutout.png` 1254×1254 및 WebP | 별도 생성 파생이라 원본과 픽셀 동일하지 않다. standalone `src/preview/LandingPreview.tsx`에서 사용하며 현재 새 랜딩 Hero 승인 원본으로 간주하지 않는다 |
| 사용자가 제공한 개인 JPEG 4장 | `public/images/dos-cafe-memory-11851.jpg`, `dos-couple-hero-11850.jpg`, `dos-couple-scrapbook-11849.jpg`, `dos-couple-figurine-11848.jpg`; 모두 1280×1280 | [ASSETS.md](../ASSETS.md)는 ZIP에서 보존했고 사용자는 갤러리를 계획하지 않았으므로 활성 홈페이지에서 렌더하지 않는다고 기록한다. 보존된 개인 사진의 공개/프라이버시 범위는 배포 설정 별도 문제이며, 이번 자산 시각 검토로 변경하지 않는다 |
| Da Vinci 조커 커플 일러스트 | `public/images/davinci/joker-couple-indoor.webp`, `joker-couple-waterfront.webp` 512×768. 원본 PNG는 asset handoff `asset-handoff/personalization/`에 있었고 [personalization/manifest.json](../../public/images/personalization/manifest.json)이 원본 경로·크기·해시를 보존한다 | 사용자 승인 black/white Joker 기본 그림. 다빈치 실제 게임 및 standalone 예고 카드에서 참조. 원본 개인 사진이 아니며 사용자가 승인한 생성 일러스트. manifest의 원본 시각검수와 최적화 WebP 기록은 있지만, 메인 통합 레이아웃 검수와 구분한다 |
| Da Vinci / Splendor 대표 커버 | `public/images/landing-preview/art/leonardo-self-portrait.jpg` 1932×2953와 provenance; `public/images/splendor/box-cover.jpg` 998×1280 | [studioObjects.ts](../../src/landing/gallery/studioObjects.ts)가 원본 비율 그대로 포함하는 두 아트 패널에 사용. Splendor 커버는 사용자 제공 11861.jpg 보존본이다. Leonardo 그림은 게임 공식 박스가 아닌 귀속/추정 자화상이며 provenance에 출처·제한 기재 |

## 일곱 승인 Marble 말 (standee 원화)

정식 자산 목록은 [pawns/manifest.json](../../public/images/marble/pawns/manifest.json)이다. 원본 PNG들은 승인 Git asset branch에서 왔고 WebP로 최적화돼 `public/images/marble/premium/pawns/`에 있다. `manifest`는 원본·최적화 SHA, 크기와 매핑을 기록한다. 7개는 다음과 같다.

| ID / 표시명 | 런타임 그림 |
|---|---|
| `fox` / Maltipoo | `maltipoo.webp` |
| `cat` / Ragdoll | `ragdoll.webp` |
| `penguin` / Panda | `panda.webp` |
| `astronaut` / Astronaut | `astronaut-rose-heart.webp` |
| `robot` / Lisyeon | `lisyeon.webp` — ID는 로봇이지만 그림은 승인된 분홍 토끼 |
| `dragon` / Chinchilla | `chinchilla.webp` |
| `sali-suli` / Sali y Suli | `sali-suli.webp` — 두 마리 한 쌍, 게임 말 ID 하나 |

시각 검토에서는 일곱 그림 모두 투명 배경 위 작은 받침대가 있는 같은 광택 수집품 스타일이고 각 캐릭터를 알아볼 수 있었다. 현재 WebP 높이는 256px, 폭 153–232px라 게임판의 작은 말 표시에는 적합하나 랜딩의 큰 전경 소품으로 키우면 세부 정보가 제한된다. manifest도 원본/최적화 픽셀 검사와 최종 인게임 QA를 구분하며, 최종 인게임 검토는 pending이다. 저장소에서 실제 확인한 고해상도 원본은 ZIP의 Lisyeon PNG뿐이다. 다른 여섯 PNG는 `asset-handoff/marble-premium/pawns/`와 Git commit/hash가 manifest에 기록돼 있으나 현재 `/workspace` 파일로 찾지 못했다. 최적화 WebP를 크게 키워 쓰기보다 원본 PNG가 전달되는 경로를 확인해야 한다. 이들은 3D 모델이 아니라 2D standee 이미지다.

`public/images/approved-couple-room/lisyeon-pawn.png`와 canonical `public/images/marble/premium/pawns/lisyeon.webp`는 동일 승인 토끼 계열의 원본/게임용 변환본이다. ZIP에서 발견한 원본은 PNG 한 장이며, Marble manifest는 원본 Git handoff 경로를 기록한다. canonical WebP는 게임 서비스 파일이고 원본 PNG가 더 큰 해상도로 어디선가 접근 가능한지 별도 확인하지 않았다. 현재 256px 높이의 WebP를 큰 hero prop으로 확대하면 세부가 부족할 수 있다. `public/images/marble/pawns/manifest.json`의 ID mapping을 유지한다.

## 여덟 게임 갤러리와 이전 아트 후보

현재 갤러리 factory는 [src/landing/gallery/studioObjects.ts](../../src/landing/gallery/studioObjects.ts)다. 갤러리 스탠드의 이미지·형상은 실제 플레이 이미지 전체를 새로 그리지 않고, 다빈치와 스플렌더는 2D 표지 원본을 얇은 패널에 담으며 나머지는 기존 정의의 간단한 3D 물체를 사용한다. 2026-10-18 provenance의 `game-tableaux.provenance.json`은 여섯 이전 조각상 정의를 되돌리고 두 패널(Leonardo, 사용자 제공 Splendor)을 유지한 상태, 신규 생성 없음, 실제 통합 검증 대기를 명시한다.

| 게임 | 갤러리 대표 시각물 | 출처·제한 |
|---|---|---|
| Da Vinci | Leonardo presumed self-portrait 단일 패널 | 미술품 이미지; 공식 게임 포장으로 표시하지 않음 |
| Catchmind | 하트 그림판과 연필 | 절차적으로 그린 기존 형상. 새 bird/easel artwork 후보를 채택하지 않음 |
| Domino | 물리 3|5 타일 한 개 | 기존 절차 형상. 실제 게임의 28 타일 SVG와는 구분 |
| Jaipur | 연속된 조각 낙타 | 기존 형상. 시장 카드 일러스트 보드가 아님 |
| Splendor | 사용자 제공 게임 박스 단일 패널 | 원본 998×1280, 실제 게임 카드·noble 자산과 구분 |
| Minhwatu | 승인 Hwatu 카드 3장 팬 | `public/images/hwatu/01-01.svg`, `03-01.svg`, `08-01.svg`; 라이선스/출처는 hwatu 폴더 attribution |
| Marble | 절차적 물리 보드·주사위·집 | 보드는 이 갤러리 공용 표면 그림과 다름. 일곱 승인 말은 게임용 별도 자산 |
| Rhythm | 헤드폰과 음표 형상 | 원본 SWF/Ruffle 플레이 화면과 별도 장식 형상 |

보존 contact sheet `/workspace/scratch/gallery-asset-audit-p/old-gallery-vs-current-factory-contact-sheet.png`는 옛 갤러리 원본과 현재 factory 연구 캡처를 한 장에 비교한다. 이는 이미지 경로가 아니라 검토 자료다. 해당 감사의 `sources.json`은 factory를 “isolated identity evidence”, 현재 게임 페이지 증거가 아닌 축소 비교라고 제한하고, 새 게임 artwork를 생성하지 않았다고 기록한다. 캡처에는 게임 오브젝트가 작고 어두운 배경에서 멀리 보이는 상태가 있다. 이것은 당시 프레이밍/통합의 관찰이며 각 자산 원본이 나쁘다는 판정이 아니다.

`public/images/landing-preview/games/{catchmind,davinci,domino,jaipur,marble,minhwatu,rhythm,splendor}.png`는 각 1268×391의 넓은 static fallback이다. `src/preview/StudioScene.tsx`가 preview WebGL 실패 시에만 사용한다. 이들은 별도 3D 모델이나 승인 게임 원화가 아니며 main gallery factory 자산도 아니다. 넓은 이미지 안에서 표적 물체가 작게 보일 수 있으므로 큰 단독 카드/스탠디로 확대해 평가하지 않는다.

## 장미·게임 장식·구형 landing asset

| 자산 | 위치·생성 기록 | 현재 코드 연결 / 검토 |
|---|---|---|
| 편지용 4+4 장미 | `public/images/landing-preview/letter-roses-atlas.png` 1774×887, source `/workspace/generated_images/exec-f13fe579-3c30-4929-9f04-d6e78db1e04b.png`. [provenance](../../public/images/landing-preview/letter-roses-atlas.provenance.json), SHA `34bd1dbe7d6f986affc479198881a0f294c4e2c2a099e2ef0776575fe2ed4449` | 활성 연결: `src/landing/LandingWorldHost.tsx`가 후반 `PostHeroPreview`를 넣고, `src/landing/PostHeroComposition.ts`가 `post-hero-preview/src/LetterRoses.ts`의 WebGL atlas를 생성해 같은 scene에 추가한다. `post-hero-preview/src/preview.css`도 standalone letter preview에서 좌우 atlas를 쓴다. 투명 배경 원본에서 좌우 각 네 송이, 꽃잎·잎·중심이 식별된다. 부모가 검토한 영상 53초 프레임에는 오른쪽 네 송이가 보이고 왼쪽은 가려져 있어 현재 해당 구도에서 4+4가 동시에 식별되지 않는다. 이것은 배치/가림 문제이며 atlas 원본의 품질 결함이 아니다. |
| 단일 장미 | `public/images/landing-preview/organic-rose-generated.png` 1024×1536 | `src/preview/LandingPreview.tsx`가 독립 preview gift 장면에 사용. 4+4 atlas와는 별개. 꽃 한 송이는 식별되지만 편지용 4+4를 대체하지 않음 |
| 8게임 장식 sprite atlas | `public/images/rose-game-atlas.png` / `.webp` 1254×1254, 4열×2행 | `.landing`/`.app-shell`의 `.game-thumbnail`, `GameRail` 숨은 로드/대체에 사용. 보석·카드·말·헤드폰·주사위 등은 각 칸에서 식별된다. 부드러운 핑크 장난감 스타일의 좋은 작은 장식 atlas이지만, 어두운 우주나 따뜻한 승인 방의 사실적 일러스트와 시각 계열이 다르다. 이것은 배치/아트 디렉션이 한 장면에서 맞는지 검수할 문제이지 원본 파일 훼손·결함 판정이 아니다 |
| 편지 envelope | `public/images/lisbeth-letter-envelope.png` / `.webp` | 생성된 독립 foreground art. `src/preview/LandingPreview.tsx`의 `HeroScene` 호출에서 사용. 봉투·봉인·종이 결은 잘 읽힌다. 새 랜딩의 동일 3D 소품이라는 뜻은 아님 |
| 밤하늘·우주 장면 | `public/images/midnight-rose-sky.webp`, `public/images/our-universe-scene.webp`, 구형 `public/images/landing/cinematic-observatory-hero-v1.webp` | CSS와 folded Hero source에서 우주/하늘 이미지를 참조한다. 2D 생성 배경이며 WebGL·실제 mesh room이 아니다. 보라·로즈 색조, 촛불과 별·행성이 식별된다. 승인 게임방과 겹치는 화면의 미감 적합성은 scene composition 문제다. Hero 현재 변경 중이므로 소스 경로를 final Hero 승인으로 간주하지 않는다 |
| 구형 hero sprite pack | `public/images/landing-preview/hero/` 아래 heart/light/curve/portrait-shadow PNG들 | 이 폴더는 여러 레이어를 포함한다. 총괄 정리에서 `portrait-shadow.png`, `curve-neutral.png`, `hearts-neutral.png`를 미참조 PNG로 별도 제거 대상으로 확인했다. 이 세 파일과 나머지 폴더를 한 덩어리로 ‘모두 보존’ 또는 ‘모두 삭제’했다고 기록하지 않는다. 그 밖의 파일별 활성 연결·보존 상태는 이 목록에서 판정하지 않았다 |
| envelope 종이 grain | `public/images/landing-preview/envelope-paper-grain.svg` | preview asset. 현 main-route의 활성 사용은 이번 조사에서 찾지 못했다 |

## 어디에 있는지와 보존 원칙

- 승인 방과 원본 인물: `public/images/approved-couple-room/`.
- 개인 원본 JPEG와 기본 커플 portrait: `public/images/` 루트. 기존 `docs/ASSETS.md`는 사용하지 않는 사진도 삭제하지 않고 보존한다고 기록한다.
- Da Vinci 커플 jokers: `public/images/davinci/`, 원본/승인/매핑은 `public/images/personalization/manifest.json`.
- 일곱 Marble 말: `public/images/marble/premium/pawns/`, mapping/source/checksum은 `public/images/marble/pawns/manifest.json`.
- 갤러리 구조: `src/landing/gallery/studioObjects.ts`; 표지·카드·게임 이미지가 해당 게임의 play implementation과 다를 수 있다.
- 레터 장미·기존 gallery fallback·hero 레이어: `public/images/landing-preview/`.
- 격리형 gallery 비교와 scratch 후보: `/workspace/scratch/gallery-asset-audit-p/`, `/workspace/scratch/gallery-two-art-review/`, `/workspace/scratch/gallery-rollback-capture-final/`. 이는 검토/회귀 증거이지 main route asset directory가 아니다.
- 승인 ZIP의 압축 해제본은 `/workspace/scratch/approved-assets/`에 있다. 그 안의 3개 PNG와 manifest hash는 공개 폴더의 같은 원본 세 개와 일치한다. ZIP 컨테이너 자체는 찾지 못했고, README가 말하는 것 외의 ZIP 파일이 더 있다고 가정하지 않는다.

## 품질 판단 범위와 남은 확인

원본 비율을 보존한 contact sheet를 사용해 승인 방·인물·승리 장면·장미·7말·gallery/tableaux·Da Vinci jokers·두 noble portrait를 직접 보았고, 파일 차원과 여러 provenance/manifest를 함께 읽었다. 개별 파일의 식별성, 잘림, 스타일 통일성과 원본/파생 경계를 확인했다. contact sheet는 빠른 시각 검토 자료라 원본 크기의 모든 가장자리·미세 잡티 검수 또는 실제 제품 크기 합격을 대신하지 않는다.

구성은 다섯 묶음의 아트 패밀리가 있다: (1) 따뜻한 승인 game-room anime illustration, (2) 둥근 수집형 Marble standees, (3) pink/gold decorative game atlas, (4) 어두운 cinematic space/hero, (5) 현실적/역사적 cover·사용자 사진. 각 원본은 자기 용도에 맞는 특징과 식별성이 있으나, 같은 장면의 색·광원·물성 조화를 화면에 섞는 일은 별도의 통합 평가다. 레이아웃이나 2D 합성 방식만을 이유로 승인 원본 자체를 나쁘다고 기록하지 않는다.

초기 자산 조사 당시 Hero revision 2는 사용자 승인 상태가 아니었다. 당시 조사자가 하지 않은 일: 승인 ZIP 컨테이너 다운로드/재압축, 자산 생성·재인코딩·삭제, UI·source 변경, 브라우저 재렌더 및 실제 화면 재검수. 특히 현재 gallery 원복 상태의 여덟 자산을 각 지원 화면 크기에서 다시 승인하거나, 승리 반응의 이번 시점 실제 play result 화면을 검수한 것으로 기록하지 않는다.

## 2026-10-21 v6 기술 자산 검수 이력 — 당시 WIP, 시각 승인 아님

초기 `cosmic-matte-generation.json`은 opacity matte 후보만 기록했지만 이후 상태가 바뀌었다. 후보 2는 `public/images/hero-cosmic-layers/near-foreground-matte.png`로 실제 v6 runtime에 연결된 기술 작업물이며, `public/images/hero-cosmic-layers/cosmic-disocclusion-plate.png`도 생성되어 runtime에 연결됐다. 두 파일은 당시 WIP였다. 최신 구현 계약은 아래 v8 추기를 따른다. `public/images/hero-cosmic-layers/provenance.json`과 `output/current-review/hero-spatial-rework-20261021/runtime-separated-v6/REVIEW.md`가 이 상태와 검사 범위를 기록한다.

| 원본/후보 | 저장 경로 · 치수 · 크기 · SHA-256 | 출처와 당시 상태 |
|---|---|---|
| 원본 우주 RGB | `public/images/our-universe-scene.webp` · 1536×1024 · 1,826,360 bytes · `29747b92c13babd57938f064c9e5a6a94339594e6adafe342e18d0e25a3114e9` | 원본 파일 hash/크기를 직접 측정했다. RGB 원본은 수정되지 않았고 두 runtime layer의 기초로 유지된다. |
| 후보 1 matte | `/workspace/generated_images/exec-c21ff612-4665-44f6-931c-91829fa70382.png` · 1536×1024 · 1,127,338 bytes · `6e7e9969bfb963eed90f1e78df44e7b1d9c6279999f8c311e7470fa651fe46a8` | 거절됨: 안쪽 검은 선화와 가까운 벽의 불투명 영역 누락. runtime에 연결된 자산이 아니다. |
| 후보 2 matte / runtime copy | generated source `/workspace/generated_images/exec-526525f4-d309-4086-98e8-8667537815fa.png`; runtime `public/images/hero-cosmic-layers/near-foreground-matte.png` · 1536×1024 · 970,436 bytes · `408eeea701b060af318b587227ee18f8630000bd43f2051c82e2be34a1132eab` | 내부 소품 윤곽 문제는 원자적 수정과 원본 좌표 구조 보정으로 개선돼 v6 WIP runtime에 연결됐다. 가까운 구조의 경계 정합·일부 rail 잔여 결함 때문에 최종 matte 또는 시각 합격이 아니다. |
| disocclusion clean plate | generated source `/workspace/generated_images/exec-24b875b1-adb9-4f9f-85b6-d68be1b793b0.png`; runtime `public/images/hero-cosmic-layers/cosmic-disocclusion-plate.png` · 1536×1024 · 2,491,083 bytes · `24c91d12523dab0097384b90b8dea0856caa9a4421b74c27f0beea7ed90c5fdc` | 가려졌다 드러나는 영역에만 쓰는 생성 RGB이며 v6 technical disocclusion test 용도로 연결됐다. 원본 우주 이미지 전체를 대체하지 않는다. `provenance.json`은 이 숨은 영역만 새 RGB를 갖는다고 기록한다. |

승인된 Hero·인물·방의 원본 RGB는 그대로 보존됐다. 사람과 승인 원본 영역은 재생성하지 않았다. 다만 hidden/disocclusion 영역에는 별도 새 RGB clean plate가 존재한다. matte는 원본 RGB를 샘플링하는 전경/가림 선택 자료이고, clean plate는 그 뒤에 드러날 때의 픽셀이다. 따라서 “새 RGB 없음”이라고 뭉뚱그리지 않는다.

v6에서 확인된 기술적 보존 범위는 제한적이다. B 카메라/frustum 도달, 입구가 읽히기 전 머리 가림 해소, 읽히는 B pose에서 원본 bunny/photo 가로 실루엣 유지, 기존 사람/방 RGB 유지가 기록됐다. 실제 런타임 정지 화면에서도 문제가 남는다: 원본 structural edge 선택의 일부 rail 흔적, 그리고 clean plate와 보존된 far RGB 경계 색차가 만드는 arch-shaped sky seam이다. `REVIEW.md`는 이 seam을 alpha만의 문제가 아니라 두 source RGB 경계의 불일치로 기록하며, far RGB 전체 덮어쓰기나 전역 이동을 해결책으로 삼지 않는다. 이는 카메라/영역 보존 등 기술 계약에 대한 부분 확인이지 장면 미감·경계 품질 합격이 아니다.

초기 2026-10-21 생성 기록 시 clean plate는 아직 생성하지 않았고 후보 2 경계도 geometry union과 정지 프레임 확인을 기다렸다. 위 표는 그 뒤 v6에서 확인한 이력이며 현재 구현의 최종 상태가 아니다. 이후 v8의 계약과 확인 범위는 아래 추기를 따른다.

## 후속 v8 계약 정정과 후보3 거절 — 당시 기록

v6의 inside-coverage 합성은 과도한 총괄 기술 제약이었다. v8 당시 구현은 승인 p0 원본을 유지한 뒤 초기 원경 layer를 일관된 cleanplate로 이어 주며 실제 전경/카메라 기하를 유지했다. 원본 RGB 파일·승인 B·인물은 보존한다. root는 실제 두 해상도 중간 PNG에서 아치 색 접합선과 FAR 옛 소품 잔상 해소를 확인했다. 근경 꽃/소품 추출 가장자리는 당시 시각 합격이 아니었다. 위 표의 v6 사용 범위와 v8 당시 구현 계약을 구분한다.

추가 mask 후보3 `/workspace/generated_images/exec-9a0c061c-9687-4a46-b580-8a3904cd2f92.png`(1536×1024,1,029,272B,SHA `799286f8281ecd9a922c10c38cd8164c0427a8c1c40cd9ba06e0cd5920b74623`)은 root가 직접 열어 거절했다. 가까운 벽의 잘못된 검정 영역과 소품 안쪽 선화가 다시 생겨 제품에 복사/연결하지 않았다. 자산 생성 성공을 품질 개선으로 기록하지 않는다.

후속 RGBA 분리 후보 `/workspace/generated_images/exec-2ab7ff3d-6750-4159-b864-ad2e6cadba3d.png`은 image_gen의 투명 배경 제거 방식으로 생성했다(1536×1024,2,089,657B,SHA `4da6cd9d3396e97ddc2cc416d1fd2be462ef7004bbb72d3050394a504b14f926`). 실제 RGBA이며 원경/난간 구멍 alpha=0, 가까운 벽은 불투명하다. root와 독립 검수는 연결 개선과 동시에 더 풍성한 꽃/잎 묘사, 벽·금속의 밝기·세부 변화, 작은 원경 잔류 가능성을 확인했다. 원본과 같은 꽃 수·형태를 완전히 보존했다고 주장할 수 없다. v8 당시에는 제품 runtime에 미연결이었다. 이후 사용하지 않는 mask2 이진 matte와 source-trace fallback helper는 checkpoint `50f833e`에서 회수할 수 있게 정리됐다. 현재 v9 source에는 파생 RGB와 별도 수리 alpha가 별도 채널로 연결된 WIP다. 사용자가 별도 장식/새 꽃을 요청한 것은 아니므로 이 파생 표현을 승인 첫 Hero/B에는 적용하지 않고, 전환 전경 후보로만 검수 중이다.

## 2026-10-20 UTC v9 전환 전경 자산 — 소스 WIP, 기술 검사 완료·시각 승인 대기

파일명 식별자 `20261021`은 한국 현지 작업일 표기다. provenance는 실제 생성 실행일을 `2026-10-20 UTC`로 기록한다. 앞선 v6/v8 구간은 당시의 상태·검수 이력으로 유지하며, 현재의 연결 상태는 다음 v9 표에 따른다.

| 입력/레이어 | 저장 경로 · 치수 · 크기 · SHA-256 | 출처·연결 상태 |
|---|---|---|
| 원본 우주 RGB (`I`) | `public/images/our-universe-scene.webp` · 1536×1024 · 1,826,360 bytes · `29747b92c13babd57938f064c9e5a6a94339594e6adafe342e18d0e25a3114e9` | 파일 해시와 크기를 직접 확인했다. 원본 우주 RGB는 수정되지 않았다. 승인 첫 Hero/B 및 승인 인물·게임방 원본도 보호된다. |
| 파생 근경 RGB (`N`) | generated source `/workspace/generated_images/exec-2ab7ff3d-6750-4159-b864-ad2e6cadba3d.png`; runtime `public/images/hero-cosmic-layers/near-derived-rgb.png` · 1536×1024 · 2,089,657 bytes · `4da6cd9d3396e97ddc2cc416d1fd2be462ef7004bbb72d3050394a504b14f926` | RGB는 파생 이미지에서 읽고, 기본 alpha는 같은 첫 RGBA 이미지의 alpha를 사용한다. 꽃/잎 묘사는 원본과 밀도·세부가 다르고 벽·돌·금속의 밝기·세부도 달라 exact cutout이 아니다. 원본과 같은 꽃 수·모양 전체를 보존한다고 말하지 않는다. |
| 수리한 alpha (`A`) | generated source `/workspace/generated_images/exec-84886c9d-60de-40b6-89a3-1d212b26e68a.png`; runtime `public/images/hero-cosmic-layers/near-repaired-alpha.png` · 1536×1024 · 2,160,095 bytes · `a488ea774fe3f2c9b8406cf6bbe75b09441c1118f58e0075a62802f4622e325b` | alpha만 쓰며 RGB는 무시한다. 기본 N alpha 대신 쓰는 범위는 실제 도시 첨탑 component x428–467,y459–564(2,224 source pixels)를 포함하도록 둔 padding ROI x424–480,y453–571뿐이다. 두 번째 후보 ROI x730–980,y635–680는 잎의 실제 차이로 인해 적용하지 않고 N alpha를 유지한다. PNG 전체를 합성·편집한 단일 RGBA 제품 파일은 만들지 않았다. |
| 원경 disocclusion RGB (`C`) | generated source `/workspace/generated_images/exec-24b875b1-adb9-4f9f-85b6-d68be1b793b0.png`; runtime `public/images/hero-cosmic-layers/cosmic-disocclusion-plate.png` · 1536×1024 · 2,491,083 bytes · `24c91d12523dab0097384b90b8dea0856caa9a4421b74c27f0beea7ed90c5fdc` | 숨겨졌던 곳에 드러나는 원경 영역을 위한 새 RGB다. 승인 B·인물 원본을 교체하지 않으며 원본 우주 panorama 전체 replacement도 아니다. |

`src/landing/cinematic/folded/cosmicLayers.ts`는 원본 texture, 파생 근경 RGB, 별도 alpha를 실제 runtime에서 채널별로 조합한다. 기본 alpha는 N의 첫 RGBA alpha이고, A는 source ROI x424–480,y453–571에만 적용된다. `src/landing/cinematic/folded/previewSpaceV19.ts`가 이들과 clean plate를 로드한다. 각 레이어는 별도 PNG이며, N의 RGB와 A의 alpha를 결합한 단일 합성 PNG를 만들지 않았다. 파일 크기·해시는 직접 `identify`, `sha256sum`, `stat`으로 확인했다. 현재 v9 연결은 소스 WIP다.

기존 v9 기록을 읽으면 기술 검증이 완료된 범위를 확인할 수 있다. `runtime-hybrid-v9-proof-v4/report.json`은 1920×1080과 1440×900에서 boundary 샘플을 기록하고 `errors`가 비어 있다. 검증 요약은 v9 경계/원경 handoff와 B 외곽 행 seam·측면 HUD 종료 수정을 범위로 적는다. `runtime-hybrid-v9-validation/interaction/settled-report.json`은 두 해상도 모두 pointer 반응·분리 전 입력 등록, settled/reversal/resize 이미지 일치 플래그가 참이며 오류가 0이다. `final-checks.log`에는 관련 집중 검사 27개 통과와 production build 통과가 기록돼 있다. 이는 범위가 지정된 기술 검증 결과이며 사용자 승인이나 전체 시각 합격을 뜻하지 않는다. 특히 독립 A의 실제 0.2초 추출 sequence에서는 fade/background replacement가 지배적으로 보였으므로 motion 최종 완료로 표시하지 않는다. 다음 timing study는 output-only로 남아 있다. v9 push도 아직 이뤄지지 않았고, 원격에는 v8 체크포인트 `50f833e`가 현재 상태다.

Root가 보고한 제한된 실제 v2 `.16` study에서는 원경 도시 첨탑이 제거되고 연결이 이어지며 RGB가 더 어둡게 유지된 모습을 확인했다. 이는 한 정지 상태에서의 관찰로 full handoff 승인 근거가 아니다. 이 파생 RGB에 더 풍성한 꽃/잎과 원본 대비 벽·금속 차이가 있으므로, 사용자가 요청하지 않은 별도 장식/새 꽃의 표현은 승인 첫 Hero/B에 적용하지 않는다. 전환 전경 WIP에서만 원본 요소와의 관계를 검수 중이다. 꽃 개수나 형상의 완전한 보존은 주장하지 않는다.
