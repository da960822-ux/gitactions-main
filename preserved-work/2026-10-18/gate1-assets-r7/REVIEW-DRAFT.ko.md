# Gate 1 R7 — 동일 Hero 폴리시 검토 초안

상태: **최종 베이크·원본·웹 캡처 실행 중. 미완료 초안이며 업로드/승인용 최종본 아님.** Gate0은 이미 승인됐고 Gate1을 반복 검수 중이다. 부모 시각 검수 전 Gate2는 시작하지 않는다. R6는 491b16883d9ca1591065a22b23731f04587e5b38에서 clean 보존한다.

## 바뀐 결과와 세 지시 대응

1. 통로가 먼저 열린다. 오른쪽 cove 자유단은 기존 변형보다 크게 바깥으로, 왼쪽 wing은 실제 vertex group/normal morph로 회전·이동한다. aperture는 p=.08–.43에 완료하고 camera position/target은 p=.43까지 안정 Hero에 머문다. 전진 후 원화 평면의 왼쪽을 통과한다. 면 fade·카드 확대·프레임 순간 교체를 사용하지 않는다.
2. 두 리본을 구조로 연결했다. warm fold는 깊이 -46까지 이어지는 같은 canopy 천장이고, cool fold는 주 바닥에 붙은 낮은 단이다. 측면 벽·깊은 alcove·천창을 연결해 앞/중간/뒤의 깊이가 실제 geometry로 생겼다. 산발적인 소품을 더하지 않았다. 다음 공간은 Gate1 경계 구조이며 Gate2 이야기 콘텐츠를 구현했다고 보고하지 않는다.
3. Hero 난간을 줄였다. 세로 반경 .78→.40, 깊이 반경 .62→.38로 줄이고 중심을 내려 원화 하단 절단면은 가린다. 원화 크기·얼굴·원본 bytes는 그대로다. 중복된 밝은 앞 바닥 면을 제거하고 실제 주 바닥 하나에 연결했다. cove 곡률과 측광으로 넓은 명암을 만든다.

## 기술 정합

- source/normal/GI/HDR/GLB/runtime를 chamber-v7.0으로 묶고 v6를 덮어쓰지 않는다.
- 한 camera/pose가 움직임을 소유한다. 입구/모프/카메라/원화 회피/역행/경로 연속성의 의미 있는 pose 테스트 6개가 통과했다. 최종 전체 테스트·빌드는 아래 결과를 기다린다.
- UV0 tangent normal, PNG flip=false / EXR flip=true, diffuse albedo 제외·storage1×PI, receiver별 atlas 격리, authored probe의 specular-only 계약을 유지한다. GI 표본은 0/.43/1이고 실제 모프 가중치에 따라 두 구간을 보간한다.
- Wine receiver는 움직인 뒤에도 맞는 별도 authored HDR probe를 사용한다. 실제 씬에서 hero/arrival/wine/wine-arrival 4개 probe를 제작한다. 임의 색상·노출을 낮춰 얼룩을 가리지 않는다.
- floor 반사는 실제 mirrored camera와 world matrix를 사용한다. roughness별 mip와 Three의 EnvironmentBRDF로 적분하며 mip blur는 GGX의 근사임을 명시한다. 조명 카드는 native camera와 웹 primary에서 숨기되 glossy/probe/planar 반사에는 실제 geometry·radiance로 기여한다.
- Remotion 신규 intro/이야기 영상을 이번 폴리시에서 만들었다고 보고하지 않는다. 기존 HyperFrames surface film의 미세한 emission modulation만 재사용한다. 거부된 기존 intro 영상은 계속 비활성이다. 긴 최종 영상은 정적 검수 뒤로 미룬다.

## 정적 검증 계획과 결과 대기

고정 source .blend ba0843975411b97684f264cbfbb9a4ed63fafbd6a7d5f1f168a741ef3042ba56에서 CPU Cycles64 원본 Hero/Mid/Arrival과 실제 Three1920×1080을 같은 camera로 비교한다. 원본·linearEXR·OIDN 원본을 구분하고 웹 PNG는 편집하지 않는다. R6와의 전후 비교는 R6 camera를 그대로 적용한 별도 Three control 3구도로 제공한다. 새 camera 경로 화면과 구분한다.

입구 개방 진단은 p=.43, camera 위치/target/FOV를 Hero에 고정한 1sample flat emission mask다. 입구 경계 z=-4 너머 실제 room/canopy 구조가 약51.5%, z=-12보다 깊은 구조만은 약43.6%다. 인물·전경난간·열린 cove/wing·빈 background는 제외한다. 이 비율은 미적 합격이나 전체 모션 품질의 자동 기준이 아니다.

실제 페이지는 p0/.43/.5/.65/1/역행, 실제 pointer, KO/ES, 오류·overflow를 캡처한다. .5는 인물 평면을 통과하기 전 절단면 가림을 추가 점검하기 위한 프레임이다. 같은 모델 UUID/모프/행렬로 복원되는지 확인한다.

## 보존·제약

독립 감사에서 보호2255개 변경/누락0, package/lock 변경0, R6와 원본 worktree clean을 확인했다. 최종 단계에서 다시 hash를 확인한다. 게임·라우트·API·언어·편지·갤러리·건의사항을 바꾸지 않는다. 독립 게임 작업은 통합하거나 중단하지 않았다. push·deploy는 하지 않는다.

현재 환경의 실제 브라우저 renderer는 캡처에서 다시 기록한다. 기존에는 SwiftShader였고 GPU 가속·모바일 실기기·60FPS를 검증했다고 주장하지 않는다. CPU submit ms는 FPS가 아니다. GI312MiB와 normal 약70.7MiB는 텍스처 산술 추정이며 실제 VRAM 실측이 아니다. probe·반사·video·driver 비용은 별도다. 큰 chunk 경고와 최종 모션/모바일 검수가 남을 수 있다.

최종 실제 결과를 채운 뒤 부모의 Gate1 정적 시각 검수를 받는다. 내부 테스트나 이 보고서는 시각 승인을 대신하지 않는다.
