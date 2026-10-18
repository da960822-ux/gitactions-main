from pathlib import Path
import json,hashlib,re,shutil,html
P=Path('/workspace/gate1-assets-r7');D=P/'delivery';D.mkdir(exist_ok=True);r=json.loads((P/'render-version.json').read_text());o=json.loads((P/'browser/observations.json').read_text());m=json.loads((P/'native/metadata.json').read_text());assert len(m)==3 and not o['errors'] and not o['failedResponses'];tests=(P/'tests.log').read_text();build=(P/'build.log').read_text();assert '17 passed (17)'in tests and 'built in'in build
for key,label in [('0','Hero'),('0_65','Mid'),('1','Arrival')]:
 for source,target in [(P/'native'/('cycles-oidn-agx-'+key+'.png'),D/('G1R7-native-'+label+'-Cycles64-OIDN.png')),(P/'browser'/('three-'+key+'.png'),D/('G1R7-web-'+label+'-1920.png'))]:
  if not target.exists():shutil.copy2(source,target)
  else:assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(target.read_bytes()).digest()
for source,target in [('same-camera-comparison.png','G1R7-same-camera-comparison.png'),('actual-page-three-poses.png','G1R7-actual-page-three-poses.png'),('r6-r7-same-camera-before-after.png','G1R6-R7-same-camera-before-after.png'),('opening-before-camera.png','G1R7-opening-before-camera.png')]:shutil.copy2(P/source,D/target)
mask=json.loads((P/'aperture-destination-mask.json').read_text());maxmatrix=max(x['matrixWorldMaxAbsoluteDifference']for x in json.loads((P/'same-camera-check.json').read_text())['checks']);maxproj=max(x['projectionMaxAbsoluteDifference']for x in json.loads((P/'same-camera-check.json').read_text())['checks'])
text=f'''# Gate 1 R7 — Hero 공간 폴리시 검토

상태: 동일 Hero의 세 폴리시 구현·정적 검증 제출. **시각 승인이나 Gate1 전체 완료 선언이 아니다. Gate2는 시작하지 않았다.**

R6 기준은 `491b16883d9ca1591065a22b23731f04587e5b38`, R7 로컬 결과는 `{r['gitHead']}`이다. 새 자산은 `chamber-v7.0`이며 v6와 원본 작업 트리를 보존했다. source .blend SHA256은 `{r['authorBlendSHA256']}`이다. push·deploy·package 변경·별도 게임 작업 변경은 하지 않았다.

## 세 지시에 따른 결과

| 지시 | 실제 구현 | 확인 자료 |
|---|---|---|
| 카메라보다 통로 먼저 열기 | 오른쪽 cove 자유단 확장, 왼쪽 wing 실제 vertex/normal morph. p=.08–.43에 열고 camera position/target은 p=.43까지 Hero에 유지 | opening-before-camera, 실제 p=.2/.43/.5 프레임, pose 테스트 |
| 리본을 건축 구조로 연결 | 같은 canopy를 깊이 -46까지 이어지는 천장으로 확장. cool fold는 주 바닥에 붙은 낮은 단. 측면 벽·깊은 alcove·실제 천창으로 앞/중간/뒤 구성 | Mid/Arrival 원본·웹, R6 camera 전후 비교 |
| 난간·두 번째 판 줄이기 | 난간 세로 반경 .78→.40, 깊이 .62→.38. 원화 하단은 가리고 더 많은 몸통이 보이게 낮춤. 중복 밝은 앞 바닥 면을 주 바닥 하나로 연결 | Hero 원본/실제 웹·확대 절단면 검사 |

원화 5.9 평면과 이미지 bytes는 그대로다. 얼굴 재생성·색 교체를 하지 않았다. source의 AgX 영상과 웹의 원화 보존 BasicMaterial은 피부 색 처리 방식이 달라 완전한 픽셀 일치를 주장하지 않는다. 다음 방은 Gate1의 실제 경계 구조이며 Gate2 스토리를 구현했다고 보고하지 않는다.

## 동일 카메라와 실제 웹 증거

고정 source에서 Cycles CPU64 원본 Hero/Mid/Arrival, linearEXR, 외부 OIDN RT 결과를 보존했다. 실제 Three는 1920×1080/DPR1 원본 PNG다. 두 renderer의 world matrix 최대 차이는 {maxmatrix:.3g}, projection 최대 차이는 {maxproj:.3g}이다. 이것은 기하 정합 확인이며 미적 품질·픽셀 동일성의 자동 판정이 아니다.

R6와 R7 전후 비교는 **R6 camera를 그대로 적용한 별도 Three control 3구도**다. 새 R7 camera 경로와 혼동하지 않는다. montage는 비교 라벨·축소 배치만 적용했고 각 원본 PNG도 별도 제공한다. 브라우저 프레임에 OIDN이나 영상 편집을 적용하지 않았다.

p=.43 개방 진단은 camera 위치/target/FOV를 Hero에 고정한 1sample flat-emission mask다. 입구 z=-4 너머 실제 room/canopy가 약 {mask['destinationVisibleFraction']*100:.2f}%, 더 깊은 z=-12 너머만은 약43.6%였다. 인물·전경·열린 cove/wing·빈 배경을 제외한다. 해당 비율은 이 구도만의 진단이며 시각 승인을 대신하지 않는다.

## 렌더 계약과 검증

- UV0 tangent normal, PNG flip=false / EXR flip=true, albedo 제외 diffuse·storage1×PI, receiver별 atlas 격리와 authored specular-only HDR을 유지한다. GI 표본은 0/.43/1이고 실제 모프 가중치로 보간한다.
- hero/arrival 및 움직인 wine wing 전후의 실제 HDR probe 4개를 같은 source로 제작했다. 임의 밝기 감소로 재질 문제를 가리지 않았다.
- floor는 mirrored camera·정확한 world matrix, roughness별 mip, Three EnvironmentBRDF를 사용한다. mip blur는 GGX의 근사다. 조명 카드 6개는 primary에서 숨기되 glossy/probe/planar reflection에 실제 geometry·radiance로 기여한다.
- 테스트 4파일 **17개 통과**, production build 통과. build의 큰 chunk 경고는 남아 있다.
- 실제 페이지 p0/.2/.43/.5/.65/1/역행, 실제 포인터·KO/ES를 캡처했다. 수집 pageerror/console error/실패응답/WebGL error·가로 overflow는 0이다. 이는 전체 게임·모든 route/API 테스트를 뜻하지 않는다.
- 역행의 camera/object UUID/morph weights는 동일하다. 이미지 MAE는 8bit {r['reverse']['imageMeanAbsoluteError8Bit']:.6g}, 최대 채널 차이는 {r['reverse']['imageMaxChannelError8Bit']}이다.

## 보존과 성능 한계

보호 파일 **{r['protectedFiles']['checked']}개 변경·누락 0**, package/lock 변경 0이다. 게임·진입 route·이중 정답·언어·편지 원문·갤러리·건의사항·API를 수정하지 않았다. 독립 게임 최종본 통합·게임 전체 플레이 인증은 수행하지 않았다.

실제 capture renderer: `{r['renderEnvironment']}`. SDK는 Playwright1.57.0 시스템 모듈, 앱은 Three0.186.1/GSAP3.15.0, 오프라인은 Blender4.3.2 Cycles CPU/OIDN2.5.1이다. CPU submit ms는 FPS가 아니다. 실제 GPU·모바일 실기기·60FPS는 미검증이다. GI {r['textureBudgetEstimate']['GI_RGBA16F_Level0_MiB']:.0f}MiB, normal 약 {r['textureBudgetEstimate']['normal_RGBA8_FullMipChain_MiB']:.1f}MiB는 산술 추정이고 실제 VRAM이 아니다. probe·반사·video·driver 비용은 별도다.

이번 폴리시에서 신규 Remotion/HyperFrames 영상을 제작했다고 보고하지 않는다. 기존 HyperFrames film의 미세 emission만 재사용했고 거부된 intro 영상은 계속 비활성이다. 최초 진입 전체·최종 장시간 모션 녹화·mobile/hardware profiling은 정적 검수 뒤의 잔여 검증이다.

## 남은 시각 검수 항목

네이티브와 실제 웹 Mid/Arrival의 입구 상부에서 작은 뾰족한 단면이 관찰됐다. 읽기 전용 검사에서 slot 주변 열린 경계 110개를 확인했다. 공통 천장의 slot을 두께·bevel 적용 뒤 face 중심으로 제거한 경계가 원인 후보다. 기하 경계 정리 및 필요한 atlas 재제작 대상으로 다룬다. 실제 웹 바닥 반사의 블록감, alcove 내부의 native 대비 색·specular 차이도 확인했다. roughness mip 근사와 공간별 probe의 한계를 추가로 보정할 필요가 있다. 이 항목과 공간의 풍성함·연속 전환은 자동 테스트 통과로 승인하지 않는다.

## 제출 범위

원본 3구도, 실제 웹 3구도, 동일 camera renderer 비교, R6 camera 전후 비교, 전체 페이지 3구도, 개방/전진 확인을 제공한다. source·실제 raw/linear·GI원본·metadata·로그는 별도 복구 묶음에 포함한다. 아직 부모 시각 검수 통과로 처리하지 않는다. Gate2 미진행.
'''
(P/'REVIEW-FINAL.ko.md').write_text(text)
# Render one report with all four evidence sheets; source Markdown is retained for diagnosis.
def inline(v):
 v=html.escape(v);v=re.sub(r'`([^`]+)`',r'<code>\1</code>',v);return re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',v)
parts=[];lines=text.splitlines();i=0
while i<len(lines):
 line=lines[i]
 if not line.strip():i+=1;continue
 if line.startswith('|'):
  rows=[]
  while i<len(lines)and lines[i].startswith('|'):
   cells=[v.strip()for v in lines[i].strip('|').split('|')]
   if not all(re.fullmatch('[-: ]+',v)for v in cells):rows.append(cells)
   i+=1
  parts.append('<table><thead><tr>'+''.join('<th>'+inline(c)+'</th>'for c in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>'for c in row)+'</tr>'for row in rows[1:])+'</tbody></table>');continue
 h=re.match(r'^(#{1,3}) (.*)',line)
 if h:parts.append('<h'+str(len(h[1]))+'>'+inline(h[2])+'</h'+str(len(h[1]))+'>')
 else:parts.append('<p>'+inline(line[2:]if line.startswith('- ')else line)+'</p>')
 i+=1
fragment=P/'performance/report-fragment.html'
if fragment.exists():parts.append(fragment.read_text())
import base64
for filename,label in [('G1R7-same-camera-comparison.png','Blender ↔ Three / same R7 cameras'),('G1R6-R7-same-camera-before-after.png','R6 ↔ R7 / R6 cameras held unchanged'),('G1R7-actual-page-three-poses.png','Actual page / R7 path'),('G1R7-opening-before-camera.png','Opening before camera advancement')]:parts.append('<section class="figure"><h2>'+label+'</h2><img src="data:image/png;base64,'+base64.b64encode((D/filename).read_bytes()).decode()+'"></section>')
css='body{font-family:"Noto Sans CJK KR",sans-serif;color:#20232a;font-size:12px;line-height:1.75;margin:0}h1{font-size:25px;line-height:1.4}h2{font-size:17px;margin-top:26px;border-top:1px solid #ccd0d4;padding-top:13px;break-after:avoid}p{word-break:keep-all;overflow-wrap:anywhere}code{font-size:10px;background:#f1f1f1;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:10px;line-height:1.7}td,th{border:1px solid #d2d2d2;padding:7px;text-align:left;vertical-align:top}th{background:#eeedef}tr{break-inside:avoid}.figure{break-before:page}.figure img{width:100%;max-height:238mm;object-fit:contain}@page{size:A4;margin:15mm}'
(D/'G1R7-Hero-review.ko.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>Gate1 R7 Hero Review</title><style>'+css+'</style>'+''.join(parts)+'</html>')
print('DELIVERY_TEXT_AND_HTML_READY',r['gitHead'])
