import bpy,math,json
from mathutils import Vector
from pathlib import Path
P=Path('/workspace/gate1-assets-r7');OUT=P/'preview-v2';OUT.mkdir(exist_ok=True);bpy.ops.wm.open_mainfile(filepath=str(P/'chamber.blend'));s=bpy.context.scene;s.cycles.samples=24;s.cycles.use_denoising=False;s.render.resolution_x=960;s.render.resolution_y=540;s.render.resolution_percentage=100;s.render.threads_mode='FIXED';s.render.threads=4;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX'
V=lambda p:Vector((p[0],-p[2],p[1]));bpy.ops.object.camera_add();c=bpy.context.object;c.data.sensor_fit='VERTICAL';c.data.sensor_height=24;s.camera=c
for pose in json.loads((P/'camera-poses.json').read_text()):
 for o in s.objects:
  if o.type=='MESH'and o.data.shape_keys:o.data.shape_keys.key_blocks['Space_Unfold'].value=pose['weights']['rail' if o.get('motionGroup')=='rail'else'aperture'];o.data.shape_keys.key_blocks['Gift_Entry'].value=0
 c.location=V(pose['position']);c.rotation_euler=(V(pose['target'])-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=24/(2*math.tan(math.radians(pose['fov'])/2));s.render.filepath=str(OUT/('preview-'+str(pose['progress']).replace('.','_')+'.png'));bpy.ops.render.render(write_still=True);print('PREVIEW_COMPLETE',pose['progress'],flush=True)
