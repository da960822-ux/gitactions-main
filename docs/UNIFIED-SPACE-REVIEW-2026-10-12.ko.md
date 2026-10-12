# 통합 우주 히어로 — 시각 검수용 로컬 변경

이 문서는 기존 WIP `137b539e044dd50f2b151582f168837c01ded6f2` 이후의 **랜딩 수정만** 다룬다. 부모/사용자의 영상 시각 승인을 기다리는 검수본이다. 이번 변경은 원격 push·main merge·배포 없이 로컬에 보존한다. 원격 마지막 확인본은 `12b03ca087075cdb8107d43e71baa8c241f3289f`이며 최신 게임 `6a4d21f046843abc10d07ad3819845d51fea3a6c`는 이번 랜딩에 통합하지 않았다.

## 화면의 중심과 실제 구현

원래 커플 WebP, 로즈골드/분홍/펄 3종 하트, 어두운 로즈/라일락 배경과 로즈골드 곡선을 유지한다. 사진은 같은 고해상도 원본 DOM 이미지이며 새 얼굴이나 인물 뒷면을 생성하지 않았다. 원본 SHA256은 `72a0010ae5960d33e62b4678715bfd1df71e3d8f743248c69eeb4c5c1c55b318`이다. 기존 편지의 본문·서명·목소리를 보존하고, 이미 보이던 서명을 새 수정으로 주장하지 않는다.

한 Three scene/camera에서 실제 하트 지오메트리가 회전하고, 고정 key light `[-4,6,8]`·rim `[5,2,-3]`·기존 재질/환경 반사가 하이라이트를 바꾼다. 기본 소프트웨어 GPU에서도 실제 mesh를 쓴다. 원본 사진과 제목은 같은 카메라에서 각각 투영한다. 첫 440px의 연속 스크롤 동안 카메라는 앞으로, 사진은 뒤/왼쪽으로, 제목은 앞으로/위쪽으로 이동한다. 원본 사진의 알파 깊이 마스크와 추가 얼굴/전화기/손/몸통 보호가 물체의 가림을 결정한다. 인물은 평면 사진이며 입체 얼굴 mesh가 아니다.

별은 기존 16개, 주 하트는 기존 3개다. 별의 깊이와 포인터 반발·복귀 속도가 다르며 하트의 세 축과 회전 속도가 독립적이다. 기존 일시정지/축소 모션/화면 밖 정지/context-loss PNG 복구를 유지한다. 렌더러가 꺼진 전시에서 소프트웨어 GPU는 기존 승인 PNG를 사용해 8개 전시 모델을 동시에 렌더링하지 않는다. 새 게임이나 동영상 패널을 추가하지 않았다.

## 지적된 네 결함과 적용 범위

| 우선 | 기존 WIP 결함 | 현재 변경과 확인 | 파일 |
|---|---|---|---|
| P0 | 궤도가 “이제 같이 놀자.”를 통과 | 실제 글자 Range/버튼/캡션을 화면 좌표로 읽어 물체 shader fragment를 보호한다. 아래 곡선을 화면 바깥으로 재배치한다. 실제 GL program의 보호 uniform이 컴파일된 것을 확인했다. | `src/preview/UnifiedHeroScene.tsx` |
| P0 | 440px에서 갈색 하트가 전화기/손/몸통을 덮고 펄이 과도하게 큼 | 세 하트를 사진 전체 바깥 좌우로 배치한다. 실제 회전 mesh의 투영 AABB를 두 번 보정해 최대112px/사진폭20.5%를 적용한다. 원본 알파·전경 깊이 마스크와 실제 framebuffer 투명 픽셀로 얼굴/전화기/손/몸통을 확인했다. | `src/preview/UnifiedHeroScene.tsx`, `src/preview/spaceSafety.ts` |
| P1 | 남성 머리 바로 옆 선과 y817 하단의 일직선 잘림 | 머리 주변18px 추가 보호, 상단 곡선 위치 조정, 화면 아래로 빠지는 곡선 경로와 하단 알파 fade를 적용했다. 이 보호는 선의 일부를 가리므로 영상에서 끊긴 선으로 느껴지는지 부모 시각 판단이 필요하다. | `src/preview/UnifiedHeroScene.tsx`, `src/preview/preview.css` |
| P1 | 회전된 성운 PNG의 사선/직사각형 마스크 경계 | 한 번 생성하는128×128의 부드러운 다중 스케일 cloud alpha로 교체했다. Gaussian 분포와 네 가장자리 fade를 사용하고 기존 사선 마스크 PNG는 통합 scene에서 제거한다. 실제0/440px 캡처에서 내부 사각형 경계가 사라진 것을 직접 확인했다. | `src/preview/UnifiedHeroScene.tsx` |

커플 사진 아래의 기존 검은 직사각형 덮개도 통합 scene에서만 제거하고 원본 이미지 하단25%를 부드럽게 알파 fade한다. 제목/사진의 scale은 균일하다. 원본 글자 자체를 휘지 않는다. CTA는 스크롤 중 유지한다. 작은 화면의 기존 Landing 경계는 유지한다.

## 실제 픽셀과 재현 자료

새 화면과 영상은 저장소에 있던 참고 스크린샷이 아니라 **현재 production build를 로컬 Chromium에서 실제 렌더링한 캡처**다. 원본 WIP 비교도 exact `137b539`의 분리된 worktree를 다시 production build해 녹화한다. 주소는 수정본5233, WIP5241이며 외부 배포가 아니다.

개인 사진이 포함된 원본 PNG/영상/원시 frame 기록은 공개 Git에 넣지 않는다. 로컬 기준 폴더는 `/workspace/home-integration-deliverables-20261011/unified-space-20261011/`이다.

- `verified/space-1440-0.png`, `space-1440-440.png`, `space-1440-680.png`: 첫 화면, 전화기/손 보호가 필요한 중간 스크롤, 다음 영역 연결. 1280×800도 동일 세 상태가 있다.
- `verified/letter-{1440,1280}-{KO,ES}.png`: 실제 열린 기존 편지 전체와 서명. 서명의 최종 위치를 바꾸지 않았다.
- `verified/context-loss-{1440,1280}.png`, `reduced.png`, `no-webgl.png`: 기존 원본 PNG 복구와 정적인 전체 화면.
- `verified/unified-space-qa.json`: 4그룹 PASS, actual projected AABB/카메라/보호 rect/픽셀 결과, page/console errors0.
- `video/before-wip-actual.mp4`, `after-fixes-actual.mp4`: 동일1440×900/DPR1/24초 좌표·스크롤 protocol. 캡처 간격을 유지하며 CFR30에서는 멈춘 프레임을 반복한다. 프레임 보간·가속·중간 간격 삭제가 없다. 첫/포인터/440/680px 대표 프레임과 전달된 실제 입력 시간도 저장한다.
- `video/cadence-abba.json`: 녹화 없이 분리한 동일 환경 ABBA 렌더 제출/rAF 측정. 녹화 중 frame 수와 성능 측정은 다른 자료다.

재현 명령은 `scripts/verify-unified-space.mjs`, `scripts/record-space-comparison.mjs`, `scripts/measure-space-cadence.mjs`다. `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_EXECUTABLE_PATH`로 설치된 Playwright/Chromium을 지정하고 `HOME_QA_OUTPUT`/`HOME_VIDEO_OUTPUT`에 비공개 로컬 출력 폴더를 지정한다. 영상 스크립트의 이전 WIP 서버5241은 별도로 exact revision을 build/serve해야 한다. 주입 포인터는 실제 페이지 handler에 전달되는 동일 좌표 입력이며 새 화면 모션을 영상에 합성한 것이 아니다.

## 검증과 남은 판단

현재 TypeScript/Vite/generated Edge build 통과. 새 사진 밖 배치 helper 테스트2개와 landing 실제 UI4그룹이 통과했다. 1440×900/1280×800의 연속0/110/220/330/440/560/680px, 고정 광원, 크기 상한, 사진 밖 하트, 실제 GL shader 보호, live framebuffer의 원본 얼굴/전화기/손/몸통 투명 영역, 포인터 반발/복귀, 정지, KO/ES 편지, 기존8선택, context loss, reduced motion/no-WebGL 복구를 확인했다. 이전 전체 게임471테스트를 이번 작업에서 다시 실행했다고 주장하지 않는다.

실제 장비 GPU 표시 FPS, 모바일의 신규3D 통합 scene, 최신 게임 통합/운영 Auth/Realtime는 이번 검증 범위 밖이다. 헤드리스 Chromium은 SwiftShader다. 상용 수준 부드러움이나 최종 사용자 시각 승인으로 해석하지 않는다. 보호 마스크로 궤도의 일부가 사라지는 표현과 사진의 평면 깊이 표현은 최종 영상에서 확인해야 한다. 별/하트의 수·크기를 늘리는 추가 기능은 하지 않았다.

동일 Chromium에서 녹화 없이 실행한 ABBA의 실제 `renderer.render` 제출은 WIP13.23/14.33회/초, 수정본13.03/12.89회/초였다. 평균13.78→12.96회/초로 약5.92% 감소했다. 같은 시점의 unique rAF cadence도 같다. 두 페이지 모두 software pixel ratio.9, 실제 canvas1296×734로 해상도도 같다. 실제 shader/투영/원본 DOM 배치가 포함된 소프트웨어 환경의 한계이며 물리 GPU 표시 FPS가 아니다. 이전의22/30회/초 PNG 모드 측정과 직접 비교하지 않는다.

두 최종MP4는각24.10초/1440×900/H.264/CFR30이며, 실제캡처는WIP277프레임/수정본311프레임이다. initial/pointer/scroll440/scroll680원시프레임과first/440/680 QA PNG를검사했다. 영상을전체재생해최종시각승인을한것은아니다. 같은벽시계입력경로이나페이지초기화와자유회전위상까지동일시드로맞춘것은아니다.

소유자전용Drive업로드를1회시도했으나자동승인검토가‘신뢰된사용자요청은피드백만이며외부영상저장이승인되지않음’으로거절했다. 파일은로컬에보존한다. 다른경로나권한변경으로우회하지않았다. 외부전달은명시적승인확인이필요하다.
