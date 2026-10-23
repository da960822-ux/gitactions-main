import subprocess,time
from pathlib import Path
p=Path('/workspace/gate1-assets-r6');root=Path('/workspace/yl-folded-playhouse-g1')
while not((p/'export.log').exists()and'EXPORT_COMPLETE'in(p/'export.log').read_text()):
 for name in ['bake.log','export.log']:
  if(p/name).exists()and'Traceback (most recent call last)'in(p/name).read_text():raise RuntimeError('Pipeline error; raw files retained. Inspect '+name)
 time.sleep(5)
steps=[(['blender','-b','-t','4','--python-exit-code','1','--python',str(root/'scripts/denoise-chamber-lightmaps.py'),'--','/tmp/yl-oidn-r6/oidn-2.5.1.x86_64.linux/bin/oidnDenoise'],'denoise.log'),(['npx','vitest','run','src/landing/cinematic/folded'],'tests.log'),(['npm','run','build'],'build.log'),(['node',str(p/'capture.mjs')],'capture.log')]
for command,name in steps:
 print('STAGE_START',name,flush=True)
 with(p/name).open('w')as f:subprocess.run(command,cwd=root,stdout=f,stderr=subprocess.STDOUT,check=True)
 print('STAGE_COMPLETE',name,flush=True)
print('STATIC_WEB_EVIDENCE_READY',flush=True)
