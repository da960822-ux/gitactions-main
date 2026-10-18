# 렌더러 계약 소스 점검

요청된 `world.ts`, `pose.ts`, `build-folded-chamber.py`, `denoise-chamber-lightmaps.py`를 읽고 기존 확인 자료를 반영했습니다. 바이너리 출력물, 소스, 진행 중 프로세스는 변경하지 않았습니다.

런타임은 diffuse 조명을 오프라인 EXR lightmap으로 제공하고, 베이크 storage scale 1과 irradiance 변환 π를 별도 메타데이터로 둡니다. 재질 슬롯을 복제해 수정하며 `Shared_Shell_Light` seam은 atlas stem이 없어 diffuse atlas를 받지 않습니다. EXR diffuse는 flipY=true, PNG normal은 false입니다. normal 텍스처의 wrap/repeat 설정은 변경하지 않아 기본값을 유지합니다. tangent가 있을 때 normal Y 스케일은 +1, 없을 때 -1입니다. 기존 geometry를 유지하고 morph target 가중치만 조정합니다. `package.json`과 `package-lock.json`도 HEAD와 동일합니다.

UV0 연결은 확인 완료입니다. Three r186의 `Texture.channel` 기본값은 0이므로 lightMap과 normal map은 TEXCOORD_0를 사용합니다. 생성기는 UVMap만 만들고 추가 UV 레이어를 만들지 않으며, 런타임은 geometry UV를 바꾸지 않습니다. R5의 UV0/UV1 동일 좌표 복제 비교에서 2,073,600개 픽셀이 일치했고, R6의 EXR/PNG GPU 코너 readback도 UV0 기준으로 통과했습니다. 근거 파일은 `pixel-comparison.json`과 `uv-format-results.json`입니다.

세부 계약 근거는 `renderer-contract-checklist.json`에 기록했습니다. 구현 및 생성물은 수정하지 않았습니다.
