# R7 성능 측정 방법 정정

기존 runtime-baseline.json에서 gl.finish() 뒤에 붙인 완료 시간 명칭은 이 Chromium/SwiftShader 실행에서 GPU 완료를 입증하지 못했다. 동일 장면의 1×1 readPixels 동기화가 훨씬 오래 걸리는 것이 실제 관찰됐다. 원본 데이터는 보존하지만 해당 1–4ms 계열 수치를 GPU 렌더 시간·FPS·60FPS 합격 근거로 사용하지 않는다. GPU timer query는 유효한 완료 결과가 없었다.

material-diagnostic/observations.json은 960×540에서 실제 render 뒤 1×1 readPixels를 수행했다. 첫 full render+readback 약10.74초, normal-zero 대조 약2.05초였다. 이 값은 동기 readback 비용을 포함한 진단 벽시계 시간이며 순수 GPU time·화면 표시 FPS가 아니다. 환경은 ANGLE Vulkan SwiftShader이고 물리 GPU 성능으로 일반화하지 않는다.

R8 격리 수정본에도 같은 readback 검증을 적용한다. GPU fence가 완료되기 전 오래된 입력을 큐에 계속 넣지 않고 최신 pose를 다음 렌더에 반영하도록 했다. 실제 영상과 렌더 입력 시각으로 반응·복원을 확인한다. fence 도입 자체를 60FPS 달성으로 보고하지 않는다.

기존 비용 진단: EXR12개 CPU parse 합계 약9.19초, HDR4개 약0.23초. GI/image initTexture CPU 제출 약6.09초. 직접 열거한 GI/image typed buffer312MiB, 계산한 morph texture 약13.40MiB. 프로세스 PSS는 blank약216.10MiB→assets약907.89MiB→textureinit약1280.60MiB→posesqueued약1392.74MiB였으며, 이는 프로세스 공유 메모리 고려 스냅샷이고 VRAM이나 정확한 최고점이 아니다.

실제 비디오 seek 진단은 readyState4/seeking false와 목표시각 도달을 확인했다. 일부 onFrame filmReady1은 렌더 시점의 오래된 메타데이터였으므로 이를 최종 decode 상태로 간주하지 않는다. seek 대기 벽시계는 소프트웨어 렌더 큐와 이벤트 대기를 포함하며 codec CPU decode 시간으로 표기하지 않는다.

RGB9_E5는 12개 동일 해상도 맵의 수치 양자화 조사와 작은 GPU decode/filter canary만 수행했다. 원본 EXR 보존, 런타임 미채택. GI의 논리 메모리312→156MiB 가능성은 예상치이며 실제 브라우저 A/B와 비용 측정 전 효과가 검증된 최적화로 보고하지 않는다.
