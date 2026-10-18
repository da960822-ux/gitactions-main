from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
P=Path('/workspace/gate1-assets-r7');D=P/'delivery';D.mkdir(exist_ok=True);A=P/'material-diagnostic';font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
rows=[(P/'native/cycles-oidn-agx-1.png','Native Cycles64 + OIDN / same p1 camera'),(A/'full.png','Actual WebGL / all effects'),(A/'normal-zero.png','DIAGNOSTIC: normal contribution zero / grey remains'),(A/'ibl-zero.png','DIAGNOSTIC: IBL zero / planar reflection remains')];im=Image.new('RGB',(1920,1180),(16,20,27));d=ImageDraw.Draw(im)
for i,(p,title)in enumerate(rows):
 x=i%2*960;y=i//2*590;d.text((x+16,y+12),title,(238,232,220),font=font);im.paste(Image.open(p).convert('RGB').resize((960,540),Image.Resampling.LANCZOS),(x,y+50))
im.save(D/'G1R7-material-cause-isolation.png')
gap=Image.new('RGB',(1920,760),(16,20,27));d=ImageDraw.Draw(gap)
for i,(name,label)in enumerate([('full','Actual WebGL'),('material-albedo','Unlit material base colours'),('vertex-normal','Geometry vertex normals')]):
 x=i*640;d.text((x+18,12),label,(238,232,220),font=font);crop=Image.open(A/(name+'.png')).convert('RGB').crop((350,180,430,340)).resize((320,640),Image.Resampling.NEAREST);gap.paste(crop,(x+160,52));d.text((x+20,704),'Same p1 pixels: background RGB(8,11,17)',(190,204,220),font=small)
d.text((18,738),'Ray probes through the triangle miss all model geometry; neighbouring rays hit the alcove side/back. Diagnostic, no final effect removed.',(190,204,220),font=small);gap.save(D/'G1R7-alcove-gap-proof.png')
print('CAUSE_SHEETS_READY')
