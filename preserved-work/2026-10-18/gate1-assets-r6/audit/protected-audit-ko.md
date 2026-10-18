# 보호 범위 재감사

HEAD는 기준 `37583421daba9a0e127c208f9c6d41e488a76b5c`와 같습니다. 기준 manifest의 보호 파일 2,255개를 현재 작업 트리와 비교한 결과 SHA-256 불일치 0개, 누락 0개입니다. 보호 범위와 겹치는 미커밋 변경도 없습니다. `package.json`과 `package-lock.json`은 기준 HEAD와 동일합니다. 게임/코어, API·라우트, 번역 문구, 갤러리, 편지 관련 보호 소스도 모두 기준 HEAD에서 변경되지 않았습니다.

현재 미커밋 소스는 `src/landing/AcrossHero.tsx`, `src/landing/cinematic/folded/pose.ts`, `src/landing/cinematic/folded/world.ts`, `src/landing/cinematic/folded/chamber-asset.test.ts`, `scripts/build-folded-chamber.py`, `scripts/denoise-chamber-lightmaps.py`입니다. `public/models/folded-chamber-v6/`는 생성 중 바이너리 자산이라 열거나 검사하지 않았습니다.

`node scripts/verify-across-hero.mjs`는 새 renderer의 승인 증거로 부적합합니다. 이 스크립트는 이전 `.across-title-line` 및 `.across-canvas` 데이터 계약을 단언하고, 이전 스크롤 카메라 진행·역방향 타임라인을 검사합니다. 또한 포인터 반응과 여러 상호작용을 실행하고 뷰포트별 브라우저 영상을 기록합니다. 새 folded chamber의 정적 프레이밍을 그 계약으로 판단할 수 없고, 영상 생성은 이번 승인 확인에 필요하지 않습니다.

부모 검토 전 main은 새 renderer만 대상으로 정적 화면을 초기·중간 펼침·최종 위치에서 캡처하면 됩니다. 데스크톱과 모바일 화면을 포함하고, 준비 상태 및 콘솔/페이지 오류·실패한 요청을 함께 확인하면 새 구도의 프레이밍과 자산 로딩을 점검할 수 있습니다. 브라우저와 빌드는 이 감사에서 실행하지 않았습니다.
