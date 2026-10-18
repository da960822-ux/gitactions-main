# Gate1 R3 — 동일 조건 pass/프레임 진단

성능 합격을 선언하지 않는다. 실제 환경은 Chromium CDP/WebGL 모두 ANGLE SwiftShader CPU software이며 GPU timer query는 없다. 실제 하드웨어 GPU/VRAM 사용량을 측정하지 않았다.

대상: R2 `4edd8c124ce08ace354e165afc0d9cf824723715`, R3 `b46889549188e828cee5a23d2ff2c8e7fc73abe3`.

## 동일 조건 비교

별도 R2 worktree/서버5198과 R3 서버5195에서 실제 world.ts factory를 각각 읽었다. 두 버전 모두 CSS1920×1080, 브라우저 DPR1, 내부 buffer를1248×702 또는1920×1080으로 명시했고 실제GL4sample AA,512² shadow,1254² 원화와1024² video를 유지했다. 테스트마다 새 페이지·같은 p≈.65 지점·같은 warmup을 사용했다. 실행 순서는 R2작은buffer→R3작은buffer→R3큰buffer→R2큰buffer다. 다른 브라우저 렌더/녹화는 동시에 실행하지 않았다. 전체 앱이 아니라 scene-only 진단이다.

각 조건은 준비 후 warmup3프레임, morph 변화3프레임과 같은 pose의 pointer 변화3프레임으로 관측했다. 첫 callback 다음의 실제 rAF 간격5개를 보고한다. 그 간격은 직전 프레임의 render/driver/compositor 대기를 포함한다. mode가 바뀌는 첫 간격의 소속을 잘못 붙이지 않기 위해 mixed 구간 전체로 표기한다. 표본이 매우 작고 pose1개라 최적화율·통계적 우열·전체 페이지 FPS로 일반화하지 않는다.

| 버전 | 실제 내부 buffer | 간격 표본 n | 중앙값 ms | 범위 ms |
|---|---|---:|---:|---:|
| r2-4edd8c1 | 1248×702 | 5 | 766.6 | 750.0–800.0 |
| r3-b468895 | 1248×702 | 5 | 633.3 | 616.6–666.7 |
| r3-b468895 | 1920×1080 | 5 | 1283.3 | 1249.8–1333.3 |
| r2-4edd8c1 | 1920×1080 | 5 | 1433.3 | 1416.6–2616.5 |

새 버전의 이 구간 관측은 이전보다 작았지만 여전히 약0.6–1.3초 프레임 지연이다. 부드러운60FPS와 거리가 멀다. 1920 결과의 오래 걸린 outlier도 원시 데이터에 그대로 남겼다. 전체 스크롤/영상 seek/최초진입/실제 GPU 검증은 별도로 필요하다.

## 어떤 draw와 shader 경로가 달라졌나

p≈.653, dirty-shadow 프레임에서 실제 renderer.renderBufferDirect를 기록했다. 아래는 main/shadow 모두 포함하며, triangle은 renderer.info와 교차 확인했다.

| 항목 | R2 | R3 |
|---|---:|---:|
| main draw |34|19|
| main triangles |70,692|27,254|
| shadow draw |4|9|
| shadow triangles |9,218|16,802|
| 전체 draw |38|28|
| 전체 triangles |79,910|44,056|
| CPU geometry arrays bytes |2,253,932|1,550,488|
| main MeshStandard draw |30|17|
| main normalMap 사용하는 draw |22|4|
| main emissiveMap 사용하는 draw |2|1|

비용 감소의 구조적 이유: 반복 rib/box/별도 canopy/겹친 film geometry 대신 연속 shell과 한 개의 조형으로 구성했고, material group을 재질별로 모아 제출한다. 실제 영상은 독립 투명 DoubleSide 평면 대신 기존 shell에 들어가며 추가 겹침 pass가 없다. 새 물성 배치는 brushed normal을 금속에 집중하고 matte ivory/graphite에는 별도 균일 roughness를 쓴다. 진단의 모든 normal/shadow/video/MSAA를 끈 조건을 제품에 복사한 것이 아니다. 이 새로운 표면 디테일의 미적 동등성은 정지 화면 검수 대상이다.

**shadow 비용은 감소했다고 말할 수 없다.** 새 조형과 다중 material 구간 때문에 shadow draw/triangles는 늘었다. 같은 pose에서 pointer만 변할 때는 shadow 캐시가 실제로 작동해 shadow draw0이 기록됐다. morph 변화 시에는 정상적으로 다시 생성된다. 이후 동일 시각 결과를 유지하는 depth draw batching을 검토할 수 있지만, 이 단계에서 임의 shadow 삭제나 AA 해제를 하지 않았다.

## CPU/pass wall time을 GPU 시간으로 오해하지 않기

각 프레임 전후와 shadow pass 뒤에 gl.finish를 호출한 진단 wall-time도 원시 JSON에 있다. 보통 수 ms에 불과해 위의 큰 rAF 지연과 일치하지 않는다. 이 경계 시간은 Chromium의 실제 GPU/소프트웨어 raster/resolve/compositor 단계별 실행 시간을 증명하지 않는다. timer query가 없으므로 ‘shadow가 몇ms GPU를 쓰고 main이 몇ms’라고 단정하지 않는다. 동기화 자체가 pipeline도 바꾸므로 실제 앱 FPS의 대체 자료가 아니다.

현재 확인 가능한 근거는 실제 draw/triangle/shader feature 경로와 실제 callback 지연이다. 4sample raster/resolve, PBR/IBL의 픽셀 연산, texture/video 갱신, driver/compositor 중 어느 단계가 몇%인지 직접 측정한 것은 아니다. R2의 이전 no-MSAA/no-video 진단은 원인 후보를 좁힌 자료이며, 이번에 그 기능을 없애서 빠르다고 보고하지 않는다.

## 다음 최적화 범위

새 구도가 통과하면 shadow depth 제출의 중복 group, profile에 남는 full-frame pixel/resolve 비용, 실제 video decode/seek를 동일 화면 비교로 확인한다. AA 대안/적응 DPR/텍스처 압축/LOD도 원화와 핵심 반사·깊이·morph를 보존하는 조건으로 비교한다. 실제 GPU가 없으므로 하드웨어60FPS 판정은 보류한다. scene-only 지점 결과를 전체 앱/모바일의 개선 완료로 확대하지 않는다.

원시 JSON, 실행 harness,각 draw의 object/material/pass/normalMap/emissiveMap 여부와 모든 error 배열을 함께 제공한다. 네 조건 pageerror0, 브라우저 종료 확인. Source/worktree는 변경하지 않은 진단이다.
