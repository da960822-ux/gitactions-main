# 새·소품·InterPals 상호작용 검수 — 2026-10-23

## 입체 만남과 소품 재질 반응 재설계 — 2026-10-23 UTC

사용자가 직전의 큰 채워진 하트와 소품 반응을 거부했다. 이전 검수의 표현 범위 Approve는 새 장면의 최종 디자인 승인으로 유지하지 않는다. 이전 검수는 입력/복구와 크기 증가를 확인했지만, 공간의 설득력·재질·인과가 좋은지를 충분히 분리하지 못했다. 이번 범위는 새 장면과 B 소품이며, 전체 사이트 재설계나 완성 판정이 아니다.

### 적용 계획과 출처

- Impeccable critique/shape/bolder/overdrive/animate/delight/craft-floor, Emil animate/review-animations/performance, Three scene/material/shader, GSAP performance, Ponytail 지침을 실제 읽고 적용한다. 기존 GSAP은 카메라/section 좌표, Motion은 새 몸짓, 공유 Three renderer는 깊이 있는 만남 경로와 방 표면을 소유한다. 서로 같은 transform을 덮어쓰지 않는다.
- ThreeUI MIT 소스의 glassToggleScene은 포인터 추종·hover/activation 분리·표면 footprint를 참고했다. Shaders MIT의 ParticleFlow/CursorTrail은 속도에 따른 방향/잔광/유한 정착 원리를 참고했다. 별도 renderer나 무거운 fluid solver는 가져오지 않는다. StreamConvergence와 기존 FlowingGradient shader 자체에 포인터 기능이 있다고 주장하지 않는다.
- Kexsio는 구도/연출 참고다. 재사용 라이선스를 확인하지 못한 코드를 복사하지 않는다. UpFork에서 이번 대상에 맞는 새 효과를 찾았다고 주장하지 않는다. 기존 CTA border beam과 이번 신규 만남 구현을 구분한다.
- 신규 라이브러리/새 원화/새 canvas 없이 기존 renderer/context를 쓴다. 불투명 DOM의 새 장면 위에 투명 Three scene을 그리되, 카메라 최종 행렬과 실제 SVG 부리 좌표에 역투영한다. GPU fence 완료 뒤에만 overlay를 드러내고 이탈 즉시 canvas를 원래 층으로 복귀한다. Hero/B 구도·자산·기능은 보존한다.
- B 소품은 모니터 반사, 실제 키 위치의 빛, 노트북 satin 반사, 사진 바깥 wood glint, 토끼 발 아래 열린 책상 접점으로 나눈다. 떠 있는 extruded hearts와 release 시 두 번째 펄스를 제거한다. 기존 발견 modal·그림·사진·초점 복귀를 보존한다.

첫 실제 중간 검수에서 새 경로는 채워진 sticker를 없앴지만 여전히 가는 wire diagram처럼 보였다. 부리 feed의 중간 연결이 내부 아치와 경쟁해 하트가 명확한 한 흐름으로 읽히지 않았다. 코드에 TubeGeometry가 있다는 이유로 승인하지 않고, 실제 held 프레임을 같은 담당에게 돌려주어 연결·두께·깊이 단서를 함께 교정하도록 했다. 독립 Assessment A는 디자인, B는 브라우저 상태/입력/회귀 근거를 별도로 수집한다.

후속 사용자 지적으로 InterPals와 원앙의 표현도 같은 배치에 포함했다. InterPals는 효과 파일의 삭제가 아니라, 부모 opacity .045→.16과 canvas .8이 곱해져 실제 3.6–12.8%로 약해지고 shader 시간도 .0375배로 느려진 것이 원인이었다. 부모 .22→.52와 시간 .13배로 조정하고, bounded 12-point pointer wake·press charge·두 경로의 release current를 구현했다. 커서의 느린 움직임도 committed anchor/live head로 누적하며 1.05초 뒤 제거한다. 가짜 대화나 새 기억은 만들지 않았다.

원앙은 기존 약4.6° 짧은 숙임 대신 발을 축으로 준비 −3.2°→답인사 약9.8°→정착2.6°와 포인터 준비3.5°로 바꿨다. 분리된 원앙 날개/꼬리 자산이 없으므로 가짜 신체 분할을 추가하지 않았다. 원본 얼굴·몸 이미지는 유지하고 실제 현재 spring 값으로 역방향 복구한다. 투명 이미지 사각형에서 발생한 오작동은 현재 SVG 화면 행렬을 역변환한 silhouette hit 판정으로 막고, keyboard detail0은 native 인사를 보존한다. 공유 host도 키보드 입력 뒤 남은 마우스 상태를 지워 정적 대응이 가능하게 했다.

참고 소스: ThreeUI `68802d5428071ada5c20db8094b1649e6bb770ed`, Shaders `eb3df5cedc826008be8e1037c1182e649037c74a` (MIT). 복사/참고한 역할은 위와 같으며 Kexsio 전체 구현을 이식했다고 표시하지 않는다. 독립 Assessment A의 첫 후보는 **18/28**이며, wire 도식·투명 hit 영역·약한 토끼/키보드를 지적했다. 이는 수정 전 후보의 평가이고 최종 점수로 재사용하지 않는다. 질문은 사용자가 수정/병렬 작업을 이미 허용해 생략했다.

Site 원격이 `63ac3a11` / source `6a155136`로 전진한 것도 확인했다. 기존 Hero 브랜치에서 source를 정상 merge한 `0201df2`로 게임 접근성·공유 Supabase client·검증 환경 격리·불용 자산/영상 의존성 정리를 보존했다. 현재 시각 수정 경로와 겹침은0이었다. 해당 게임/백엔드 개선을 이번 시각 담당이 구현하거나 실서비스 검수했다고 주장하지 않는다. 최종 build는 기존 게시물의 공개 Supabase client 입력만 프로세스 메모리에서 재사용하며, key나 환경 파일을 새로 기록하지 않는다.

### 최종 화면 교정과 직접 확인

첫 Three 후보의 wire 표현을 유지하지 않았다. 다음 실제 프레임도 좁은 filament로 읽혀, 동일 담당에게 다시 구체적인 미술 피드백을 주었다. 최종 current는 NormalBlending의 pearl 표면, 실제로 회전하는 타원 단면, 가까운 면 약10px/먼 면 약4px의 굵기 차이, depth buffer로 앞뒤가 갈리는 notch, 같은 면을 따라 흐르는 빛으로 바뀌었다. 포인터는 경로와 단면 roll을 바꾸고 press/release는 모임과 이동을 연결한다. 넓은 glow만 더하거나 채워진 하트를 복구하지 않았다. 원화의 새는 2D이고, 이 경로만 실제 Three geometry다. 방 반응도 승인 원화에 역등록한 surface overlay이며 3D 방 전체를 새로 모델링했다고 주장하지 않는다.

키보드는 최초 down부터 빛 압력 최소.55와 약3키의 밝은 묶음이 보이며 한 번의 press wave가 진행한다. 같은 입력의 native click은 release 때 두 번째 wave를 시작하지 않는다. 토끼는 발 아래 열린 접점, 노트북은 lid satin, 사진은 원본 사진을 비운 wood bevel, 모니터는 glass reflection을 유지한다.

실제 Chromium `/usr/bin/chromium`, DPR1, Linux ANGLE Vulkan **SwiftShader**, 1440×900 KO /1920×1080 es-DO에서 직접 확인했다. 루트도 최종 held ribbon·InterPals wake·토끼 접점·정적 모드의 실제 이미지를 열어 확인했다.

- 원앙의 실제 측정은 −2.90° 준비(80ms)→7.74° 답인사(314ms)→2.60° 정착이다. x/y0을 유지했다. source의9.8° 목표를 실제 최고 측정치라고 바꾸어 쓰지 않는다.
- 두 크기에서 포인터 위치 A/B에 따라 current가 변하고, gap release 뒤에도 인사가 유지됐다. 기존 L04 range 입력.1, L09 shutter false→true, L06 실제 pointer stroke1개, Escape/원래 버튼 focus/scroll Δ0 복귀를 확인했다. modal 중 새 방 반응은 꺼진다.
- InterPals는 실제 wake count3, held 밝기 변화, release opacity.37→0을 확인했다. offscreen render205→205, visibility handler 검수213→213 후 resume220. hidden은 `document.hidden`을 주입하고 visibilitychange를 발생시킨 검사이며 OS 최소화 증거가 아니다.
- reduced/keyboard 정적 모드의 실제 프레임에서 pre-commit SVG 위치가 캐시에 남아 feeder가 머리 위로 간 결함을 발견했다. sampler key에 두 새의 현재 button style을 포함해 DOM 최종 transform 반영 뒤 다시 역투영하도록 고쳤다. 실패 그림을 승인 근거로 사용하지 않고, 새 cold reduced1440/1920 및 keyboard1440/1920 프레임으로 부리 연결과 q1/animation=false를 재검수했다.
- null input에서 helper inactive update가 빠져 offscreen render가 남을 수 있는 통합 결함도 고쳤다. pending fence의 overlay metadata는 현재 input을 기준으로 정규화한다. Country의 기존 이탈 정책은 인사를 return으로 retarget하므로 재진입 시 정확히 같은 pose 유지라고 주장하지 않는다.
- 정상 경로 page/console/network 오류0. 원본 PNG abort 주입의 예상 ERR_FAILED2개와 의도적인 context-loss 검수는 분리했다. 원본 fallback/disabled 상태와 DOM 인사 접근을 확인했다. HMR에 의한 중간 harness navigation/timeout도 제품 결함이나 승인 근거로 섞지 않았다.
- B idle·새 장면 이후 B 복귀의 전체 픽셀 비교는 변화0으로, 공유 renderer alpha 설정이 승인 B 원화/구도를 바꾸지 않았다.120회 browser RAF callback 간격의 software 측정은 median16.7ms/p9516.7ms/max16.8ms다. 이는 GPU 처리량/FPS나 실제 GPU 성능이 아니다.

전체 **91파일/764테스트**, TypeScript, 공개 백엔드 입력을 보존한 production build가 통과했다. 마지막 sampler/fence 수정 뒤에도 전체 테스트와 build를 재실행했다. Impeccable detector는 완성된 대상에0건이며, 후속 실제 기하/소품 교정은 변경된 대상만 다시 확인했다. detector0이 시각적 승인이라는 주장은 하지 않는다. 큰 chunk/Motion directive의 기존 build 경고는 남는다.

검수/미술 담당과 구현 담당은 분리했다. 첫 후보 점수를 새 결과에 복사하지 않았으며 전체 사이트 새 점수도 만들지 않았다. 모바일·영상·전체8게임 실제 플레이·실서비스 backend 쓰기·실제 GPU frame throughput은 이번 범위에서 제외했다. 요청한 구역의 변경/화면 확인과 전체 사이트 완성을 구분한다.

최종 독립 검수는 **검수한 데스크톱 구역의 미술·입력 범위 Approve**다. 최종 source hash11개가 유지된 fresh lifecycle 검사에서 offOverlay/offAnimating/offExternalStable/reentered/frozenOffscreen/returnRetargetObserved가 모두 true였다. 원앙·벌새의 최종 실제 위치는 양쪽 정적 모드에서도 확인했다. 모바일이나 전체 게임/전체 사이트의 최종 승인으로 확대하지 않는다.

[기존 채워진 하트](assets/impeccable-landing/full-skill-review/motion-correction/bird-spatial-before.webp) → [실제 입체 리본·포인터 held](assets/impeccable-landing/full-skill-review/motion-correction/bird-spatial-current.webp), [InterPals wake·charge](assets/impeccable-landing/full-skill-review/motion-correction/interpals-live-wake.webp), [토끼 책상 접점](assets/impeccable-landing/full-skill-review/motion-correction/room-contact-material.webp), [키보드 첫 눌림](assets/impeccable-landing/full-skill-review/motion-correction/keyboard-press-current.webp), [단계별 실제 브라우저 상태·최종 소스 해시](assets/impeccable-landing/full-skill-review/motion-correction/bird-room-spatial-browser.json).

### 게시 직전 최신 Site 작업 재인수

Site 원격이 다시 `75d11cf` / source `5d07977`로 바뀌어 기존 패키지 helper가 정상적으로 push를 중단했다. 이를 무시하거나 force하지 않았다. 최신 게임 viewport/건의사항 owner submission·불용 preview 정리를 기존 Hero 브랜치에 정상 통합했다. `post-hero-preview/src`의 실제 story 코드는 `src/landing/story`로 정식 이동했고, 이번 Country TSX/CSS·field·room·InterPals 파일은 기존 `7f99aa6`과 byte 동일함을 별도 Luna가 확인했다. host 변경은 story import 경로와 없어진 renderScene prop 정리다. 외부 담당의 편지 직접 링크 제거도 임의로 되돌리지 않았으며 편지 장면/원문/서명 흐름은 보존됐다.

원격이 삭제한 과거 리뷰/증거 묶음을 복구하지 않았다. 이 문서는 이번 신규 구역의 실제 변경·검수 내용만 남겨 정리했고, 새 증거5장/상태 bundle만 보존했다. 추가 게임·건의사항 개선의 실서비스 승인이나 원격 DB migration을 이번 시각 담당의 실행으로 표시하지 않는다.

최신 source 통합 후 전체 **92파일/788테스트**, TypeScript와 공개 백엔드 연결을 보존한 production build가 다시 통과했다. 앞의764는 정식 story 이동 이전 단계의 수치이며 최신 최종 수치와 구분한다. 실제 source 경로는 이제 `src/landing/story/CountryCompanions.tsx`와 같은 정식 경로다. 최신 비교에서도 승인된 B 정지 화면의 전체 픽셀 차이0을 확인했다.
