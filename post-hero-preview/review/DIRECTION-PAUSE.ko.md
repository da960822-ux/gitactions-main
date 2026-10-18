# 시각 방향 승인 전 보존 상태 — 2026-10-18

## 환경과 범위

재접속 시 HEAD `40697fe6e132ef8958e0cce65f431898de337418`, 작업 트리 clean, v3 ZIP/캡처 보존을 확인했다. 개발 Vite4178와 빌드 검수 Vite4179 각각 하나이며 중복 캡처/브라우저 검수 프로세스는 없었다. 새 서버를 만들지 않고 기존 검수 서버를 사용했다.

부모가 세 아트 디렉션의 Hero/다음 공간 비교를 진행하므로 추가 조형·재질 수정은 보류했다. 아래는 그 지시 전에 이미 적용한 탐색 변경과 독립 기능 수정이다. 현재 조형을 채택하거나 디자인을 합격 처리하는 기록이 아니다. 원문 설계 v2의 원래 스크롤/카메라 수치도 최종 승인값으로 간주하지 않는다.

## 40697fe 이후 보존한 변경

- `src/Scene.tsx`: 같은 surface를 낮은 종이 접힘으로 바꾸고 밝은 단면·하부층·중앙 빛 인레이를 추가했다. 같은 문 객체는 story/play/letter에서 후퇴·하강하고 ending에 돌아온다. 종이띠 두 개와 리듬 막대는 gap→table로 연속 이동한다. 전경 도미노/종이 받침과 seeded 절차 재질을 추가했다. 기존 봉투 q, 승인 컷아웃, 투영 콜백, reduced-motion 4개 pose를 유지했다. **모두 미술 방향 미승인 상태**다.
- `src/PostHeroPreview.tsx`: 새로 쓴 소개 문구를 짧게 나누고 리듬게임 접속 불가/언어 장벽의 실제 이야기를 distance 구간에 유지했다. 첫 구간에도 기존 `/#games` 계약 링크를 뒀다. home.ts 원문은 수정하지 않았다.
- 원문의 초기 공개 요구와 실제 구현의 차이를 수정했다. 장식 q0에서도 원문 article은 접근성 트리에 있고 시각적으로만 접혀 있다. 명시적 닫기 후에만 hidden이다. aria-expanded는 이 원문 공개 상태를 따른다. 원문 복제는 없다. 읽기 영역의 열기 버튼은 자동 q의 도착 여부와 무관하게 명시적으로 다시 연다.
- `src/preview.css`: 데스크톱 본문을 더 위로 배치하고 앞 구간의 번호 꼬리가 뒤 장면에 남지 않게 했다. 초기 원문의 시각 접힘용 스타일을 추가했다.
- `scripts/check-polish-mobile.mjs`: 초기 원문 접근성, 첫 게임 링크, 명시적 닫기 검사를 추가했다. 기존 실제 개봉·보간·미니 상호작용 상태 로직은 보존했다.

## 원문 요구사항 대조

`src/copy/home.ts`의 KO/es-DO 주소·제목·각5문단·서명을 직접 import한다. `src/games/catalog.ts`의 실제 8종 davinci/catchmind/domino/jaipur/splendor/minhwatu/marble/rhythm과 기존 경로 계약을 다시 읽었다. 공유 제품의 게임 rail·초대·Catchmind 번역/원문·한도 안내를 바꾸지 않았다. 이 독립 프리뷰에 게임 앱 전체나 기존 feature 영역이 통합되었다고 주장하지 않는다.

2025-04-04/한국·도미니카/리듬게임 접속 불가/언어 장벽/함께 놀 공간이라는 사실을 유지한다. 가짜 추억·청혼·게임 기능 확장을 추가하지 않았다. 신규 승인 게임말/사진 조커/커플 귀족은 메인 source 인수 대기이며 옛 로컬 자산을 대체품으로 사용하지 않았다.

## 회귀 검수와 현재 증거

빌드(TypeScript/Vite) 통과, 단위테스트6/6 통과. 모바일390×844 KO/es-DO 8케이스와 초기공개/명시닫기/첫게임링크 각언어 확인 통과. handoff 검수15/15, JS예외0. 최종 장면별 캡처6장·원문보존 검수35/35·JS예외0도 확인했다. 최종 장면별 캡처와 원문 보존 검수는 `stage-review.json`, 보간 검수는 `handoff-v3-report.json`, 모바일/접근성은 `mobile-polish-report.json`을 참조한다.

캡처는 현재 독립 구현의 상태 증거다. 최종 아트디렉션·실제기기 성능·Safari·Hero 접속·전체 프레임2px 정밀도를 보증하지 않는다. 컷아웃이 여전히 평면이고 재질/공간 구성은 탐색 수준이다. 세 방향 선택 전 추가 고비용 영상 출력이나 미술 미세 조정은 하지 않는다.

## 전송 상태

공식 create_library_file/prepare_uploads/finalize_uploads/list 도구는 노출되어 있다. 이전 공식 조회는 정상이며 재연결 요구가 없었다. 필수 prepared helper가 prepare 이전 hosted apps tools/list 조회에서 `library upload failed: hosted apps tools/list request failed: network`로 중단됐다. 공개된 helper 연결 복구 수단이나 복구 성공 근거가 없어 같은 호출을 무의미하게 반복하지 않았다. 수동 prepare/finalize나 다른 목적지로 우회하지 않았다. Library ID는 없다. 사용자 승인 목적지는 본인 Library이며 승인 자체는 확보되어 있다.

40697fe 기준의 원래 ZIP과 이후 변경 patch를 `/workspace/scratch/post-hero-delivery/`에 보존했다. 현재 코드/캡처의 후속 ZIP도 같은 디렉터리에 저장한다. 부모의 아트 디렉션 및 캡처 기반 검수 대기 상태다.
