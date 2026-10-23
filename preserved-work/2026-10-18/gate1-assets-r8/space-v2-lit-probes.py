"""Two small-sample authored probes for the new-space live-light prototype."""
import bpy, math, json
import numpy as np
from pathlib import Path
from mathutils import Vector
P=Path('/workspace/gate1-assets-r8');OUT=P/'space-v2-lit-model'
bpy.ops.wm.open_mainfile(filepath=str(P/'chamber-space-v2-lit.blend'));s=bpy.context.scene
V=lambda p:Vector((p[0],-p[2],p[1]))
for o in s.objects:
 if o.get('lighting_card'):o.visible_camera=True
s.cycles.samples=4;s.render.threads_mode='FIXED';s.render.threads=4;s.render.resolution_x=1024;s.render.resolution_y=512;s.render.resolution_percentage=100;s.render.image_settings.file_format='HDR'
records=[]
for name,at,unfold in [('hero',(1,.7,1),0),('arrival',(-4.5,1,-55),1)]:
 for o in s.objects:
  if o.type=='MESH'and o.data.shape_keys:
   o.data.shape_keys.key_blocks['Space_Unfold'].value=unfold;o.data.shape_keys.key_blocks['Gift_Entry'].value=0
 bpy.ops.object.camera_add(location=V(at));c=bpy.context.object;c.rotation_euler=(math.pi/2,0,0);c.data.type='PANO';c.data.panorama_type='EQUIRECTANGULAR';s.camera=c;s.render.filepath=str(OUT/(name+'-environment.hdr'));bpy.ops.render.render(write_still=True)
 im=bpy.data.images.load(s.render.filepath,check_existing=False);im.colorspace_settings.name='Non-Color';px=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(px);px=px.reshape(512,1024,4);cols=(256-np.arange(1024)-1)%1024;im.pixels.foreach_set(px[:,cols,:].copy().ravel());im.filepath_raw=s.render.filepath;im.file_format='HDR';im.save();records.append({'name':name,'position':at,'pose':unfold,'size':[1024,512],'samples':4});print('SPACE_V2_PROBE_READY',name,flush=True)
(P/'space-v2-lit-probes.json').write_text(json.dumps({'scope':'Low-cost prototype specular probes, not final bake or native quality certification','records':records},indent=2))
