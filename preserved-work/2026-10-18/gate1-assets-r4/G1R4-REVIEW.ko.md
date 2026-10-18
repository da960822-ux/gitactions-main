# Gate1 R4 — Blender 알코브 실제 정지 화면 3장

현재 Gate1은 미적 불합격/미승인 상태다. 새 3장은 총괄 검수를 위한 자료이며 디자인 완료 선언이 아니다. Gate2·원격 푸시·배포·새 full-screen 인트로 장시간 렌더는 하지 않았다.

로컬 커밋: `37583421daba9a0e127c208f9c6d41e488a76b5c` · 브랜치 `redesign/folded-playhouse-gate1-20261017` · 작업 트리 clean. 이전 기준 `b468895`를 보존한 증분이다.

## 이번에 직접 확인할 화면

| 자료 | 실제 상태 |
|---|---|
| G1R4-STABLE-1920.png | 실제 Chromium, 1920×1080 CSS/내부 buffer, p=0, 승인 원화와 알코브·낮은 곡면 턱 |
| G1R4-MID065-1920.png | p≈.65, 카메라 (-6.3,.3,-2.2), 왼쪽 통로로 진입하는 중간 상태 |
| G1R4-ARRIVAL-1920.png | p=1, 카메라 (-5.8,1,-10.8), 실제 통로 벽 뒤로 들어온 도착 상태 |

모두 실제 애플리케이션에서 스크롤을 이동해 확보했다. Blender 렌더 이미지나 편집 영상으로 웹 화면을 대체하지 않았다. 최초 인트로는 생략한 세션이다. 세 PNG를 직접 열어 검토했고 pageerror0/console error0이다. 정지 프레임은 전체 정·역방향 모션 품질 검수의 대체 자료가 아니다.

## 참고 자료와 작업 권한

부모 제공 Library 이미지의 정상 전송은 download failed였고 image_file 읽기는 픽셀을 반환하지 않았다. 원본 이미지를 직접 봤다고 보고하지 않는다. 이후 부모가 전달한 구도·물성·광원 설명에 따라 제작했다. 다운로드 차단을 우회하지 않았다. 이미지를 배경으로 깔거나 얼굴을 생성하지 않았다.

## 이전 구현이 충분하지 못했던 원인

1. 얕은 절차식 셸과 넓은 균일 면은 실제 깊이보다 ‘흰 판’으로 읽혔다.
2. 접지/접촉 음영과 넓은 면광원 반사 정보가 부족해 PBR 재질도 플라스틱처럼 보였다.
3. 반복 패널을 직접 그린 cubemap은 금속에서 인공적인 물결/줄무늬 반사를 만들었다.
4. 목적인 공간보다 카메라 가까운 벽·천장을 크게 잡아 다음 공간의 보상이 부족했다.
5. 얇은 선반만으로는 원화 아래가 완전히 가려지지 않아 허리의 직선 절단이 다시 나타났다.

현재 한계가 기술적으로 구현 불가능하다는 뜻은 아니다. 공간 구성·자산·조명 폴리시의 문제이며 목표 수준을 낮출 근거로 쓰지 않는다.

## 실제 제작한 자산과 실시간 렌더 구조

Blender 4.3.2 CPU 환경에서 실제 고유 모델을 제작했다. 입체 벽에서 타원체를 Boolean으로 파내고 넓은 bevel을 적용해 깊은 알코브와 모서리 전이를 만들었다. 승인된 원화는 별도 RGBA plane으로 유지하며 Blender에서는 그 정확한 alpha를 베이크용 occluder로만 사용했다.

- 알코브 입구와 낮은 턱의 가는 로즈골드 edge는 실제 mesh다. 입구 edge는 실제 벽 표면으로 ray cast해 배치했다.
- 턱은 얇은 떠 있는 선반이 아니라 아래로 이어지는 입체 벽체다. 아래쪽은 바닥과 이어지는 graphite cladding으로 나눠 원화 절단을 가리면서 전경의 넓은 베이지 면을 줄였다.
- 왼쪽 벽에는 실제 뚫린 통로가 있다. 그 뒤로 곡면 벽·바닥·높은 천장·패브릭 면·곡선 built-in surface를 서로 다른 깊이에 두었다.
- plaster/brush normal data texture와 4개 물리적 diffuse direct+indirect irradiance atlas를 실제 제작했다. Blender CPU32samples로 베이크했다. runtime atlas는 원래 해상도 2048/1024를 유지한 linear RGB8이며, 선형16bit 원본도 보존했다.
- 표면은 MeshStandardMaterial PBR이다. 금속/무광 ivory/짙은 stone/버건디 패브릭의 roughness·metalness를 구분한다. 실제 Three RoomEnvironment→PMREM을 사용하며 기존 반복 softbox cubemap을 사용하지 않는다.
- 넓은 RectAreaLight가 포인터에 반응한다. 바닥 반사는 실제 mirrored camera의 768×512 render target으로 만들고 제한된 9tap blur로 거칠기를 표현한다. 파도 왜곡이나 정적인 반사 그림으로 대체하지 않았다.
- 5개 작성 mesh에 Space_Unfold/Gift_Entry의 실제 glTF position/normal morph target을 넣었다. 여러 재질 primitive로 로드되므로 runtime moving mesh는6개다. 같은 표면이 스크롤에 따라 변형된다.
- 카메라는 인물 옆을 지나 왼쪽 통로 내부로 이동한다. 도착에서 시야를38→48도로 열고 낮은 면과 바닥 깊이를 보도록 조정했다. pose는 스크롤 값의 결정적 함수여서 역행 시 같은 상태로 돌아간다.
- 기존 HyperFrames 실제 VideoTexture는 실제 통로/먼 공간 조명 표면에 작은 caustic을 더한다. 영화 평면을 따로 겹치지 않았다. Remotion 새 출력/match는 정적 아트 디렉션 검수 후 진행한다.

베이크는 안정 포즈 기준의 간접광/면광원 음영이다. 큰 morph 중간에 GI를 매 프레임 다시 ray trace하는 구현은 아니다. 포인터 직접광·PBR highlight·카메라·실시간 반사는 실제로 계산한다. 큰 변형 중 베이크된 음영의 설득력은 향후 모션 QA 대상이다.

## 실제 화면 확인 후 수정한 사항

첫 WebGL 검수에서는 얇은 선반 아래로 원화가 보였다. 턱을 바닥까지 닫고 실제 곡선 경계로 가리도록 고쳤다. 피부·얼굴·원화 파일을 수정하지 않았다.

통로 light strip의 X좌표가 고정돼 수직 막대로 중복 생성된 오류를 수정했다. 지금은 실제 아치 입구를 따라간다. 천 주름에는 과도한18cm 두께가 들어가 서로 교차할 수 있어 실제 얇은 fabric 두께로 수정하고 정적 방의 맵을 다시 베이크했다.

먼 방에는 이미 면광원 베이크의 음영이 있으므로, Hero용 directional key가 뒤쪽 벽에 추가로 강한 삼각형 silhouette를 투사하지 않게 했다. 먼 방의 베이크된 접촉 음영은 유지하고 Hero의 실시간 그림자도 유지한다. 모든 그림자/반사를 꺼서 결함을 숨긴 것이 아니다.

오른쪽 작은 세로 문구는 ivory 배경에 어두운 색을 사용한다. 도착 문구/CTA도 실제 화면에서 위치·크기·배경 대비를 조정했다.

## 보존과 검증

- 보호 대상2,255개 파일 SHA-256: 변경/누락0. 원화1254² RGBA 원본, 8게임, 기존 갤러리, 게임 API/core/router, KO/ES 연결, 편지 원문, feedback, package/lock을 보존했다.
- 별도 게임 담당 저장소/브랜치와 작업 파일을 수정하거나 중단하지 않았다.
- pose5개 + 기존 shell5개 + 실제 GLB/UV/lightmap/morph 계약3개 = 총13개 테스트 통과.
- Production build / git diff --check 통과. Three chunk>500k 경고는 남아 있다.
- 실제 캡처3개 중 pageerror0, console error0. 캡처 로그와 상태 JSON을 보존했다.
- 소스17개 변경/추가: Hero world·pose·CSS·asset test, 작성/수정/내보내기/texture script5개, GLB/manifest/map8개다.

## 성능과 미완료 범위

실제 브라우저는 ANGLE SwiftShader CPU software다. 실제 하드웨어 GPU/VRAM/FPS 합격을 측정하지 않았다. 캡처의 CPU submit 수 ms를60FPS의 근거로 쓰지 않는다.

안정 frame의 renderer.info는 반사/그림자를 포함해29draw, 약212,780triangles였다. 새 실제 geometry와 mirrored reflection이 추가돼 이전 버전과 부하가 다르다. 이번3장은 미적 검수용이며 새 전체 앱 성능 개선을 선언하지 않는다. 과거 진단의 MSAA/video/shadow 제거 조건을 제품에 적용하지 않았다. 메인 AA, 실제 반사, PBR/IBL과 영상은 유지한다.

아직 미검수: 새 최초 진입 전체, 정역 스크롤 실제 녹화, 포인터 동작 영상, Remotion 세 비율 출력과 match, 최신 모바일 전 구간, 실제 GPU 성능, 전체 랜딩 연결. 도착 공간의 큰 후면 벽·콘텐츠 밀도와 연결 천장·인물/공간의 미적 통합도 총괄 검수 대상이다. 정적 결과가 목표 미감에 못 미치면 다시 수정한다.

## 복구와 승인

연결 끊김 알림 뒤 실제 프로세스/저장 시각을 확인했고 단일 Blender 작업을 중복 시작하지 않았다. 베이크→내보내기→테스트→빌드→캡처를 추적했다. 필요한 원본·스크립트·로그를 모두 보존했다.

G1R4-ALCOVE.bundle은 `b468895`를 prerequisite로 하는 `3758342` 증분이다. 별도 랜딩 검토 복사본에서 복원하며 게임 브랜치 위에 직접 복원하지 않는다. authoring ZIP에는 .blend, maps/원본 선형 데이터, 작성 script와 검증 로그가 들어 있다.

현재는 Gate1 재검수 요청이다. 부모의 3장 직접 검수와 다음 지시를 기다리며 Gate2로 넘어가지 않는다.
