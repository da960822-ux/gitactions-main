# 데스크톱 요구사항별 대조표

이 문서는 기능 수정·파일 준비·실제 적용·화면 검수·최종 2인 검수를 분리한다. **전체 요청 완료 판정은 아직 없음.** 근거는 현재 checkout의 코드/계획과 부모가 전달한 사용자 지시다. Personal Context 조회는 `Personal context is unavailable for this conversation`으로 실패했다. 부모 대화의 초기 사진 피드백 원문 전체를 직접 열람했다고 주장하지 않는다. 추가 전체 체크리스트 도착 뒤 누락 대조를 계속해야 한다.

소스: baseline `b37c10b`, 후속 `8c90594`, `27d802e`, 랙돌 표시명 `53cf8be`. 최신 원래 통합 커밋 `f0c6d01`, `5f7e75d`, `1c20ea3`은 이 실행기에 없다. 아래 **기존 코드 있음**은 baseline에서 관찰했다는 뜻이며 이번 새 구현이나 통합 최신본 보존 완료를 의미하지 않는다. 모든 최종 2인 검수는 전체 반영된 통합본에서 다시 수행한다. 현재 Luna 결과는 개발 중 회귀 확인이다.

| 요구사항 | 실제 파일/현재 변경 | 상태와 미완료 사유 |
| --- | --- | --- |
| 공통 사용자별 한국어/스페인어, 합법 행동·중복 요청·재접속·재경기 | 기존 `PlayApp.tsx`, `core/client.ts`, `core/authority.ts`; 이번 도움말은 `beginner-guides.ts`와 아래 각 Guide, 27d802e | 기존 코드 보존. Luna 두 별도 contexts로 현 checkout의 대표 행동/재조회/controlled 종료 재경기 확인. 최신 단일 주제 Catchmind와 운영 Realtime 보존은 미확인. |
| 공통 입력/전송/확정 피드백과 무음 기본 효과음·감소 모션 | 기존 `GameFeedback.tsx`, `audio/audio.ts` 및 각 motion 컴포넌트 | 새 시스템/의존성/BGM 추가 없음. 물리 청취·키보드/스크린리더 전수·실기기 성능/전후 비교 미실행. |
| 일곱 게임 초보자 목표→화면→첫 클릭→예외→종료 설명, 다시 열기 | `DominoQuickGuide.tsx`, `JaipurQuickGuide.tsx`, `SplendorQuickGuide.tsx`, `MinhwatuGuide.tsx`, `beginner-guides.ts`, `games/rules.ts`, 27d802e | 현 규칙의 실제 첫 확인 버튼 KO/ES 보완. 최신 Catchmind 소스 없어 새 단일 주제 설명 미변경. 전체 희귀 이벤트/설정/오류 번역 전수 완료 아님. |
| 도미노 원본28타일, 실제 끝/방향 미리보기·선택/취소/확정·팀/AI/막힘/누적 | 기존 `DominoBoard.tsx`, `DominoTile.tsx`, `DominoEventStage.tsx`, 관련 게임/스타일 | 기존 구현 보존. 선택 후 중앙 시작 X\|Y 확정 설명 27d802e. 새 드래그는 미구현(기존 선택형 계획 후보); 클릭/키보드 방식 유지. 최종 통합 재검수 대기. |
| 도미노 체인/양끝·최신 수 접근, 공개 이동/착지/정산 | 기존 `DominoBoard.tsx`, `DominoEventStage.tsx`, `styles/domino-premium.css` | 가로 스크롤+양끝 방식 유지. 현재 두 context 첫 행동/턴/reload/controlled 재경기 확인; 자연 종료/전체 설정은 이번 실행 미실행. |
| 자이푸르 시장5·손패7·상품 공급/토큰, 선택 판매·교환·취소·비공개 보너스 | 기존 `JaipurBoard.tsx`, `JaipurMotion.tsx`, `JaipurArt.tsx`, `games/jaipur.ts` | 기존 상품 그룹+수량의 앞 N stable ID 방식 유지. 낙타 첫 버튼/라운드 종료/2승 설명 27d802e. 개별 카드 묶음 토글은 기존 계획과 대체 구현의 차이로 기록, 새 규칙 추가 없음. |
| **초기 f0c6d01: 자이푸르 금/은/향신료 시각 구분** | 현재 `JaipurArt.tsx`, `styles/jaipur-art.css`, 기존 atlas 경로 | f0 원본 diff 미확보. 현 자산은 기존 상품 계열, 새 통합에서 개선 자산/스타일이 유지됐다는 검증 불가. 임의 그림 대체 없음. |
| 스플렌더 시장3×4·90카드/10귀족 ID, 비용/할인/금/부족, 반환·예약3·15점 동수 턴 | 기존 `TableGames.tsx`, `SplendorGem.tsx`, `SplendorMotion.tsx`, `styles/splendor-premium.css`, 카드 map | 기존 코드/규칙/비공개 예약 보호. 보석3색→확정/카드 구매·예약/금/동점 안내 27d802e. 기존 테스트와 이번 대표 행동으로 시각 전체 합격을 대신하지 않음. |
| **초기 f0c6d01: 스플렌더 중복 snapshot 효과 취소·썸네일 CSS 충돌·비용 가독성** | 현재 `SplendorMotion.tsx`, `styles/splendor-premium.css`, `styles/app.css` | f0 원본 diff 미확보. effect key dedupe와 scoped 비용 스타일의 기존 코드 존재만 확인. 최신 수정 보존·중복 snapshot 실제 비행 지속/최종 축소 화면 확인 필요. |
| 스플렌더 승인 의사가운/한복 귀족 두 그림만 교체 | 원본 Library libfile_e0b409da6f188191833c6b6fea49fe83 / libfile_11a21ea77bf481918844b881f860b455 | 공식 materialization+재시도 실패, bytes0·픽셀 미확인·미적용. **공개 업로드 승인도 별도 미해결 차단 항목.** 다른 이미지 생성 금지, 비용/점수/규칙 불변. |
| 민화투 원본48 얼굴/달 매칭/획득 분류/점수·고도리/종료/비공개 패 | 기존 `HwatuCard.tsx`, `HwatuMotion.tsx`, `MinhwatuTable.tsx`, `games/minhwatu.ts`, `images/hwatu/source-verification.json` | 원본 해시/48장 mapping 회귀 통과. 실제 월 버튼·두 후보 선택 안내 27d802e. 초기에 승인한 original48와 획득 연출의 최신 통합 diff 대조는 f0 미확보로 보류. 새 아트나 Go/Stop 규칙 없음. |
| 민화투 실제 card→deck reveal→capture·공개 조합/점수/음향 | 기존 `HwatuMotion.tsx`, `useMinhwatuPresentation.ts`, 음향 | 기존 소스 유지. 두 context 첫 행동/reload/controlled 재경기 확인. 최종 통합 자연승리 경기/실제 음향은 아직 미실행. |
| 다빈치 추론 화면 배치·선택/공개/준비·포커스/확인/취소 | 기존 `DaVinciTable.tsx`, `DaVinciMatchSummary.tsx`, 해당 스타일 | 기존 코드 유지. 실제 준비 버튼·조커 + 빈칸·뽑기→대상→숫자→확정 안내 27d802e. 두 context 준비/추측/숨김/reload/controlled 재경기 확인은 개발 회귀. 개인 후보 메모는 초기 문서의 후보이며 미구현/안정 ID 설계 미완료. |
| 다빈치 새 사진 두 장 각각 캐리커처, 비공개 주입 | `DaVinciTable.tsx`, `private-game-art.ts`, 후속 변경 | 최신 지시로 기존 커플 crop은 최종 사용 안 함. 기본 조커는 규칙 기호 －. 외부 private host 런타임 config/컴포넌트 prop으로 각각 주입; 공개 repo에 새 개인 원본/완성본/URL 저장 안 함. 부모 사진 확보·생성 대기. 상대 숨긴 카드에는 주입 이미지 DOM/경로도 렌더 안 함. |
| 캐치마인드 입력·logical strokes/queue·undo/fill·IME·HUD/도구 | 기존 `CatchmindTable.tsx`, `PlayApp.tsx`, `games/catchmind.ts` | 정수 좌표·큐/조각·IME 차단 기존 소스 존재. 최신 완료본 source 미확보. 물리 IME/운영 지연은 미실행. |
| **초기 f0c6d01: 빈 캔버스 42% 초과 채우기/무안내 실패 처리** | 현재 `CatchmindTable.tsx` bucketFill은 여전히 `.42`에서 false, fill 입력은 서버 동작으로 전송 | 이 실행기에서는 이전 코드가 남아 있음. 부모의 f0 개선본과 최신 단일 주제 소스를 받기 전 보존 완료 판정 금지. 현재 checkout 문제를 통합 환경의 미반영으로 단정하지 않음. |
| 캐치마인드 승인 단일 주제·동시 정답·타이머·타임오버·재시작 | 부모 보유 5f7e75d / 이 실행기 현재 여러 라운드 소스 | 소스·통합 diff 차단. 새 기능을 구버전 위에 임의 재구현하거나 새 도움말로 덮어쓰지 않음. |
| 부루마블 읽히는 40칸/24도시·도시/가격/임대/단계·큰 상세/예상 잔액 | `MarbleBoard.tsx`, `styles/marble-premium.css`, 27d802e | 데스크톱 높이 실측 대응, 네 해상도 KO/ES 보드 전부 화면 안/이름 잘림0/주행동 겹침0 개발 회귀. 132px 미리보기, 720 높이 대출은 스크롤. 새 이미지 적용 후 픽셀 재검수 필요. |
| 부루마블 고품질 공통 단독주택/아파트/24개 실제 랜드마크·크기/밑면/색 | `MarblePropertyArt.tsx`, `dioramas/manifest.json`, 27d802e | 새 이미지 path 전부 null, 준비 중. 54/73/100 CSS 연결 준비. 실제 alpha bounds·도시별 색변형·일관된 재질·식별성 미검증. 사용자 반려 SVG/최초 아파트는 최종 그림 아님. |
| 부루마블 exact6 도시 변경, 고정 서사/경제·saved40/legacy18 보존 | `games/marble.ts`, 생성 Edge, 27d802e | fresh route3: Berlin11/Miami13/Istanbul21/Agra32/Athens33/Sydney36. 고정1→3→15→31→38. 칸별 이름 외 view/economy 같음 회귀. 이전 route2/원래40/legacy18 보존. |
| 광주 본관/산토 Diego/뉴어크 성당/도쿄 Kaminarimon/Miami Beach 정확성 | `dioramas/manifest.json`, `MarbleBoard.tsx`, 27d802e | 명칭/노트 연결, 실제 raster 미적용. 이전 후보는 폐기. 실제 항공 노선 주장 없음, Asiana/JetBlue 상상 여행만 유지. |
| **초기 f0c6d01: Marble fallback 경로 계산·주사위→이동→도착 순서** | 현재 `marble-motion.ts`, `MarbleBoard.tsx` | f0 diff 미확보. 현 fallback/58ms 이동은 이전 코드로 관찰, 최신 개선 보존을 판정할 수 없음. 최신 Luna 개발 진단에서 [4,1]→5칸/도착5·양쪽 snapshot 일치 확인. 최종 통합 순서 재검수 필요. |
| 부루마블 6종 말·기존 저장 ID·선택/중복 선택·이동/턴 | `MarblePawn.tsx`, `pawns/manifest.json`, `games/marble.ts`, 8c90594/27d802e/53cf8be 및 후속 명칭 | ID fox/cat/penguin/astronaut/robot/dragon 유지. 새6종은 말티푸/랙돌/판다/우주인/리스연/친칠라. 기존 SVG 기능용 backupfallback, 시각 품질 반려. 새 단일 투명 이미지 경로 null. 걷기·몸회전·sprite/3D 범위 없음. |
| 말티푸·친칠라/주택·수정 아파트 Library 실제 bytes | 원본 Library libfile_7263ed8d8b708191a8fde159d1dec058 / libfile_fd8b5109fbb08191b783c1ec91451fde / libfile_5d468ddb88608191a7bf980985a82642 / libfile_84b3a1d523fc8191aa56d3e24ebdcb7c | 파일명 resolve 성공. 소비자 로컬 original 목적지와 별도 retry 목적지 모두 공식 `download failed`; 네 파일 각각 초기+한 번 재시도 실패, 총 bytes0. 픽셀 검수/실제 적용 불가. 아파트 record명 stage-2-apartment-ordinary-v2.png, 버전 pin의 실제 bytes 미확보. |
| 우주인 로즈골드/불투명 검정 바이저·리스연 연분홍 토끼 인형 | `pawns/manifest.json` 연결 예정; 우주인 Library libfile_10a0511c400481919b6dc6d878d0b285 승인 버전1 | 이전 민트/얼굴 버전 최종 적용 금지. 사용자 인물/배경 제외한 인형만 새 아트. 현재 최신 우주인 승인 버전1 및 리스연 파일 레코드는 전달됐지만 로컬 download실패·미적용·미검수. 일반 robot SVG를 리스연 최종 그림으로 승인하지 않음. |
| 말 동일 칸/코너/건물·가격 가림·칸별 이동/도착·KO/ES 선택 | Luna `/root/luna_playqa`, `marble-roll-diagnose.json`, 추가 pawn QA | 독립 두 contexts actual roll POST200, [4,1], tile02→06 5칸, 0→5/version일치 확인. 이전 hook/fixture setup 실패는 QA 오류로 분리. 같은 칸의 두 말/랜드마크/도시명 겹침 관찰 후 간격과 보드 안쪽 별도 말 공간 CSS를 추가했으나 사용자 지시로 재검수는 최종 통합 뒤로 보류. |
| push/작업 분리/원본 보존 | isolated `/workspace/gitactions-games`, Git commits·bundle/patch | 최신 커밋은 로컬만. 정상 작업 branch push가 자동 검토 2회 거절(이 세션 최초 금지/이전 승인 전달 불인정). 동일 목적지 본인소유/admin확인은 성공. 현재 명시 승인 질문 대기. main·force·PR·배포 없음. |

최종 통합본 확인 전에 과거 문서의 312/346/373/433/440 테스트 수, 과거 사진 합격, 현재444 회귀 수를 전체 게임 고도화 완료나 새 자산 승인으로 합산하지 않는다. 이 실행기 full regression은27d802e까지49파일444,53cf8be 이름 변경 뒤 관련52와 빌드 통과다. 인계 시 통합된 최신 소스로 생성 Edge를 다시 빌드하며 이 실행기의 전체 generated 파일로 부모 최신 Catchmind를 덮어쓰지 않는다.

현재 latest 변경: robot→리스연/Lisyeon(저장ID 유지), 새 자산4개 실패 기록, 말 간격3px·음각 좌석번호·도시 그림/문자 밖 안쪽 말 공간. 이 추가 구현의 화면/최종2인 검수는 아직 미실행.

추가 materialization9: 랙돌/판다/우주인v1/리스연/베를린/광주/산토도밍고/뉴어크/마이애미v1은 prepare 성공, 파일명·Library 버전 확인. 각 공식 다운로드와 소비자 로컬 목적지 한 번 재시도 모두 `library file transfer failed: download failed`. 그 시점 앞선4와 합쳐 **13개 모두 로컬 bytes0·픽셀 미검수·미적용**. 생성자가 준비한 파일/승인과 소비자 실제 적용을 구분한다. 당시 남은19도시 제작 대기였으며, 아래 추가12 전달로 마지막7도시 대기로 갱신됐다.

추가 도시12: 뉴욕/서울/파리/도쿄/바르셀로나/시드니/이스탄불/아그라/아테네/런던/로마/토론토는 Library prepare 성공(모두 버전0), 공식 helper 초기+로컬 retry 모두 download failed. 합계25개 로컬 bytes0, 실제 픽셀/최적화/적용 불가. 공개 안전 메타데이터 `assets/library-materialization-status-2026-10-11.json`에 기록. 마지막7개 도시는 제작 중. CN타워는 contain과 상단 여백 유지, 가로 확대 왜곡 금지.

최신 빌드: 비공개 joker 주입 색상 인덱스 타입 오류1건 수정 후 TypeScript/Vite/Edge 모두 통과. 관련18 회귀 통과. 이 결과는 브라우저 화면/최종 멀티플레이 검수와 별개다. 원본 worktree git status clean 재확인.

후속 소스 대조: `SEVEN-GAME-GUIDE-SOURCE-AUDIT-2026-10-11.ko.md`에 7게임의 실제 버튼/선택후확정/승리 조건을 대조했다. 다빈치 두 단계 확정, Domino/Splendor/Minhwatu 취소 안내, Jaipur 실제 확정명·덱 종료·3라운드 동점, legacy Marble ES 버튼명 보완. 30번 세계여행 아시아나/젯블루 상상 여행 연출의 KO 이름을 지역화했다. 엔진 경제/규칙 변경 없음. `CATCHMIND-INTEGRATION-DELTA-2026-10-11.ko.md`에 f0/5f 최신 소스 보존 경계 기록. PlayApp26 통과, MinhwatuGuide 처음 문구검사1 실패 후 source 표현 복원해3 통과. 최신 TypeScript/Vite/Edge build 통과. 인게임·전체 최신 통합 QA는 여전히 미실행.
