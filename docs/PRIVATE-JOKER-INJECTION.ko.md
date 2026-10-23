# 다빈치 비공개 조커 연결

새 그림은 실제 서로 다른 커플 사진2장에서 만든 결과다. 이미지 bytes·base64·signed URL·개인 Library ID를 공개 소스에 넣지 않는다. 공개코드는 색상별 로컬 경로를 받는 연결점만 가진다. 라이브러리 결과를 실제로 내려받지 못한 상태이므로 이 변경은 이미지 적용 완료가 아니다.

1. 승인된 이미지 bytes를 확보한 뒤 실제 픽셀을 확인한다. 검정과 흰색에 사용할 순서는 비공개 전달 기록에 보존한다. 둘의 얼굴을 한 그림에서 함께 유지하며 기존 얼굴 crop을 재사용하지 않는다.
2. 외부에 노출되지 않는 로컬 실행에서만 `public/private-assets/davinci/black-joker.webp`, `white-joker.webp`에 각각 배치한다. 이 경로는 Git에서 제외된다. 원본은 저장소 밖의 비공개 디렉터리에 별도로 보존한다.
3. Git에 넣지 않는 `.env.local`에 아래 설정을 쓰고 개발 서버를 다시 시작한다.

```dotenv
VITE_DAVINCI_BLACK_JOKER_IMAGE=/private-assets/davinci/black-joker.webp
VITE_DAVINCI_WHITE_JOKER_IMAGE=/private-assets/davinci/white-joker.webp
```

PNG/JPG도 가능하다. 코드에는 같은 origin의 지정 디렉터리 경로만 허용한다. 원격 URL·data/base64·signed URL은 거부한다. 미설정/로드 실패에는 중립 조커표시－를 쓴다. 상대 숨김 타일에는 이미지 태그나 경로 자체를 내보내지 않는다. 기존 숫자/조커 규칙과 색상 ID는 바꾸지 않는다.

**Git 제외는 웹 접근 보호가 아니다.** 자산을 넣은 공개 정적 서버나 빌드는 사진을 공개할 수 있다. 따라서 이 구조의 현재 사용 범위는 loopback 로컬 실행이다. 인증된 비공개 배포는 별도 승인과 운영 설계가 필요하며 여기서 설정·배포하지 않았다. Vite 빌드에 public 자산이 복사될 수 있으므로 개인 자산을 넣은 산출물을 공개 호스팅에 올리지 않는다.

검증은 미설정 중립표시·원격 경로 거부·흑백 각각 다른 경로·상대 숨김 경로0을 SSR 단위 테스트로 확인한다. 실제 새 이미지의 크기/가독성/얼굴 crop과 두 사람 플레이 검증은 bytes 전달 뒤에 남아 있다.
