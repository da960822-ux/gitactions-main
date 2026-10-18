# 구현·자산·검증 상태 — 전체 완료 아님

초기 시각 리뷰 대상은875b7c9ae1dc97bdafce50a6939c7ef003b7a0b4다. 이번 파일은 그 뒤 승인된 구현의 통합 상태표다. 과거 테스트·타 환경 생성·로컬 픽셀·현재 원격 보존·최종 플레이는 서로 다른 증거다. 최신 후속 게임1feaca317은 현재 환경에 없고, 그 공개push 차단을 다른 경로로 대신하지 않는다.

| 요청 | 현재 통합 소스/보존 | 실제 확인과 남은 조건 |
| --- | --- | --- |
| 중앙 커플·고정 문구·승인 전시 유지 | `src/preview/LandingPreview.tsx`, `copy.ts` | 원본 WebP bytes 유지.1440/1280 실제 홈·KO/ES 편지 확인. 상용/실기기 최종 승인 별도 |
| Lusion 모션 구체화 | `heroMotion.ts`, `StudioScene.tsx`, `heroMaterials.ts`, `journeyMotion.ts`, `preview.css` | 독립 회전/고정광원/14px 반발/곡선 깊이/장미 앞뒤/기존 종이 윤곽.4검수그룹·실제영상. 원본 셰이더 재현 아님 |
| 실제 놀이 서사·Catchmind에 한정한 번역·여행·교제일 | `src/preview/copy.ts` | KO/ES 실제 픽셀.2025-04-04. 결혼 약속/가짜 기억 없음 |
| 상단 건의 링크·최신 톤 | `/feedback`, 최신1a288c215 통합 | 로컬SQL-backed45/45. 본문 대형섹션0. 운영migration/Auth/Realtime 별도 |
| 캐치마인드 큰 영역 채우기/동색 no-op/undo/실패 안내 | `CatchmindTable.tsx`, 기존 canvas helper/테스트 | 기존 구현 보존. 전체 픽셀 검사 단위 테스트 포함. 최종 새 게임 통합 뒤 UI 검수 |
| 단일 주제272단어·KO□/ES? 공백 | `src/games/catchmind.ts`, 테스트/사전 | 단일주제 보존·새 공백 회귀 통과. 정답/hand 상대 비공개. 최신 후속코드 수령 별도 |
| 공유 마감시각·늦은답·재접속·다시하기 | 기존 엔진/authority/Edge 소스 | 현재 단위 검증과 후속코드 최종 통합을 구분. 운영 두기기·Realtime·전체분기 미실행 |
| 다빈치 추리/차례마침·초기준비·숨김 | `DaVinciTable.tsx`, beginner-guides/rules | 기존 UI 보존·준비 버튼 KO/ES 도움말 일치. 숨긴 상대 조커는 이미지경로도0 |
| 서로 다른 실제 사진 기반 새 조커2장 | 색상별 비공개 로컬 주입 코드·`PRIVATE-JOKER-INJECTION.ko.md` | Library 새 결과2개 생성은 부모 확인. 각1회 다운로드 실패·bytes0·새 픽셀 미확인. 기존 얼굴 crop 재사용 제거. 공개업로드0 |
| 도미노 양끝·손패·준비 도움말 | `DominoBoard.tsx`, `DominoQuickGuide.tsx` | 현재 실제 첫 타일 버튼은 손패 선택 뒤 나타남. 없는 버튼으로 판단하지 않음. 최종 전체판 미실행 |
| 자이푸르 시장/손패/확정·금/은/향신료 | `JaipurBoard.tsx`, `JaipurArt.tsx`, `JaipurMotion.tsx` | 기존 개선 통합·짧은 대표 행동 검수만 과거 실행. 전체 라운드/정산 최종 검수 별도 |
| 스플렌더90카드·비용숫자·보석·선택·효과수명 | `TableGames.tsx`, `SplendorGem.tsx`, `SplendorMotion.tsx` | 원본90카드 보존·현재 단위 통과. 실제 승리/복수귀족/운영 전체분기 미실행 |
| 승인 귀족2장만 교체 | 기존10귀족 그대로 | 개인 bytes 전달/비공개 주입 pending. 공개 허용으로 해석하지 않음. 다른8장·조건·점수 보존 |
| 민화투48장·포획·가림 방지 | `MinhwatuTable.tsx`, `useMinhwatuPresentation.ts` | 원본48장 유지·기존 개선 통합. 최종 양쪽 전체판 미실행 |
| 부루마블 주사위→경로→도착 확정 이벤트 | `MarbleBoard.tsx`, `MarbleEventStage.tsx` | 기존 authority 확정 타임라인 우선·중복 표시/음향 방지. 과거 대표이동 확인. 최종 새자산 통합 뒤 검수 |
|24도시40칸/레거시 저장·임시 도시 그림 후퇴 교정 | `src/games/marble.ts`, `MarblePropertyArt.tsx` | 원본 광주/산토 WebP 보존. 단순 SVG는 반려 상태. 승인 새24도시/베를린·마이애미 WebP 준비·실제 게임 연결 미완료 |
|1단독주택2아파트3랜드마크·실제 크기 차이 | 기존 임시 단계 구조 | 승인 ccec83d의 원본32PNG 수령·hash32/32. WebP32개/2.21MB 준비. 게임 컴포넌트 연결·단계 크기 최종 검수 pending |
|래그돌·말티푸·판다·친칠라·우주인·리스연,로봇 제외 | 현재1c20ea3 `MarblePawn.tsx` 보존 | 현재 컴포넌트는 최종6명 로스터 아님. 승인된 새6종 source/runtime 픽셀 확인. 연결은 게임 담당. 추가 살리·술리 자산 미수령 |
|Asiana/JetBlue·실제 왕복 경로 | 랜딩 여행 서사 적용 | 게임용 항공 bytes/최종 이동 연출 미통합 |
|모든 KO/ES 초보 도움말·예시·종료 안내 | 기존 각 Guide/rules +이번 DaVinci 라벨 수정 | 실제 버튼 존재를 소스로 확인. 새후속게임이 도착한 뒤 최종 전수확인 필요 |
|Rhythm 원본SWF | `RhythmBoard.tsx`, 원본SWF | 보존. 기존2contexts 포커스/입력만 확인. 스코어 동기화나 전체 플레이 완료 주장 안 함 |
|최종 Luna 두 사용자 검수 | 기존 중간8게임 대표행동 기록 | 사용자 지시대로 구현/자산 통합 완료 뒤 최종 검수. 아직 재실행하지 않음 |

이번 최신 단위 검증은53파일471테스트, TypeScript/Vite/Edge 빌드 통과다. 전체 시각 자산 적용·상용 완성도·자연스러운 모든 승패·실기기 성능·운영 연결을 이 숫자로 대신하지 않는다. 로컬 소프트웨어 모션 cadence22.14/22.13회/초로 이전28.58/28.28보다 낮다. 비공개 실제 녹화와 원시 측정은 홈 인계 문서에 별도로 연결한다.

후속 상태 교정: 명시적 공개 승인 후 ccec83d87fac6ad1a65dd2b900dec8870ef1c71b에서32개 원본 PNG를 수령했고 SHA256·Git blob SHA·크기를32/32 검증했다. 따라서 위32개 공개승인 대기는 해소됐다. 런타임 최적화/연결·새 게임코드·최종 플레이는 여전히 별도 단계이며 새 개인 조커/귀족 비공개 조건은 그대로다. 추가 두 반려견 캐릭터는 아직 수령하지 않았다.
