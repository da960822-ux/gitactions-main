import bpy,math,json
from mathutils import Vector
from pathlib import Path
p=Path('/workspace/gate1-assets-r6');bpy.ops.wm.open_mainfile(filepath=str(p/'chamber.blend'));s=bpy.context.scene;s.cycles.samples=24;s.cycles.use_denoising=False;s.render.resolution_x=960;s.render.resolution_y=540;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_depth='8';s.render.threads_mode='FIXED';s.render.threads=4
V=lambda a:Vector((a[0],-a[2],a[1]));bpy.ops.object.camera_add();c=bpy.context.object;c.data.sensor_fit='VERTICAL';c.data.sensor_height=24;s.camera=c
for progress,at,target in [(1,(-3.5,.8,-10.5),(5.2,1,-25))]:
 t=max(0,min(1,(progress-.15)/.7));w=t*t*(3-2*t)
 for o in s.objects:
  if o.type=='MESH'and o.data.shape_keys:o.data.shape_keys.key_blocks['Space_Unfold'].value=w
 c.location=V(at);c.rotation_euler=(V(target)-c.location).to_track_quat('-Z','Y').to_euler();f=max(0,min(1,(progress-.4)/.6));f=f*f*(3-2*f);c.data.lens=24/(2*math.tan(math.radians(38+10*f)/2));s.render.filepath=str(p/('preview-'+str(progress)+'.png'));bpy.ops.render.render(write_still=True);print('PREVIEW',progress,flush=True)
