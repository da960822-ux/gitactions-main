import bpy
from pathlib import Path
p=Path('/workspace/gate1-assets-r6/canary');p.mkdir(exist_ok=True);bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r6/chamber.blend');s=bpy.context.scene;bpy.ops.object.select_all(action='DESELECT')
for o in s.objects:
 if o.get('runtime'):o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in s.objects if o.get('runtime'));bpy.ops.export_scene.gltf(filepath=str(p/'chamber.glb'),export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_extras=True)
im=bpy.data.images.new('Canary unit radiance',width=4,height=4,float_buffer=True);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set([1,1,1,1]*16);s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='16';im.save_render(str(p/'unit.exr'),scene=s);s.render.image_settings.file_format='HDR';im.save_render(str(p/'unit.hdr'),scene=s)
