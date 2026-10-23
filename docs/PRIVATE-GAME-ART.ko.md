# 승인 생성 초상 연결과 선택적 호스트 주입

2026-10-12 사용자 명시 공개 승인 후 생성 그림4장을 asset branch `0be54b63f3e053cb6367fd099421b8799ba2d191`에서 실제 수신했다. 원본 bytes/SHA256/Git blob/크기 및 원본·WebP pixels를 확인했다. 원본 실사 사진은 이번 전달·변환·게임 적용 대상이 아니다. 이전 Drive 다운로드403은 해결 전 이력이며 현재 생성 그림4장 적용은 완료됐다.

기본 흑 조커는 `/images/davinci/joker-couple-waterfront.webp`, 백 조커는 `/images/davinci/joker-couple-indoor.webp`다. 자신의 조커와 공개된 상대 조커에만 img를 표시한다. 숨긴 상대 타일은 URL/얼굴/조커 식별 DOM이 없다. 현재 양언어·양쪽 viewer 회귀가 이를 검사한다.

로컬 통합에서 기존 `VITE_DAVINCI_BLACK_JOKER_IMAGE` / `VITE_DAVINCI_WHITE_JOKER_IMAGE`도 유지한다. 우선순위는 private host runtime 주입 → 제한된 local env 경로 → 승인된 기본 WebP다. env는 `/private-assets/davinci/<name>.webp|png|jpg|jpeg`만 허용하며 외부 URL/상위 경로 이동을 거절한다. 잘못된 env는 기본 그림을 사용한다. runtime config/prop은 private host 값이며 room state에서 가져오지 않는다. 두 private 디렉터리는 Git ignore에 보존한다. 정적 빌드의 public 경로는 자동으로 비공개가 되지 않는다. 이번 작업은 배포를 포함하지 않는다.


기존 귀족 `n0`/`20001`은 의사가운, `n1`/`20002`는 한복 초상이다. 나머지8귀족·90개 개발 카드·비용·점수·rule engine은 그대로이며 이전 원본 JPG도 보존했다. 테이블·귀족 방문 공지·모션·같은 귀족 도움말 그림이 모두 card-map을 따른다. 승인 원본/파생 파일과 경로 근거는 `public/images/personalization/manifest.json`이다.

선택적 private host는 기존 `window.__DOS_PRIVATE_GAME_ART__.davinciJokers`/`.splendorNobles`에 별도 로컬 blob 경로를 주입할 수 있다. 이 값은 room state·행동·공개 게임 로그에 들어가지 않는다. 게임은 Drive/SAS URL을 브라우저에서 호출하지 않는다. 기본 게임은 주입 없이 위 승인된 로컬 WebP를 사용한다.

살리·술리는 공개 승인 원본을 받은 `/images/marble/premium/pawns/sali-suli.webp`의 두 마리·한 받침대·단일 ID/위치/턴 이미지다. 기존 여섯 말과 canonical33개 자산을 보존한다.

실제 화면/두 세션 플레이/운영 Realtime 검수는 각각 별도 상태로 보고한다. 소스 및 pixels 확인만으로 이 검수를 완료로 표시하지 않는다.
