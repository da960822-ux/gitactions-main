# 기존 로컬 자산·기능 조사

> 최신 자산 정정: 이 로컬 조사보다 메인 측 승인 정보가 우선한다. 승인 게임말7종(핑크토끼, 살리·술리 두 마리 강아지, 로즈하트 우주인, 말티푸, 랙돌, 판다, 친칠라), 흑수변/백실내 커플사진 조커, 의사/한복 커플 귀족2종을 사용한다. robot ID는 핑크토끼다. 로컬의 옛6종 말·‘－’조커·기존 귀족은 최신 승인본이 아니다. 실제 메인 경로/ID 인수는 EASTER-EGGS.ko.md v3의 목록을 따른다.


기준 커밋 `b37c10b5a93d44236a7d5ed5834b817531e8ea39`. 메인 개발 세션의 별도 영상 7개는 이 로컬 조사 범위에 포함되지 않는다.

## 자산 인벤토리와 재사용 결정

모든 경로는 이 저장소 기준이며 다른 환경에 파일이 있다고 가정하지 않는다. 기존 자산을 다시 요청하지 않는다. PNG 원본은 보존하고 현재 쓰는 WebP를 기본으로 한다.

| 경로 | 조사 결과 / 용도 / 한계 |
|---|---|
| `public/images/yeonseok-lisbeth-portrait.jpg` | 1536² RGB, 370,027B. 사용자 원본 캐리커처. `Better Together`와 하트 배경 포함. 원본 확인용이며 얼굴을 재생성하지 않음 |
| `public/images/yeonseok-lisbeth-cutout.webp` | 1254² RGBA, 1,241,834B. 현재 Hero 사용. 실제 투명 픽셀 589,075개. 엔딩 재사용 후보; 원본과 cutout은 이미지 생성 때문에 세부가 같지 않음. 기존 컷아웃은 사용자 승인 완료. 그대로 재사용하며 재승인 요청하지 않음 |
| `public/images/yeonseok-lisbeth-cutout.png` | 1254², 1,930,478B. source 보존; 새 derivatives 만들지 않음 |
| `public/images/lisbeth-letter-envelope.webp` | 1536×1024 RGBA, 2,038,002B. 실제 투명 픽셀 356,749개, alpha 최대 254. `For Lisbeth`, 버건디 왁스, 로즈골드 하트가 합쳐진 1장. 봉투 전체 이동만; 물리 플랩/봉인 분리는 불가능 |
| `public/images/lisbeth-letter-envelope.png` | 동일 크기 원본, 3,099,605B. 보존 |
| `public/images/our-universe-scene.webp` | 1536×1024 RGB, 1,826,360B. Hero의 행성·촛불·망원경·장미·편지가 한 이미지에 구워짐. 배경의 편지는 실제 읽는 편지가 아님. S0 암부 환경 잔향만, 분해된 3D로 주장하지 않음 |
| `public/images/our-universe-scene.png` | 동일 크기 source 2,425,965B. 보존 |
| `public/images/midnight-rose-sky.webp` | 1939×811 RGB, 1,084,714B. 대체 정적 배경 후보. 여러 대형 배경을 동시에 추가 fetch하지 않음 |
| `public/images/rose-game-atlas.webp` | 1254² RGB, 1,464,588B, 4×2. S2 rhythm/domino 장식은 기존 CSS crop 재사용. 게임의 실시간 스크린샷으로 표시 금지 |
| `public/images/hwatu/01-01.svg` | 현재 민화투 thumbnail override. atlas의 옛 민화투 crop으로 회귀하지 않음 |
| `public/images/splendor/box-cover.jpg` | 현재 스플렌더 thumbnail override. 게임 구간은 이 사용자 제공 원본을 보존 |
| `public/fonts/gowun-batang-display.woff2` | 기존 제목 face. 한국어 범위와 최종 줄바꿈은 별도 검증 필요 |
| `public/fonts/dm-sans-{regular,700}.ttf` | 기존 UI face. ES 악센트와 한국어 fallback 확인; 추가 서체 설치 없음 |
| `public/images/dos-{cafe-memory-11851,couple-hero-11850,couple-scrapbook-11849,couple-figurine-11848}.jpg` | 1280² 사용자 제공 보존 파일 4개. 갤러리 미사용 요구 유지. 파일명을 실제 함께한 추억의 증거로 삼지 않음 |
| `public/rhythm/{Music14,Music_RES}.swf`, `public/rhythm/ruffle/` | 실제 rhythm 기능 자산. 랜딩 장식 때문에 SWF/wasm을 선로딩하거나 실행하지 않음 |

현재 `landing.css` atlas 위치: davinci 0/16%, catchmind 33.333/16%, domino 66.667/16%, jaipur 100/16%, splendor 0/84%, minhwatu 33.333/84%, marble 66.667/84%, rhythm 100/84%. 실제 민화투와 스플렌더는 위 override가 최종이다.

## 기능·원문 보존 계약

여덟 게임은 `src/games/catalog.ts`가 source of truth. 순서/라우트 보존: davinci 다빈치 코드 / El código Da Vinci, catchmind 캐치마인드 / Adivina el dibujo, domino 도미노 / Dominó, jaipur 자이푸르 / Jaipur, splendor 스플렌더 / Splendor, minhwatu 민화투 / Minhwatu, marble 부루마블 (우리 규칙) / Marble · juego de bienes raíces, rhythm 뮤직톡톡 / Music Talk Talk. 각 링크는 `/play?game=<id>`다. 장식 rhythm을 클릭 가능한 새 미니게임으로 만들지 않는다.

`LandingMoments`의 실제 invite 설명, Catchmind 번역/원문·한도 안내, `/play?game=catchmind`, `/feedback`를 모두 보존. 번역은 모든 게임/실시간 통화/랜딩 채팅에서 된다고 넓혀 말하지 않는다. Supabase 미설정 시 같은 브라우저 모드라는 기존 구분을 변경하지 않는다.

모바일 안내 문구는 현재 일반적으로 컴퓨터를 권하지만 `src/core/display.ts`에는 Jaipur 예외가 있다. `/play` lobby와 `/room/:id` 진입도 허용한다. 이번 설계는 이 정책이나 현재 카피를 수정하지 않는다. 모바일에서 여덟 게임 모두 동작하거나 모두 완전히 차단된다고 새 약속하지 않는다.

편지는 `landingCopy[language]`의 `letterAddress`, `letterTitle`, `letterBody[0..4]`, `letterSignature`를 **한 글자도 재작성하지 않고 직접 렌더**한다. 현재 처음 열림(true), 접기/펼치기, `#papi-letter`, `moment-letter-copy` 연결을 보존. `src/landing/LandingMoments.test.tsx`에는 양언어 원문 전체·링크·초기 열림·폼 없음 검사가 있으므로 이후 구현 시 그대로 통과시킨다. 스토리 초안은 별도 키에 두고 letterBody를 늘리거나 덮지 않는다.
