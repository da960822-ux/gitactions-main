"""Assemble labeled evidence; preserve all raw screenshots and source renders."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
P=Path('/workspace/gate1-assets-r7')
labels=[('0','Hero / progress 0'),('0_65','Mid transition / progress 0.65'),('1','Arrival / progress 1')]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',23)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
sheet=Image.new('RGB',(1920,3*590),(15,18,23));draw=ImageDraw.Draw(sheet)
for row,(key,title) in enumerate(labels):
 y=row*590;draw.text((18,y+8),title+' | same camera, 1920x1080 originals',(245,240,231),font=font)
 for col,(folder,prefix,desc) in enumerate([('native','cycles-oidn-agx-','Blender Cycles / 64 samples + OIDN RT'),('browser','three-','Actual Three.js / AgX / unedited browser capture')]):
  path=P/folder/(prefix+key+'.png');im=Image.open(path);assert im.size==(1920,1080),path
  sheet.paste(im.convert('RGB').resize((960,540),Image.Resampling.LANCZOS),(col*960,y+50));draw.text((18+col*960,y+31),desc,(181,193,211),font=small)
sheet.save(P/'same-camera-comparison.png')
full=Image.new('RGB',(960,3*580),(15,18,23));d=ImageDraw.Draw(full)
for row,(key,title)in enumerate(labels):
 im=Image.open(P/'browser'/('page-'+key+'.png'));assert im.size==(1920,1080);full.paste(im.convert('RGB').resize((960,540),Image.Resampling.LANCZOS),(0,row*580+40));d.text((18,row*580+8),title+' | actual full page',(245,240,231),font=font)
full.save(P/'actual-page-three-poses.png')
native=json.loads((P/'native/metadata.json').read_text());web=json.loads((P/'browser/observations.json').read_text());checks=[]
for n in native:
 w=next(v for v in web['factory']if v['p']==n['progress']);matrix=max(abs(a-b)for a,b in zip(n['worldAsThree'],w['matrixWorld']));projection=max(abs(a-b)for a,b in zip(n['projection'],w['projection']));assert matrix<2e-5 and projection<2e-5,(n['progress'],matrix,projection)
 checks.append({'progress':n['progress'],'matrixWorldMaxAbsoluteDifference':matrix,'projectionMaxAbsoluteDifference':projection,'sourceSha256':n['authorBlendSha256'],'glError':w['glError']})
assert len(checks)==3
(P/'same-camera-check.json').write_text(json.dumps({'checks':checks,'note':'Matching projection and pose are geometric checks, not a pixel or design equivalence claim.'},indent=2))
print('EVIDENCE_ASSEMBLY_COMPLETE',checks)

old=json.loads(Path('/workspace/gate1-assets-r6/browser/observations.json').read_text())
ab=Image.new('RGB',(1920,3*590),(15,18,23));d=ImageDraw.Draw(ab);controls=[]
for row,(key,title)in enumerate(labels):
 p=float(key.replace('_','.'));a=next(x for x in old['factory']if x['p']==p);b=next(x for x in web['oldCameraControls']if x['progress']==p)
 error=max(abs(x-y)for x,y in zip(a['matrixWorld'],b['matrixWorld']));projection=max(abs(x-y)for x,y in zip(a['projection'],b['projection']));assert error<2e-5 and projection<2e-5,(p,error,projection);controls.append({'progress':p,'worldMatrixError':error,'projectionError':projection})
 y=row*590;d.text((18,y+8),title+' | R6 camera held unchanged for geometry A/B',(245,240,231),font=font)
 for col,(folder,file,label)in enumerate([(Path('/workspace/gate1-assets-r6/browser'),'three-'+key+'.png','R6 / original actual Three camera'),(P/'browser','r6-camera-control-'+key+'.png','R7 / same R6 camera, new architecture and timing')]):
  im=Image.open(folder/file);assert im.size==(1920,1080);ab.paste(im.convert('RGB').resize((960,540),Image.Resampling.LANCZOS),(col*960,y+50));d.text((18+col*960,y+31),label,(181,193,211),font=small)
ab.save(P/'r6-r7-same-camera-before-after.png');(P/'r6-camera-controls.json').write_text(json.dumps(controls,indent=2))
openproof=Image.new('RGB',(960,3*580),(15,18,23));d=ImageDraw.Draw(openproof)
for row,(file,label)in enumerate([('three-0.png','Hero / same initial camera'),('three-0_43.png','Passage fully open / camera still held'),('three-0_5.png','Camera advancement / portrait clearance check')]):
 im=Image.open(P/'browser'/file);openproof.paste(im.convert('RGB').resize((960,540),Image.Resampling.LANCZOS),(0,row*580+40));d.text((18,row*580+8),label,(245,240,231),font=font)
openproof.save(P/'opening-before-camera.png')
