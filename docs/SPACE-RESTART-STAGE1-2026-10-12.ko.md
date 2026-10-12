# 우주/하트 풍선 재시작 — 중간 구현 / 미완료

보존 기준 `ab81a9e2de168b89c58e197edbb6e5a541aad4ca`, 작업 브랜치 `local/lusion-space-restart-20261012`.
이 문서는 **최종 시각 검수 전, 형태·배치 문제를 조기에 확인하는 중간 전달**이다. 전체 합격을 주장하지 않는다.

## 최신 수량 수정 반영

하트3개이하/소수의별이라는 임의 상한은 적용 명세에서 폐기했다. 첫 배치 계획은 실제 볼륨 하트 풍선48개(좌18/우20/후경10), 별빛720개+주요별12개, 은하/성운3깊이다. 계획 수량은 상한이 아니다. 실제 구도가 빈약하면 늘리거나 재배치하며 얼굴/문구 보호를 개수 삭감으로 해결하지 않는다.

현재 주 화면은 풍성한 하트 군집과 원본 커플이며 기존 방/창틀/책상 구도는 active path에 없다. 원래 HeroScene과 이전 scene 파일·승인 자산은 삭제하지 않고 보존했다. active path에 TubeGeometry/금속 고리/기존 얇은 궤도는 없다. no-WebGL 배경에서도 기존 wire가 그려진 sky URL을 제거했다. fallback의 시각 수준은 주 구현의 합격 근거로 사용하지 않는다.

## 명세 → 실제 코드 대응

| 항목 | 실제 파일 | 현재 코드 수치/방식 | 현재 판단 |
|---|---|---|---|
| 풍선 군집 | `spaceMotion.ts`, `CoupleSpaceScene.tsx`, 기존 `heartGeometry.ts` |48개,3재질의InstancedMesh각16개. 좌18/우20/뒤10. camera-rest기준depth7.2/10.6/14.4/18.4, worldz+2.2/−1.2/−5/−9. 모바일도48개동일. 개별pose/회전/깊이/가림 |실제정지픽셀에서군집·볼륨·재질차이를확인. 풍선물리감/입력최소량은아직연속검수전 |
| 우주 밀도 | `CoupleSpaceScene.tsx` |Points별720개중460개는은하분포, 나머지는넓은공간분포. z−19/−28/−42. 주요별12sprite. galaxyplane z−48 + cloudplanes−32/−21 |기존빈성운보다채워짐. 은하의식별성·성운의구조는실제장면에서추가개선/판정필요 |
| 재질/빛 | 기존 `heroMaterials.ts`, `CoupleSpaceScene.tsx` |rosemetal.8/.28,pinkmatte.08/.62,pearl.28/.3+iridescence. 고정warmkey(−4,6,8)3.4, rim(5,2,−3)1.8, PMREM반사panel4개 |정지픽셀의세재질차이확인. 이동specular/전경뒷면/회전검수는남음 |
| 입장/세계열림 | `spaceMotion.ts`, `CoupleSpaceScene.tsx` |ready후2s, camera12.8→9.4. 앞풍선군집좌우300px/뒷군집150px진입offset, 넓은리본330px이동. 별도의DOMcopy/버튼 |입력·실제시간·연속frame검수전. 큰효과를미세float로대체하지않음 |
| 포인터/관성 | `spaceMotion.ts`, `CoupleSpaceScene.tsx` |raycast instancepick, dragx±240px/y±180px, pointer근접반응140px, stiffness100/damping15, substeps. offset에따른독립회전 |최소수치의실제전달/복귀시간과이웃풍선접촉품질은미검수 |
| 큰 스크롤 전환 | `CoupleSpaceScene.tsx`, `spaceGeometry.ts` |desktop720/mobile650px한progress. camerax0→2.4/z9.4→5.4. 커플planeviewdepth9.4→14.8. 같은리본vertex가펼쳐져다음영역으로이어짐 |720px정지픽셀에서큰면/게임8카드연결확인. **면이얼굴하단을가리는경로·넓은빈면의위계는미달**, 다음수정필요 |
| 장미/리본 형상 | `spaceGeometry.ts`, `CoupleSpaceScene.tsx` |장미꽃잎은앞뒤두께있는mesh와5petal군집, ribbon은넓은96×12분할곡면; 얇은tube없음 |**현재보조장미가날카로운별/접힌조각처럼읽힘. 리본도한눈에선물리본으로읽히는형상은미달. 최종채택불가**, 교정필요 |
| 편지 실제표면 | `spaceGeometry.ts`, `CoupleSpaceScene.tsx` |동일papergeometry의3열×2행6panel fold, opening1.2s, flap155°, wax별도이탈, 원래본문DOM은펼친후투영에맞춰표시 |열린ES데스크톱/모바일정지픽셀확보. 접힘/역전/그림자와DOM투영의연속검수는남음 |
| 개인본문/언어/입력 | Luna구현 `SpaceLetter.tsx`, `space-letter.css`; root `LandingPreview.tsx` |기존previewCopy KO/ES전본문·서명그대로. focus/Escape/inert/longbodyscroll. mobile꽃이미지는본문밖아래공간으로이동 |실제열린편지/서명확인. 언어/전체키보드/모션선택행동QA는남음 |
| 실제home연결 | `src/app/App.tsx`, `LandingPreview.tsx`, `couple-space.css` |desktop/mobile모두같은LandingPreview. 게임route의desktopguard/feedback유지. hash별기존games/letterlink호환 |Luna정적보존검사PASS. 실제게임진입/뒤로가기검수는남음 |

위 값은 소스와 렌더 dataset을 대조한 값이다. source에 존재한다고 시각 합격으로 바꾸지 않는다. 숫자를 늘리는 것만으로 완료를 선언하지 않는다.

## 실제 중간 화면

Vite production build를 로컬 `http://127.0.0.1:5260/`에서 Chromium으로 렌더했다. 기존 저장소 source screenshot이나 합성 시안이 아니다. 2026-10-12 05:53–05:55 UTC에 두 번째 중간 캡처를 확보했다. source는 이 브랜치의 미커밋 구현 상태였으며 fallback 배경URL 제거는 캡처 후 수정이다. 최종 exact-revision 영상 자료로 혼동하지 않는다.

로컬 원본은 `output/playwright/couple-space-stage2/`에 있고 Git 제외다.

- `hero-1440-ko.png`, `hero-1440-es.png`: 원본커플+풍선군집+현재우주+실제개인문구/버튼.
- `hero-390-ko.png`, `hero-390-es.png`: 모바일같은scene/군집배치/개인문구.
- `scroll-360.png`, `scroll-720.png`: 중간camera이동/같은면전환/기존8게임카드.
- `letter-1440-es.png`, `letter-390-es.png`: 실제열린편지/서명. mobilebody는내부scroll.
- `inspection.json`:6상태의camera/entry/phase/48instance투영/depth/materialdataset와console/pageerror0.

첫 번째 중간 캡처 `couple-space-stage1/`도 보존한다. 그 화면에서 canvas가hero문구를덮던stacking결함을직접확인해수정했고, 편지header·장미·3D봉투가본문을덮던배치를조정했다. stage1을현재합격본으로사용하지않는다.

## 검증과 보존

새 순수 모션/geometry 테스트4개와TypeScript/Vite/Edge build가통과했다. 테스트는빠른편지반전의연속성, spring복귀/큰dt유한성, mobile깊이분포, 실제petal두께/동일papervertex펼침을다룬다. 처음배치테스트는후경풍선까지좌군집으로분류하는테스트오류였고depth를구분해바로잡았다. 전체게임테스트/실제운영Realtime검사를이번에실행했다고주장하지않는다.

사용자 요청에 따라 모델을 명시적으로 `gpt-6-luna`로 지정한 두 작업을 사용했다. 하나는 편지 DOM/CSS, 다른 하나는 read-only 보존 검사다. Luna는 실제 화면의 최종 디자인 승인을 하지 않았다. root가 실제 PNG 픽셀을 열어 위 미달 항목을 식별했다.

Luna 보존 검사: 기준 ab81 대비 게임/코어/DB/승인자산·copy는그대로다. 승인37WebP=Marble33(7pawn/24city/2building)+개인4(2DaVinci joker/2Splendor noble). Sali/Suli도7pawn안에보존. cutout/승인배경그대로. App변경은의도한공유mobilelanding호출한곳이며desktop게임guard/feedbackroute는변경없다. main/push/배포/통째revert없음.

## 다음 구현 / 완료 금지 사유

1. 날카로운보조꽃잎/리본형상을장미·선물리본으로명확히읽히게교정. 현재형상은최종채택하지않는다.
2. 마지막스크롤면의얼굴가림을경로/인물깊이/카메라로해결하고게임전환의빈면위계를교정. 풍선개수·전체효과강도를삭감하지않는다.
3. 실제포인터/관성·물체접촉·진입·빠른역scroll·편지fold/reverse를연속frame에서명세수치와대조.
4. 우주의은하/성운식별성과multipledepth를실제화면/연속모션으로판정. 정적인texture만으로공간품질완료처리금지.
5. 모든명세구현/적합성대조후에기능QA와시각QA를분리하고동일조건비교영상. 아직최종영상은제작하지않았다.

미검수: 전체연속모션·실제포인터반응량/복귀시간·실기기GPU·물리FPS·전체게임회귀. **위 미달이 있어 전체 작업은 미완료다.**
