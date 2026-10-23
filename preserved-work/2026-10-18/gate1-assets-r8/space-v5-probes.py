"""Matching pose/rig and indirect-only diffuse probes for the live prototype."""
import bpy, math, json
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
P=Path('/workspace/gate1-assets-r8');OUT=P/'space-v5-model'
bpy.ops.wm.open_mainfile(filepath=str(P/'chamber-space-v5.blend'));s=bpy.context.scene
V=lambda p:Vector((p[0],-p[2],p[1]))
bases={o.name:o.matrix_world.copy()for o in s.objects}
baseKeys={o.name:{k.name:[v.co.copy()for v in k.data]for k in o.data.shape_keys.key_blocks}for o in s.objects if o.get('floorSupport')and o.data.shape_keys}
def smooth(a,b,v):
 t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
def around(pivot,angle,delta):
 return Matrix.Translation(V(delta))@Matrix.Translation(V(pivot))@Matrix.Rotation(angle,4,'Z')@Matrix.Translation(-V(pivot))
def support(point,p):
 x,y,z=point;t=smooth(.10,.52,p);cx=1.85+1.9*t;cz=.05-4.4*t;a=math.radians(-6)*t;c=math.cos(a);si=math.sin(a);dx=x-cx;dz=z-cz;lx=c*dx-si*dz;lz=si*dx+c*dz;r=math.hypot(lx/4.6,lz/2.8);h=.48*(1-smooth(.7,1,r))*(1-smooth(-2.8,-1,y));return x,y+h,z
def pose(p):
 for o in s.objects:
  if o.type=='MESH'and o.data.shape_keys:
   if'Space_Unfold'in o.data.shape_keys.key_blocks:o.data.shape_keys.key_blocks['Space_Unfold'].value=smooth(.08,.43,p)
   if'Gift_Entry'in o.data.shape_keys.key_blocks:o.data.shape_keys.key_blocks['Gift_Entry'].value=0
  if o.get('hingeRig'):o.matrix_world=around((18,0,-7),math.radians(-75)*smooth(.08,.43,p),(0,0,0))@bases[o.name]
  if o.get('portraitStage')or o.get('portrait'):
   t=smooth(.1,.52,p);o.matrix_world=around((1.85,0,.05),math.radians(-6)*t,(1.9*t,0,-4.4*t))@bases[o.name]
 for name,keys in baseKeys.items():
  o=bpy.data.objects[name]
  for key,coords in keys.items():
   for i,q in enumerate(coords):o.data.shape_keys.key_blocks[key].data[i].co=V(support((q.x,q.z,-q.y),p))
  o.data.update()
 bpy.context.view_layer.update()
s.cycles.samples=4;s.render.threads_mode='FIXED';s.render.threads=4;s.render.resolution_percentage=100;s.render.image_settings.file_format='HDR'
records=[]
for name,at,p in [('hero',(1,.7,1),0),('arrival',(-4.5,1,-55),1)]:
 pose(p)
 for mode in ['specular','indirect-diffuse']:
  indirect=mode=='indirect-diffuse'
  for o in s.objects:
   if o.get('lighting_card')or o.get('rect_area_position'):o.visible_camera=not indirect
  bpy.ops.object.camera_add(location=V(at));c=bpy.context.object;c.rotation_euler=(math.pi/2,0,0);c.data.type='PANO';c.data.panorama_type='EQUIRECTANGULAR';s.camera=c
  w,h=(512,256)if indirect else(1024,512);s.render.resolution_x=w;s.render.resolution_y=h;s.render.filepath=str(OUT/(name+('-indirect.hdr'if indirect else'-environment.hdr')));bpy.ops.render.render(write_still=True)
  im=bpy.data.images.load(s.render.filepath,check_existing=False);im.colorspace_settings.name='Non-Color';px=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(px);px=px.reshape(h,w,4);cols=(w//4-np.arange(w)-1)%w;im.pixels.foreach_set(px[:,cols,:].copy().ravel())
  if indirect:im.scale(1024,512)
  im.filepath_raw=s.render.filepath;im.file_format='HDR';im.save();records.append({'name':name,'mode':mode,'position':at,'pose':p,'nativeResolution':[w,h],'storedResolution':[1024,512],'samples':4,'indirectOnly':'Analytic source surfaces camera-invisible; lighting transport remains active'if indirect else False});print('SPACE_V3_PROBE_READY',name,mode,flush=True)
(P/'space-v5-probes.json').write_text(json.dumps({'scope':'Prototype, no full GI bake. Diffuse maps upsampled solely to share PMREM layout; no added detail claim.','records':records},indent=2))
