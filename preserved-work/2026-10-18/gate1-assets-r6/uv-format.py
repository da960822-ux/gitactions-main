import bpy
from pathlib import Path
p=Path('/workspace/gate1-assets-r6/canary');im=bpy.data.images.new('Corner calibration',width=4,height=4,float_buffer=True);im.colorspace_settings.name='Non-Color';colors=[(1,0,0,1),(0,1,0,1),(0,0,1,1),(1,1,0,1)];im.pixels.foreach_set([c for y in range(4)for x in range(4)for c in colors[(y//2)*2+x//2]]);im.filepath_raw=str(p/'corners.png');im.file_format='PNG';im.save();s=bpy.context.scene;s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='16';im.save_render(str(p/'corners.exr'),scene=s)
