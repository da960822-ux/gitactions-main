import bpy,math,json
from mathutils import Vector,Matrix
from pathlib import Path
p=Path('/workspace/gate1-r5-diagnostics');bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.resolution_x=1920;s.render.resolution_y=1080;s.render.resolution_percentage=100
V=lambda a:Vector((a[0],-a[2],a[1]));bpy.ops.object.camera_add(location=V((0,.3,11.7)));c=bpy.context.object;c.rotation_euler=(V((.3,-.05,0))-c.location).to_track_quat('-Z','Y').to_euler();c.data.sensor_fit='VERTICAL';c.data.sensor_height=24;c.data.lens=24/(2*math.tan(math.radians(38)/2));c.data.clip_start=.1;c.data.clip_end=100;bpy.context.view_layer.update()
P=c.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=1920,y=1080,scale_x=1,scale_y=1);A=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));M=A.inverted()@c.matrix_world
flat=lambda m:[m[row][col]for col in range(4)for row in range(4)]
result={'projectionColumnMajor':flat(P),'worldAsThreeColumnMajor':flat(M)}
if(p/'three-metadata.json').exists():
 t=json.loads((p/'three-metadata.json').read_text())['camera'];result['maxProjectionDifference']=max(abs(a-b)for a,b in zip(flat(P),t['projection']));result['maxWorldDifference']=max(abs(a-b)for a,b in zip(flat(M),t['matrixWorld']))
(p/'camera-verification.json').write_text(json.dumps(result,indent=2));print('CAMERA_VERIFIED',result.get('maxProjectionDifference'),result.get('maxWorldDifference'))
