from pathlib import Path
import subprocess,json,datetime,hashlib,os
P=Path('/workspace/gate1-assets-r7');R=Path('/workspace/yl-folded-playhouse-r7');B='/usr/bin/blender';OIDN='/tmp/yl-oidn-r6/oidn-2.5.1.x86_64.linux/bin/oidnDenoise';state={}
def mark(stage,**fields):
 state.update(stage=stage,checkedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),**fields);(P/'PIPELINE-CHECKPOINT.json').write_text(json.dumps(state,indent=2));print(stage,json.dumps(fields),flush=True)
def start(args,log):
 f=(P/log).open('w');p=subprocess.Popen(args,cwd=R,stdout=f,stderr=subprocess.STDOUT);f.close();return p
def run(args,log):
 p=start(args,log);mark('running '+log,activePID=p.pid);code=p.wait();assert code==0,(log,code);mark('completed '+log)
try:
 frozen=json.loads((P/'frozen-source.json').read_text());assert hashlib.sha256((P/'chamber.blend').read_bytes()).hexdigest()==frozen['authorBlendSHA256'];assert hashlib.sha256((R/'scripts/build-folded-chamber.py').read_bytes()).hexdigest()==frozen['generatorSHA256']
 bake=start([B,'-b','-t','4','--python',str(R/'scripts/build-folded-chamber.py'),'--','bake'],'bake.log');native=start([B,'-b','-t','4','--python',str(P/'render-native.py')],'native.log');mark('bake and native running',bakePID=bake.pid,nativePID=native.pid)
 code=bake.wait();assert code==0,('bake.log',code);mark('bake completed')
 run([B,'-b','-t','4','--python',str(R/'scripts/build-folded-chamber.py'),'--','export'],'export.log')
 run([B,'-b','-t','4','--python',str(R/'scripts/denoise-chamber-lightmaps.py'),'--',OIDN],'denoise.log')
 run(['node','node_modules/vitest/vitest.mjs','run','src/landing/cinematic/folded/pose.test.ts','src/landing/cinematic/folded/chamber-asset.test.ts','src/landing/cinematic/folded/asset.test.ts','src/landing/cinematic/folded/shellGeometry.test.ts'],'tests.log')
 run(['npm','run','build'],'build.log')
 code=native.wait();assert code==0,('native.log',code);mark('native all three completed')
 run(['node',str(P/'capture.mjs')],'capture.log');mark('PIPELINE_COMPLETE',note='Static source/native/web comparison ready for assembly and visual review; no Gate2')
except BaseException as e:
 mark('PIPELINE_FAILED',error=repr(e));raise
