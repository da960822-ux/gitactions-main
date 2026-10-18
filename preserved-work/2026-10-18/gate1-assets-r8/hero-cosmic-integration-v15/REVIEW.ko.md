# V15 Hero 실제 화면 검토 제출

상태: 배경 방향만 승인됨. Gate1 Hero 전체 시각 승인은 대기한다. 별도 스토리·편지·이벤트 담당 파일과 게임은 변경하지 않는다.

실제 비교 PNG: `G1R8-V15-actual-Hero-Middle-Arrival-comparison.png`
Library: `libfile_602ecc50e5608191bcf28a70ee9f4191`

## 수정 결과

- 기존 곡선 회랑 중심축을 따라 cove를 넓혀 Arrival의 거대한 우측 벽이 화면을 지배하지 않게 했다. 같은 geometry의 실제 변형이며 벽 삭제·영상 확대·fade 전환이 아니다.
- Arrival 카메라를 [-3.8,.25,-40], target [-12,.15,-69], FOV48로 설정하고 원화의 마지막 위치를 카메라 거리8.5/NDC x.34에서 계산했다. 두 사람은 V13보다 크고 완전하게 프레임에 들어온다. Hero 및 초반 카메라 경로는 유지했다.
- Lightwell/reveal도 주변 벽과 같은 변형을 받아 왼쪽에 문 조각처럼 떠 있지 않게 했다. 해당 면광원 위치·방향·면적도 함께 변하며 총 광량은 유지한다.
- 실제 곡면 SSR을 더 약하고 선명하게 조정했다. 반사를 지운 것이 아니며 새 베이크·모델 생성은 없다.
- 복귀 프레임은 Hero와 동일했고 포인터 좌우 반응의 완료 프레임도 확인했다. 로딩 중 원래 구도가 보이도록 WebGL 완료 프레임 준비와 표시 시점을 맞췄다.

## 실제 증거와 한계

스틸은 실제 앱 CSS1920×1080/DPR.5, native960×540, 재방문 상태다. 시각 검토자가 직접 Hero/Middle/Arrival/Reverse와 비교 시트를 확인했다. 캡처 오류0이며 신규 장면 모듈 override 없이 현재 AcrossHero→previewSpaceV15를 실행했다.

배경은 승인된 원본 이미지의 고정 곡면/배경 레이어(2.5D)다. 행성 자체가 새 3D 모델이라고 주장하지 않는다. 회랑·바닥·카메라는 실제 WebGL이다. Middle의 큰 반투명 면과 도착 무대의 전체 미감은 계속 검토 대상이다. 안정 스틸 개선이 모션 승인이나 Lusion 동등 수준 인증을 뜻하지 않는다.

현재 Remotion intro/live handoff 및 작은 이미지가 실제 큰 영상 패널로 변하는 전체 요구는 미완료다. 활성 lightwell 영상만으로 해당 요구를 완료 처리하지 않는다. 이번 짧은 클립은 복귀/공간 변화 확인용이며 첫 방문 전체·1920 native 원본 승인 녹화를 대체하지 않는다.

## 검증

V15의 geometry Jacobian/미분·바닥 접지·전체 원화 framing·twist·pointer 감쇠: 5파일 8테스트 통과. TypeScript 통과. 보호 manifest2255파일의 현재 해시 변경0/누락0. 게임·API·언어·편지 원문·패키지 보호 경계는 유지됐다.

Git alternate `/tmp/yl-gate0-audit/.git/objects`가 환경 재개 후 없어 전체 history 검증은 보류다. 소스·HEAD·작업 목록은 남아 있으며 .git 수정/reset/fetch를 하지 않았다. V15 소스만 별도 로컬 snapshot으로 보존했고 source ZIP을 외부에 재업로드하지 않았다.

실제 renderer는 SwiftShader다. 하드웨어 GPU·60FPS 합격·최종 모바일 성능을 주장하지 않는다. 기존 기능 QA 기록은 8로비/8동적선택·KO/es-DO 편지·언어 유지·feedback까지이며 온라인 두 사용자 실제 게임 플레이 인증은 아니다.

Gate1 사용자/총괄 시각 검수 대기.


## 실제 짧은 녹화 납품

60.48초 Library libfile_69a7250a8d28819199ca20073f265cca / 101.44초 원본 libfile_ffb1cb864e8c819191830d39ebbe638f. 실제0→.32→1→.32→0 완료 프레임, 오류0, 전체 decode 오류0. 구간은 ffmpeg stream copy로 로딩 앞부분만 제외했고 속도 변경·프레임 합성은 없다. 뷰포트960×540/DPR.5, 실제 캔버스480×370(최소 높이740), VP8 container25fps. 인코더25fps는 앱FPS가 아니며 일부 세로 잘림이 있어1920 최종 구도 검수를 대체하지 않는다. 첫방문이 아닌 재방문 진단이다.

V15 build 통과. 기존500kB chunk 경고는 남아 있다. 새 패키지 업데이트 없음.
