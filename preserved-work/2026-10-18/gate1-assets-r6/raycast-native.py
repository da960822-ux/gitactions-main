import bpy,math,json
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r6/chamber.blend');V=lambda p:Vector((p[0],-p[2],p[1]));at=V((0,.3,11.7));q=(V((.3,-.05,0))-at).to_track_quat('-Z','Y');rows=[]
for x,y in[(100,850),(400,700),(500,1000),(800,800),(100,400)]:
 d=q@Vector(((x/1920*2-1)*math.tan(math.radians(38)/2)*1920/1080,(1-y/1080*2)*math.tan(math.radians(38)/2),-1)).normalized();hit,loc,n,index,o,m=bpy.context.scene.ray_cast(bpy.context.evaluated_depsgraph_get(),at,d,distance=100);rows.append({'pixel':[x,y],'object':o.name if hit else None,'material':o.data.materials[o.data.polygons[index].material_index].name if hit else None,'position':list(loc)})
print('RAYCAST',json.dumps(rows),flush=True)
