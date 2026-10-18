# 실제 코드 보정과 캡처 — 후반부 v3

기준 `a1c122b` 이후 제안 문서의 네 가지 항목을 독립 프리뷰 코드에 적용했다. Hero·원문·공유 파일은 그대로이며 영상 렌더, push, 배포는 하지 않았다.

## 구현

- **스토리 지형:** 같은 surface의 높이 계수를 2.3에서 1.3으로 낮추고 좌우 중심/폭을 비대칭화했다. 중앙 통로(-1.8..2.1)의 표면 높이는 .15 이하로 제한한다. 인물과 봉투의 시야를 확보하며 p에 따라 같은 바닥이 놀이 표면으로 펴진다.
- **문 배경:** 반복 가로선을 5개에서 2개로 줄이고 별도 저광택 trim 재질로 바꿨다. 문의 높이를 늘려 상단 테두리의 경쟁을 줄였다. 기존 로즈골드 종이 테두리와 문 열림은 유지한다. 여전히 단순한 큰 패널 구조라는 한계는 남는다.
- **편지 연결:** 입체 카드에는 기존 주소·서명만 얹었다. desktop, 일반 모션, q>.9, p=.70..86에서 카드 네 모서리의 viewport 투영 좌표를 내보낸다. 부모는 **동일 DOM 원문 article**을 CSS projective transform으로 이 quad에 맞추고 일반 읽기 위치로 보간한다. 이때 입체 insert를 숨겨 빈 종이 중복을 없앤다. p>=.86에서 fixed/transform을 제거하고 normal flow로 복귀한다. 모바일/reduced-motion과 직접 읽기는 안정적인 일반 본문을 사용한다.
- **모바일 엔딩:** 세계 상단을 투명 마스크로 페이지 바탕에 연결했다. footer 여백을 늘리고 독립적인 크림색 읽기면을 주어 작은 인물·봉투 위 글자 경쟁을 줄였다. 기존 제목 대비 수정을 유지했다.

## 실제 증거와 한계

`npm run build` 통과. `npm test` 6/6 통과(상태/저장/도미노 4개 + projective mapping 2개).

`verify-handoff.mjs`: 실제 Chromium/WebGL에서 1600×1000, p=.705/.78/.85의 DOM tracking, 중복 insert 숨김, 가로 넘침, 의도한 보간 quad의 bounding box와 실제 DOM bounds 오차, p=.87 읽기 endpoint 복귀를 확인했다. 총 15/15, 예외 0. 경계 오차 약 .06~.10px. 이 값은 **검사한 정지 viewport와 의도한 quad의 외곽 경계**에 대한 값이다. 전 기기·움직이는 모든 프레임에서 3D 표면 전체가 2px 이내라고 확대하지 않는다. 화면 비율이 다른 입체 종이와 긴 본문 사이의 타이포 변화, 실제 기기 성능은 추가 검수가 필요하다.

`capture-stage-review.mjs`: 최종 코드에서 장면별 큰 캡처 6개, 검수 35/35, JavaScript 예외 0. 두 언어 원문 각 5문단의 정확한 보존을 다시 확인했다.

`check-polish-mobile.mjs`: 390×844, KO/es-DO 각각 story/play/letter/ending 총 8케이스, 가로 넘침 없음·장면 분리 유지·엔딩 제목 대비 약 9.52:1. 이것은 실제 물리기기 검수가 아니다.

큰 캡처는 `output/playwright/stage-review/`의 장면별 1600×1000 파일 및 모바일 ending 두 파일, 전환 과정은 `output/playwright/handoff-v3/paper-0.705.png`, `paper-0.78.png`, `paper-0.85.png`, `paper-0.87.png`다. 합성 콜라주가 아니다. 정확한 체크 결과는 `review/handoff-v3-report.json`, `review/mobile-polish-report.json`, `review/stage-review.json`에 보존한다.

## 남은 작업

Hero의 마지막 프레임과 camera/object/light를 맞추는 통합, 최신 승인 말·조커·귀족 연결은 남는다. 지형·문·테라스의 표면과 조형은 블록아웃 수준이라 최종 아트디렉션 승인으로 보고하지 않는다. 원래 게임 링크는 유지하지만 독립 서버에서 게임 앱이 실행되는 것은 아니다. Three.js chunk 분할과 실제 기기 성능 검수도 통합 시 필요하다.

## Library 상태

목적지는 사용자 본인 Library뿐이다. 조회/중복 확인은 성공했고 대상의 중복 저장은 없었다. 공식 prepare_uploads/finalize_uploads 도구는 노출되어 있으나 현재 Library prepared-uploads 지침은 두 도구의 개별 수동 호출과 시작한 helper를 direct action으로 전환하는 것을 금지한다. 필수 helper는 prepare 이전 hosted apps tools/list에서 `library upload failed: hosted apps tools/list request failed: network`로 실패했다. 따라서 prepare 응답/업로드 session/finalize 응답/Library ID는 없다. 다른 목적지 전송이나 수동 우회를 하지 않았다.
