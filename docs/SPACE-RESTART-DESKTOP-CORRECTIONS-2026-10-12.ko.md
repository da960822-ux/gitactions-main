# 데스크톱 중간 구도 보정 — 미승인 / 전체 미완료

기준 `ab81a9e2de168b89c58e197edbb6e5a541aad4ca`, 브랜치 `local/lusion-space-restart-20261012`.
이전 중간본은 `a30fdc2098ce0b41b0b7047d36bdb991ec54918e`다. 사용자 지시에 따라 **데스크톱만 추가 작업·캡처**했다. 모바일 추가 캡처/녹화와 최종 영상은 하지 않았다.

## 이번 수정과 실제 파일 대응

| 요구/출처 명세 | 실제 파일·값 | 실제 정지 화면 확인 | 남은 검수 |
|---|---|---|---|
| 풍성한 신부파티풍 하트 | `spaceMotion.ts`, `CoupleSpaceScene.tsx`:48개 그대로(좌18/우20/뒤10),3재질각16instance. camera-rest기준depth7.2/10.6/14.4/18.4. 재질을각깊이에섞어규칙적인단색기둥을줄임 |크고작은풍선군집과재질/가림보임. 수량삭감없음 |raycastdrag/실제회전량/관성/접촉품질·연속구도 |
| 날카로운 꽃잎을 둥근 겹 구조로 | Luna `roseBloomGeometry.ts`:5+5+3겹petal,110°원통형arc/안쪽122°,컵형root/감기는rim/둥근scallop,두께.03. 13,650vertices/27,248triangles,지름약3.58/깊이1.23 |기존별모양끝단이둥근겹꽃잎으로변함. 형상읽힘의최종승인은아님 |부모의장미꽃잎읽힘/위계평가,실제각도변화 |
| 리본이 선물로 읽히는 곡면 | root `spaceGeometry.ts`:중심매듭을향하는실제3Dloop경로,미러된반대고리,둥근끝단꼬리2개,두께.036. 주고리2,522vertices/같은vertexarray가넓은면으로펼쳐짐 |두고리/꼬리와매듭관계보임. 얇은wire/tube/금속고리로대체하지않음. 꼬리각도.95rad로본문쪽침범을줄임 |변형연속성/반사이동/빠른역스크롤에서접힘 |
| 마지막 면이 얼굴 침범 금지 | `CoupleSpaceScene.tsx`:최종portraitcentre y40%→31%,x34%;최종viewdepth14.8. camera x2.4/z5.4,면크기/강도유지 |720pxPNG에서두얼굴의눈·코·입·턱이넓은면위로온전히보임 |중간0–720전구간/포인터변화/빠른반전안전 |
| 큰 은하·성운·별군집 | `public/images/landing/spiral-galaxy-far-v1.webp`1672×941/377,518B. sourceimagegenPNG를WebP92/method6으로정규화. scene의far환경viewdepth60/camera-facing. 별720+주요별12유지. 460별은은하분포,worldz−19/−28/−42;cloud−32/−21 |큰은하팔/밝은중심/성운섬유/별무리가분명히보임. camera-facingfar환경으로720px의사각배경edge도없어짐 |독립3D깊이/광층/포인터와scroll연속변화 |
| 실제 깊이·재질·빛 | `heroMaterials.ts`보존. 금속.8/.28,pink.08/.62,pearl.28/.3+iridescence. 고정key3.4/rim1.8/PMREM4panel. 실제하트mesh/instance별pose |세재질의volume/highlight대비와군집가림확인 |이동specular·물리접촉·실기기GPU |
| 입장 강도 유지 | `CoupleSpaceScene.tsx`:camera12.8→9.4/2s,front군집300px·rear150px진입. 첫실제렌더가끝난뒤clock를시작해shadercompile이입장시간을먹지않게수정 |이번PNG는entry1인최종입장pose |콜드/웜첫화면·실제2s입장·버튼/얼굴초기읽힘 |
| 편지·개인말투 유지 | 기존SpaceLetter/previewCopy본문5문단·서명그대로. paper6panel/1.2s,flap155°/wax이탈. ES열림760×571.78px,body전체341px,서명표시 |새데스크톱ES편지PNG에서전체5문단·서명·장미·닫기보임 |fold/reverse/정확한1.2s/접촉그림자/키보드 |

새 은하 그림은 **먼 배경 자산**이며 실제3D 은하 모델이라고 부르지 않는다. 기존 독립 mesh·Points·Sprite·서로 다른 world 깊이의 성운·카메라 이동이 공간을 만든다. 그림 한 장의 미세 wobble로 주 구현을 대체하지 않는다. 원본 생성PNG를 `/workspace/generated_images/exec-305deea3-911b-4ff4-9e6c-cfca3b25cfea.png`에 그대로 보존했고 source/runtime hash와 생성·정규화 정보를 `spiral-galaxy-far-v1.json`에 기록했다.

## 이번 실제 캡처

로컬Vite production을Chromium/1440×900/DPR1에서렌더했다. 새로운데스크톱캡처이며합성시안/기존source screenshot이아니다.

- `output/playwright/couple-space-desktop4/hero-1440-ko.png`:2026-10-12 06:24:16.919 UTC. 실제camera `[0,0,9.4]`,entry1.
- 같은폴더 `scroll-720.png`:06:24:32.486 UTC. 실제camera `[2.4,0,5.4]`,entry1. 얼굴침범/배경edge교정확인.
- 같은폴더 `letter-1440-es.png`:06:29:08.182 UTC. 전체5문단·`Tu Papi, Yeonseok ♡`.
- `inspection.json`, `letter-inspection.json`:actualgeometrycounts/background/depth/material/camera/DOMrect. console/pageerror0. 숫자dataset만으로시각PASS를주장하지않음.

root가위3PNG의실제픽셀을열어확인했다. 원본폴더를보존하고, 승인된`assets/premium-marble-20261011`자산브랜치에검토자료를복사한다. 이전`stage1-unapproved`도남겨비교한다. 최신자료도**미승인·미완료**로명시한다.

## 적합성 대조에서 남은 항목 — 영상 전에 구현/검증 필요

소스에 있는효과와명세의실제동작량을구분한다. **P1의문구ready+delay/stagger와반대방향광루프의적용량, P3의mount텍스트clip-reveal은아직명세그대로구현·대조완료하지않았다.** P2포인터광반응도고정광/재질회전반응과별도로대조해야한다. 이를테스트통과나영상으로대체하지않는다.

L1입력최소량·관성/접촉,L2접힘/반전,L3실제입장,L4/L5/L6의전체연속경로는모두연속frame검수가남아있다. 마지막정지pose의얼굴보호가전경로의합격을뜻하지않는다. 큰면의빈영역위계와보조장미/리본의최종읽힘도부모검토가남아있다. 한항목미달이면전체미완료다.

## 확인한 검증과 보존

현재새motion/geometry테스트5개,TypeScript/Vite/Edge build가통과했다. 새로운ribbon곡선끝의Float32미세초과를실제테스트가잡아t범위를clamp했다. 테스트는시각합격이아니다.

원본37승인WebP·커플cutout·기존승인배경·게임/core/DB·기존KO/EScopy는기준ab81와diff없음. App의기존root호출변경외게임/feedback/desktopguard는그대로다. 보조장미geometry는실제Luna작업으로제작/수정했고root가연결·구도검수했다. 영상/모바일추가캡처/main/배포/강제push없음.

미검수:명세의위미완항목·전경로실제모션·실기기GPU/FPS·전체게임회귀. 새정지구도는검토자료이며완성결과가아니다.
