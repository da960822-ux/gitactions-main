# Gate 0 v1 검토 중 추가 확인 — 접근 장애와 최종 폴리시

2026-10-17 19:38 UTC. 구현 시작 지시는 아직 받지 않았다. 제품 소스 변경 없음. 부모 검토 중인 Library v1 전체 문서는 그대로 보존한다.

## 접근 장애 진단

- Lusion 공개 MP4 GET은 `HTTP/1.1 403 Forbidden`, `server: envoy`, `curl: (56) CONNECT tunnel failed, response 403`였다. **원본 사이트 GET 이전의 네트워크 CONNECT 터널 단계 거부**로 확인된다. 사이트 자체의 파일 권한/404/서명 만료라고 판단할 수 없다. 워크스페이스의 정확한 정책 규칙/도메인 허용목록은 응답에 없어서 확인하지 못했다. IP직접접속·대체프록시·DNS변경 등 접근거부 우회는 하지 않았다.
- bundle은 `library_prepare_materialize`를 **직접 새로 호출**했다. 19:38:19 UTC 응답은 isError=false, unavailable_items=[], warnings=[], 정상 파일명·138,492,886bytes·v0였고 workspace_path=null, 유효기간20:38:19 UTC인 새 download URL을 반환했다.
- 만료 전에 즉시 GET했으나 `URLError: Tunnel connection failed: 403 Forbidden`이었다. 따라서 **fresh materialize는 성공했고, bytes 전송의 CONNECT 터널 단계가 실패**했다. 서명 만료로 볼 증거가 없고 해당 서비스의 파일 권한 거부라고도 단정하지 않는다. signed URL은 문서/최종 응답에 노출하지 않는다.
- 부모 환경에 있는 Lusion 파일을 허용된 Library 경로로 전달받는 준비는 가능하지만, 이 환경의 bytes 전송 경로가 같으면 동일 장애가 날 수 있다. 파일을 받기 전 시청/ffprobe/bundleclone 검증 성공을 보고하지 않는다. 부모 쪽에 이미 된 검증은 담당 검증기록으로만 유지한다.

## 최종까지 폴리시·수정·재검증

추가 사용자 지시를 반영해 각 Gate는 구현→실제 브라우저 증거→부모 검수→수정→폴리시→재검증→부모 통과 순서다. 마지막까지 타이포(한/ES 줄바꿈·자형·위계), 여백·safe-zone, 재질·광원·반사, 모션 타이밍/중단/역행, 모바일 구도·touch, 접근성·읽기·focus, 성능·리소스, 게임/언어/편지/feedback 기능을 검토한다.

폴리시는 마지막에 CSS를 조금 다듬는 작업만 뜻하지 않는다. 구도/geometry/카메라/자산 문제면 해당 수준을 재설계하고 재녹화한다. 이전 Gate 승인 부분에 영향을 주면 영향 범위를 표시해 다시 검수한다. 내부 테스트만으로 다음 단계로 넘어가지 않는다. 최종10초ES 하이라이트는 모든 Gate 통과 후 제작하며 전체 검수 원본을 대체하지 않는다.

**부모 Gate 0 v1 추가 검토 및 구현 시작 지시 대기.**
