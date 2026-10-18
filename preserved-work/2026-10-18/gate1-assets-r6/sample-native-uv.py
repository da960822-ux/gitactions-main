import bpy,math,json,numpy as np
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/workspace/gate1-assets-r6/chamber.blend');V=lambda p:Vector((p[0],-p[2],p[1]));at=V((0,.3,11.7));q=(V((.3,-.05,0))-at).to_track_quat('-Z','Y');rows=[]
for x,y in[(100,850),(400,700),(500,1000),(800,800),(100,400)]:
 d=q@Vector(((x/1920*2-1)*math.tan(math.radians(38)/2)*1920/1080,(1-y/1080*2)*math.tan(math.radians(38)/2),-1)).normalized();hit,loc,n,index,o,m=bpy.context.scene.ray_cast(bpy.context.evaluated_depsgraph_get(),at,d,distance=100);rows.append({'pixel':[x,y],'object':o.name if hit else None,'material':o.data.materials[o.data.polygons[index].material_index].name if hit else None,'position':list(loc)})
print('RAYCAST',json.dumps(rows),flush=True)
imgs=[]
for name in ['/workspace/gate1-assets-r6/denoise/raw-room-diffuse-0.exr','/workspace/yl-folded-playhouse-g1/public/models/folded-chamber-v6/room-diffuse-0.exr']:
 im=bpy.data.images.load(name);im.colorspace_settings.name='Non-Color';data=np.empty(len(im.pixels),dtype=np.float32);im.pixels.foreach_get(data);imgs.append(data.reshape(im.size[1],im.size[0],4))
for row in rows[:3]:
 x,y=row['pixel'];d=q@Vector(((x/1920*2-1)*math.tan(math.radians(38)/2)*1920/1080,(1-y/1080*2)*math.tan(math.radians(38)/2),-1)).normalized();hit,loc,n,idx,o,mat=bpy.context.scene.ray_cast(bpy.context.evaluated_depsgraph_get(),at,d,distance=100);me=o.data;me.calc_loop_triangles();local=o.matrix_world.inverted()@loc
 for tri in me.loop_triangles:
  if tri.polygon_index!=idx:continue
  a,b,c=[me.vertices[i].co for i in tri.vertices];v0=b-a;v1=c-a;v2=local-a;d00=v0.dot(v0);d01=v0.dot(v1);d11=v1.dot(v1);d20=v2.dot(v0);d21=v2.dot(v1);den=d00*d11-d01*d01;v=(d11*d20-d01*d21)/den;w=(d00*d21-d01*d20)/den
  if v>=-.0001 and w>=-.0001 and v+w<=1.0001:
   uv=[me.uv_layers.active.data[l].uv for l in tri.loops];uv=uv[0]*(1-v-w)+uv[1]*v+uv[2]*w;px=int(uv.x*2048);py=int(uv.y*2048);print('UV_SAMPLE',row['pixel'],list(uv),'raw',imgs[0][py,px,:3].tolist(),'filtered',imgs[1][py,px,:3].tolist(),'filteredFlipped',imgs[1][2047-py,px,:3].tolist(),flush=True);break

