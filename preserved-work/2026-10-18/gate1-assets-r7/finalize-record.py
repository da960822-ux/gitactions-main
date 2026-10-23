from pathlib import Path
from hashlib import sha256
import json,datetime,subprocess
import numpy as np
from PIL import Image
P=Path('/workspace/gate1-assets-r7');R=Path('/workspace/yl-folded-playhouse-r7');A=R/'public/models/folded-chamber-v7'
hashfile=lambda p:sha256(p.read_bytes()).hexdigest()
freeze=json.loads((P/'frozen-source.json').read_text())
for file,digest in freeze['source'].items():assert hashfile(R/file)==digest, 'Source changed during frozen R7 capture: '+file
assert hashfile(P/'chamber.blend')==freeze['authorBlendSHA256']
manifest=json.loads((A/'asset-manifest.json').read_text());obs=json.loads((P/'browser/observations.json').read_text());native=json.loads((P/'native/metadata.json').read_text())
assert len(native)==3 and len(obs['factory'])==7 and len(obs['page'])==7
assert not obs['errors'] and not obs['failedResponses'] and all(not row['glError']for row in obs['factory'])
assert all(n['authorBlendSha256']==manifest['authorBlendSha256']for n in native)
for file,meta in manifest['files'].items():assert hashfile(A/file)==meta['sha256'],file
protection=json.loads(Path('/workspace/gate1-evidence/protected-file-sha256.json').read_text());missing=[];changed=[]
for f in protection['files']:
 path=R/f['path']
 if not path.is_file():missing.append(f['path'])
 elif hashfile(path)!=f['sha256']:changed.append(f['path'])
assert not missing and not changed,(missing,changed)
for row in obs['factory']:
 errors=[float(np.max(np.abs(np.array(v)-np.array(row['reflectionWorldMatrixExpected']))))for v in row['reflectionWorldMatricesOnGPU']]
 assert errors and min(errors)<2e-5,errors
first,last=obs['factory'][0],obs['factory'][-1]
assert first['frame']['reflectionEmitters']=='6'
assert all(int(row['frame']['filmReady'])>=2 for row in obs['factory']), 'Film did not decode for actual WebGL captures'
assert float(next(row for row in obs['factory']if row['p']==1)['frame']['filmTime'])>0, 'Film did not seek with actual progress'
assert obs['pointer']['before']!=obs['pointer']['after']
assert first['matrixWorld']==last['matrixWorld'] and first['morphs']==last['morphs']
assert any(m['material'].startswith('Deep burgundy') and m.get('environment')=='wine-authored-probe' for m in first['materials'])
for mat in first['materials']:
 if mat.get('lightmap'):assert abs(mat['lightMapIntensity']-np.pi)<1e-10 and mat['lightMapChannel']==0 and mat['diffuseFlipY'] is True
 if mat.get('normal'):assert mat['normalChannel']==0 and mat['normalRepeat']==[1,1] and mat['normalFlipY'] is False
one=np.asarray(Image.open(P/'browser/three-0.png').convert('RGB'),dtype=np.int16);two=np.asarray(Image.open(P/'browser/three-reverse.png').convert('RGB'),dtype=np.int16);diff=np.abs(one-two)
record={'createdAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'assetVersion':manifest['version'],'assetManifestSha256':hashfile(A/'asset-manifest.json'),'source':{f:hashfile(R/f)for f in ['src/landing/AcrossHero.tsx','src/landing/cinematic/folded/world.ts','src/landing/cinematic/folded/pose.ts','scripts/build-folded-chamber.py','scripts/denoise-chamber-lightmaps.py','src/landing/cinematic/folded/chamber-asset.test.ts']},'authorBlendSHA256':manifest['authorBlendSha256'],'bakedBlendSHA256':manifest['bakedBlendSha256'],'portable':json.loads((P/'portable-source.json').read_text()),'cameraPosesSHA256':hashfile(P/'camera-poses.json'),'renderEnvironment':first['frame']['renderer'],'protectedFiles':{'checked':len(protection['files']),'changed':changed,'missing':missing},'reverse':{'sameCameraAndObjectUUIDsAndMorphWeights':True,'imageMeanAbsoluteError8Bit':float(diff.mean()),'imageMaxChannelError8Bit':int(diff.max()),'nonidenticalPixels':int(np.count_nonzero(np.any(diff,axis=2)))},'textureBudgetEstimate':{'GI_RGBA16F_Level0_MiB':sum(r['size']**2*8 for r in manifest['records'])/2**20,'normal_RGBA8_FullMipChain_MiB':(3*2048**2+1024**2+512**2)*4*4/3/2**20,'note':'Arithmetic estimate from authored dimensions, not measured VRAM. Excludes probes, reflection/depth/framebuffers, portrait, video and driver allocation.'},'gitHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'sourceFreeze':json.loads((P/'frozen-source.json').read_text()),'sameR6CameraControls':json.loads((P/'r6-camera-controls.json').read_text()),'gate':'Gate1 R7 static review; no self approval, no Gate2'}
(P/'render-version.json').write_text(json.dumps(record,ensure_ascii=False,indent=2));print(json.dumps(record,ensure_ascii=False,indent=2))
