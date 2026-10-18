> 현재 인계는 [REDESIGN-HANDOFF-20261018.ko.md](docs/REDESIGN-HANDOFF-20261018.ko.md)를 따른다. 아래는 이전 독립 구현 기록이며, 자산 미확보·시각 방향 대기는 현재 구현 중단 지시가 아니다. 과거 검토4문서의 고유 제한은 대표 검수제한으로 통합했다.

# 후반부 독립 구현 인수

브랜치 `feature/post-hero-preview`, 디렉터리 `post-hero-preview/`. 기존 Hero·Landing·게임·번역·home.ts·공유 package/lock은 수정하지 않았다. main의 Hero 승인이나 통합 승인을 주장하지 않는다.

## 실행과 실제 동작

`cd post-hero-preview && npm ci --cache /tmp/post-hero-npm-cache && npm run dev` 후 `http://localhost:4178/`. 검수용 빌드 서버는4179. 이 환경에서는 둘 다 로컬 실행 가능하며 외부 게시/배포가 아니다.

스토리→놀이테이블→편지→엔딩을 독립 페이지로 조립했다. 실제 Three.js 표면·원근 camera·앞뒤 가림, 승인 컷아웃, 별도 봉투 body/앞판/안감/flap/seal/3-panel insert 메시가 있다. click/scroll 개봉·닫기·역방향과 원문 직접 이동을 제공한다. 열린 DOM 원문으로 넘어갈 때 빈3D종이는 숨기고 역스크롤에서 같은 메시를 복구한다. reduced-motion에서는4개의 정적camera/표면pose와 즉시개봉상태를 사용한다.

Luna는 순수상태/단위테스트·도미노실제타일연결·균형·200점상한낙서/도형button·리듬·종이조각·양면문구·기기내취향저장을 구현했다. Sol은 별도3D봉투와 개봉,850ms내 유한효과(도미노연쇄→서랍,미니방벽hinge,렌즈셔터,왁스변형,곡선종이바람,bridge/bar hinge)를 구현했다. root는 독립설치/전체구도/원문·언어·q조립/브라우저검수·인수를 담당했다.

## 통합 API와 파일 소유

- `PostHeroScene`: `{progress, opening, reducedMotion, effect:{name,value,nonce}, portraitSrc, onReady?, onFailure?}`. 부모가p/q소유,scene이geometry/camera/material을소유한다.
- `Details`: `{language,reducedMotion,onEffect}`. 서버/game명령없음. 실제반응 canonical event는balance, balance-settled, domino-chain, paper-bridge, rhythm-bridge, wax-stamp, wax-press, paper-pocket, paper-wind, prism-angle. 0은복귀,nonce는명시입력구별.
- `interaction.ts`: q범위·manual override·정규화·취향저장·실제도미노배치검증. `PostHeroPreview`가독립조립예시다.
- scenehost의data-flap-angle/insert-y/top-fold-angle/bottom-fold-angle/camera-z/paper-visible는실제mesh값검수용이며UI조작대체물이아니다.

원문은 `../src/copy/home.ts`에서직접import한다. 부모의최신원문을source of truth로유지한다. font/public경로는현재저장소의기존경로를쓴다. Vite publicDir는../public이므로생성dist에는기존public자산도포함된다. 최종제품에서는필요자산만참조하도록통합한다. sharedpackage/lock은그대로이며본디렉터리의pinnedlock만추가했다.

현재 CSS는독립페이지 reset을포함한다. 제품에연결할때root아래로scope하고Three scene은동적로드경계에둔다. 게임선택/#games와/play?game=catchmind,feedback은원래제품의목적지이며이독립서버에게임앱이함께실행되는것은아니다. 부모router또는명시app-origin으로연결해야한다.

## 승인 자산 인수 전 대기

최신7종말(핑크토끼/살리·술리두마리강아지/로즈하트우주인/말티푸/랙돌/판다/친칠라),흑수변·백실내커플조커,의사·한복커플귀족의실제source/runtime/ID매핑이이환경에없다. robot은핑크토끼라는최신정정을보존했다. 오래된6종말·‘－’조커·귀족10개를대체품으로사용하지않았다.

이자산을쓰는그림자극/말레일/커플사진셔터/귀족popup/말flipbook/말꾸미기는해당source인수후연결한다. 승인컷아웃재승인·기존파일재요청은필요없다. 기존7개MP4/4Remotion·3HyperFrames제작source도메인측인수이며여기서없다고새로렌더하지않았다.

서버공동4계열은명세만있다. 새인증·RLS·권한·채팅전송을생성하지않았다. Hero영상→WebGL오브젝트/광원/카메라일치는전체통합담당의계약이다. desktop의 실제DOM/카드투영연결은후속구현했고세정지pose의의도한quad경계오차를검수했다. 전기기/전체프레임의2px추적완료를주장하지않는다.

## 증거

`npm run build` TypeScript/Vite 통과, `npm test` 상태·저장·도미노검증4개통과. 실제Chromium/WebGL검수스크립트는 `scripts/verify-preview.mjs`, 캡처와정확한최종결과는 `output/playwright/qa-report.json`이다. KO/es-DO원문,실제메시개봉·복귀,미니상호작용,1440/768/390과축소모션을확인한다. Safari/실제물리기기/60fps나온라인동기화검수로확대하지않는다. 긴영상렌더·베이크·push·배포는하지않았다.

기준 커밋 fcf726a의 결과: Chromium 실제 검수 51/51 통과(기본38+복귀/모바일11+최종구도2), JavaScript 예외0, 실제캡처12개. 추적가능한요약은 review/qa-report.json에도보존했다.

## 장면별 시각 보정 후속

스토리 접힌 지형→놀이 테이블→편지 조명→밝은 열린 테라스로 같은 오브젝트/표면을 변형했다. 상세 개선·남은 디자인 문제·1600×1000 단일 캡처는 `../preserved-work/2026-10-18/REVIEW-LIMITATIONS.ko.md`와 `review/stage-review.json`을 참조한다. 이전 51개 전체를 새 보정 후 재통과했다고 확대하지 않는다.

## v3 실제 보정

제안한지형/문/실제DOM카드투영/모바일경계와footer를코드에적용했다. 현재검수와한계는 `docs/REDESIGN-HANDOFF-20261018.ko.md`를참조한다. `PostHeroScene`의옵셔널 `onPaperPose({corners,visible})`는 viewport좌표 TL/TR/BR/BL이며부모가동일DOM원문을배치한다.

## 시각 방향 선택 전 보존

40697fe 이후이미적용한공간탐색과초기원문접근성수정을별도보존했다. 현재구현과검수는 `docs/REDESIGN-HANDOFF-20261018.ko.md`가우선한다. 초기q0에서도원문은접근성트리에있고시각적으로만접혀있으며명시적닫기후에만hidden이다. 새미술방향선택전조형/재질추가수정은보류한다.
