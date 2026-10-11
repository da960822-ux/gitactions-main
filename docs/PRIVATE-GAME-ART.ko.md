# 비공개 다빈치 조커 연결

흑백 조커에는 새 사진 두 장을 각각 캐리커처화한 별도 이미지를 사용한다. 기존 커플 크롭은 기본 표시에서 제외했다. 새 원본·완성본·실제 비공개 URL은 공개 저장소에 넣지 않는다.

Private host는 React를 mount하기 전에 다음 런타임 값을 주입할 수 있다. 두 경로는 설명용 예시이며 현재 파일은 없다. `public/private-game-art/`는 gitignore에 포함돼 있지만, **정적 빌드에 포함해 공개 배포하면 접근 제한이 생기지 않는다**. 실제 비공개 호스트에서 인증된 경로 또는 로컬 세션 blob URL을 제공해야 한다. 이번 작업에는 배포가 포함되지 않는다.

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
