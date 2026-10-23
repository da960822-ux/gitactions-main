from pathlib import Path
import datetime,json,re,time,os
P=Path('/workspace/gate1-assets-r7')
def save(path,value):
 t=path.with_suffix('.tmp');t.write_text(json.dumps(value,indent=2));t.replace(path)
while True:
 try:
  state=json.loads((P/'PIPELINE-CHECKPOINT.json').read_text());b=(P/'bake.log').read_text(errors='replace');n=(P/'native.log').read_text(errors='replace');samples=re.findall(r'Sample (\d+)/64',n)
  r={'checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'R6':{'worktree':'/workspace/yl-folded-playhouse-g1','checkpoint':'/workspace/gate1-assets-r6/LATEST-CHECKPOINT.json','complete':True,'head':'491b16883d9ca1591065a22b23731f04587e5b38','normals':5,'GI':12,'native':3,'tests':16,'build':'passed','browser':'completed'},'R7':{'worktree':'/workspace/yl-folded-playhouse-r7','state':state,'normals':b.count('NORMAL_BAKED'),'GI':b.count('DIFFUSE_BAKED'),'HDR':b.count('ENVIRONMENT_BAKED'),'nativeCompleted':n.count('NATIVE_CAPTURE_COMPLETE'),'currentNativeSample':int(samples[-1])if samples else 0,'bakeAlive':Path('/proc/'+str(state.get('bakePID',0))).exists(),'nativeAlive':Path('/proc/'+str(state.get('nativePID',0))).exists()},'authority':'Continue approved Gate1 R7 implementation/polish/verification. No Gate0 regression or new approval question. No Gate2 before parent visual review.'}
  save(P/'LATEST-CHECKPOINT.json',r);save(Path('/workspace/GATE1-CURRENT-STATUS.json'),r)
  if state['stage']in['PIPELINE_COMPLETE','PIPELINE_FAILED']:print(state['stage'],flush=True);break
 except Exception as e:print(repr(e),flush=True)
 time.sleep(30)
