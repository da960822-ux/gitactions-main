# 비공개 다빈치 조커 연결

흑백 조커에는 새 사진 두 장을 각각 캐리커처화한 별도 이미지를 사용한다. 기존 커플 크롭은 기본 표시에서 제외했다. 새 원본·완성본·실제 비공개 URL은 공개 저장소에 넣지 않는다.

Private host는 React를 mount하기 전에 다음 런타임 값을 주입할 수 있다. 두 경로는 설명용 예시이며 현재 파일은 없다. `public/private-assets/`는 gitignore에 포함돼 있지만, **정적 빌드에 포함해 공개 배포하면 접근 제한이 생기지 않는다**. 실제 비공개 호스트에서 인증된 경로 또는 로컬 세션 blob URL을 제공해야 한다. 이번 작업에는 배포가 포함되지 않는다.

```js
window.__DOS_PRIVATE_GAME_ART__ = {
  davinciJokers: {
    black: '/private-game-art/black-joker.webp',
    white: '/private-game-art/white-joker.webp',
  },
};
```

별도 통합 화면에서는 `DaVinciTable`의 `jokerPortraits` prop으로 같은 값을 전달할 수 있다. 미주입/읽기 실패는 규칙 기호 `－`로 표시한다. 이미지는 자신의 조커와 공개된 상대 조커에만 렌더한다. 숨긴 상대 타일에는 이미지 URL, 얼굴, 조커 식별 DOM을 넣지 않는다. 이미지 경로를 게임 room 상태·행동·공개 로그에 저장하지 않는다.

새 파일 생성·로컬 pixels 확인·실제 연결·최종 2인 검수는 아직 대기다. 개인 이미지 mapping은 부모의 확정 전달을 따른다.

승인한 기존 귀족 두 장도 같은 private host가 `splendorNobles`의 **기존 engine ID** 두 개에만 로컬 세션 blob URL을 주입한다. 공개 카드/귀족 manifest·비용·점수는 바꾸지 않는다. 테이블·귀족 방문 공지·착지 모션·동일 귀족 도움말 예시는 같은 주입 경로를 사용하고, 미주입 상태에서는 기존 귀족 아트를 표시한다. 미확인 ID는 테이블 아트 resolver에서 무시한다. ID별 실제 승인 사진 배정은 private 입력에만 기록한다.

```js
window.__DOS_PRIVATE_GAME_ART__.splendorNobles = {
  '<approved existing noble ID>': '<local session blob URL>',
  '<second approved existing noble ID>': '<local session blob URL>',
};
```

2026-10-12: 개인4장 Drive metadata와 공식 raw fetch는 성공했다. 소비 실행기 다운로드는 `URLError`, 한 번 재시도한 파일은 `Tunnel connection failed: 403 Forbidden`으로 실패했다. 로컬 bytes0이므로 실제 픽셀·개인 이미지 적용은 완료가 아니다. Drive/SAS URL은 프론트에서 호출하거나 저장소에 기록하지 않는다.

살리·술리는 이후 별도로 공개 승인한 Git 자산을 받아 `/images/marble/premium/pawns/sali-suli.webp`에 연결했다. 두 마리가 한 받침대에 있는 일곱 번째 단일 말이며 기존 여섯 말·위치·주사위·차례를 보존한다. 이 자산은 이제 private 입력 대상이 아니다.
