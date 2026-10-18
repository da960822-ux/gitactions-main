# Gate1 재작업 R3 — 정상 메시·물성과 공간 구도 검수

현재 Gate1은 미승인이다. 이전 `4edd8c1` 불합격은 그대로 유지한다. 새 인트로의 장시간 렌더를 하지 않았고 Gate2도 진행하지 않았다. 이번에는 실제 브라우저 정지 화면과 기하/법선 진단을 먼저 제출한다. 정지 화면과 테스트만으로 미적 합격이나 전체 모션 완성을 선언하지 않는다.

새 로컬 커밋: `b46889549188e828cee5a23d2ff2c8e7fc73abe3` · 브랜치 `redesign/folded-playhouse-gate1-20261017` · 작업 트리 clean · 푸시/배포 없음.

## 렌더링 결함의 원인과 수정

### 삼각형 얼룩은 두 원인이 겹쳤다

이전 MP4를 ffmpeg로 직접 추출한 첫 프레임에도 큰 삼각형과 경계선이 있다. 기존 HyperFrames 원본의 회전하는 사각형/접힌 띠 디자인이 만든 무늬다. 따라서 모든 삼각형을 법선 결함이라고 설명하면 부정확하다. 증거 `r3-old-film-frame0.png`를 함께 보존한다.

이와 별도로 이전 영화 평면은 구조 캐노피와 다른 수식으로 휘었고, vertex shader가 정점 z만 변경하면서 normal을 갱신하지 않았다. 서로 다른 곡률의 겹침/교차와 잘못된 반사 방향이 가능한 구조였다. 해당 별도 평면과 shader 변형을 제거했다. 이제 영상은 **실제 morph shell의 동일 삼각형·동일 법선에 할당되는 material region**이다. 두 번째 겹친 표면을 만들지 않는다.

각진 원본 영상은 삭제하지 않고 보존했다. 새 `folded-playhouse-lightwell.mp4`는 두 개의 연속적인 부드러운 반사광 곡선으로 제작했다. 검은 배경을 emissive channel로 사용하므로 ivory 바탕을 갈색 영상 사각형으로 덮지 않는다. 구조/물성/반사는 MeshStandardMaterial과 IBL이 담당하고, 영상은 작은 빛의 움직임만 담당한다. HyperFrames 실제 check findings0, 1024×1024·30fps·120frames·4초·177,672bytes 출력이다. CLI 출력은 screenshot capture/software gpu다. 사용량 조회는 no_subscription_login으로 unknown이다. 새 full-screen Remotion intro를 렌더했다는 의미가 아니다.

### 가장자리와 닫힌 통로의 구조도 수정했다

- 이전 shell rim은 본체 nx/ny와 관계없이 고정48분할이었다. 곡면 본체와 rim의 다각형 경계가 일치하지 않아 틈이 생길 수 있었다. 각 가장자리의 분할을 본체와 일치시켰고, 앞/뒤 skin의 경계 정점을 rim의 양 끝과 동일하게 했다.
- rim은 실제 두께 반경의 원호를 사용하고 코너의 외향 법선도 연결한다. 실제 화면에 보이는 금속은 얇은 edge material과 PBR 환경 반사다.
- 닫힌 lightwell은 u=0/1을 주기적으로 샘플링하고, 내부에 불필요한 end cap을 생성하지 않는다. 법선과 rim도 seam 양쪽이 일치한다.
- 새로운 접힌 조형의 얇은 끝단에서 두께 대비 곡률이 과도하면 offset skin이 뒤집히는 사례를 테스트가 잡았다. 폭/곡률을 조정해 실제 앞뒤 skin과 중간 morph 검사를 통과시켰다. 테스트를 느슨하게 낮춰 통과시키지 않았다.

이 검사는 퇴화 삼각형·국소 법선 방향·특정 morph 샘플·두께·seam을 확인한다. 모든 가능한 pose의 전역 자가교차를 수학적으로 증명한 것은 아니다. 실제 중간 pose의 normal-pass도 별도로 제출한다.

## 새 공간과 아트 디렉션

반복 다각형 골조, 별도 구부러진 기둥, 세 개의 직육면체는 제거했다. 중심 구조는 바닥에서 측벽과 높은 천장으로 이어지는 **하나의 연속된 곡면 shell**이다. 같은 단면이 앞에서 뒤로 곡률과 폭을 바꾸며 이어지고, 스크롤에 따라 morph한다. 이전의 낮은 캐노피가 카메라 바로 위에서 화면 절반을 막던 구도를 사용하지 않는다. 카메라는 인물 왼쪽을 통과한 뒤 먼 공간을 향한다.

목적지에는 깊은 carved lightwell과 하나의 접힌 금속 조형을 둔다. 이 조형은 Hero에서 인물 뒤에 접혀 있던 같은 mesh가 펼쳐져 목적지의 중심으로 이동하는 구성이다. 별도 게임 콘텐츠나 확인되지 않은 추억을 추가한 것이 아니다. 복잡도를 상자 개수로 채우는 방식은 사용하지 않는다. 실제 구도와 조형의 미적 완성도는 이번 검수 대상이다.

색은 짙은 graphite/ink, 무광 ivory, 차가운 daylight를 중심으로 바꿨다. 로즈골드는 실제 금속의 edge와 조형 표면, burgundy는 shell 뒤쪽과 조형의 반대 면에 남긴다. 금속 roughness, 무광 paper, 바닥 roughness/metalness가 구분된다. 기존 PBR/PMREM 경로를 유지하고 갈색 분석적 반사 shader로 되돌리지 않았다.

원화는 1254×1254 RGBA 원본 그대로다. 얼굴 재생성·다른 인물 교체·원본 해상도 축소를 하지 않았다. 넓은 베이지 전경 파도 대신 인물 아래의 국소적인 짙은 바닥이 하단을 가린다. CTA는 왼쪽의 어두운 읽기 영역을 유지한다. 목적지 카피도 왼쪽에 두어 밝은 lightwell과 겹치지 않게 했다.

## 부모 피드백 대조

| 피드백 | 이번 변경 | 상태 |
|---|---|---|
| 반복 골조/분리 부품 | 연속 floor–wall–vault shell, 반복 프레임 제거 | 구조 변경, 미적 검수 필요 |
| 천장 삼각형/접합 틈 | 원본 영상 무늬 확인, 별도 휜 plane 제거, 동일 mesh material, rim/closed seam 수정 | 자동 검사 + 실제 normal-pass 검수 |
| 갈색 플라스틱/살색 창 | 중성 IBL, 별도 metal/paper/floor PBR, 실제 carved opening·9m 깊이 통로·cool daylight | 물성·광원 미적 검수 필요 |
| CTA 침범 베이지 전경 | 인물 주변 graphite 바닥 crest, 앞 가장자리는 화면 밖으로 연장 | 실제 안정 구도 검수 |
| 임시 상자·빈 목적지 | 상자 제거, 하나의 morphing crease 조형과 lightwell | 실제 p=.5/.65/1 검수 |
| 끝에서 천장 압박 | 높은 vault와 먼 방향으로 재설정한 시선, 목적지 카피 왼쪽 이동 | 실제 중간/종료 프레임 검수 |
| 성능 악화 | 이전 4edd와 새 b468을 같은 scene-only/내부 buffer/pass 동기화 조건으로 비교 | 별도 원시 프로파일 및 제한 보고 |

## 보존과 검증

보호 대상 2,255개 파일 SHA-256 변경/누락0. 게임·라우트·API·언어 연결·기존 갤러리·편지·feedback·원화·패키지/lock은 그대로다. 별도 게임 작업 저장소/브랜치를 수정하거나 중단하지 않았다.

- 카메라 계약5개, 기하 검사5개 총10개 통과.
- Production build와 git diff --check 통과. 기존 Three chunk>500k 경고는 남아 있다.
- 실사용 AA4samples, 512² key shadow, 원화 원본 해상도, 실제 VideoTexture와 PBR/IBL을 유지한다. 진단용 제외 조건을 제품에 적용하지 않는다.
- 변경 파일은 Hero 호출부, Hero CSS, folded의 world/pose/shellGeometry/test, HyperFrames source/brief, 새 lightwell MP4 총9개다.

## 자료의 범위와 남은 일

1920×1080의 안정 및 p=.25/.5/.65/.85/1은 실제 Chromium 화면이다. 최초 진입 인트로는 생략한 검수 세션이며 영상 편집으로 만든 장면이 아니다. normal-pass는 같은 factory/camera에서 MeshNormalMaterial을 적용한 진단 출력으로, 최종 디자인 화면과 구분한다. normal-pass에서만 인물/투명 접촉 그림자를 숨기고 shadow를 비활성화한다.

아트 디렉션 합격 전 새 Remotion 세 비율 장시간 출력과 전체 최초 진입/정역스크롤 녹화는 보류한다. 현재 intro film-ready=false이며 이전 불합격 공간의 MP4를 새 화면 위에 재생하지 않는다. 새로운 원화-영상 match, 최신 모바일 전 구간, full-app 성능, 실제 GPU 측정은 미검수다. 중간 공간이 충분히 세련되고 풍성한지, ivory의 넓은 면이 여전히 단조로운지, 금속 조형이 공간과 자연스럽게 통합되는지도 총괄 검수해야 한다.

이 자료는 Gate1 재검수 요청이며 완료/품질 합격 요청이 아니다. 부족하면 같은 범위에서 다시 수정한다. Gate2는 계속 보류한다.

`G1R3-REWORK.bundle`은 prerequisite `4edd8c1`부터 `b468895`까지의 증분이며 별도 랜딩 검토 복사본에서만 복원한다. 원격으로 푸시하지 않았다.

## Library 이미지 식별자

- G1R3-STABLE-1920.png: libfile_e1569591f01c8191838d4ff3d55b1f92
- G1R3-P025-1920.png: libfile_181109dac89481919b8ccb996b28f0ee
- G1R3-P050-1920.png: libfile_d16858d025f881919c772a38d2753ed9
- G1R3-P065-1920.png: libfile_bb3dfc1570508191898f082b2fd88fbf
- G1R3-P085-1920.png: libfile_fe3ac5ee882481918f7d9a53237121c5
- G1R3-P100-1920.png: libfile_c565c1e79cc08191950ec46ab3f99bbf
- G1R3-NORMAL-P050-1920.png: libfile_e619ffed69d4819183e3833dd8edc219
- G1R3-NORMAL-P065-1920.png: libfile_f240b27dfb008191a63f826067c709e3
- G1R3-NORMAL-P100-1920.png: libfile_a45007ad9d408191a8a643cc34d86659
