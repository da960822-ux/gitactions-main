from pathlib import Path
import json,statistics,html
P=Path('/workspace/gate1-assets-r7/performance');r=json.loads((P/'runtime-baseline.json').read_text())
assert not r.get('errors') and len(r.get('frames',[]))==7 and r.get('allocations'), 'Incomplete runtime profile; do not publish success report'
def f(v):return '미측정' if v is None else f'{v:,.2f}'
def med(rows,key):return statistics.median([x[key]for x in rows if x.get(key)is not None])if any(x.get(key)is not None for x in rows)else None
lines=['<h2>실제 런타임 비용 분리 측정</h2>','<p>1920×1080, DPR1, 별도 진단 페이지에서 같은 제품 world 모듈과 자산을 직접 실행했다. 오프라인 베이크와 렌더를 종료한 뒤 측정한다. 다음 값은 물리 GPU VRAM이나 디스플레이 FPS가 아니다.</p>']
alloc=r.get('allocations',{});lines.append('<p>실제 renderer: <code>'+html.escape(alloc.get('renderer','미확인'))+'</code></p>')
rows=[]
for kind in ['EXRLoader','HDRLoader','TextureLoader']:
 samples=[x for x in r.get('load',{}).get('records',[])if x.get('loader')==kind];times=[x.get('decodeAndParseMs')for x in samples if x.get('decodeAndParseMs')is not None]
 rows.append([kind,str(len(samples)),f(sum(times))if times else '별도 image decode 표 참조',f(max(times))if times else '—'])
lines.append('<table><tr><th>디코더</th><th>파일</th><th>동기 parse 합계 ms</th><th>파일 최대 ms</th></tr>'+''.join('<tr>'+''.join('<td>'+html.escape(c)+'</td>'for c in row)+'</tr>'for row in rows)+'</table>')
lines.append('<p>EXR/HDR 값은 loader parse에 걸린 벽시계 시간이며 네트워크·GPU upload와 분리했다. 합계는 여러 로드의 실행시간 합산으로 전체 로딩 지연과 같지 않다. PNG/WebP는 본 loader의 fetch+image-ready와 별도 동일 bytes ImageDecoder/createImageBitmap probe를 구분해 원본 JSON에 기록했다.</p>')
lines.append('<table><tr><th>메모리 시점</th><th>프로세스 RSS 합계 MiB</th><th>PSS 합계 MiB</th><th>JS heap used MiB</th></tr>'+''.join('<tr><td>'+html.escape(m['label'])+'</td><td>'+f(m.get('totalRssMiB'))+'</td><td>'+f(m.get('totalPssMiB'))+'</td><td>'+f(m.get('cdpMetrics',{}).get('JSHeapUsedSize',0)/2**20)+'</td></tr>'for m in r.get('memory',[]))+'</table>')
if r.get('assetLoadRssSamples'):lines.append('<p>자산 로딩 중 약250ms 주기 RSS 샘플 '+str(len(r['assetLoadRssSamples']))+'개, 관측 최대 RSS 합계 '+f(max(x['totalRssMiB']for x in r['assetLoadRssSamples']))+'MiB. 샘플 사이 순간 최고점과 모든 공유 메모리를 정확히 계상한 수치는 아니다.</p>')
lines.append('<p>RSS 합계는 공유 페이지를 중복 셀 수 있다. PSS를 읽을 수 없으면 미측정으로 표시한다. JS typed buffer와 geometry ArrayBuffer의 보유 bytes는 직접 합산했으며, 이미지·텍스처 GPU 저장량은 포맷 산술값이다. 스냅샷은 parse 도중 순간 최고점 측정이 아니고, SwiftShader resident memory는 물리 GPU 메모리가 아니다.</p>')
lines.append('<p>고유 texture ArrayBuffer 보유량 '+f(alloc.get('retainedUniqueTextureArrayBufferBytes',0)/2**20)+'MiB, geometry ArrayBuffer '+f(alloc.get('retainedUniqueGeometryArrayBufferBytes',0)/2**20)+'MiB. renderer의 texture object '+str(alloc.get('rendererTextureObjectCount','미확인'))+'개. Arrival 전용 HDR uniform과 내부 LUT/depth의 모든 byte를 열거한 총량으로 해석하지 않는다.</p>')
lines.append('<table><tr><th>progress</th><th>CPU submit+pose 중앙 ms</th><th>완료 대기 중앙 ms</th><th>동기 총 비용 중앙 ms</th><th>timer query 중앙 ms</th></tr>'+''.join('<tr><td>'+str(row['p'])+'</td>'+''.join('<td>'+f(med(row['frames'],key))+'</td>'for key in ['cpuSubmitAndPoseMs','completionWaitMs','totalSynchronousFrameMs','gpuTimerElapsedMs'])+'</tr>'for row in r.get('frames',[]))+'</table>')
if r.get('videoSeeks'):lines.append('<p>제품 영상의 pose 전환→seek-ready 대기(geometry 제출 후) 중앙 '+f(statistics.median(x['waitAfterSubmitMs']for x in r['videoSeeks']))+'ms, 최대 '+f(max(x['waitAfterSubmitMs']for x in r['videoSeeks']))+'ms. demux·I/O·decode 대기를 포함하는 벽시계 값이며 codec CPU 단독 시간이 아니다.</p>')
lines.append('<p>각 구도 warm-up 후 5회, 미세 포인터 변화로 on-demand cache를 무효화했다. gl.finish로 완료를 기다리는 비용과 CPU 제출 시간을 분리했으므로 이 수치를 FPS로 환산하거나 실제 GPU의 60FPS 인증으로 쓰지 않는다. 실제 전체 페이지 스케줄링·스크롤·GPU 하드웨어·모바일은 별도 검수가 필요하다. 영상 decode-ready와 seek 비용이 안정된 상태에서 측정하며 전환 중 실시간 영상 디코딩 전체 비용을 대체하지 않는다.</p>')
if (P/'actual-page-runtime.json').exists():
 a=json.loads((P/'actual-page-runtime.json').read_text());assert not a['errors'] and len(a['poses'])==5
 lines.append('<h2>전체 제품 페이지 비용 — 별도 새 브라우저</h2><table><tr><th>시점</th><th>RSS 합계 MiB</th><th>PSS 합계 MiB</th></tr>'+''.join('<tr><td>'+html.escape(m['label'])+'</td><td>'+f(m['totalRssMiB'])+'</td><td>'+f(m['totalPssMiB'])+'</td></tr>'for m in a['memory'])+'</table>')
 intervals=a['motion']['rafIntervalsMs'];updates=a['motion']['observedProductFrameUpdates'];lines.append('<p>실제 페이지에서 약12초 정·역 스크롤 명령 중 rAF 간격 중앙 '+f(statistics.median(intervals))+'ms, 최대 '+f(max(intervals))+'ms, 관측한 progress 갱신 '+str(len(updates))+'회. rAF 콜백과 dataset 표본은 GPU 완료 프레임 또는 물리 디스플레이 FPS를 직접 세는 값이 아니다. 별도 world 진단과 전체 페이지 메모리를 합산하지 않는다.</p>')
if (P/'rgb9e5-quantization.json').exists():
 q=json.loads((P/'rgb9e5-quantization.json').read_text());rows=q['rows'];valid=all(x['supportedWithoutClamping']for x in rows);lines.append('<h2>화질 유지 최적화 조사 — 미적용</h2><p>원본 EXR을 보존한 채 RGB9_E5 32bit HDR packing을 외부 진단으로 조사했다. GI 포맷만 RGBA16F→RGB9_E5로 바꾸면 같은 해상도 논리 저장량은 312→156MiB가 된다. 양자화가 있으므로 무손실 압축으로 보고하지 않는다. 유효 범위 내 분석: '+str(valid)+'; 최대 pixel peak 상대 오차 '+f(max(x['maxErrorRelativeToPixelPeak']for x in rows)*100)+'%. 실제 장면의 같은 카메라 A/B와 역스크롤·기기 지원 확인 전에는 제품에 채택하지 않았다.</p>')
lines.append('<p>2상태 GI streaming은 두 sampler로 교체하고 다음 상태의 선행 로딩·업로드 완료를 보장하는 구조가 필요하다. 현재 세 sampler가 참조한 채 dispose하면 자동 재업로드·플래시 위험이 있다. normal KTX2 인코더는 설치되지 않았으며 압축 완료로 보고하지 않는다. 텍스처 해상도·DPR·핵심 공간 효과를 이 조사 때문에 줄이지 않았다.</p>')
(P/'report-fragment.html').write_text('\n'.join(lines));print('PERFORMANCE_REPORT_FRAGMENT_READY')
