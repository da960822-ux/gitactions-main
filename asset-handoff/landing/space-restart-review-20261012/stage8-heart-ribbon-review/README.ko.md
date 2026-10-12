# 히어로 리본 제거와 하트 소재 확인

부모 검토용 1차 정지 화면입니다. 연속 영상은 재녹화하지 않았습니다. 하트 재질을 확인한 뒤 진행하도록 요청된 단계입니다.

## 실제 렌더 전후

- [수정 전 1440×900](hero-before-1440x900.png)은 기준 소스 `32d0a3d52c2304602d143e2897cfbcb6ab93a2af`로 캡처했습니다.
- [수정 후 1440×900](hero-after-1440x900.png)은 리뷰 브랜치의 코드 커밋 `d72f11df266bdd62f8f7c7c5452b5259c9095490`에서 캡처했습니다.
- [전체 화면 전후 비교](hero-before-after-1440x900.png)는 위 두 원본의 나란한 배치이며, [하트 소재 확대 비교](heart-material-before-after.png)와 [수정 후 하트 확대](heart-material-after-closeup.png)는 같은 원본 픽셀에서 자른 참고 이미지입니다.

두 화면 모두 Chromium 154, 1440×900, DPR 1, `prefers-reduced-motion: reduce`에서 웹 앱을 실제 렌더한 화면입니다. 같은 소프트웨어 WebGL 환경을 사용했고 입장 상태가 완료된 뒤 촬영했습니다. 원본 캡처 상태는 `before-state.json`과 `after-state.json`에 담았습니다. 두 상태에서 화면·카메라·48개 하트의 좌표, 크기, 깊이가 일치합니다.

## 적용한 변경

- 선물 리본의 고리·매듭·꼬리, 스크롤 변형, 천 색/범프 텍스처 생성 코드를 히어로에서 제거했습니다. 게임 카드의 패널과 게임별 카드 아트는 건드리지 않았습니다.
- 48개 하트와 배치·깊이·포인터 반응은 유지했습니다. 법선 검수에서 현재 메시의 모든 정점 법선이 단위 길이이고 앞/뒤 경계가 매끈하게 이어져, 메시를 다시 만들지 않았습니다.
- 로즈골드 재질은 `metalness .80 → .24`, `roughness .28 → .40`, `clearcoat .65 → .16`, `envMapIntensity 1.30 → .72`로 조정했습니다. 핑크와 펄에도 더 넓고 약한 반사를 주었고, 펄의 강한 iridescence를 낮췄습니다. 환경맵 blur는 `.06 → .12`로 높여 반사 패널이 만드는 날카로운 띠를 부드럽게 했습니다.
- 새 이미지 생성이나 유료 자산은 사용하지 않았습니다.

## 확인과 한계

- `npm test`: 58개 테스트 파일, 513개 테스트 통과.
- `npm run build:landing-preview`: 통과. Vite의 기존 500KB 청크 경고는 계속 표시됩니다.
- 실제 포인터 스모크: 진단 레코드 48개, 하트 32 이동 오프셋 `[121.1, 46.8]`, 손을 놓은 뒤 거의 0으로 복귀, 브라우저 오류 0.
- 같은 10초 프로파일 표본에서 24개 렌더 프레임(2.40fps), rAF 중앙값 416.6ms/P95 483.3ms를 관측했습니다. 이 컨테이너는 `/dev/dri`가 없어 SwiftShader를 쓰고 CPU quota throttling도 발생했습니다. 이 수치는 실제 GPU 성능이나 의미 있는 성능 향상을 보증하지 않습니다.
- 모바일 화면과 물리 GPU 장치에서는 아직 확인하지 않았습니다. 이번 전달은 정지 전후 이미지이며, 전체 연속 영상 재녹화도 하지 않았습니다.

코드 변경 파일:

- `src/preview/CoupleSpaceScene.tsx`
- `src/preview/heroMaterials.ts`
- `src/preview/spaceGeometry.ts`
- `src/preview/heartGeometry.test.ts`
- `src/preview/spaceMotion.ts`
- `src/preview/spaceMotion.test.ts`
