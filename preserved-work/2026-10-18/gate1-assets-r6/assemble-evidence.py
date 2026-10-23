"""Assemble labeled evidence; preserve all raw screenshots and source renders."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
P=Path('/workspace/gate1-assets-r6')
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
