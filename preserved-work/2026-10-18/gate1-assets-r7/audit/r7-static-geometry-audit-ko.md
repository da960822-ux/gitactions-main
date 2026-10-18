# R7 정적 지오메트리 감사

`chamber.glb`, `chamber.blend` 파일 메타데이터/문자열, `scripts/build-folded-chamber.py`를 읽어 정적 검사했습니다. GLB는 v2, 12개 mesh/node, 17개 재질 primitive, 389,820개 삼각형입니다. 모든 17개 material이 `doubleSided: true`이며, baseColor·roughness와 primitive 연결은 JSON에 전부 기록했습니다. 예를 들어 `Shared_Light_Chamber`는 버건디, 흑연색, 차가운 청색, cool woven light, skylight의 다섯 재질 primitive를 포함합니다. `Cold blue plaster`는 baseColor `(0.055, 0.095, 0.135)`, roughness `0.65`입니다. GLB에 임베드된 image/texture는 없습니다.

검사한 위치·법선·UV0 값은 모두 유한합니다. 209,140개 법선 길이 모두 1에서 1e-3 이내이고, UV0를 가진 209,116개 정점의 UV 값도 유한합니다. 삼각형 면적을 primitive AABB 대각선² × 1e-12(최소 1e-18) 기준과 비교했을 때 퇴화 삼각형은 0개입니다. 기준과 primitive별 통계는 JSON에 있습니다.

**관측 사실:** alcove 부품은 별도 GLB 노드가 아니라 `Shared_Light_Chamber`로 합쳐져 있습니다. 생성기에서 앞 지붕은 z=-35..-42, 뒤 지붕은 z=-46..-56, y=5.8이고, skylight는 z=-42..-46, y=6.6입니다. 주 지붕은 이 skylight 구간의 x=-10..-2, z=-46.1..-41.9 면을 삭제하도록 되어 있습니다.

**가설:** 상부 검은 단면이나 alcove 어두운 삼각형은 의도된 슬롯 경계 또는 맞닿은/겹친 표면 경계에서 생길 가능성이 있습니다. 생성기 좌표만으로는 실제 삼각형 교차, 깊이 순서, 카메라에서 보이는 면을 확정할 수 없습니다. 웹의 회색 면은 generator에서 cool 계열 재질로 매핑된 사실은 확인되지만, native와의 픽셀 차이나 원인은 이 정적 감사로 재현·판정할 수 없습니다. `doubleSided: true`는 확인된 설정값이지 단독으로 결함을 뜻하지 않습니다.

렌더, 빌드, 충돌 계산은 하지 않았습니다. Blender 파일은 열지 않고 파일 메타데이터와 printable 이름만 확인했습니다. 제품·게임·편지·언어·API·갤러리 파일은 변경하지 않았습니다.
