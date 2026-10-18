# Gate1 재작업 성능 진단 — 2026-10-17

현재 구현의 성능 합격을 선언하지 않는다. Chromium CDP와 WebGL에서 **ANGLE SwiftShader CPU 소프트웨어 렌더링**을 확인했다. 하드웨어 GPU 측정이 아니다. GPU timer query도 제공되지 않아 GPU 실행 시간을 직접 분리하지 못했다.

대상 소스는 `4edd8c124ce08ace354e165afc0d9cf824723715`의 새 곡면 건축 Hero다. 원시 관측에는 새 카메라 경로(초기 0,.3,11.7 → 음수 x 진입), 새 shell 이름, geometry CPU bytes 2,253,932가 기록된다. 전체 앱 대신 Vite5195에서 실제 world.ts factory만 가져온 진단 페이지다.

## 측정 방식과 결과

1920×1080 CSS viewport, 브라우저 DPR1. 각 조건 새 페이지에서 준비 후 p=0,.5,1,0을 렌더해 warmup했다. warmup에만 gl.finish를 사용했다. 측정 루프에서는 녹화·스크린샷·readPixels·gl.finish 없이 rAF로 9초 목표 정방향/역방향 진행했다. 심한 stall로 표본 수가 작다. 각 조건 1회이고 실행 순서도 고정이므로 아래 차이는 원인 후보 조사이며 정밀 기여율이나 재현성 검증이 아니다.

| 조건 | 내부 buffer | 간격 표본 n | 평균 간격 ms | p95 ms | 실제 측정초 | texture 추정 MB(10⁶) |
|---|---|---:|---:|---:|---:|---:|
| full-1920 | 1920×1080 | 5 | 1976.60 | 2749.90 | 9.883 | 14.42 |
| full-matched-1248 | 1248×702 | 7 | 1321.39 | 2266.60 | 9.250 | 14.42 |
| no-video-diagnostic | 1248×702 | 11 | 889.36 | 1583.40 | 9.783 | 10.22 |
| no-shadows-diagnostic | 1248×702 | 11 | 833.29 | 1399.90 | 9.166 | 14.42 |
| no-normalmaps-diagnostic | 1248×702 | 11 | 916.63 | 1816.60 | 10.083 | 14.33 |
| no-msaa-diagnostic | 1248×702 | 15 | 608.87 | 1599.90 | 9.133 | 14.42 |

full-1920은 약 1.98초/프레임으로 매우 느리다. 같은 내부 1248×702에서도 약1.32초/프레임이다. 이 결과는 현재 환경에서 사용성을 충족하지 못한다. 60FPS 목표를 달성했다는 근거가 없다.

video, shadow, normal, MSAA를 각각 제외한 조건은 **진단용 페이지에만 적용**했다. 제품의 시각 효과를 제거한 변경은 없다. no-MSAA에서 간격이 작아진 것은 4sample raster/resolve 비용을 조사할 근거다. video/shadow/normal 조건도 개선된 관측을 보였지만 작은 표본·경로별 부하·고정 실행 순서 영향이 있어 비용을 합산하거나 독립적인 절감률로 제시하지 않는다. 추가 검증은 AA 대안과 재질/영상 통합을 동일 화면 품질로 비교해야 한다.

프레임 상태의 CPU submit은 수 ms 수준인 반면 rAF 지연이 매우 크다. 따라서 JS submit 시간만으로 렌더 성능을 설명할 수 없다. 소프트웨어 raster/driver/compositor 및 비동기 작업을 포함하는 stall 가능성이 있고, 현재 자료로 세부 GPU/decoder 실행 시간을 확정하지 않는다. 모든 조건 pageerror0이다.

## baseline과 비교 제한

기존 landing24a Hero는 SwiftShader를 감지하면 내부 pixelRatio .65와 저비용 material 경로를 사용했다. CSS1920×1080/DPR1이어도 실제 backing store는1248×702였다. 새 full1920과 같은 부하가 아니다.

별도 baseline cold 앱 측정은 실제12.266초, n19, 평균645.59ms, p95/max6966.3ms였고 역스크롤이 완전히 반영되지 않았다. 새 진단은 warm scene-only다. 따라서 baseline 대비 성능 개선이나 정량 회귀율은 주장하지 않는다. 다만 새 matched-buffer 관측도 느려 성능 회귀 위험을 열어 둔다. 동일 앱·동일 buffer·동일 warmup·반복 순서 교차 검증이 남아 있다.

## 자원 추정

- 기본 texture 비압축 이론 합 약14.42MB: 원화1254² mip 포함약8.39MB, video1024² 약4.19MB, PMREM 약1.57MB 등. 실제 VRAM 조회가 아니다.
- 512² 단일 key shadow target. drawing buffer 추정범위: 1920×1080 4sample 약58.06–74.65MB, 1248×702 약24.53–31.54MB, 같은 크기 no-MSAA 약8.76–10.51MB.
- CPU geometry typed-array 합2,253,932 bytes이며 GPU buffer 메모리와 동일시하지 않는다. 표면 geometry는 position/normal/morph와 실제 두께를 포함한다.
- 추정은 driver 정렬·내부복제·compositor buffers·decoder surfaces·캐시를 제외한다. shadow target depth/color·임시 PMREM도 별도이며 총 VRAM 사용량으로 합쳐 보고하지 않는다.
- 원시 graphics.resources는 dispose 과정과 공유된 renderer.info.memory 참조가 직렬화된 값이므로 GPU 자원 개수로 해석하지 않는다. 렌더 중 onFrame의 draw/triangle/geometries/textures 상태를 참고한다.

## 후속 조치

실제 화면 품질 검수 후 동일 품질을 유지하는 geometry/material draw 정리, 영상 표면 접합, AA 대안 비교, DPR와 LOD 전략을 검증한다. 진단 효과 삭제를 그대로 제품에 적용하지 않는다. 하드웨어 GPU를 사용할 수 있게 되면 렌더러 식별·실제 FPS/프레임타임·영상 decode 비용을 따로 측정한다. 현재 환경에서 GPU 가속이라고 추정하지 않는다.

미검수: 새 전체 최초 진입/정역 녹화, 새 Remotion match, 모바일 전체, 실제 GPU 성능. Gate1은 진행 중이며 Gate2로 넘어가지 않는다.
