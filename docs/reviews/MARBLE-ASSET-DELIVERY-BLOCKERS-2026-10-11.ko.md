# 새 부루마블 자산 전달 기록

최신 상태: 승인 asset commit ccec83d의32개 원본을 실제 fetch/로컬 읽기/해시/pixels 확인했고, 최적화 WebP32개를 연결했다. 아래 두 차단 기록은 전달 성공 전 이력이다. 최종 인게임 품질 검수·새 개인 이미지 전달·후속 코드 push는 아직 별도 대기다. 생성 준비, Library 승인 버전, 공개 게시 승인, 소비자 다운로드 성공은 서로 다른 상태다.

1. **지원되는 Library 전달 실패**: 이 실행기에 ID가 전달된25개는 prepare resolve 성공. 공식 helper 다운로드와 별도 소비자 로컬 목적지 한 번 재시도 모두 `library file transfer failed: download failed`, bytes0. 더 반복하지 않는다. 파일별 ID/버전/선언크기는 `assets/library-materialization-status-2026-10-11.json`이며 선언크기를 실제 로컬 bytes로 세지 않는다.
2. **대체 공개 전달 SHA 대기**: 부모가 보고한32개 PNG blob에는24도시·공통 건물2·게임말6 준비물이 있다. 그러나 공개 게시 자동 검토는 정확한 사용자 증거 재전달 한 번 뒤에도 거절됐다. 사유는 공개 repo/비공개 의도/리스연 개인 인형 자산이다. 거절 후 부모가 공개 저장소와 인물 사진·귀족·커플초상 제외를 명시해 질문했고, 사용자가 건물·게임말32개 공개 업로드를 승인했다. 부모 자산 담당이 같은 pending tree를 재개 중이며 완료 SHA를 기다린다. 이 게임 후속 코드 push 승인은 별개로 대기다. 소비자 실행기는 이 공개 경로를 성공했다고 보고하지 않는다.

부모 보고상 `assets/premium-marble-20261011`은 원래 `4ac2808`에 머물고 자산 tree/commit은 없다. 현재 checkout에서 이 브랜치의 새 자산을 fetch했거나32개 원본을 받았다고 주장하지 않는다. blob 직접 다운로드, 다른 공개 브랜치·repo·업로드 도구를 통한 우회는 하지 않는다. 부모가 전달할 확정된 정확한 브랜치명/commit SHA/파일목록을 기준으로 필요한 비개인 파일만 가져온다.

실제 인물 사진, 새 조커 캐리커처, 의사/한복 귀족은 이 공개 전달에 포함하지 않는다. `PRIVATE-GAME-ART.ko.md`의 조커 런타임 주입 구조는 준비돼 있으나 실제 파일과 비공개 전달 경로는 대기다. 스플렌더는 승인된 원본2장만 허용하며 다른 그림으로 대체하지 않는다.

코드 준비 상태: route3 이미지 resolver,24도시 slug/랜드마크·공통 단계·pawn 저장ID mapping, null 경로의 준비 중 표시, contain·밑면·상단 여백·큰 상세, 상대 조커 숨김은 준비돼 있다. 아직 raster의 색/alpha bounds·비율·광원·실제 크기·품질을 검증하지 못했다. 공통1/2단계 도시별 색변형의 실제 이미지 처리는 원본 pixels를 확보한 뒤 확인해야 한다. placeholder/fallback을 최종 자산 완료로 표시하지 않는다.

환경 연결/로컬 코드 커밋/복원 bundle은 정상이다. 공개 push·인게임 반복 검수는 보류하며, 최종 전체 통합본 QA는 Luna 분리 두 세션으로 진행한다. 전체 게임 완료 판정은 없다.

최신 승인 적용: 공개32자산 게시 승인만 해결됐다. 전달 commit/SHA·실제 bytes는 아직 미완료이므로 위 Library 실패 기록·미적용 상태를 성공으로 바꾸지 않는다.

전달 완료 근거: `assets/marble-raster-verification-ccec83d.json`. 원본32개 총52,604,560bytes와 각각 SHA256/Gitblob/bytes 일치. Lossless WebP는 max512도시/건물,max384말,비율과전체alpha캔버스 보존이며 resizedRGBA와 decodebytes 일치. 출력총6,390,196bytes. 실제 원본은 output 추출본과 ccec83d 원격 원본으로 보존. 원본 PNG 그림/palette는 바꾸지 않았다. 공통 건물은 renderer가 따뜻한 지붕/중립 벽체 영역을 도시 palette로 multiply해 shape/lighting을 유지한다. 이 tint와 전체 화면은 아직 final in-game 검수하지 않았다.
