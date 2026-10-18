# A — 우주에서, 우리 방으로

이 자료는 사용자 선택을 위한 정적 아트 디렉션 시안이며, 구현된 WebGL 화면이나 게임 동작 증거가 아니다.

- hero.png / arrival.png: 각각 1920×1080 독립 전체 화면. Playwright와 Chromium으로 HTML/CSS를 실제 캡처했다.
- hero.html / arrival.html: 분리된 정적 원본. 제품 코드에는 연결하지 않았다.
- assets/our-universe-scene.webp: 승인된 원본을 바이트 그대로 복사. Hero에만 사용했다.
- assets/couple.webp: 승인된 투명 캐리커처를 바이트 그대로 복사. 재생성·리터칭·색상 필터 없음. 외곽 drop-shadow만 적용했다. 원래 피부톤에 맞춰 따뜻한 주변 색을 배치했다.
- assets/playroom.png: ImageGen으로 새로 제작한 환경 전용 컨셉 자산. 인물·글자·UI 생성 없음. 실제 3D 모델 또는 실제 게임 상태가 아니다. 원본 생성 파일 /workspace/generated_images/exec-e6d077e0-11da-4ddb-bf1a-5c7e43a0360c.png도 보존했다.
- 폰트: 프로젝트 기존 Gowun Batang과 DM Sans, Baby는 Chromium 기본 Georgia italic.

## 공간 제안

최초에는 연인과 우주가 중심이다. 전환 후에는 큰 인물 컷을 반복하지 않고 두 좌석과 도미노가 놓인 놀이 공간으로 도착한다. 버건디 천과 따뜻한 금속을 공통 시각 언어로 연결하되, 우주의 야경과 방 바깥의 차가운 해안 채광은 확실히 다르다. 선택 후에는 Hero의 실제 곡면이 테이블의 가장자리로 변형되고 카메라가 실내 공간으로 진입하는 연결을 설계해야 한다. 그 모션은 이번 정적 시안에서 구현하지 않았다.

## 실제 도구 / 검증 범위

AGENTS.md 및 Ponytail SKILL.md 전체 열람, exec, ImageGen(환경만), Python(HTML 파일 작성), Playwright, Chromium, view_image를 실제 사용했다. file:// 탐색은 관리자 정책으로 차단되어 서버를 만들지 않고 setContent + 원본 바이트 data URL로 로드했다. 이 제약은 출력 픽셀 해상도에 영향을 주지 않는다. 두 화면 모두 눈으로 검토했고 타이포·CTA가 전체 프레임 내에 들어온다.

제품 파일·게임·패키지·기존 실행 서버·녹화·모션은 변경하거나 실행하지 않았다. 실제 GPU 성능, 모바일, 깊이 이동, 인물의 실시간 라이팅 일치는 검증하지 않았다. 합격 또는 Gate 1 승인으로 보고하지 않는다.
