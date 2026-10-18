# Gate 1 R7 보호 파일 감사

R7 HEAD는 `491b16883d9ca1591065a22b23731f04587e5b38`입니다. `/workspace/gate1-evidence/protected-file-sha256.json`에 기록된 보호 파일 2,255개를 모두 확인했으며 SHA-256 불일치 0개, 누락 0개입니다. 변경 경로 중 보호 manifest와 겹치는 파일은 없습니다. `package.json`과 `package-lock.json` 모두 HEAD와 동일합니다.

현재 R7의 미커밋 변경 경계는 `scripts/build-folded-chamber.py`, `scripts/denoise-chamber-lightmaps.py`, `src/landing/cinematic/folded/chamber-asset.test.ts`, `src/landing/cinematic/folded/pose.test.ts`, `src/landing/cinematic/folded/pose.ts`, `src/landing/cinematic/folded/world.ts`입니다. 게임 규칙, 편지/언어 문구, API/라우트, 갤러리 등 보호 영역 변경은 발견되지 않았습니다.

별도 작업 트리도 확인했습니다. R6 `/workspace/yl-folded-playhouse-g1`은 HEAD `491b16883d9ca1591065a22b23731f04587e5b38`에서 clean이고, 원본 `/workspace/gitactions-main`은 HEAD `b37c10b5a93d44236a7d5ed5834b817531e8ea39`에서 clean입니다.

이 점검은 파일 해시와 Git 상태만 확인했으며, 제품 파일을 수정하거나 프로세스를 중단하지 않았습니다.
